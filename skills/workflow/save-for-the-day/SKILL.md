---
name: save-for-the-day
description: "Save a daily work log to the Pi agent log directory (${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/log/<YY-MM-DD>.md) summarizing completed work (今日记录) and remaining work (今后计划). Use when the user wants to wrap up, archive progress, or stop for the day. Triggers on save-for-the-day, daily log, work log, 今日记录, 今后计划, 收工, 存档, 记录今天, 存一下今天."
---

# save-for-the-day

把当天工作保存为一份 Markdown 日志。

## 参数

- `LOG_DIR`：默认 `${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/log/`。如果 skill arguments 提供 `LOG_DIR=<path>` 或明确指定其他目录，则使用用户给出的目录。
- arguments 可能包含侧重说明（如“重点记 X”），据此调整内容取舍。

## 流程

### 1. 确定日期与路径

不要凭记忆推断日期。使用 `bash` 执行；如果用户指定了目录，替换第一行的默认值：

```bash
LOG_DIR="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/log"
TODAY="$(date +%y-%m-%d)"
mkdir -p -- "$LOG_DIR"
printf '%s/%s.md\n' "$LOG_DIR" "$TODAY"
```

目标文件为 `<LOG_DIR>/<YY-MM-DD>.md`。

### 2. 收集内容

只从**当前 Pi 会话可见的上下文**提取，不扫描 session transcript，也不猜测：

- **今日记录**：本次会话里实际完成、且有验证或输出佐证的事项，使用 `- [x]`。
- **今后计划**：明确提过但未完成的后续项、遗留问题和被推迟的建议，使用 `- [ ]`。

规则：

- 每条一行、一到两句，写“做了什么 + 结果”，不写过程流水账。
- 只写真正完成的事项；失败或跳过的事项归入“今后计划”，并注明卡点。
- 没有“今后计划”时保留空小节，不编造内容。

### 3. 写入日志

**文件不存在**：使用 `write` 按模板创建。

**文件已存在**（当天再次调用）：

1. 使用 `read` 读取现有文件。
2. 使用 `edit` 将新条目追加到对应小节末尾。
3. 保留原有条目及勾选状态，不重写、不重排。
4. 如果某条“今后计划”本次已完成，将它移到“今日记录”并改为 `- [x]`。
5. 语义重复的条目不重复添加。

### 4. 模板

```markdown
# <YY-MM-DD>

## 今日记录
- [x] <做了什么 + 结果>

## 今后计划
- [ ] <待办 + 原因或卡点>
```

### 5. 收尾

只报告写入路径，以及本次新增了几条记录和几条计划；不要打印整个日志文件。
