import * as p from "@clack/prompts";
import pc from "picocolors";
import { checkStarred } from "../../../io/github.js";
import type { DoctorReport } from "../types.js";

export function renderFooter(report: DoctorReport): void {
  if (report.hasSerena) {
    p.note(
      `${pc.green("✅")} Serena memory directory exists\n${pc.dim(`${report.serenaFileCount} memory files found`)}`,
      "Serena Memory",
    );
  } else {
    p.note(
      `${pc.yellow("⚠️")} Serena memory directory not found\n${pc.dim("Dashboard will show 'No agents detected'")}`,
      "Serena Memory",
    );
  }

  renderSerenaReap(report);

  for (const doc of report.vendorDocs) {
    if (!doc.required) continue;
    const label = `./${doc.fileName}`;
    if (doc.hasOmaBlock) {
      p.note(`${pc.green("✅")} OMA block found in ${label}`, doc.fileName);
    } else {
      p.note(
        `${pc.yellow("⚠️")} OMA block missing in ${label}\n${pc.dim("Run 'oh-my-agent' to install or reinstall")}`,
        doc.fileName,
      );
    }
  }

  if (report.totalIssues === 0) {
    p.outro(pc.green("✅ All checks passed! Ready to use."));
  } else {
    p.outro(
      pc.yellow(`⚠️  Found ${report.totalIssues} issue(s). See details above.`),
    );
  }

  if (checkStarred()) {
    p.note(`${pc.green("⭐")} Thank you for starring oh-my-agent!`, "Support");
  } else {
    p.note(
      `${pc.yellow("❤️")} Enjoying oh-my-agent? Give it a star or sponsor!\n${pc.dim("gh api --method PUT /user/starred/first-fluke/oh-my-agent")}\n${pc.dim("https://github.com/sponsors/first-fluke")}`,
      "Support",
    );
  }
}

/**
 * Render the Serena reaper diagnostic (T1-3: always surface the per-root signal
 * source; T2-2: surface heavy/unmapped language advisories). Skipped silently
 * only when no Serena roots are running (nothing to report).
 */
function renderSerenaReap(report: DoctorReport): void {
  const check = report.serenaReap;
  if (!check || check.roots.length === 0) {
    if (check?.languageAdvisories.length) {
      renderLanguageAdvisories(check.languageAdvisories);
    }
    return;
  }

  const lines: string[] = [];
  lines.push(
    `${pc.dim("policy")} ${check.config.policy}  ${pc.dim("keep-warm")} ${check.config.keepWarm}  ${pc.dim("enabled")} ${check.config.enabled ? pc.green("yes") : pc.yellow("no (opt-in)")}`,
  );
  lines.push(
    `${check.roots.length} root(s), LSP RSS ${check.totalLspRssMb.toFixed(1)} MB · reapable ${check.reapableRssMb.toFixed(1)} MB across ${check.reapTargetCount} target(s)`,
  );
  for (const root of check.roots) {
    const tag = root.isReapTarget ? pc.yellow("REAP") : pc.green("KEEP");
    lines.push(
      `${tag} ${root.project} ${pc.dim(`(pid ${root.pid})`)} — signal:${root.signalSource} idle:${root.idleMinutes}m rss:${root.lspRssMb.toFixed(1)}MB`,
    );
  }
  p.note(lines.join("\n"), "Serena Reaper");

  renderLanguageAdvisories(check.languageAdvisories);
}

function renderLanguageAdvisories(
  advisories: DoctorReport["serenaReap"]["languageAdvisories"],
): void {
  if (advisories.length === 0) return;
  const lines = advisories.map(
    (a) =>
      `${pc.yellow("⚠️")} ${a.language}: ${a.reason}\n${pc.dim(`   ${a.suggestion}`)}`,
  );
  p.note(lines.join("\n"), "Serena Languages");
}
