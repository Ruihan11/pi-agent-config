import { basename, resolve } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

interface DiffStats {
	additions: number;
	deletions: number;
}

const GIT_REFRESH_INTERVAL_MS = 3_000;
const GIT_TIMEOUT_MS = 2_000;
const CONTEXT_BAR_MAX_WIDTH = 10;
const CONTEXT_BAR_MIN_WIDTH = 4;

function sanitize(value: string): string {
	return value
		.replace(/[\x00-\x1f\x7f]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export function getFolderName(cwd: string): string {
	const absolutePath = resolve(cwd);
	return sanitize(basename(absolutePath) || absolutePath);
}

export function getContextProgress(percent: number | null | undefined, width: number) {
	const normalizedPercent = percent == null || !Number.isFinite(percent) ? null : Math.max(0, Math.min(100, percent));
	const cells = Math.max(1, Math.floor(width));
	const filled = normalizedPercent == null ? 0 : Math.round((normalizedPercent / 100) * cells);

	return {
		filled,
		empty: cells - filled,
		label: normalizedPercent == null ? "?%" : `${Math.round(normalizedPercent)}%`,
		percent: normalizedPercent,
	};
}

export function fitLabels(labels: string[], width: number): string[] {
	if (labels.length === 0) return [];

	const budget = Math.max(labels.length, Math.floor(width));
	const widths = labels.map((label) => visibleWidth(label));
	const minimums = widths.map((labelWidth) => Math.min(labelWidth, 3));
	let total = widths.reduce((sum, labelWidth) => sum + labelWidth, 0);

	while (total > budget) {
		let candidate = -1;
		for (let index = 0; index < widths.length; index += 1) {
			if (widths[index] <= minimums[index]) continue;
			if (candidate === -1 || widths[index] > widths[candidate]) candidate = index;
		}
		if (candidate === -1) break;
		widths[candidate] -= 1;
		total -= 1;
	}

	for (let index = widths.length - 1; total > budget && index >= 0; index = (index - 1 + widths.length) % widths.length) {
		if (widths[index] <= 1) {
			if (widths.every((labelWidth) => labelWidth <= 1)) break;
			continue;
		}
		widths[index] -= 1;
		total -= 1;
	}

	return labels.map((label, index) => truncateToWidth(label, widths[index], "…"));
}

export function parseNumstat(output: string): DiffStats {
	let additions = 0;
	let deletions = 0;

	for (const line of output.split("\n")) {
		const [added, deleted] = line.split("\t", 2);
		if (/^\d+$/.test(added)) additions += Number(added);
		if (/^\d+$/.test(deleted)) deletions += Number(deleted);
	}

	return { additions, deletions };
}

export default function (pi: ExtensionAPI) {
	let refreshActiveFooter: (() => Promise<void>) | undefined;

	pi.on("session_start", async (_event, ctx) => {
		if (ctx.mode !== "tui") return;

		ctx.ui.setFooter((tui, theme, footerData) => {
			let diffStats: DiffStats = { additions: 0, deletions: 0 };
			let disposed = false;
			let refreshRunning = false;
			let refreshQueued = false;
			let activeController: AbortController | undefined;

			const refreshDiff = async (): Promise<void> => {
				if (disposed) return;
				if (refreshRunning) {
					refreshQueued = true;
					return;
				}

				refreshRunning = true;
				do {
					refreshQueued = false;
					const branch = footerData.getGitBranch();
					let nextStats = branch ? diffStats : { additions: 0, deletions: 0 };

					if (branch) {
						const controller = new AbortController();
						activeController = controller;

						try {
							const result = await pi.exec(
								"git",
								["--no-optional-locks", "diff", "--numstat", "HEAD", "--"],
								{ cwd: ctx.cwd, signal: controller.signal, timeout: GIT_TIMEOUT_MS },
							);
							if (result.code === 0) nextStats = parseNumstat(result.stdout);
						} catch {
							// Keep the last successful stats when Git is unavailable or times out.
						} finally {
							if (activeController === controller) activeController = undefined;
						}
					}

					if (
						!disposed &&
						(nextStats.additions !== diffStats.additions || nextStats.deletions !== diffStats.deletions)
					) {
						diffStats = nextStats;
						tui.requestRender();
					}
				} while (refreshQueued && !disposed);
				refreshRunning = false;
			};

			refreshActiveFooter = refreshDiff;

			const unsubscribeBranch = footerData.onBranchChange(() => {
				void refreshDiff();
				tui.requestRender();
			});
			const refreshTimer = setInterval(() => void refreshDiff(), GIT_REFRESH_INTERVAL_MS);
			refreshTimer.unref();
			void refreshDiff();

			return {
				invalidate() {},
				render(width: number): string[] {
					const model = sanitize(ctx.model?.name || ctx.model?.id || "unknown");
					const folder = getFolderName(ctx.cwd);
					const branch = sanitize(footerData.getGitBranch() || "no-git");
					const context = ctx.getContextUsage();
					const separatorText = width >= 36 ? " · " : "·";
					const diffText =
						width >= 36
							? `+${diffStats.additions} -${diffStats.deletions}`
							: `+${diffStats.additions}/-${diffStats.deletions}`;
					const progress = getContextProgress(context?.percent, CONTEXT_BAR_MAX_WIDTH);
					const separatorWidth = visibleWidth(separatorText) * 4;
					const fixedWidth = separatorWidth + visibleWidth(diffText) + 1 + visibleWidth(progress.label);
					const minimumLabelWidth = 3 * 3;
					const availableWidth = Math.max(0, width - fixedWidth);
					const barWidth = Math.max(
						1,
						Math.min(
							CONTEXT_BAR_MAX_WIDTH,
							Math.max(CONTEXT_BAR_MIN_WIDTH, availableWidth - minimumLabelWidth),
						),
					);
					const labels = fitLabels([model, folder, branch], Math.max(3, availableWidth - barWidth));
					const bar = getContextProgress(context?.percent, barWidth);
					const contextColor =
						bar.percent == null
							? "muted"
							: bar.percent >= 90
								? "syntaxVariable"
								: bar.percent >= 75
									? "syntaxNumber"
									: bar.percent >= 50
										? "syntaxType"
										: "syntaxOperator";
					const contextBar =
						theme.fg(contextColor, "█".repeat(bar.filled)) + theme.fg("borderMuted", "░".repeat(bar.empty));
					const diff =
						theme.fg("syntaxString", `+${diffStats.additions}`) +
						theme.fg("dim", width >= 36 ? " " : "/") +
						theme.fg("syntaxVariable", `-${diffStats.deletions}`);
					const parts = [
						theme.fg("accent", labels[0]),
						theme.fg("syntaxOperator", labels[1]),
						theme.fg("syntaxKeyword", labels[2]),
						diff,
						`${contextBar} ${theme.fg(contextColor, bar.label)}`,
					];
					const line = parts.join(theme.fg("dim", separatorText));
					return [truncateToWidth(line, width, theme.fg("dim", "…"))];
				},
				dispose() {
					disposed = true;
					activeController?.abort();
					clearInterval(refreshTimer);
					unsubscribeBranch();
					if (refreshActiveFooter === refreshDiff) refreshActiveFooter = undefined;
				},
			};
		});
	});

	pi.on("tool_execution_end", async () => {
		await refreshActiveFooter?.();
	});

	pi.on("session_shutdown", async () => {
		refreshActiveFooter = undefined;
	});
}
