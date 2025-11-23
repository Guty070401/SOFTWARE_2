const { readFile } = require("node:fs/promises");
const { resolve } = require("node:path");

const summaryPath = resolve(process.cwd(), "coverage/coverage-summary.json");

async function main(){
  let summary;
  try {
    summary = JSON.parse(await readFile(summaryPath, "utf8"));
  } catch (error) {
    console.warn(`[coverage] Could not read ${summaryPath}`);
    console.warn(`[coverage] Run the tests with coverage enabled to generate the file (error: ${error.message})`);
    process.exitCode = 1;
    return;
  }

  const totals = summary.total || {};
  const keys = ["lines", "statements", "functions", "branches"];
  const rows = keys
    .map((key)=> totals[key])
    .filter(Boolean)
    .map((entry, idx)=>{
      const key = keys[idx];
      const pct = Number(entry.pct) || 0;
      return `${key.padEnd(11)} ${pct.toFixed(1).padStart(6)}%   (${entry.covered}/${entry.total})`;
    });

  if (!rows.length) {
    console.warn("[coverage] No metrics found in coverage-summary.json");
    process.exitCode = 1;
    return;
  }

  console.log("\nCoverage snapshot:");
  rows.forEach((row)=> console.log(`  ${row}`));
  console.log("");
}

main();
