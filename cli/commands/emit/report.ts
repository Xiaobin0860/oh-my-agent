import type {
  AgentSkillsEmitReport,
  AgentsMdEmitReport,
  ClaudePluginEmitReport,
  CliDocsEmitReport,
} from "../../platform/emit/types.js";

export interface EmitRunReport {
  agentSkills?: AgentSkillsEmitReport;
  claudePlugin?: ClaudePluginEmitReport;
  agentsMd?: AgentsMdEmitReport;
  cliDocs?: CliDocsEmitReport;
}

export function renderJson(report: EmitRunReport): string {
  return JSON.stringify(report, null, 2);
}

function renderAgentSkillsSection(report: AgentSkillsEmitReport): string[] {
  const lines = [
    `agent-skills -> ${report.outDir}`,
    `  ${report.passCount} passed, ${report.failCount} failed (${report.skills.length} total)`,
  ];
  for (const result of report.skills) {
    const status = result.validation.valid ? "PASS" : "FAIL";
    lines.push(`  [${status}] ${result.skill}`);
    for (const err of result.validation.errors) {
      lines.push(`      error: ${err.field}: ${err.message}`);
    }
    for (const warn of result.validation.warnings) {
      lines.push(`      warn:  ${warn.field}: ${warn.message}`);
    }
  }
  return lines;
}

function renderClaudePluginSection(report: ClaudePluginEmitReport): string[] {
  return [`claude-plugin -> ${report.outPath}`];
}

function renderAgentsMdSection(report: AgentsMdEmitReport): string[] {
  return [
    `agents-md -> ${report.outPath}`,
    `  existing: ${report.existingPath} (${report.existingExists ? "found" : "not found"})`,
    `  differs from existing: ${report.existingDiffers ? "yes" : "no"}`,
  ];
}

function renderCliDocsSection(report: CliDocsEmitReport): string[] {
  const lines = [`cli-docs -> ${report.outDir}`];
  for (const file of report.files) {
    lines.push(
      `  [${file.changed ? "UPDATED" : "unchanged"}] ${file.outPath} (${file.vendor})`,
    );
  }
  return lines;
}

export function renderText(report: EmitRunReport): string {
  const lines: string[] = [];
  if (report.agentSkills)
    lines.push(...renderAgentSkillsSection(report.agentSkills), "");
  if (report.claudePlugin)
    lines.push(...renderClaudePluginSection(report.claudePlugin), "");
  if (report.agentsMd)
    lines.push(...renderAgentsMdSection(report.agentsMd), "");
  if (report.cliDocs) lines.push(...renderCliDocsSection(report.cliDocs), "");
  return lines.join("\n").trimEnd();
}
