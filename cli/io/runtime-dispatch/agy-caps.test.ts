import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectAgyCaps, primeAgyCaps, resetAgyCapsCache } from "./agy-caps.js";

const HELP_1_1 = [
  "Usage of agy:",
  "  --add-dir                       Add a directory to the workspace (repeatable) (default [])",
  "  --model                         Model for the current CLI session",
  "  -p                              Short alias for --print",
].join("\n");

const HELP_1_0 = [
  "Usage of agy:",
  "  -p          Short alias for --print",
  "  --print     Run a single prompt non-interactively and print the response",
].join("\n");

describe("detectAgyCaps", () => {
  beforeEach(() => resetAgyCapsCache());
  afterEach(() => resetAgyCapsCache());

  it("detects --model and --add-dir from agy 1.1 help", () => {
    expect(detectAgyCaps(() => HELP_1_1)).toEqual({
      modelFlag: true,
      addDir: true,
    });
  });

  it("reports no caps for agy 1.0 help", () => {
    expect(detectAgyCaps(() => HELP_1_0)).toEqual({
      modelFlag: false,
      addDir: false,
    });
  });

  it("treats a failing probe as no caps (legacy drop behavior)", () => {
    expect(
      detectAgyCaps(() => {
        throw new Error("agy not installed");
      }),
    ).toEqual({ modelFlag: false, addDir: false });
  });

  it("matches only flag-definition lines, not prose mentions", () => {
    expect(detectAgyCaps(() => "see the --model docs for details")).toEqual({
      modelFlag: false,
      addDir: false,
    });
  });

  it("caches the first probe until reset", () => {
    detectAgyCaps(() => HELP_1_1);
    expect(detectAgyCaps(() => HELP_1_0)).toEqual({
      modelFlag: true,
      addDir: true,
    });
    resetAgyCapsCache();
    expect(detectAgyCaps(() => HELP_1_0)).toEqual({
      modelFlag: false,
      addDir: false,
    });
  });

  it("primeAgyCaps seeds the cache without probing", () => {
    primeAgyCaps({ modelFlag: true, addDir: false });
    expect(detectAgyCaps(() => HELP_1_0)).toEqual({
      modelFlag: true,
      addDir: false,
    });
  });
});
