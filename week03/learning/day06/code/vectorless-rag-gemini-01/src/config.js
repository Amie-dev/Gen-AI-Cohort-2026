import fs from "fs";
import path from "path";

/**
 * Lightweight zero-dependency .env file parser for Gemini config.
 */
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [key, ...vals] = trimmed.split("=");
          process.env[key.trim()] = vals.join("=").trim();
        }
      }
    }
  } catch (err) {
    // Ignore error if .env doesn't exist
  }
}

loadEnv();

/**
 * Centralized Application Configuration Module
 */
export const config = {
  env: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
  geminiApiKey: process.env.GEMINI_API_KEY || null,
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  maxTreeDepth: Number(process.env.DEFAULT_MAX_TREE_DEPTH) || 3,
  pruningThreshold: Number(process.env.SUMMARY_PRUNING_THRESHOLD) || 1.5
};
