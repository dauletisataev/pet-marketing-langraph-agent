import { AgentNodeFunction, AgentState } from "./types";
import { loadDataSet } from "../utils/csv-loader";
import {
  checkDataValidity,
  calculateROAS,
  calculateCAC,
  isChangeSigificant,
  generatePossibleReasons,
  calculateConversionRates,
  analyzeChannelDistribution,
} from "../services/data-analysis";
import {
  generateDataQualityImprovements,
  generateReportingImprovements,
} from "../services/report-improvements";
import { config } from "../config";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { Transaction, SourceData, Session, Lead, Contact } from "../types";
import {
  calculatePreviousPeriodStartDate,
  filterTransactionsByDateRange,
  filterSourceDataByDateRange,
  filterSessionsByDateRange,
  filterLeadsByDateRange,
  filterContactsByDateRange,
} from "../utils/date-utils";
import {
  calculateMetricsTrend,
  calculateConversionsTrend,
  calculateChannelsTrend,
} from "../utils/trend-analysis";

/**
 * Load data from CSV files
 */
export const loadData: AgentNodeFunction = async (state: AgentState) => {
  try {
    console.log(`Loading data from ${state.dataPath}...`);

    // Log the exact file paths that we're trying to load
    console.log(`Looking for files with prefix 'test' in ${state.dataPath}`);

    // Load test data only, no separate control dataset
    const testData = await loadDataSet(state.dataPath, "test");

    console.log("Data loaded successfully!");
    console.log(`Sessions: ${testData.sessions.length}`);
    console.log(`Leads: ${testData.leads.length}`);
    console.log(`Contacts: ${testData.contacts.length}`);
    console.log(`Transactions: ${testData.transactions.length}`);
    console.log(`Source Data: ${testData.sourceData.length}`);
    console.log(`Atoms: ${testData.atoms.length}`);

    return {
      ...state,
      testData,
    };
  } catch (error) {
    console.error("Error loading data:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return {
      ...state,
      error: error as Error,
    };
  }
};

/**
 * Validate data quality
 */
export const validateData: AgentNodeFunction = async (state: AgentState) => {
  try {
    console.log("Validating data quality...");

    const { testData } = state;

    if (!testData) {
      throw new Error("Test data not loaded");
    }

    const validation = checkDataValidity(
      testData.sessions,
      testData.leads,
      testData.contacts,
      testData.transactions,
      testData.sourceData,
      testData.atoms
    );

    return {
      ...state,
      dataValidation: validation,
    };
  } catch (error) {
    console.error("Error validating data:", error);
    return {
      ...state,
      error: error as Error,
    };
  }
};

/**
 * Analyze key metrics (ROAS, CAC)
 */
export const analyzeMetrics: AgentNodeFunction = async (state: AgentState) => {
  try {
    console.log("Analyzing key metrics...");

    const { testData } = state;

    if (!testData) {
      throw new Error("Data not loaded");
    }

    // Get the current date from state
    const currentDate = state.date;

    // Calculate the previous period start date (looking back 30 days)
    const pastDate = calculatePreviousPeriodStartDate(currentDate, 30);

    console.log(
      `Calculating metrics trends: comparing current date ${currentDate} with past date ${pastDate}`
    );

    // Get previous period data
    const previousPeriodTransactions = filterTransactionsByDateRange(
      testData.transactions,
      pastDate,
      currentDate
    );

    const previousPeriodSourceData = filterSourceDataByDateRange(
      testData.sourceData,
      pastDate,
      currentDate
    );

    console.log(
      `Found ${previousPeriodTransactions.length} transactions and ${previousPeriodSourceData.length} source data entries for previous period`
    );

    // Calculate metrics with trend analysis
    const metricsAnalysis = calculateMetricsTrend(
      testData.transactions,
      testData.sourceData,
      previousPeriodTransactions,
      previousPeriodSourceData
    );

    // Generate reasons for the metrics
    const roasReasons = generatePossibleReasons(
      "ROAS",
      metricsAnalysis.roas.current,
      metricsAnalysis.roas.previous,
      testData.sessions,
      testData.sourceData,
      testData.atoms
    );

    const cacReasons = generatePossibleReasons(
      "CAC",
      metricsAnalysis.cac.current,
      metricsAnalysis.cac.previous,
      testData.sessions,
      testData.sourceData,
      testData.atoms
    );

    return {
      ...state,
      metricsAnalysis: {
        roas: {
          ...metricsAnalysis.roas,
          possibleReasons: roasReasons,
        },
        cac: {
          ...metricsAnalysis.cac,
          possibleReasons: cacReasons,
        },
      },
    };
  } catch (error) {
    console.error("Error analyzing metrics:", error);
    return {
      ...state,
      error: error as Error,
    };
  }
};

/**
 * Analyze conversion rates
 */
export const analyzeConversions: AgentNodeFunction = async (
  state: AgentState
) => {
  try {
    console.log("Analyzing conversion rates...");

    const { testData } = state;

    if (!testData) {
      throw new Error("Data not loaded");
    }

    // Get the current date from state
    const currentDate = state.date;

    // Calculate the previous period start date (looking back 30 days)
    const pastDate = calculatePreviousPeriodStartDate(currentDate, 30);

    console.log(
      `Calculating conversion trends: comparing current date ${currentDate} with past date ${pastDate}`
    );

    // Get previous period data
    const previousPeriodSessions = filterSessionsByDateRange(
      testData.sessions,
      pastDate,
      currentDate
    );

    const previousPeriodLeads = filterLeadsByDateRange(
      testData.leads,
      pastDate,
      currentDate
    );

    const previousPeriodContacts = filterContactsByDateRange(
      testData.contacts,
      pastDate,
      currentDate
    );

    const previousPeriodTransactions = filterTransactionsByDateRange(
      testData.transactions,
      pastDate,
      currentDate
    );

    console.log(
      `Found ${previousPeriodSessions.length} sessions, ${previousPeriodLeads.length} leads, ${previousPeriodContacts.length} contacts, and ${previousPeriodTransactions.length} transactions for previous period`
    );

    // Calculate conversion trends
    const stages = calculateConversionsTrend(
      testData.sessions,
      testData.leads,
      testData.contacts,
      testData.transactions,
      previousPeriodSessions,
      previousPeriodLeads,
      previousPeriodContacts,
      previousPeriodTransactions
    );

    // Generate insights using LLM
    const model = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: config.openai.model,
    });

    const template = `
    You are an analytics expert analyzing marketing funnel conversion rates.
    Based on the following conversion rate data, provide 3-5 meaningful insights:
    
    Conversion Rates:
    ${stages
      .map((s) => {
        return `- ${s.name}: ${s.current.toFixed(2)}% (${
          s.percentageChange >= 0 ? "up" : "down"
        } ${Math.abs(s.percentageChange).toFixed(
          2
        )}% from previous period's ${s.previous.toFixed(2)}%)`;
      })
      .join("\n")}
    
    Provide concise, data-driven insights about what these conversion rates and their changes mean for the business.
    Insights:`;

    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const insights = (await chain.invoke({}))
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim());

    return {
      ...state,
      conversionAnalysis: {
        stages,
        insights,
      },
    };
  } catch (error) {
    console.error("Error analyzing conversions:", error);
    return {
      ...state,
      error: error as Error,
    };
  }
};

/**
 * Analyze channel distribution
 */
export const analyzeChannels: AgentNodeFunction = async (state: AgentState) => {
  try {
    console.log("Analyzing channel distribution...");

    const { testData } = state;

    if (!testData) {
      throw new Error("Data not loaded");
    }

    // Get the current date from state
    const currentDate = state.date;

    // Calculate the previous period start date (looking back 30 days)
    const pastDate = calculatePreviousPeriodStartDate(currentDate, 30);

    console.log(
      `Calculating channel trends: comparing current date ${currentDate} with past date ${pastDate}`
    );

    // Get previous period data
    const previousPeriodSessions = filterSessionsByDateRange(
      testData.sessions,
      pastDate,
      currentDate
    );

    console.log(
      `Found ${previousPeriodSessions.length} sessions for previous period channel analysis`
    );

    // Calculate channel distribution trends
    const channels = calculateChannelsTrend(
      testData.sessions,
      previousPeriodSessions,
      testData.atoms
    );

    // Generate insights using LLM with historical comparison
    const model = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: config.openai.model,
    });

    const template = `
    You are a marketing analytics expert analyzing traffic channel distribution.
    Based on the following channel data, provide 3-5 meaningful insights about the current channel performance and trends:
    
    Channel Distribution:
    ${channels
      .map((c) => {
        return `- ${c.name}: ${c.current.percentage.toFixed(2)}% (${
          c.current.sessions
        } sessions), ${c.change >= 0 ? "up" : "down"} ${Math.abs(
          c.change
        ).toFixed(2)}% from previous period's ${c.previous.percentage.toFixed(
          2
        )}%`;
      })
      .join("\n")}
    
    Provide concise, data-driven insights about what this channel distribution and its changes mean for marketing strategy.
    Insights:`;

    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const insights = (await chain.invoke({}))
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim());

    return {
      ...state,
      channelDistribution: {
        channels,
        insights,
      },
    };
  } catch (error) {
    console.error("Error analyzing channels:", error);
    return {
      ...state,
      error: error as Error,
    };
  }
};

/**
 * Suggest data quality improvements
 */
export const suggestDataImprovements: AgentNodeFunction = async (
  state: AgentState
) => {
  try {
    console.log("Suggesting data quality improvements...");

    const { testData } = state;

    if (!testData) {
      throw new Error("Test data not loaded");
    }

    const improvements = generateDataQualityImprovements(
      testData.sessions,
      testData.leads,
      testData.contacts,
      testData.transactions,
      testData.sourceData,
      testData.atoms
    );

    return {
      ...state,
      dataQualityImprovements: improvements,
    };
  } catch (error) {
    console.error("Error suggesting data improvements:", error);
    return {
      ...state,
      error: error as Error,
    };
  }
};

/**
 * Suggest reporting improvements
 */
export const suggestReportingImprovements: AgentNodeFunction = async (
  state: AgentState
) => {
  try {
    console.log("Suggesting reporting improvements...");

    const { testData } = state;

    if (!testData) {
      throw new Error("Test data not loaded");
    }

    const improvements = generateReportingImprovements(
      testData.sessions,
      testData.leads,
      testData.contacts,
      testData.transactions,
      testData.sourceData,
      testData.atoms
    );

    return {
      ...state,
      reportingImprovements: improvements,
    };
  } catch (error) {
    console.error("Error suggesting reporting improvements:", error);
    return {
      ...state,
      error: error as Error,
    };
  }
};

/**
 * Generate a summary using LLM
 */
export const generateSummary: AgentNodeFunction = async (state: AgentState) => {
  try {
    console.log("Generating summary...");

    const {
      date,
      dataValidation,
      metricsAnalysis,
      conversionAnalysis,
      channelDistribution,
      dataQualityImprovements,
      reportingImprovements,
    } = state;

    if (
      !dataValidation ||
      !metricsAnalysis ||
      !conversionAnalysis ||
      !channelDistribution ||
      !dataQualityImprovements ||
      !reportingImprovements
    ) {
      throw new Error("Missing required analysis data");
    }

    // Use LLM to generate summary
    const model = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: config.openai.model,
    });

    const template = `
    You are a senior marketing analyst creating a summary of the day's marketing performance data.
    Create a concise but comprehensive executive summary based on the following information:
    
    Date: ${date}
    
    Data Quality:
    - Valid: ${dataValidation.isValid ? "Yes" : "No"}
    - Issues: ${
      dataValidation.issues.length > 0
        ? dataValidation.issues.join(", ")
        : "None"
    }
    
    Key Metrics:
    - ROAS: ${metricsAnalysis.roas.current.toFixed(2)} (${
      metricsAnalysis.roas.percentageChange >= 0 ? "up" : "down"
    } ${Math.abs(metricsAnalysis.roas.percentageChange).toFixed(2)}%, ${
      metricsAnalysis.roas.isSignificant ? "significant" : "not significant"
    })
    - CAC: ${metricsAnalysis.cac.current.toFixed(2)} (${
      metricsAnalysis.cac.percentageChange >= 0 ? "up" : "down"
    } ${Math.abs(metricsAnalysis.cac.percentageChange).toFixed(2)}%, ${
      metricsAnalysis.cac.isSignificant ? "significant" : "not significant"
    })
    
    Conversion Insights:
    ${conversionAnalysis.insights.map((insight) => `- ${insight}`).join("\n")}
    
    Channel Distribution Insights:
    ${channelDistribution.insights.map((insight) => `- ${insight}`).join("\n")}
    
    Key Data Quality Improvement Recommendations:
    ${dataQualityImprovements.dataCollection
      .slice(0, 2)
      .map((rec) => `- ${rec}`)
      .join("\n")}
    
    Key Reporting Improvement Recommendations:
    ${reportingImprovements.additionalMetrics
      .slice(0, 2)
      .map((rec) => `- ${rec}`)
      .join("\n")}
    
    Your summary should be about 150-200 words, highlighting the most important findings and actionable insights, written in a professional business tone.
    Summary:`;

    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const summary = await chain.invoke({});

    return {
      ...state,
      summary,
    };
  } catch (error) {
    console.error("Error generating summary:", error);
    return {
      ...state,
      error: error as Error,
    };
  }
};

/**
 * Finalize the daily brief
 */
export const completeBrief: AgentNodeFunction = async (state: AgentState) => {
  try {
    console.log("Finalizing daily brief...");

    const {
      date,
      dataValidation,
      metricsAnalysis,
      conversionAnalysis,
      channelDistribution,
      dataQualityImprovements,
      reportingImprovements,
      summary,
    } = state;

    if (
      !date ||
      !dataValidation ||
      !metricsAnalysis ||
      !conversionAnalysis ||
      !channelDistribution ||
      !dataQualityImprovements ||
      !reportingImprovements ||
      !summary
    ) {
      throw new Error("Missing required data for daily brief");
    }

    return {
      ...state,
      dailyBrief: {
        date,
        dataValidation,
        metricsAnalysis,
        conversionAnalysis,
        channelDistribution,
        dataQualityImprovements,
        reportingImprovements,
        summary,
      },
    };
  } catch (error) {
    console.error("Error completing brief:", error);
    return {
      ...state,
      error: error as Error,
    };
  }
};

/**
 * Handle errors
 */
export const handleError: AgentNodeFunction = async (state: AgentState) => {
  console.error("Error in agent workflow:", state.error);

  // You could implement more sophisticated error handling here,
  // like sending notifications, logging to a service, etc.

  return state;
};
