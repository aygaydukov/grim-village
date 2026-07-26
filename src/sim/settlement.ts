/**
 * Shared time/settlement constants for headless + browser.
 * Settlement lineage: each fatal reset starts settlementVersion += 1.
 */
export const SETTLEMENT_REGISTRY_FILE = "registry.json";
export const SETTLEMENT_CURRENT_FILE = "current.json";
export const SETTLEMENT_FATAL_ALIVE_RATIO = 0.2;
