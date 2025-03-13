import { StateGraph } from "@langchain/langgraph";
import { DailyBrief } from "../types";

/**
 * The state maintained by the agent throughout its workflow
 */
export interface AgentState {
  // Input parameters and loaded data
  date: string;
  dataPath: string;
  dataPrefix: "ai.test" | "ai.control";

  // Loaded data from files
  testData?: any;
  controlData?: any;

  // Analysis results for each step
  dataValidation?: {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  };

  metricsAnalysis?: {
    roas: {
      current: number;
      previous: number;
      percentageChange: number;
      isSignificant: boolean;
      possibleReasons: string[];
    };
    cac: {
      current: number;
      previous: number;
      percentageChange: number;
      isSignificant: boolean;
      possibleReasons: string[];
    };
  };

  conversionAnalysis?: {
    stages: {
      name: string;
      current: number;
      previous: number;
      percentageChange: number;
      isSignificant: boolean;
    }[];
    insights: string[];
  };

  channelDistribution?: {
    channels: {
      name: string;
      current: {
        sessions: number;
        percentage: number;
      };
      previous: {
        sessions: number;
        percentage: number;
      };
      change: number;
    }[];
    insights: string[];
  };

  dataQualityImprovements?: {
    dataCollection: string[];
    attribution: string[];
  };

  reportingImprovements?: {
    additionalMetrics: string[];
    visualizations: string[];
    automations: string[];
  };

  // Summary of the analysis
  summary?: string;

  // Final output
  dailyBrief?: DailyBrief;

  // Error handling
  error?: Error;
}

/**
 * Define agent node actions
 */
export enum AgentAction {
  LOAD_DATA = "load_data",
  VALIDATE_DATA = "validate_data",
  ANALYZE_METRICS = "analyze_metrics",
  ANALYZE_CONVERSIONS = "analyze_conversions",
  ANALYZE_CHANNELS = "analyze_channels",
  SUGGEST_DATA_IMPROVEMENTS = "suggest_data_improvements",
  SUGGEST_REPORTING_IMPROVEMENTS = "suggest_reporting_improvements",
  GENERATE_SUMMARY = "generate_summary",
  COMPLETE_BRIEF = "complete_brief",
  HANDLE_ERROR = "handle_error",
}

/**
 * Type definition for the entire agent graph
 */
export type AgentGraph = StateGraph<AgentState>;

/**
 * Configuration for the agent graph
 */
export type AgentGraphConfig = {
  channels?: Record<string, string[]>;
  [key: string]: any;
};

/**
 * Node function type
 */
export type AgentNodeFunction = (
  state: AgentState
) => Promise<Partial<AgentState>>;
