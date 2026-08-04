---
name: save-for-the-day
description: "Save a daily work log to ~/.claude/log/<YY-MM-DD>.md summarizing what got done today (今日记录) and what is left for next time (今后计划). Use when the user wants to wrap up, record or archive the day's work, or save progress before stopping. Triggers on save-for-the-day, daily log, work log, 今日记录, 今后计划, 收工, 存档, 记录今天, 存一下今天."
---

# save-for-the-day

把当天工作存成一份 Markdown 日志。

## 参数

- `LOG_DIR`：日志目录，默认 `~/.claude/log/`。用户在 args 里给了别的路径就用它。
- args 里可能带侧重说明（如「重点记 X」），据此调整取舍。

## 流程

### 1. 取日期与路径

不要凭记忆推断日期，执行：

```bash
date +%y-%m-%d
```

目标文件 `<LOG_DIR>/<YY-MM-DD>.md`；先 `mkdir -p "<LOG_DIR>"`。

### 2. 收集内容

只从**当前会话**提取，不扫 transcript、不猜：

- **今日记录**：本次会话里实际做完、且有验证或输出佐证的事，用 `- [x]`。
- **今后计划**：明确提过但没做的后续项、遗留问题、被推迟的建议，用 `- [ ]`。

规则：
- 每条 1 行 1-2 句，写「做了什么 + 结果」，不写过程。
- 只写真做完的。失败或跳过的归入「今后计划」，注明卡在哪。
- 没有「今后计划」内容时保留空小节，不编造。

### 3. 写入

**文件不存在**：按模板新建。

**文件已存在**（当天再次调用）：
1. 先 Read 现有文件。
2. 新条目**追加**到对应小节末尾。
3. 保留原有条目及其勾选状态，不重写、不重排。
4. 若某条「今后计划」本次已完成，把它移到「今日记录」并改成 `- [x]`。
5. 去重：语义重复的条目不重复添加。

### 4. 模板

```markdown
# <YY-MM-DD>

## 今日记录
- [x] <做了什么 + 结果>

## 今后计划
- [ ] <待办 + 为什么或卡在哪>
```

### 5. 收尾

只报写入路径 + 本次新增几条记录、几条计划。不要把整个文件内容打印出来。
