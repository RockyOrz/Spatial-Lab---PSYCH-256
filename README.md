# Spatial Lab – PSYCH 256: Mental Rotation Benchmark

This repository hosts a small “spatial lab” for PSYCH 256 that benchmarks mental rotation ability on 3D block objects. It is designed to support both human experiments (e.g., in a cognitive science class) and AI evaluations (LLMs, vision models, or multi-modal systems).

The core idea: present a reference object in multiple views, plus several candidate objects (typically three). Exactly one candidate is a rotated version of the reference object; the others are structural distractors. The task is to pick the correct candidate as quickly and accurately as possible.

---

## Project Goals

- Build **clean, controlled visual stimuli** for mental rotation tasks.
- Provide a **simple web app** for running trials in the browser.
- Make it easy to **compare performance across humans and AI systems**.
- Keep the structure transparent so others can **extend or remix** the task (new object sets, difficulty levels, timing manipulations).

---

## Repository Structure

```text
Spatial-Lab---PSYCH-256/
├─ App/           # Front-end application (TypeScript + HTML)
├─ Trials/        # Mental-rotation trial sets (images / metadata)
└─ .gitignore     # Git ignore rules
