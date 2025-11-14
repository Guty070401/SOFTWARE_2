import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultSummaryPath = resolve(process.cwd(), "coverage/coverage-summary.json");
const latestSnapshotPath = resolve(process.cwd(), "coverage-summary.latest.json");

export function formatCoverage(summary){
  const totals = summary.total ?? {};
  const keys = ["lines", "statements", "functions", "branches"];
  return keys
    .filter((key)=> totals[key])
    .map((key)=>{
      const { pct, covered, total } = totals[key];
      return `${key.padEnd(11)} ${pct.toFixed(1).padStart(6)}%   (${covered}/${total})`;
    });
}

export async function printCoverage({ path = defaultSummaryPath, logger = console, persistPath = latestSnapshotPath } = {}){
  try {
    const raw = await readFile(path, "utf8");
    const summary = JSON.parse(raw);
    const rows = formatCoverage(summary);
    if (!rows.length) {
      logger.warn("[coverage] No se encontraron métricas en coverage-summary.json");
      return false;
    }
    if (persistPath) {
      await writeFile(persistPath, raw, "utf8");
    }
    logger.log("\nCoverage actual:");
    rows.forEach((row)=> logger.log(`  ${row}`));
    logger.log("");
    return true;
  } catch (error) {
    logger.warn(`[coverage] No se pudo leer ${path}`);
    logger.warn(`[coverage] Ejecuta las pruebas con cobertura habilitada para generar el archivo (error: ${error.message})`);
    return false;
  }
}

export async function main(options = {}){
  const ok = await printCoverage(options);
  if (!ok) process.exitCode = 1;
  return ok;
}

export function shouldRunCli({ entry = process.argv[1], url = import.meta.url } = {}){
  const scriptPath = fileURLToPath(url);
  /* c8 ignore next */
  const resolvedEntry = entry ? resolve(entry) : null;
  return Boolean(resolvedEntry && scriptPath === resolve(resolvedEntry));
}

export async function runCliIfNeeded(options = {}){
  const { run = main, ...rest } = options;
  if (shouldRunCli(rest)) {
    await run(rest);
    return true;
  }
  return false;
}

runCliIfNeeded();
