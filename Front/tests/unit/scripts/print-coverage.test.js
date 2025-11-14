import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockReadFile, mockWriteFile } = vi.hoisted(()=> ({
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  default: { readFile: mockReadFile, writeFile: mockWriteFile },
}));

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { printCoverage, formatCoverage, main, runCliIfNeeded } from "../../../scripts/print-coverage.mjs";

describe("print-coverage script", () => {
  const logger = {
    log: vi.fn(),
    warn: vi.fn(),
  };

  beforeEach(() => {
    mockReadFile.mockReset();
    mockWriteFile.mockReset();
    logger.log.mockReset();
    logger.warn.mockReset();
  });

  it("formats totals from summary", () => {
    const rows = formatCoverage({
      total: {
        lines: { pct: 80, covered: 8, total: 10 },
        statements: { pct: 90, covered: 9, total: 10 },
      },
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatch(/lines\s+80\.0%/);
    expect(rows[1]).toMatch(/statements\s+90\.0%/);
  });

  it("returns empty rows when totals are missing", () => {
    expect(formatCoverage({})).toEqual([]);
  });

  it("prints coverage rows when file exists", async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify({
      total: {
        lines: { pct: 100, covered: 5, total: 5 },
      },
    }));
    const ok = await printCoverage({ path: "coverage.json", logger, persistPath: "latest.json" });
    expect(ok).toBe(true);
    expect(logger.log).toHaveBeenCalledWith("\nCoverage actual:");
    expect(mockWriteFile).toHaveBeenCalledWith("latest.json", expect.any(String), "utf8");
  });

  it("warns when no totals are present", async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify({ total: {} }));
    const ok = await printCoverage({ path: "coverage.json", logger, persistPath: null });
    expect(ok).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("No se encontraron"));
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("warns when summary cannot be read", async () => {
    mockReadFile.mockRejectedValueOnce(new Error("missing"));
    const ok = await printCoverage({ path: "coverage.json", logger });
    expect(ok).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("coverage.json"));
  });

  it("sets exitCode when main fails", async () => {
    const prev = process.exitCode;
    mockReadFile.mockRejectedValueOnce(new Error("missing"));
    await main({ path: "coverage.json", logger });
    expect(process.exitCode).toBe(1);
    process.exitCode = prev;
  });

  it("runs CLI helper when entry matches script path", async () => {
    const entryPath = resolve(process.cwd(), "scripts/print-coverage.mjs");
    const scriptUrl = pathToFileURL(entryPath);
    const runner = vi.fn().mockResolvedValue(true);
    const ran = await runCliIfNeeded({ entry: entryPath, url: scriptUrl, run: runner });
    expect(ran).toBe(true);
    expect(runner).toHaveBeenCalled();
  });

  it("skips CLI helper when entry differs", async () => {
    const runner = vi.fn();
    const ran = await runCliIfNeeded({ entry: "other-script.mjs", url: import.meta.url, run: runner });
    expect(ran).toBe(false);
    expect(runner).not.toHaveBeenCalled();
  });

  it("treats missing entry as non-cli execution", async () => {
    const entryPath = resolve(process.cwd(), "scripts/print-coverage.mjs");
    const scriptUrl = pathToFileURL(entryPath);
    const runner = vi.fn();
    const ran = await runCliIfNeeded({ entry: undefined, url: scriptUrl, run: runner });
    expect(ran).toBe(false);
  });
});
