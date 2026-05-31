import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function getKiroHome(env: NodeJS.ProcessEnv): string {
  return env.KIRO_HOME?.trim() || join(homedir(), ".kiro");
}

/**
 * Checks whether the user is authenticated for Kiro CLI.
 *
 * Kiro stores credentials under `~/.kiro/` (or `$KIRO_HOME`).
 * Falls back to running `kiro-cli auth status` if the credential file is absent.
 */
export function isKiroAuthenticated(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const kiroHome = getKiroHome(env);

  // Kiro uses AWS CodeWhisperer/Q tokens stored in the platform data dir,
  // but the presence of a settings file is a reliable proxy for a logged-in session.
  const settingsPath = join(kiroHome, "settings", "cli.json");
  if (existsSync(settingsPath)) {
    return true;
  }

  // Fall back to CLI probe
  try {
    const output = execSync("kiro-cli auth status", {
      stdio: ["pipe", "pipe", "ignore"],
      encoding: "utf-8",
      timeout: 5000,
    });
    const normalized = output.toLowerCase();
    if (/\b(not authenticated|not logged in|logged out)\b/.test(normalized)) {
      return false;
    }
    return /\b(authenticated|logged in)\b/.test(normalized);
  } catch {
    return false;
  }
}
