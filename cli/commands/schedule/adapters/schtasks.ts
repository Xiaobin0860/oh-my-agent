/**
 * schedule/adapters/schtasks.ts
 *
 * SchtasksAdapter -- Windows Task Scheduler backend for oma schedule.
 *
 * upsert : schtasks /Create /TN "<label>" /TR "<absOma> schedule:run <id>"
 *          /SC <sched> ... /F  (translate cron -> schtasks schedule flags)
 * remove : schtasks /Delete /TN "<label>" /F
 * listLabels : schtasks /Query /FO CSV -> filter tasks starting with dev.oma.
 * isAvailable : process.platform === "win32"
 *
 * /TR always uses the absolute oma binary path because schtasks runs jobs
 * without a user shell; a bare "oma" would not be found in the system PATH.
 *
 * Per .agents/skills/_shared/core/api-contracts/schedule-scheduler-port.md §2
 */

import { execFileSync } from "node:child_process";
import * as path from "node:path";
import type { ScheduledJobSpec, SchedulerPort } from "../port.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the absolute path to the oma binary.
 * schtasks /TR runs without a user shell and with a restricted PATH,
 * so we must embed an absolute path at registration time.
 */
function resolveOmaBinary(): string {
  try {
    // On Windows, `where` is the equivalent of `command -v`
    const found = execFileSync("where", ["oma"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .split(/\r?\n/)[0]; // `where` may return multiple lines; take first
    // schtasks is Windows-only: validate as a Windows path so resolution is
    // correct even when this code is exercised under a POSIX test runner.
    if (found && path.win32.isAbsolute(found)) return found;
  } catch {
    // fall through
  }
  return process.execPath;
}

// ---------------------------------------------------------------------------
// cron -> schtasks schedule flags translator
//
// schtasks /SC supports: MINUTE, HOURLY, DAILY, WEEKLY, MONTHLY, ONCE, etc.
// We translate the common cron shapes that map cleanly to a single schtasks
// /Create invocation. Unsupported shapes throw a clear error.
//
// Supported cron shapes:
//   */N * * * *        -> /SC MINUTE /MO N
//   M * * * *          -> /SC HOURLY /ST 00:M  (at minute M of every hour)
//   M H * * *          -> /SC DAILY  /ST H:M
//   M H * * D          -> /SC WEEKLY /D <dow>  /ST H:M
//   0 0 1 * *          -> /SC MONTHLY /D 1     /ST 0:00
//
// All times use HH:MM format (24-hour, no seconds).
// ---------------------------------------------------------------------------

interface SchtasksFlags {
  /** All flags following /Create /TN /TR /F, e.g. ["/SC", "DAILY", "/ST", "09:00"] */
  scheduleArgs: string[];
}

const DOW_MAP: Record<string, string> = {
  "0": "SUN",
  "1": "MON",
  "2": "TUE",
  "3": "WED",
  "4": "THU",
  "5": "FRI",
  "6": "SAT",
  "7": "SUN",
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Translate a 5-field cron expression to schtasks /Create schedule flags.
 * Throws for unsupported shapes.
 */
export function cronToSchtasksFlags(cron: string): SchtasksFlags {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(
      `SchtasksAdapter: invalid cron expression "${cron}". ` +
        `Expected 5 fields (minute hour dom month dow).`,
    );
  }

  const [minuteStr, hourStr, domStr, monthStr, dowStr] = parts as [
    string,
    string,
    string,
    string,
    string,
  ];

  const isWildcard = (f: string) => f === "*";
  const isNumber = (f: string) => /^\d+$/.test(f);
  const isStep = (f: string) => /^\*\/\d+$/.test(f);

  // Shape: */N * * * *  -> every N minutes
  if (
    isStep(minuteStr) &&
    isWildcard(hourStr) &&
    isWildcard(domStr) &&
    isWildcard(monthStr) &&
    isWildcard(dowStr)
  ) {
    const stepMatch = /^\*\/(\d+)$/.exec(minuteStr);
    const interval = stepMatch?.[1] ?? "1";
    return { scheduleArgs: ["/SC", "MINUTE", "/MO", interval] };
  }

  // Shape: M * * * *  -> at minute M of every hour
  if (
    isNumber(minuteStr) &&
    isWildcard(hourStr) &&
    isWildcard(domStr) &&
    isWildcard(monthStr) &&
    isWildcard(dowStr)
  ) {
    const minute = Number(minuteStr);
    const startTime = `00:${pad2(minute)}`;
    return { scheduleArgs: ["/SC", "HOURLY", "/ST", startTime] };
  }

  // Remaining shapes require specific hour + minute
  if (!isNumber(minuteStr) || !isNumber(hourStr)) {
    throw new Error(
      `SchtasksAdapter: cron expression "${cron}" has a complex minute/hour ` +
        `field that cannot be expressed as a single schtasks schedule. ` +
        `Use a simple hour:minute (e.g. "0 9 * * *") or "*/N" step.`,
    );
  }

  const minute = Number(minuteStr);
  const hour = Number(hourStr);
  const startTime = `${pad2(hour)}:${pad2(minute)}`;

  // Shape: M H * * *  -> daily at H:M
  if (isWildcard(domStr) && isWildcard(monthStr) && isWildcard(dowStr)) {
    return { scheduleArgs: ["/SC", "DAILY", "/ST", startTime] };
  }

  // Shape: M H * * D  -> weekly on day D at H:M
  if (isWildcard(domStr) && isWildcard(monthStr) && isNumber(dowStr)) {
    const dowName = DOW_MAP[dowStr];
    if (!dowName) {
      throw new Error(
        `SchtasksAdapter: invalid day-of-week "${dowStr}" in cron "${cron}".`,
      );
    }
    return { scheduleArgs: ["/SC", "WEEKLY", "/D", dowName, "/ST", startTime] };
  }

  // Shape: M H D * *  -> monthly on day D at H:M
  if (isNumber(domStr) && isWildcard(monthStr) && isWildcard(dowStr)) {
    return { scheduleArgs: ["/SC", "MONTHLY", "/D", domStr, "/ST", startTime] };
  }

  throw new Error(
    `SchtasksAdapter: cron expression "${cron}" cannot be translated to a ` +
      `single schtasks /Create schedule. Supported shapes: ` +
      `"*/N * * * *" (every N minutes), "M * * * *" (hourly at :M), ` +
      `"M H * * *" (daily), "M H * * D" (weekly), "M H D * *" (monthly).`,
  );
}

/**
 * Normalize a raw schtasks CSV TaskName to the dev.oma.<id> form.
 * schtasks may return "\dev.oma.sch_abc" (backslash-prefixed root path).
 */
function normalizeTaskName(raw: string): string {
  // Strip surrounding quotes (CSV parsing)
  let name = raw.replace(/^"(.*)"$/, "$1");
  // Strip leading backslash (root task folder)
  name = name.replace(/^\\/, "");
  return name;
}

// ---------------------------------------------------------------------------
// SchtasksAdapter
// ---------------------------------------------------------------------------

export class SchtasksAdapter implements SchedulerPort {
  async isAvailable(): Promise<boolean> {
    return process.platform === "win32";
  }

  async upsert(spec: ScheduledJobSpec): Promise<void> {
    const absOma = resolveOmaBinary();

    // Build the resolved command: replace bare "oma" with absolute path
    const resolvedCommand =
      spec.command[0] === "oma"
        ? [absOma, ...spec.command.slice(1)]
        : spec.command;

    const taskRun = resolvedCommand.join(" ");
    const { scheduleArgs } = cronToSchtasksFlags(spec.cron);

    // Build schtasks /Create args
    // /F = force (overwrite if exists -- idempotent upsert)
    const args = [
      "/Create",
      "/TN",
      spec.label,
      "/TR",
      taskRun,
      ...scheduleArgs,
      "/F",
    ];

    execFileSync("schtasks", args, { encoding: "utf-8" });
  }

  async remove(label: string): Promise<void> {
    try {
      execFileSync("schtasks", ["/Delete", "/TN", label, "/F"], {
        encoding: "utf-8",
      });
    } catch {
      // Task does not exist -- no-op
    }
  }

  async listLabels(): Promise<string[]> {
    let csv: string;
    try {
      csv = execFileSync("schtasks", ["/Query", "/FO", "CSV"], {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {
      return [];
    }

    const labels: string[] = [];
    const lines = csv.split(/\r?\n/);

    for (const line of lines) {
      if (!line.trim()) continue;
      // CSV format: "TaskName","Next Run Time","Status"
      // TaskName is the first comma-separated field
      const firstField = line.split(",")[0];
      if (!firstField) continue;

      const normalized = normalizeTaskName(firstField);
      if (normalized.startsWith("dev.oma.")) {
        labels.push(normalized);
      }
    }

    return labels;
  }
}
