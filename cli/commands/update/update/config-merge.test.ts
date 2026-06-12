import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { appendMissingConfigKeys } from "./config-merge.js";

const TEMPLATE = [
  "# oh-my-agent — project config",
  "language: en",
  "translation_voice: balanced",
  "date_format: ISO",
  "timezone: Asia/Seoul",
  "auto_update_cli: true",
  "telemetry: false",
  "docs:",
  "  auto_verify: false",
  "  check_urls: true",
  "model_preset: antigravity",
  "",
].join("\n");

describe("appendMissingConfigKeys", () => {
  it("appends template keys missing from the user file", () => {
    const user =
      "language: ko\ndate_format: ISO\ntimezone: Asia/Seoul\nmodel_preset: gemini\n";
    const { content, addedKeys } = appendMissingConfigKeys(user, TEMPLATE);

    expect(addedKeys).toEqual([
      "translation_voice",
      "auto_update_cli",
      "telemetry",
      "docs",
    ]);
    const merged = parseYaml(content) as Record<string, unknown>;
    expect(merged.translation_voice).toBe("balanced");
    expect(merged.auto_update_cli).toBe(true);
    expect(merged.telemetry).toBe(false);
    expect(merged.docs).toEqual({ auto_verify: false, check_urls: true });
  });

  it("never modifies keys the user already has", () => {
    const user = "language: ko\nmodel_preset: gemini\n";
    const { content } = appendMissingConfigKeys(user, TEMPLATE);

    const merged = parseYaml(content) as Record<string, unknown>;
    expect(merged.language).toBe("ko");
    expect(merged.model_preset).toBe("gemini");
    // Existing content stays byte-identical at the head of the file
    expect(content.startsWith(user)).toBe(true);
  });

  it("is a no-op when the user file already has every template key", () => {
    const { content, addedKeys } = appendMissingConfigKeys(TEMPLATE, TEMPLATE);
    expect(addedKeys).toEqual([]);
    expect(content).toBe(TEMPLATE);
  });

  it("treats an empty user file as having no keys", () => {
    const { addedKeys } = appendMissingConfigKeys("", TEMPLATE);
    expect(addedKeys).toContain("language");
    expect(addedKeys).toContain("model_preset");
  });

  it("leaves malformed user YAML untouched", () => {
    const broken = "language: [unclosed\n  nope";
    const { content, addedKeys } = appendMissingConfigKeys(broken, TEMPLATE);
    expect(content).toBe(broken);
    expect(addedKeys).toEqual([]);
  });

  it("handles a user file without a trailing newline", () => {
    const user = "language: ko";
    const { content } = appendMissingConfigKeys(user, TEMPLATE);
    expect(() => parseYaml(content)).not.toThrow();
    const merged = parseYaml(content) as Record<string, unknown>;
    expect(merged.language).toBe("ko");
    expect(merged.model_preset).toBe("antigravity");
  });
});
