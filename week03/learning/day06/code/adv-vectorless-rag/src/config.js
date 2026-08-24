import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Safely parses .env file without external dependencies
 */
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join("=").trim();
        }
      }
    }
  }
}

loadEnv();

export const config = {
  env: process.env.NODE_ENV || "development",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  maxTreeDepth: Number(process.env.DEFAULT_MAX_TREE_DEPTH) || 3,
  pruningThreshold: Number(process.env.SUMMARY_PRUNING_THRESHOLD) || 1.5
};
