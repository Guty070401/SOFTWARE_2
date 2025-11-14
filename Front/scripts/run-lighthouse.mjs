import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const defaultUrl = process.env.PERF_URL || "http://localhost:4173";
const defaultReportPath = resolve(process.cwd(), "lighthouse-report.html");
const defaultRunner = process.env.LIGHTHOUSE_BIN || "npx lighthouse";

function formatPath(value){
  return /\s/.test(value) ? JSON.stringify(value) : value;
}

export function buildLighthouseCommand({
  url = defaultUrl,
  reportPath = defaultReportPath,
  runner = defaultRunner,
} = {}){
  const safeUrl = JSON.stringify(url);
  const safeReportPath = formatPath(reportPath);
  return {
    command: `${runner} ${safeUrl} --quiet --chrome-flags="--headless" --output html --output-path ${safeReportPath}`,
    reportPath,
  };
}

export function runLighthouse(options = {}){
  const { exec = execSync } = options;
  const { command, reportPath } = buildLighthouseCommand(options);
  exec(command, { stdio: "inherit" });
  return { command, reportPath };
}

export function shouldRunCli({ entry = process.argv[1], url = import.meta.url } = {}){
  const scriptPath = fileURLToPath(url);
  /* c8 ignore next */
  const resolvedEntry = entry ? resolve(entry) : null;
  return Boolean(resolvedEntry && scriptPath === resolve(resolvedEntry));
}

export function runCliIfNeeded(options = {}){
  const { run = runLighthouse, ...rest } = options;
  if (shouldRunCli(rest)) {
    run(rest);
    return true;
  }
  return false;
}

runCliIfNeeded();
