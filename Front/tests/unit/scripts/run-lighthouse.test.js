import { vi, describe, it, expect, beforeEach } from "vitest";

const { execSpy } = vi.hoisted(()=> ({
  execSpy: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execSync: execSpy,
  default: { execSync: execSpy },
}));

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { buildLighthouseCommand, runLighthouse, runCliIfNeeded } from "../../../scripts/run-lighthouse.mjs";

describe("run-lighthouse script", () => {
  beforeEach(() => {
    execSpy.mockReset();
  });

  it("builds command with provided url and path", () => {
    const { command, reportPath } = buildLighthouseCommand({
      url: "http://example.com",
      reportPath: "/tmp/report.html",
    });
    expect(command).toContain("http://example.com");
    expect(command).toContain("--output-path /tmp/report.html");
    expect(reportPath).toBe("/tmp/report.html");
  });

  it("executes lighthouse command", () => {
    const result = runLighthouse({
      url: "http://example.com",
      reportPath: "/tmp/report.html",
      exec: execSpy,
    });
    expect(execSpy).toHaveBeenCalledWith(expect.stringContaining("http://example.com"), { stdio: "inherit" });
    expect(result.reportPath).toBe("/tmp/report.html");
  });

  it("uses default execSync when no exec override is provided", () => {
    runLighthouse({ url: "http://example.com", reportPath: "/tmp/report.html" });
    expect(execSpy).toHaveBeenCalledWith(expect.stringContaining("--output-path /tmp/report.html"), { stdio: "inherit" });
  });

  it("runs CLI helper when invoked directly", () => {
    const entryPath = resolve(process.cwd(), "scripts/run-lighthouse.mjs");
    const scriptUrl = pathToFileURL(entryPath);
    const runner = vi.fn();
    const ran = runCliIfNeeded({ entry: entryPath, url: scriptUrl, run: runner });
    expect(ran).toBe(true);
    expect(runner).toHaveBeenCalled();
  });

  it("skips CLI helper otherwise", () => {
    const runner = vi.fn();
    const ran = runCliIfNeeded({ entry: "other", url: import.meta.url, run: runner });
    expect(ran).toBe(false);
    expect(runner).not.toHaveBeenCalled();
  });

  it("does not treat missing entry as cli invocation", () => {
    const entryPath = resolve(process.cwd(), "scripts/run-lighthouse.mjs");
    const scriptUrl = pathToFileURL(entryPath);
    const runner = vi.fn();
    const ran = runCliIfNeeded({ entry: undefined, url: scriptUrl, run: runner });
    expect(ran).toBe(false);
  });
});
