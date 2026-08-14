---
name: save-for-the-week
description: "Merge daily logs from the Pi agent log directory (${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/log) over a date range into one themed weekly summary returned in the assistant response. Confirm the range unless skill arguments already specify it. Use for weekly recaps, 周报, 本周记录, 汇总本周, 合并日报, or 这周做了什么."
---

# save-for-the-week

把指定日期范围内的 Pi 日报归并为一份周报，并在最终回复中返回 Markdown。

## 参数

- `LOG_DIR`：默认 `${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/log/`。如果 skill arguments 提供 `LOG_DIR=<path>` 或明确指定其他目录，则使用用户给出的目录。
- 如果 arguments 已明确日期范围（如 `26-07-13 ~ 26-07-19`、`上周`），直接使用该范围，不再询问。

## 1. 确认日期范围

没有明确范围时，先取得事实，不要凭记忆推断日期。使用 `bash` 执行；如果用户指定了目录，替换第一行的默认值：

```bash
LOG_DIR="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/log"
TODAY="$(date +%y-%m-%d)"
WEEKDAY="$(date +%u)"
MONDAY="$(date -d "-$((WEEKDAY - 1)) days" +%y-%m-%d)"
SUNDAY="$(date -d "+$((7 - WEEKDAY)) days" +%y-%m-%d)"
printf 'today=%s monday=%s sunday=%s\n' "$TODAY" "$MONDAY" "$SUNDAY"
if [ -d "$LOG_DIR" ]; then
  find "$LOG_DIR" -maxdepth 1 -type f -name '*.md' -printf '%f\n' | sort
fi
```

然后用普通助手回复询问用户，并提供基于**实际存在日报**的编号选项：

1. 本周（`<本周一>` ~ `<今天>`）
2. 上周（`<上周一>` ~ `<上周日>`）
3. 全部现有日报（`<最早>` ~ `<最晚>`）

不要提供范围内一份日报都没有的选项。本轮只提出问题并等待用户选择，下一轮再继续。

## 2. 读取日报

使用 `read` 逐个读取范围内的 `<LOG_DIR>/<YY-MM-DD>.md`。

- 缺失日期直接跳过，不报错、不编造。
- 范围内没有任何日报时，告诉用户没有可汇总内容并停止。

## 3. 归并

**本周记录**：

- 按内容提炼主题，不套用固定分类。
- 将跨天重复或连续推进的同一事项合并为一条，只写最终结果。
- 只收集 `- [x]` 条目。

**今后计划**：

- 汇总所有 `- [ ]` 条目并去重。
- 如果某条计划在更晚日报中已变为 `- [x]`，将其剔除。
- 保留未完成项的 `- [ ]` 状态。

## 4. 返回结果

在最终助手回复中直接返回以下 Markdown；不要使用 `write` 或 `edit` 创建周报文件。

```markdown
# <起始日期> ~ <结束日期>

## 本周记录

### <主题>
- [x] <合并后的结果>

## 今后计划
- [ ] <待办>
```

末尾注明实际覆盖的日报天数，以及日期范围内缺失了哪些天。
