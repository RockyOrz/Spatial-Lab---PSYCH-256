# LLM Trait Testing Results

This file is auto-appended by scripts/run_llm_trials.py.
Columns: Trial | Condition | Correct Answer | Model Answer | Model Confidence
## Run 2025-12-13 01:00:45
- Trials root: Trials
- Prompt:
```
System prompt:\nYou are an expert participant in a Mental Rotation cognitive test.

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
- reasoning: brief why the chosen candidate matches and one flaw in at least one distractor.\n\nUser instruction:\nUse the two reference views to reconstruct the object. Identify which candidate (A, B, or C) matches the reference after 3D rotation. Reply ONLY with JSON: {"answer":"A|B|C","confidence":0-100,"reasoning":"short explanation"}
```

### gpt5_2 (gpt-5.2)
- Accuracy: 15/40 (37.5%)
- Avg confidence (where provided): 79.2

| Trial | Condition | Correct Answer | Model Answer | Model Confidence |
| --- | --- | --- | --- | --- |
| BatchRun_HighSym_1Axis_HighMag_1765540416838\Trial_1 | HIGH_SYMMETRY \| ONE_AXIS \| HIGH | B | B | 78.0 |
| BatchRun_HighSym_1Axis_HighMag_1765540416838\Trial_2 | HIGH_SYMMETRY \| ONE_AXIS \| HIGH | B | B | 78.0 |
| BatchRun_HighSym_1Axis_HighMag_1765540416838\Trial_3 | HIGH_SYMMETRY \| ONE_AXIS \| HIGH | C | B | 78.0 |
| BatchRun_HighSym_1Axis_HighMag_1765540416838\Trial_4 | HIGH_SYMMETRY \| ONE_AXIS \| HIGH | A | B | 78.0 |
| BatchRun_HighSym_1Axis_HighMag_1765540416838\Trial_5 | HIGH_SYMMETRY \| ONE_AXIS \| HIGH | C | B | 74.0 |
| BatchRun_HighSym_1Axis_LowMag_1765540370741\Trial_1 | HIGH_SYMMETRY \| ONE_AXIS \| LOW | A | B | 78.0 |
| BatchRun_HighSym_1Axis_LowMag_1765540370741\Trial_2 | HIGH_SYMMETRY \| ONE_AXIS \| LOW | A | C | 78.0 |
| BatchRun_HighSym_1Axis_LowMag_1765540370741\Trial_3 | HIGH_SYMMETRY \| ONE_AXIS \| LOW | B | C | 78.0 |
| BatchRun_HighSym_1Axis_LowMag_1765540370741\Trial_4 | HIGH_SYMMETRY \| ONE_AXIS \| LOW | C | C | 86.0 |
| BatchRun_HighSym_1Axis_LowMag_1765540370741\Trial_5 | HIGH_SYMMETRY \| ONE_AXIS \| LOW | A | B | 78.0 |
| BatchRun_HighSym_2Axis_HighMag_1765540469375\Trial_1 | HIGH_SYMMETRY \| TWO_AXIS \| HIGH | A | B | 78.0 |
| BatchRun_HighSym_2Axis_HighMag_1765540469375\Trial_2 | HIGH_SYMMETRY \| TWO_AXIS \| HIGH | C | B | 78.0 |
| BatchRun_HighSym_2Axis_HighMag_1765540469375\Trial_3 | HIGH_SYMMETRY \| TWO_AXIS \| HIGH | B | C | 78.0 |
| BatchRun_HighSym_2Axis_HighMag_1765540469375\Trial_4 | HIGH_SYMMETRY \| TWO_AXIS \| HIGH | C | B | 78.0 |
| BatchRun_HighSym_2Axis_HighMag_1765540469375\Trial_5 | HIGH_SYMMETRY \| TWO_AXIS \| HIGH | B | C | 78.0 |
| BatchRun_HighSym_2Axis_LowMag_1765540443332\Trial_1 | HIGH_SYMMETRY \| TWO_AXIS \| LOW | B | C | 86.0 |
| BatchRun_HighSym_2Axis_LowMag_1765540443332\Trial_2 | HIGH_SYMMETRY \| TWO_AXIS \| LOW | A | C | 78.0 |
| BatchRun_HighSym_2Axis_LowMag_1765540443332\Trial_3 | HIGH_SYMMETRY \| TWO_AXIS \| LOW | C | C | 78.0 |
| BatchRun_HighSym_2Axis_LowMag_1765540443332\Trial_4 | HIGH_SYMMETRY \| TWO_AXIS \| LOW | B | B | 78.0 |
| BatchRun_HighSym_2Axis_LowMag_1765540443332\Trial_5 | HIGH_SYMMETRY \| TWO_AXIS \| LOW | C | B | 78.0 |
| BatchRun_LowSym_1Axis_HighMag_1765540153779\Trial_1 | LOW_SYMMETRY \| ONE_AXIS \| HIGH | B | A | 86.0 |
| BatchRun_LowSym_1Axis_HighMag_1765540153779\Trial_2 | LOW_SYMMETRY \| ONE_AXIS \| HIGH | B | C | 78.0 |
| BatchRun_LowSym_1Axis_HighMag_1765540153779\Trial_3 | LOW_SYMMETRY \| ONE_AXIS \| HIGH | A | C | 86.0 |
| BatchRun_LowSym_1Axis_HighMag_1765540153779\Trial_4 | LOW_SYMMETRY \| ONE_AXIS \| HIGH | C | A | 86.0 |
| BatchRun_LowSym_1Axis_HighMag_1765540153779\Trial_5 | LOW_SYMMETRY \| ONE_AXIS \| HIGH | C | C | 78.0 |
| BatchRun_LowSym_1Axis_LowMag_1765540089976\Trial_1 | LOW_SYMMETRY \| ONE_AXIS \| LOW | B | B | 78.0 |
| BatchRun_LowSym_1Axis_LowMag_1765540089976\Trial_2 | LOW_SYMMETRY \| ONE_AXIS \| LOW | C | B | 78.0 |
| BatchRun_LowSym_1Axis_LowMag_1765540089976\Trial_3 | LOW_SYMMETRY \| ONE_AXIS \| LOW | C | C | 78.0 |
| BatchRun_LowSym_1Axis_LowMag_1765540089976\Trial_4 | LOW_SYMMETRY \| ONE_AXIS \| LOW | A | C | 86.0 |
| BatchRun_LowSym_1Axis_LowMag_1765540089976\Trial_5 | LOW_SYMMETRY \| ONE_AXIS \| LOW | A | C | 78.0 |
| BatchRun_LowSym_2Axis_HighMag_1765540326875\Trial_1 | LOW_SYMMETRY \| TWO_AXIS \| HIGH | C | C | 78.0 |
| BatchRun_LowSym_2Axis_HighMag_1765540326875\Trial_2 | LOW_SYMMETRY \| TWO_AXIS \| HIGH | B | A | 78.0 |
| BatchRun_LowSym_2Axis_HighMag_1765540326875\Trial_3 | LOW_SYMMETRY \| TWO_AXIS \| HIGH | C | C | 86.0 |
| BatchRun_LowSym_2Axis_HighMag_1765540326875\Trial_4 | LOW_SYMMETRY \| TWO_AXIS \| HIGH | B | B | 78.0 |
| BatchRun_LowSym_2Axis_HighMag_1765540326875\Trial_5 | LOW_SYMMETRY \| TWO_AXIS \| HIGH | C | C | 78.0 |
| BatchRun_LowSym_2Axis_LowMag_1765540252931\Trial_1 | LOW_SYMMETRY \| TWO_AXIS \| LOW | B | B | 78.0 |
| BatchRun_LowSym_2Axis_LowMag_1765540252931\Trial_2 | LOW_SYMMETRY \| TWO_AXIS \| LOW | C | C | 74.0 |
| BatchRun_LowSym_2Axis_LowMag_1765540252931\Trial_3 | LOW_SYMMETRY \| TWO_AXIS \| LOW | C | A | 78.0 |
| BatchRun_LowSym_2Axis_LowMag_1765540252931\Trial_4 | LOW_SYMMETRY \| TWO_AXIS \| LOW | B | B | 78.0 |
| BatchRun_LowSym_2Axis_LowMag_1765540252931\Trial_5 | LOW_SYMMETRY \| TWO_AXIS \| LOW | C | B | 78.0 |
## Run 2025-12-13 04:04:58
- Trials root: Trials
- Prompt:
```
System prompt:\nYou are an expert participant in a Mental Rotation cognitive test.

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
- reasoning: brief why the chosen candidate matches and one flaw in at least one distractor.\n\nUser instruction:\nUse the two reference views to reconstruct the object. Identify which candidate (A, B, or C) matches the reference after 3D rotation. Reply ONLY with JSON: {"answer":"A|B|C","confidence":0-100,"reasoning":"short explanation"}
```

### gemini (gemini-3-pro-preview)
- Accuracy: 12/40 (30.0%)
- Avg confidence (where provided): 98.6

| Trial | Condition | Correct Answer | Model Answer | Model Confidence |
| --- | --- | --- | --- | --- |
| BatchRun_HighSym_1Axis_HighMag_1765540416838\Trial_1 | HIGH_SYMMETRY \| ONE_AXIS \| HIGH | B | C | 100.0 |
| BatchRun_HighSym_1Axis_HighMag_1765540416838\Trial_2 | HIGH_SYMMETRY \| ONE_AXIS \| HIGH | B | B | 95.0 |
| BatchRun_HighSym_1Axis_HighMag_1765540416838\Trial_3 | HIGH_SYMMETRY \| ONE_AXIS \| HIGH | C | C | 95.0 |
| BatchRun_HighSym_1Axis_HighMag_1765540416838\Trial_4 | HIGH_SYMMETRY \| ONE_AXIS \| HIGH | A | B | 100.0 |
| BatchRun_HighSym_1Axis_HighMag_1765540416838\Trial_5 | HIGH_SYMMETRY \| ONE_AXIS \| HIGH | C | C | 100.0 |
| BatchRun_HighSym_1Axis_LowMag_1765540370741\Trial_1 | HIGH_SYMMETRY \| ONE_AXIS \| LOW | A | B | 95.0 |
| BatchRun_HighSym_1Axis_LowMag_1765540370741\Trial_2 | HIGH_SYMMETRY \| ONE_AXIS \| LOW | A | A | 100.0 |
| BatchRun_HighSym_1Axis_LowMag_1765540370741\Trial_3 | HIGH_SYMMETRY \| ONE_AXIS \| LOW | B | C | 95.0 |
| BatchRun_HighSym_1Axis_LowMag_1765540370741\Trial_4 | HIGH_SYMMETRY \| ONE_AXIS \| LOW | C | C | 100.0 |
| BatchRun_HighSym_1Axis_LowMag_1765540370741\Trial_5 | HIGH_SYMMETRY \| ONE_AXIS \| LOW | A | B | 100.0 |
| BatchRun_HighSym_2Axis_HighMag_1765540469375\Trial_1 | HIGH_SYMMETRY \| TWO_AXIS \| HIGH | A | B | 100.0 |
| BatchRun_HighSym_2Axis_HighMag_1765540469375\Trial_2 | HIGH_SYMMETRY \| TWO_AXIS \| HIGH | C | C | 100.0 |
| BatchRun_HighSym_2Axis_HighMag_1765540469375\Trial_3 | HIGH_SYMMETRY \| TWO_AXIS \| HIGH | B | C | 95.0 |
| BatchRun_HighSym_2Axis_HighMag_1765540469375\Trial_4 | HIGH_SYMMETRY \| TWO_AXIS \| HIGH | C | A | 100.0 |
| BatchRun_HighSym_2Axis_HighMag_1765540469375\Trial_5 | HIGH_SYMMETRY \| TWO_AXIS \| HIGH | B | B | 95.0 |
| BatchRun_HighSym_2Axis_LowMag_1765540443332\Trial_1 | HIGH_SYMMETRY \| TWO_AXIS \| LOW | B | A | 95.0 |
| BatchRun_HighSym_2Axis_LowMag_1765540443332\Trial_2 | HIGH_SYMMETRY \| TWO_AXIS \| LOW | A | C | 100.0 |
| BatchRun_HighSym_2Axis_LowMag_1765540443332\Trial_3 | HIGH_SYMMETRY \| TWO_AXIS \| LOW | C | B | 100.0 |
| BatchRun_HighSym_2Axis_LowMag_1765540443332\Trial_4 | HIGH_SYMMETRY \| TWO_AXIS \| LOW | B | A | 90.0 |
| BatchRun_HighSym_2Axis_LowMag_1765540443332\Trial_5 | HIGH_SYMMETRY \| TWO_AXIS \| LOW | C | A | 100.0 |
| BatchRun_LowSym_1Axis_HighMag_1765540153779\Trial_1 | LOW_SYMMETRY \| ONE_AXIS \| HIGH | B | A | 100.0 |
| BatchRun_LowSym_1Axis_HighMag_1765540153779\Trial_2 | LOW_SYMMETRY \| ONE_AXIS \| HIGH | B | A | 95.0 |
| BatchRun_LowSym_1Axis_HighMag_1765540153779\Trial_3 | LOW_SYMMETRY \| ONE_AXIS \| HIGH | A | A | 95.0 |
| BatchRun_LowSym_1Axis_HighMag_1765540153779\Trial_4 | LOW_SYMMETRY \| ONE_AXIS \| HIGH | C | B | 100.0 |
| BatchRun_LowSym_1Axis_HighMag_1765540153779\Trial_5 | LOW_SYMMETRY \| ONE_AXIS \| HIGH | C | B | 100.0 |
| BatchRun_LowSym_1Axis_LowMag_1765540089976\Trial_1 | LOW_SYMMETRY \| ONE_AXIS \| LOW | B | B | 100.0 |
| BatchRun_LowSym_1Axis_LowMag_1765540089976\Trial_2 | LOW_SYMMETRY \| ONE_AXIS \| LOW | C | A | 100.0 |
| BatchRun_LowSym_1Axis_LowMag_1765540089976\Trial_3 | LOW_SYMMETRY \| ONE_AXIS \| LOW | C | A | 100.0 |
| BatchRun_LowSym_1Axis_LowMag_1765540089976\Trial_4 | LOW_SYMMETRY \| ONE_AXIS \| LOW | A | A | 100.0 |
| BatchRun_LowSym_1Axis_LowMag_1765540089976\Trial_5 | LOW_SYMMETRY \| ONE_AXIS \| LOW | A | A | 100.0 |
| BatchRun_LowSym_2Axis_HighMag_1765540326875\Trial_1 | LOW_SYMMETRY \| TWO_AXIS \| HIGH | C | A | 100.0 |
| BatchRun_LowSym_2Axis_HighMag_1765540326875\Trial_2 | LOW_SYMMETRY \| TWO_AXIS \| HIGH | B | A | 100.0 |
| BatchRun_LowSym_2Axis_HighMag_1765540326875\Trial_3 | LOW_SYMMETRY \| TWO_AXIS \| HIGH | C | B | 100.0 |
| BatchRun_LowSym_2Axis_HighMag_1765540326875\Trial_4 | LOW_SYMMETRY \| TWO_AXIS \| HIGH | B | C | 100.0 |
| BatchRun_LowSym_2Axis_HighMag_1765540326875\Trial_5 | LOW_SYMMETRY \| TWO_AXIS \| HIGH | C | C | 100.0 |
| BatchRun_LowSym_2Axis_LowMag_1765540252931\Trial_1 | LOW_SYMMETRY \| TWO_AXIS \| LOW | B | A | 100.0 |
| BatchRun_LowSym_2Axis_LowMag_1765540252931\Trial_2 | LOW_SYMMETRY \| TWO_AXIS \| LOW | C | A | 100.0 |
| BatchRun_LowSym_2Axis_LowMag_1765540252931\Trial_3 | LOW_SYMMETRY \| TWO_AXIS \| LOW | C | A | 100.0 |
| BatchRun_LowSym_2Axis_LowMag_1765540252931\Trial_4 | LOW_SYMMETRY \| TWO_AXIS \| LOW | B | A | 100.0 |
| BatchRun_LowSym_2Axis_LowMag_1765540252931\Trial_5 | LOW_SYMMETRY \| TWO_AXIS \| LOW | C | A | 100.0 |
