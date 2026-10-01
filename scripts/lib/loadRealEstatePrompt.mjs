import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPT_FILE = path.resolve(
  __dirname,
  "../../src/lib/ai/prompts/realEstateAgent.ts",
);

/**
 * Load REAL_ESTATE_SYSTEM_PROMPT from the TypeScript source of truth.
 */
export function loadRealEstateSystemPrompt() {
  const source = readFileSync(PROMPT_FILE, "utf8");
  const match = source.match(
    /export const REAL_ESTATE_SYSTEM_PROMPT\s*=\s*`([\s\S]*?)`;/,
  );
  if (!match) {
    throw new Error(
      `Could not extract REAL_ESTATE_SYSTEM_PROMPT from ${PROMPT_FILE}`,
    );
  }
  return match[1];
}
