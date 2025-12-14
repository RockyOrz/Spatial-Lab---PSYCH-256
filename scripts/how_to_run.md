# 如何运行 `scripts/run_llm_trials.py`

下面是手把手的运行指南（默认在仓库根目录执行）。

## 1) 准备环境
- 确认已安装 Python 3.10+。
- 安装依赖（推荐装到当前用户目录，避免权限问题）：
```powershell
python -m pip install --user -r scripts/requirements.txt
```
> 如果你使用虚拟环境，可先 `python -m venv .venv`，然后 `.\.venv\Scripts\activate` 再执行上面的安装命令。

## 2) 配置 API 密钥
1. 复制示例配置：
```powershell
copy scripts\llm_config.example.yaml scripts\llm_config.yaml
```
2. 编辑 `scripts/llm_config.yaml`，填入你的 `api_key`（GPT-5.2 / Qwen / Gemini / DeepSeek）。  
   - 该文件已在 `.gitignore` 中，不会被提交；但仍请不要把密钥泄露到公共场所。
3. 如需只跑部分模型，保留相应的模型配置即可。

## 3) 运行脚本
- 运行全部模型：
```powershell
python scripts\run_llm_trials.py
```
- 只跑指定模型（例如只跑 GPT-5.2 和 Gemini）：
```powershell
python scripts\run_llm_trials.py --models gpt5_2 gemini
```
- 限制试次数做冒烟测试（例如只跑 5 个试次）：
```powershell
python scripts\run_llm_trials.py --max-trials 5
```
- 指定输出文件或配置文件：
```powershell
python scripts\run_llm_trials.py --config scripts\llm_config.yaml --report report\trials_result.md
```

## 4) 查看结果
- 脚本会把每次运行的汇总和逐试次结果追加到 `report/trials_result.md`。  
- 每个模型都在独立会话中回答，避免上下文干扰；表格里可查看正确率、置信度和错误信息。
