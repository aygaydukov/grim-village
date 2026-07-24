import { formatStabilityReport, runModulation } from "../src/sim/modulate.ts";

const days = Number(process.argv[2] ?? 10);
const seed = Number(process.argv[3] ?? 2026);

const { report } = runModulation(days, seed);
console.log(formatStabilityReport(report));

if (!report.stable) {
  process.exitCode = 1;
}
