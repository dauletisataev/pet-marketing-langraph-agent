import { config, getTodayISOString } from "./config";
import fs from "fs-extra";
import path from "path";
import { createMarketingDataAnalysisGraph } from "./agents/agent";

/**
 * Parse command line arguments to get the date
 * Format expected: YYYY-MM-DD
 * @returns The date string in ISO format (YYYY-MM-DD)
 */
function getDateFromArgs(): string {
  // Get command line arguments (skip the first two which are node and script path)
  const args = process.argv.slice(2);
  let dateArg: string | undefined;

  // Look for a date argument
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--date" || args[i] === "-d") {
      dateArg = args[i + 1];
      break;
    } else if (args[i].startsWith("--date=")) {
      dateArg = args[i].split("=")[1];
      break;
    }
  }

  // Validate the date format if provided
  if (dateArg) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateArg)) {
      console.error("Invalid date format. Please use YYYY-MM-DD format.");
      process.exit(1);
    }
    return dateArg;
  }

  // Use a default date from the sample data period
  return "2024-03-15";
}

async function main() {
  console.log("Starting Marketing Data Analysis Agent...");

  try {
    await fs.ensureDir(config.data.outputDir);

    // Get date from command line or use default
    const analysisDate = getDateFromArgs();

    // Set up initial state
    const initialState = {
      date: analysisDate,
      dataPath: config.data.inputDir,
      dataPrefix: "ai.test" as const,
    };

    console.log(`Processing data for date: ${initialState.date}`);

    // Create and run the workflow
    const graph = createMarketingDataAnalysisGraph();

    // Execute the graph with the initial state
    console.log("Running LangGraph workflow...");
    const result = await graph.invoke(initialState);

    if (result.error) {
      throw result.error;
    }

    // Save the result to a file
    if (result.dailyBrief) {
      const outputPath = path.join(
        config.data.outputDir,
        `daily-brief-${initialState.date}.json`
      );

      await fs.writeJSON(outputPath, result.dailyBrief, { spaces: 2 });
      console.log(`✅ Daily brief saved to: ${outputPath}`);

      // Print a summary to the console
      console.log("\n===== DAILY BRIEF SUMMARY =====");
      console.log(`Date: ${result.dailyBrief.date}`);
      console.log(
        `\nData Quality: ${
          result.dailyBrief.dataValidation.isValid ? "Good" : "Issues Found"
        }`
      );

      if (result.dailyBrief.dataValidation.issues.length > 0) {
        console.log("\nData Issues:");
        result.dailyBrief.dataValidation.issues.forEach((issue: string) => {
          console.log(`- ${issue}`);
        });
      }

      console.log("\nKey Metrics:");
      const roas = result.dailyBrief.metricsAnalysis.roas;
      const cac = result.dailyBrief.metricsAnalysis.cac;

      console.log(
        `- ROAS: ${roas.current.toFixed(2)} (${
          roas.percentageChange >= 0 ? "+" : ""
        }${roas.percentageChange.toFixed(2)}%)`
      );
      console.log(
        `- CAC: ${cac.current.toFixed(2)} (${
          cac.percentageChange >= 0 ? "+" : ""
        }${cac.percentageChange.toFixed(2)}%)`
      );

      console.log("\nSummary:");
      console.log(result.dailyBrief.summary);
      console.log("\n=================================");
    }
  } catch (error) {
    console.error("Error running agent:", error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}
