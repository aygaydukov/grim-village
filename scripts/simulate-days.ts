import { formatStabilityReport, runModulation } from "../src/sim/modulate.ts";

const args = process.argv.slice(2);
const ciMode = args.includes("--ci");
const numericArgs = args.filter((a) => a !== "--ci");
const days = Number(numericArgs[0] ?? 10);
const seed = Number(numericArgs[1] ?? 2026);

const { report } = runModulation(days, seed, undefined, { ciMode });
console.log(formatStabilityReport(report));

if (!report.stable) {
  process.exitCode = 1;
}
