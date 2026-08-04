import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";

interface DiffStats {
	additions: number;
	deletions: number;
}

const GIT_REFRESH_INTERVAL_MS = 3_000;
const GIT_TIMEOUT_MS = 2_000;
const RAINBOW_COLORS = ["error", "warning", "success", "syntaxOperator", "accent", "syntaxKeyword"] as const;

function sanitize(value: string): string {
	return value
		.replace(/[\x00-\x1f\x7f]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export function formatTokens(tokens: number): string {
	return tokens >= 1_000 ? `${Math.floor(tokens / 1_000)}k` : `${tokens}`;
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
					const branch = footerData.getGitBranch();
					const context = ctx.getContextUsage();
					const contextWindow = context?.contextWindow ?? ctx.model?.contextWindow ?? 0;
					const contextTokens = context?.tokens;
					const contextUsage = `${contextTokens == null ? "?" : formatTokens(contextTokens)}/${formatTokens(contextWindow)}`;
					const parts = [model];

					if (branch) {
						parts.push(sanitize(branch), `+${diffStats.additions} -${diffStats.deletions}`);
					}
					parts.push(contextUsage);

					const separator = theme.fg("dim", " | ");
					const line = parts
						.map((part, index) => theme.fg(RAINBOW_COLORS[index % RAINBOW_COLORS.length], part))
						.join(separator);
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
