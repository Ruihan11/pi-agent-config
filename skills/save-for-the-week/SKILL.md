---
name: save-for-the-week
description: "Merge the daily logs in ~/.claude/log/ over a date range into one themed weekly summary, printed to the terminal. Always confirms the start and end date with the user first. Use when the user wants a weekly recap, to summarize the week, or to roll several daily logs into one. Triggers on save-for-the-week, weekly log, weekly summary, 周报, 本周记录, 汇总本周, 合并日报, 这周做了什么."
---

# save-for-the-week

把一段日期范围内的日报归并成一份周报，**直接打印到终端**。

## 参数

- `LOG_DIR`：日报目录，默认 `~/.claude/log/`。args 给了别的路径就用它。
- args 里若已明确日期范围（如 `26-07-13 ~ 26-07-19`、`上周`），跳过第 1 步直接用。

## 1. 先聊日期范围（必须）

除非 args 已明确给出，**先问用户，不要自己定**。

先取事实，不要凭记忆推断日期：

```bash
date +%y-%m-%d                                      # 今天
date +%u                                            # 1=周一 .. 7=周日
date -d "-$(( $(date +%u) - 1 )) days" +%y-%m-%d    # 本周一
date -d "+$(( 7 - $(date +%u) )) days" +%y-%m-%d    # 本周日
ls <LOG_DIR>/*.md                                   # 实际存在哪些日报
```

再用 AskUserQuestion 给选项。选项必须基于**实际存在的日报**，不要给出范围内一份日报都没有的选项：

- 本周（`<本周一>` ~ `<今天>`）
- 上周（`<上周一>` ~ `<上周日>`）
- 全部现有日报（`<最早>` ~ `<最晚>`）

## 2. 读取

逐个 Read 范围内的 `<LOG_DIR>/<YY-MM-DD>.md`。

- 缺失的日期直接跳过，不报错、不编造。
- 范围内一份都没有：告诉用户没有日报并停止，**不要编内容**。

## 3. 归并成一份

**本周记录**：
- 按主题分组；主题名从内容里现提炼，不要套固定分类。
- 跨天重复或连续推进的同一件事**合并成一条**，写最终结果，不是逐天过程。
- 只收 `- [x]`。

**今后计划**：
- 汇总所有天的 `- [ ]` 并去重。
- 若某条在更晚的日报里已完成（出现为 `- [x]`），**剔除**，不列入。
- 保留 `- [ ]`。

## 4. 输出

**打印到终端。不写文件、不调 Write。**

```markdown
# <起> ~ <止>

## 本周记录

### <主题>
- [x] <合并后的结果>

## 今后计划
- [ ] <待办>
```

末尾附一行：实际覆盖了几天（有日报的天数），以及范围内哪几天没有日报。
