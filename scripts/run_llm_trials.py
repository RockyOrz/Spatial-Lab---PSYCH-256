#!/usr/bin/env python3
"""
Run the mental-rotation trials against GPT-5.2, Qwen, and Gemini.

- Reads API credentials from llm_config.yaml (see llm_config.example.yaml).
- Sends each trial as an isolated conversation to avoid context carryover.
- Appends results to report/trait_result.md.
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import textwrap
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from statistics import mean
from typing import Any, Dict, List, Optional, Tuple

import yaml

SYSTEM_PROMPT = textwrap.dedent(
    """
    You are an expert participant in a Mental Rotation cognitive test.

    Task:
    - You see two views of a reference object (front + back/180° turn).
    - You see three candidate objects labeled A, B, C.
    - Exactly ONE candidate is the same object as the reference, merely rotated in 3D.
    - The other two are structural distractors.

    Process:
    1) Combine the two reference views to build a 3D model of the correct object.
    2) For each candidate (A-C), mentally rotate and compare structure. Eliminate any structural mismatch.
    3) Select the single matching candidate, regardless of its rotation.

    Output JSON fields:
    - answer: "A" | "B" | "C"
    - confidence: 0-100
    - reasoning: brief why the chosen candidate matches and one flaw in at least one distractor.
    """
).strip()

USER_INSTRUCTION = (
    "Use the two reference views to reconstruct the object. Identify which candidate (A, B, or C) "
    "matches the reference after 3D rotation. Reply ONLY with JSON: "
    '{"answer":"A|B|C","confidence":0-100,"reasoning":"short explanation"}'
)


@dataclass
class TrialAssets:
    label: str
    condition: str
    correct_answer: str
    ref_front: Tuple[str, str]  # (mime, base64)
    ref_back: Tuple[str, str]   # (mime, base64)
    candidates: Dict[str, Tuple[str, str]]  # letter -> (mime, base64)


@dataclass
class TrialResult:
    trial_label: str
    condition: str
    gold: str
    prediction: Optional[str]
    confidence: Optional[float]
    reasoning: str
    latency_ms: Optional[int]
    success: bool
    error: Optional[str] = None

    @property
    def is_correct(self) -> bool:
        return self.success and self.prediction == self.gold


@dataclass
class ModelRun:
    name: str
    model_id: str
    results: List[TrialResult]

    def accuracy(self) -> float:
        if not self.results:
            return 0.0
        return sum(1 for r in self.results if r.is_correct) / len(self.results)

    def avg_confidence(self) -> Optional[float]:
        vals = [r.confidence for r in self.results if r.confidence is not None]
        return mean(vals) if vals else None


def load_yaml_config(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(
            f"Config file {path} not found. Copy scripts/llm_config.example.yaml to {path} "
            "and fill in your API keys."
        )
    with path.open("r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def data_url(mime: str, b64: str) -> str:
    return f"data:{mime};base64,{b64}"


def read_image(path: Path) -> Tuple[str, str]:
    mime = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    b64 = base64.b64encode(path.read_bytes()).decode("ascii")
    return mime, b64


def discover_trials(trials_root: Path, max_trials: Optional[int] = None) -> List[TrialAssets]:
    trials: List[TrialAssets] = []
    meta_files = sorted(trials_root.rglob("Metadata.json"))
    for meta_file in meta_files:
        with meta_file.open("r", encoding="utf-8") as fh:
            meta = json.load(fh)

        config = meta.get("config", {})
        condition = f"{config.get('shape', '?')} | {config.get('complexity', '?')} | {config.get('magnitude', '?')}"

        correct_target = next((t["id"] for t in meta.get("targets", []) if t.get("is_correct")), None)
        if correct_target is None:
            raise ValueError(f"No correct target found in {meta_file}")

        trial_dir = meta_file.parent
        ref_front = read_image(trial_dir / "1_Reference_Front.jpg")
        ref_back = read_image(trial_dir / "2_Reference_Back.jpg")

        candidates: Dict[str, Tuple[str, str]] = {}
        for letter in ["A", "B", "C"]:
            candidates[letter] = read_image(trial_dir / f"3_Target_{letter}.jpg")

        label = str(trial_dir.relative_to(trials_root))
        trials.append(
            TrialAssets(
                label=label,
                condition=condition,
                correct_answer=str(correct_target).upper(),
                ref_front=ref_front,
                ref_back=ref_back,
                candidates=candidates,
            )
        )
        if max_trials is not None and len(trials) >= max_trials:
            break
    return trials


def parse_json_response(text: str) -> Dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        blocks = cleaned.split("```")
        cleaned = blocks[1] if len(blocks) > 1 else cleaned
        cleaned = cleaned.strip()
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
    if "{" in cleaned and "}" in cleaned:
        cleaned = cleaned[cleaned.find("{") : cleaned.rfind("}") + 1]
    return json.loads(cleaned)


def normalize_answer(val: Any) -> Optional[str]:
    if val is None:
        return None
    ans = str(val).strip().upper()
    return ans if ans in {"A", "B", "C"} else None


def normalize_confidence(val: Any) -> Optional[float]:
    if val is None:
        return None
    try:
        num = float(val)
    except (TypeError, ValueError):
        return None
    return max(0.0, min(100.0, num))


def build_openai_content(trial: TrialAssets) -> List[Dict[str, Any]]:
    parts: List[Dict[str, Any]] = [
        {"type": "text", "text": "Reference Object - View 1 (Front):"},
        {"type": "image_url", "image_url": {"url": data_url(*trial.ref_front)}},
        {"type": "text", "text": "Reference Object - View 2 (Back - 180 degrees):"},
        {"type": "image_url", "image_url": {"url": data_url(*trial.ref_back)}},
        {"type": "text", "text": "--- CANDIDATES ---"},
    ]
    for letter in ["A", "B", "C"]:
        parts.append({"type": "text", "text": f"Candidate {letter}:"})
        parts.append({"type": "image_url", "image_url": {"url": data_url(*trial.candidates[letter])}})
    parts.append({"type": "text", "text": USER_INSTRUCTION})
    return parts


class OpenAIStyleRunner:
    def __init__(
        self,
        model_id: str,
        api_key: str,
        base_url: Optional[str],
        temperature: float,
        timeout: int,
        json_mode: bool = True,
    ):
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise ImportError("openai package is required. pip install -r scripts/requirements.txt") from exc

        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model_id = model_id
        self.temperature = temperature
        self.timeout = timeout
        self.json_mode = json_mode

    def __call__(self, trial: TrialAssets) -> Dict[str, Any]:
        content = build_openai_content(trial)
        params: Dict[str, Any] = dict(
            model=self.model_id,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": content},
            ],
            temperature=self.temperature,
            timeout=self.timeout,
        )
        if self.json_mode:
            params["response_format"] = {"type": "json_object"}
        try:
            response = self.client.chat.completions.create(**params)
        except Exception:
            if self.json_mode:
                params.pop("response_format", None)
                response = self.client.chat.completions.create(**params)
            else:
                raise
        message = response.choices[0].message.content
        return parse_json_response(message)


class GeminiRunner:
    def __init__(self, model_id: str, api_key: str, temperature: float, timeout: int):
        try:
            import google.generativeai as genai
        except ImportError as exc:
            raise ImportError("google-generativeai package is required. pip install -r scripts/requirements.txt") from exc

        self.genai = genai
        self.model = None
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            model_name=model_id,
            system_instruction=SYSTEM_PROMPT,
        )
        self.model_id = model_id
        self.temperature = temperature
        self.timeout = timeout

    def __call__(self, trial: TrialAssets) -> Dict[str, Any]:
        parts: List[Any] = [
            "Reference Object - View 1 (Front):",
            {"mime_type": trial.ref_front[0], "data": base64.b64decode(trial.ref_front[1])},
            "Reference Object - View 2 (Back - 180 degrees):",
            {"mime_type": trial.ref_back[0], "data": base64.b64decode(trial.ref_back[1])},
            "--- CANDIDATES ---",
        ]
        for letter in ["A", "B", "C"]:
            parts.append(f"Candidate {letter}:")
            mime, b64_data = trial.candidates[letter]
            parts.append({"mime_type": mime, "data": base64.b64decode(b64_data)})
        parts.append(USER_INSTRUCTION)

        response = self.model.generate_content(
            parts,
            generation_config={
                "temperature": self.temperature,
                "response_mime_type": "application/json",
            },
            request_options={"timeout": self.timeout},
        )
        if not getattr(response, "text", None):
            raise RuntimeError("Gemini returned empty text")
        return parse_json_response(response.text)


def run_trials(name: str, runner, trials: List[TrialAssets]) -> ModelRun:
    results: List[TrialResult] = []
    for trial in trials:
        start = time.time()
        try:
            raw = runner(trial)
            latency_ms = int((time.time() - start) * 1000)
            answer = normalize_answer(raw.get("answer"))
            confidence = normalize_confidence(raw.get("confidence"))
            reasoning = str(raw.get("reasoning", "")).strip()
            results.append(
                TrialResult(
                    trial_label=trial.label,
                    condition=trial.condition,
                    gold=trial.correct_answer,
                    prediction=answer,
                    confidence=confidence,
                    reasoning=reasoning,
                    latency_ms=latency_ms,
                    success=answer in {"A", "B", "C"},
                    error=None,
                )
            )
        except Exception as exc:
            latency_ms = int((time.time() - start) * 1000)
            results.append(
                TrialResult(
                    trial_label=trial.label,
                    condition=trial.condition,
                    gold=trial.correct_answer,
                    prediction=None,
                    confidence=None,
                    reasoning="",
                    latency_ms=latency_ms,
                    success=False,
                    error=str(exc),
                )
            )
    return ModelRun(name=name, model_id=getattr(runner, "model_id", name), results=results)


def append_report(report_path: Path, runs: List[ModelRun], trials_root: Path, prompt_note: str) -> None:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if report_path.exists():
        existing = report_path.read_text(encoding="utf-8").rstrip()
    else:
        existing = "# LLM Trait Testing Results\n\n"
        existing += "This file is auto-appended by scripts/run_llm_trials.py.\n\n"

    sections: List[str] = [existing, f"## Run {timestamp}", f"- Trials root: {trials_root}", f"- Prompt: {prompt_note}", ""]

    for run in runs:
        acc = run.accuracy()
        avg_conf = run.avg_confidence()
        total = len(run.results)
        correct = sum(1 for r in run.results if r.is_correct)
        sections.append(f"### {run.name} ({run.model_id})")
        sections.append(f"- Accuracy: {correct}/{total} ({acc:.1%})")
        if avg_conf is not None:
            sections.append(f"- Avg confidence (where provided): {avg_conf:.1f}")
        sections.append("")
        sections.append("| Trial | Condition | Gold | Pred | Conf | Status | Notes |")
        sections.append("| --- | --- | --- | --- | --- | --- | --- |")
        for res in run.results:
            conf_str = f"{res.confidence:.1f}" if res.confidence is not None else "-"
            status = "OK" if res.is_correct else ("WRONG" if res.success else "ERROR")
            note = res.error or res.reasoning
            note = " ".join(str(note).split())  # collapse whitespace
            note = note.replace("|", "\\|")
            sections.append(
                f"| {res.trial_label} | {res.condition} | {res.gold} | "
                f"{res.prediction or '-'} | {conf_str} | {status} | {note} |"
            )
        sections.append("")

    report_path.write_text("\n".join(sections).strip() + "\n", encoding="utf-8")


def build_runners(config: Dict[str, Any], temperature: float, timeout: int) -> Dict[str, Any]:
    runners: Dict[str, Any] = {}
    for name, info in config.get("models", {}).items():
        provider = info.get("provider")
        model_id = info.get("model")
        api_key = info.get("api_key")
        base_url = info.get("base_url")
        json_mode = info.get("json_mode", True)
        if not api_key or not model_id or not provider:
            raise ValueError(f"Model entry '{name}' is missing provider/model/api_key")
        if provider.lower() == "openai":
            runners[name] = OpenAIStyleRunner(
                model_id, api_key, base_url, temperature, timeout, json_mode=json_mode
            )
        elif provider.lower() == "gemini":
            runners[name] = GeminiRunner(model_id, api_key, temperature, timeout)
        else:
            raise ValueError(f"Unsupported provider '{provider}' for model '{name}'")
    return runners


def main() -> None:
    parser = argparse.ArgumentParser(description="Run GPT-5.2, Qwen, and Gemini on the spatial trials.")
    parser.add_argument("--config", default="scripts/llm_config.yaml", help="Path to YAML config with API keys.")
    parser.add_argument("--models", nargs="*", help="Subset of model keys to run (default: all in config).")
    parser.add_argument("--max-trials", type=int, default=None, help="Limit number of trials for quick smoke runs.")
    parser.add_argument("--report", default=None, help="Override report output path.")
    args = parser.parse_args()

    cfg = load_yaml_config(Path(args.config))
    trials_root = Path(cfg.get("trials_root", "Trials"))
    report_path = Path(args.report or cfg.get("report_path", "report/trait_result.md"))
    cfg_max_trials = cfg.get("max_trials")
    max_trials = args.max_trials if args.max_trials is not None else (
        int(cfg_max_trials) if cfg_max_trials is not None else None
    )
    temperature = float(cfg.get("temperature", 0.2))
    timeout = int(cfg.get("timeout_seconds", 120))

    selected_models = set(args.models) if args.models else set(cfg.get("models", {}).keys())
    runners = build_runners(cfg, temperature=temperature, timeout=timeout)
    missing = selected_models - set(runners.keys())
    if missing:
        raise ValueError(f"Requested models {missing} not found in config.")

    trials = discover_trials(trials_root, max_trials=max_trials)
    if not trials:
        raise RuntimeError(f"No trials found under {trials_root}")

    print(f"Running {len(trials)} trials against models: {', '.join(sorted(selected_models))}")
    runs: List[ModelRun] = []
    for name in sorted(selected_models):
        runner = runners[name]
        model_id = getattr(runner, "model_id", name)
        print(f"- {name} ({model_id})...")
        run_result = run_trials(name=name, runner=runner, trials=trials)
        runs.append(run_result)

    prompt_note = "Mental rotation prompt (system + JSON answer/confidence/reasoning)"
    append_report(report_path, runs, trials_root=trials_root, prompt_note=prompt_note)
    print(f"Results appended to {report_path}")


if __name__ == "__main__":
    main()
