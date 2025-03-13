import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import {
  loadData,
  validateData,
  analyzeMetrics,
  analyzeConversions,
  analyzeChannels,
  suggestDataImprovements,
  suggestReportingImprovements,
  generateSummary,
  completeBrief,
  handleError,
} from "./nodes";
import { RunnableLambda } from "@langchain/core/runnables";

const MarketingAgentState = Annotation.Root({
  date: Annotation<string>(),
  dataPath: Annotation<string>(),
  dataPrefix: Annotation<"ai.test" | "ai.control">(),
  testData: Annotation<any>(),
  controlData: Annotation<any>(),
  dataValidation: Annotation<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }>(),
  metricsAnalysis: Annotation<{
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
  }>(),
  conversionAnalysis: Annotation<{
    stages: {
      name: string;
      current: number;
      previous: number;
      percentageChange: number;
      isSignificant: boolean;
    }[];
    insights: string[];
  }>(),
  channelDistribution: Annotation<{
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
  }>(),
  dataQualityImprovements: Annotation<{
    dataCollection: string[];
    attribution: string[];
  }>(),
  reportingImprovements: Annotation<{
    additionalMetrics: string[];
    visualizations: string[];
    automations: string[];
  }>(),
  summary: Annotation<string>(),
  dailyBrief: Annotation<any>(),
  error: Annotation<Error>(),
});

/**
 * Define node names as string literals to match LangGraph API
 */
const Nodes = {
  LOAD_DATA: "load_data",
  VALIDATE_DATA: "validate_data",
  ANALYZE_METRICS: "analyze_metrics",
  ANALYZE_CONVERSIONS: "analyze_conversions",
  ANALYZE_CHANNELS: "analyze_channels",
  SUGGEST_DATA_IMPROVEMENTS: "suggest_data_improvements",
  SUGGEST_REPORTING_IMPROVEMENTS: "suggest_reporting_improvements",
  GENERATE_SUMMARY: "generate_summary",
  COMPLETE_BRIEF: "complete_brief",
  HANDLE_ERROR: "handle_error",
};

/**
 * Create a LangGraph workflow for analyzing marketing data
 */
export function createMarketingDataAnalysisGraph() {
  // Define the routing function for error handling
  const checkForErrors = (state: typeof MarketingAgentState.State) => {
    // Return 'error' if error is present, 'continue' otherwise
    return state.error ? "error" : "continue";
  };

  // Create a new state graph and define nodes with method chaining
  const graph = new StateGraph(MarketingAgentState)
    // Add nodes for each step of the process
    .addNode(Nodes.LOAD_DATA, new RunnableLambda({ func: loadData }))
    .addNode(Nodes.VALIDATE_DATA, new RunnableLambda({ func: validateData }))
    .addNode(
      Nodes.ANALYZE_METRICS,
      new RunnableLambda({ func: analyzeMetrics })
    )
    .addNode(
      Nodes.ANALYZE_CONVERSIONS,
      new RunnableLambda({ func: analyzeConversions })
    )
    .addNode(
      Nodes.ANALYZE_CHANNELS,
      new RunnableLambda({ func: analyzeChannels })
    )
    .addNode(
      Nodes.SUGGEST_DATA_IMPROVEMENTS,
      new RunnableLambda({ func: suggestDataImprovements })
    )
    .addNode(
      Nodes.SUGGEST_REPORTING_IMPROVEMENTS,
      new RunnableLambda({ func: suggestReportingImprovements })
    )
    .addNode(
      Nodes.GENERATE_SUMMARY,
      new RunnableLambda({ func: generateSummary })
    )
    .addNode(Nodes.COMPLETE_BRIEF, new RunnableLambda({ func: completeBrief }))
    .addNode(Nodes.HANDLE_ERROR, new RunnableLambda({ func: handleError }))

    // Define entry point - start with load data
    .addEdge(START, Nodes.LOAD_DATA);

  // Add conditional edges with proper mapping
  graph
    .addConditionalEdges(Nodes.LOAD_DATA, checkForErrors, {
      error: Nodes.HANDLE_ERROR,
      continue: Nodes.VALIDATE_DATA,
    })
    .addConditionalEdges(Nodes.VALIDATE_DATA, checkForErrors, {
      error: Nodes.HANDLE_ERROR,
      continue: Nodes.ANALYZE_METRICS,
    })
    .addConditionalEdges(Nodes.ANALYZE_METRICS, checkForErrors, {
      error: Nodes.HANDLE_ERROR,
      continue: Nodes.ANALYZE_CONVERSIONS,
    })
    .addConditionalEdges(Nodes.ANALYZE_CONVERSIONS, checkForErrors, {
      error: Nodes.HANDLE_ERROR,
      continue: Nodes.ANALYZE_CHANNELS,
    })
    .addConditionalEdges(Nodes.ANALYZE_CHANNELS, checkForErrors, {
      error: Nodes.HANDLE_ERROR,
      continue: Nodes.SUGGEST_DATA_IMPROVEMENTS,
    })
    .addConditionalEdges(Nodes.SUGGEST_DATA_IMPROVEMENTS, checkForErrors, {
      error: Nodes.HANDLE_ERROR,
      continue: Nodes.SUGGEST_REPORTING_IMPROVEMENTS,
    })
    .addConditionalEdges(Nodes.SUGGEST_REPORTING_IMPROVEMENTS, checkForErrors, {
      error: Nodes.HANDLE_ERROR,
      continue: Nodes.GENERATE_SUMMARY,
    })
    .addConditionalEdges(Nodes.GENERATE_SUMMARY, checkForErrors, {
      error: Nodes.HANDLE_ERROR,
      continue: Nodes.COMPLETE_BRIEF,
    });

  // Add end node handling
  graph.addEdge(Nodes.COMPLETE_BRIEF, END).addEdge(Nodes.HANDLE_ERROR, END);

  // Return the fully compiled graph
  return graph.compile();
}
