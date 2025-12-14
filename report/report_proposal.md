# Report Proposal：LLM 在 3D Mental Rotation 任务中的表现与置信度校准

## 1. 研究目标（你这份报告要回答什么）

本项目测试多模态大语言模型（LLM）是否能在视觉心智旋转（mental rotation）任务中正确识别“同一物体的 3D 旋转视图”，以及它们是否能像人类一样：在更难的空间变换下表现更差，并在不确定时降低置信度（confidence calibration / metacognition）。

## 2. 研究问题（Research Questions）

1. LLM 的识别准确率是否高于随机猜测（chance = 1/3）？不同模型之间是否存在稳定差异？
2. 任务难度操控（对称性、旋转轴数量、旋转幅度）是否会系统性影响模型准确率？
3. 模型的自信程度是否与正确率匹配（校准良好），以及是否能随难度变化而调整？
4. 是否存在明显的选项偏好（例如总是偏向回答某个字母），从而影响准确率解释？

## 3. 可检验假设（Hypotheses）

H1（能力）：视觉模型准确率略高于随机猜测，但明显低于人类（待加入人类对照后检验）。  
H2（难度效应）：两轴旋转与大幅度旋转会降低准确率；低对称物体更难。  
H3（元认知）：模型存在过度自信（平均置信度显著高于正确率），且置信度对“对/错”的区分能力弱。  
H4（反应偏差）：部分模型会出现强烈选项偏好（A/B/C 的输出分布不均），这会导致“表面准确率”接近某些简单基线。

## 4. 方法设计（Methods）

### 4.1 刺激与任务

- 每道题包含 5 张图片：两张参考视图（`1_Reference_Front.jpg`、`2_Reference_Back.jpg`）+ 三个候选视图（`3_Target_A.jpg/B.jpg/C.jpg`）。
- 三个候选中仅 1 个与参考物体相同（仅做 3D 旋转），其余 2 个为结构性干扰项（structural distractors）。
- 真值来自每题 `Metadata.json`（包含目标是否正确与旋转参数）。

### 4.2 自变量（2×2×2 因子设计）

来自 `report/project_proposal.md` 的三维难度操控：

- **物体对称性**：HIGH_SYMMETRY vs LOW_SYMMETRY  
- **旋转轴数量**：ONE_AXIS vs TWO_AXIS  
- **旋转幅度**：LOW vs HIGH

共 8 个条件，每个条件 5 道题，总计 40 道题（见 `Trials/BatchRun_*`）。

### 4.3 被试与程序

- 被试：4 个模型（见 `report/trials_result.md`）。
- 程序：每题在“全新会话”中运行，避免上下文污染；模型输出 JSON：`answer`（A/B/C）+ `confidence`（0–100）+ `reasoning`（简述）。
- 采样参数：脚本默认温度 `temperature=0.2`（见 `scripts/run_llm_trials.py`）。

## 5. 数据与分析计划（Analysis Plan）

### 5.1 主要指标（Performance）

- **总体准确率**：每模型 40 题正确比例。
- **条件准确率**：每模型在 8 个条件下的正确率（每格 n=5；报告中需强调不确定性较大）。
- **基线对照**：
  - 随机猜测基线：33.3%。
  - 简单“多数类”基线：始终回答在本题集里最常见的正确选项（本次为 C；见下方结果快照）。

可选推断统计（若你想更“有野心”）：
- 二项检验（vs 1/3）或对数几率/逻辑回归（Accuracy ~ Symmetry × Axis × Magnitude + Model），但需要更多题量提升统计功效。

### 5.2 置信度与校准（Metacognition / Calibration）

将 `confidence/100` 视为“主观正确概率”的粗略近似，计算：

- **Overconfidence gap**：mean(confidence) − accuracy（越大越过度自信）。
- **ECE（Expected Calibration Error）**：分箱后 |acc−conf| 的加权平均。
- **Brier score**：平均 (p − y)^2（越小越好）。
- **区分度**：mean_p(correct) − mean_p(wrong)（如果接近 0，说明置信度基本不区分对错）。

报告呈现建议：
- 一张 **校准曲线/可靠性图（reliability diagram）**。
- 一张 **Accuracy vs Avg Confidence** 的并列条形图（或散点图）。

### 5.3 错误模式与偏差（Error pattern）

- **选项偏好**：统计各模型输出 A/B/C 的比例，与正确答案分布对照。
- **条件交互**：查看是否出现“某模型只在某些条件有效”的模式（但需谨慎解释：每格 n 很小）。

## 6. 当前结果快照（基于 `report/trials_result.md`）

### 6.1 总体表现（n=40/模型）

| Model | Accuracy | Avg confidence |
| --- | --- | --- |
| gpt5_2 (gpt-5.2) | 15/40 = 37.5% | 79.2 |
| gemini (gemini-3-pro-preview) | 12/40 = 30.0% | 98.6 |
| qwen (qwen-vl-plus) | 17/40 = 42.5% | 95.0 |
| deepseek (deepseek-chat) | 18/40 = 45.0% | 92.0 |

说明：
- 随机猜测为 33.3%。当前最好模型（deepseek）为 45.0%，但样本量较小，统计上未必显著高于 1/3（可在正文报告二项检验或给出置信区间）。
- 本题集中正确答案分布不均（A:9 / B:14 / C:17）；若始终回答 C，准确率可达 **42.5%**。因此解释模型准确率时必须同时报告“多数类基线”。

### 6.2 条件准确率（每格 n=5）

| Condition | gpt5_2 | gemini | qwen | deepseek |
| --- | --- | --- | --- | --- |
| HIGH_SYMMETRY \| ONE_AXIS \| HIGH | 40% | 60% | 100% | 60% |
| HIGH_SYMMETRY \| ONE_AXIS \| LOW | 20% | 40% | 80% | 20% |
| HIGH_SYMMETRY \| TWO_AXIS \| HIGH | 0% | 40% | 60% | 40% |
| HIGH_SYMMETRY \| TWO_AXIS \| LOW | 40% | 0% | 40% | 20% |
| LOW_SYMMETRY \| ONE_AXIS \| HIGH | 20% | 20% | 0% | 60% |
| LOW_SYMMETRY \| ONE_AXIS \| LOW | 40% | 60% | 40% | 40% |
| LOW_SYMMETRY \| TWO_AXIS \| HIGH | 80% | 20% | 20% | 60% |
| LOW_SYMMETRY \| TWO_AXIS \| LOW | 60% | 0% | 0% | 60% |

建议在报告中强调：每个条件只有 5 题，上表很容易受“个别题目”影响；更适合作为探索性结果，并据此提出下一轮加题/平衡化的计划。

### 6.3 置信度校准（简要结论）

- 所有模型都表现出明显的**过度自信**：平均置信度远高于真实正确率。
- 置信度对对/错的区分度几乎为 0（mean_p(correct) − mean_p(wrong)≈0），意味着“自信高 ≠ 更可能答对”。

## 7. 报告结构建议（按评分标准组织）

> 你可以用 IMRaD（Introduction–Methods–Results–Discussion）写作框架，并把 rubric 的四项要求映射到对应章节。

1. **Introduction / Conceptual Background（对应概念解释 20%）**  
   - Mental rotation 在人类认知中的典型发现（例：旋转角越大越难；可引用经典文献）。  
   - 为什么用对称性/轴数量/幅度操控难度是合理的。  
   - LLM（尤其多模态）可能“像人类一样”还是“用别的捷径”的理论预期。

2. **Methods（对应测试方法与执行 40%）**  
   - 刺激、条件、题量与生成方式（含 `Metadata.json` 真值）。  
   - 模型列表、版本、温度、JSON 输出约束、每题新会话。  
   - 评分与数据处理流程（如何算准确率、如何处理缺失输出）。

3. **Results（对应方法执行与核心发现呈现）**  
   - 总体准确率 + 基线（1/3 与多数类）。  
   - 条件分解结果（强调不确定性）。  
   - 置信度校准（至少给出 Accuracy vs Confidence；若可再给校准曲线/ECE/Brier）。

4. **Discussion（对应结果解释 25%）**  
   - 结论：LLM 是否具备稳定的 3D 心智旋转能力？在什么意义上“像/不像”人类？  
   - 为什么会出现高置信但低准确（可能的机制：表面线索、过度泛化、无法形成稳定 3D 表征等）。  
   - 局限与改进：题量、答案分布不均、提示词、模型差异、缺少人类对照等。

5. **Conclusion（1 段即可）**  
   - 回答研究问题 + 给出下一步最关键的实验计划。

6. **Appendix（课程硬性要求）**  
   - 完整 prompt 与模型输出（建议补充保存每题返回的原始 JSON，含 reasoning 与错误信息）。  
   - 可附一两个代表性题目的图片示例（说明如何判断“结构性差异”）。

## 8. 下一步计划（为了让最终报告更强）

1. **增加题量与平衡答案分布**：每条件至少 20 题（总 ≥160），并让正确答案在 A/B/C 中尽量平衡。  
2. **加入人类对照组**：同一刺激集测若干人类被试（至少准确率；若能收 RT 更贴近经典 mental rotation 研究）。  
3. **做重复性/一致性测试**：同一题让同一模型重复多次（测“同题同答”的稳定性）。  
4. **改进置信度测量**：让模型输出 A/B/C 的概率分布（和为 1），再用 log loss / ECE 做更合理的校准分析。  
5. **错误诊断**：挑选高置信错误样本，观察 reasoning 是否呈现“看错结构”的一致模式。

