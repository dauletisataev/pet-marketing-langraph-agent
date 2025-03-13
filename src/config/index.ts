import dotenv from "dotenv";
import { join } from "path";

// Load environment variables
dotenv.config();

// Check for required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is required but not set.");
  process.exit(1);
}

if (!process.env.DATA_DIR) {
  console.error("DATA_DIR environment variable is required but not set.");
  process.exit(1);
}

// Define default values
const DEFAULT_HISTORICAL_DAYS = 7;
const DEFAULT_SIGNIFICANT_CHANGE_THRESHOLD = 10; // 10% change is considered significant

export const config = {
  // API Keys
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-4o",
  },

  // Data Paths
  data: {
    inputDir: process.env.DATA_DIR || join(process.cwd(), "src/data/input"),
    outputDir: process.env.OUTPUT_DIR || join(process.cwd(), "src/data/output"),
  },

  // Analysis Parameters
  analysis: {
    historicalDays: parseInt(
      process.env.HISTORICAL_DAYS || DEFAULT_HISTORICAL_DAYS.toString()
    ),
    significantChangeThreshold: parseInt(
      process.env.SIGNIFICANT_CHANGE_THRESHOLD ||
        DEFAULT_SIGNIFICANT_CHANGE_THRESHOLD.toString()
    ),
  },

  // LangGraph agent configuration
  agent: {
    maxRetries: 3,
    verbose: process.env.VERBOSE?.toLowerCase() === "true" || false,
  },
};

// Helper function to get today's date in ISO format
export function getTodayISOString(): string {
  return new Date().toISOString().split("T")[0];
}

// Helper function to get a past date (N days ago) in ISO format
export function getPastDateISOString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}
