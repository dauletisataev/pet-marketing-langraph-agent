import {
  Session,
  Lead,
  Contact,
  Transaction,
  SourceData,
  Atom,
} from "../types";
import {
  calculateROAS,
  calculateCAC,
  isChangeSigificant,
  calculateConversionRates,
  analyzeChannelDistribution,
} from "../services/data-analysis";

/**
 * Calculate historical metrics comparison for ROAS and CAC
 * @param currentTransactions Current period transactions
 * @param currentSourceData Current period source data
 * @param previousTransactions Previous period transactions
 * @param previousSourceData Previous period source data
 * @returns Object containing both current and historical ROAS and CAC metrics with change analysis
 */
export function calculateMetricsTrend(
  currentTransactions: Transaction[],
  currentSourceData: SourceData[],
  previousTransactions: Transaction[],
  previousSourceData: SourceData[]
) {
  // Calculate current metrics
  const currentROAS = calculateROAS(currentTransactions, currentSourceData);
  const currentCAC = calculateCAC(currentTransactions, currentSourceData);

  // Calculate previous metrics (if data available)
  const previousROAS =
    previousTransactions.length > 0 && previousSourceData.length > 0
      ? calculateROAS(previousTransactions, previousSourceData)
      : 0;

  const previousCAC =
    previousTransactions.length > 0 && previousSourceData.length > 0
      ? calculateCAC(previousTransactions, previousSourceData)
      : 0;

  // Calculate percentage changes
  const roasPercentageChange =
    previousROAS > 0 ? ((currentROAS - previousROAS) / previousROAS) * 100 : 0;

  const cacPercentageChange =
    previousCAC > 0 ? ((currentCAC - previousCAC) / previousCAC) * 100 : 0;

  // Determine if changes are significant
  const roasSignificant =
    previousROAS > 0 ? isChangeSigificant(currentROAS, previousROAS) : false;

  const cacSignificant =
    previousCAC > 0 ? isChangeSigificant(currentCAC, previousCAC) : false;

  return {
    roas: {
      current: currentROAS,
      previous: previousROAS,
      percentageChange: roasPercentageChange,
      isSignificant: roasSignificant,
    },
    cac: {
      current: currentCAC,
      previous: previousCAC,
      percentageChange: cacPercentageChange,
      isSignificant: cacSignificant,
    },
  };
}

/**
 * Calculate historical comparison for conversion rates
 * @param currentSessions Current period sessions
 * @param currentLeads Current period leads
 * @param currentContacts Current period contacts
 * @param currentTransactions Current period transactions
 * @param previousSessions Previous period sessions
 * @param previousLeads Previous period leads
 * @param previousContacts Previous period contacts
 * @param previousTransactions Previous period transactions
 * @returns Conversion rates with historical comparison
 */
export function calculateConversionsTrend(
  currentSessions: Session[],
  currentLeads: Lead[],
  currentContacts: Contact[],
  currentTransactions: Transaction[],
  previousSessions: Session[],
  previousLeads: Lead[],
  previousContacts: Contact[],
  previousTransactions: Transaction[]
) {
  // Calculate current conversions
  const currentConversions = calculateConversionRates(
    currentSessions,
    currentLeads,
    currentContacts,
    currentTransactions
  );

  // Calculate previous conversions
  const previousConversions = calculateConversionRates(
    previousSessions,
    previousLeads,
    previousContacts,
    previousTransactions
  );

  // Combine current data with previous data
  return currentConversions.map((stage, index) => {
    const previousStage = previousConversions[index];
    const previous = previousStage ? previousStage.current : 0;

    // Calculate percentage change
    const percentageChange =
      previous > 0 ? ((stage.current - previous) / previous) * 100 : 0;

    // Check if change is significant
    const isSignificant =
      previous > 0 ? isChangeSigificant(stage.current, previous) : false;

    return {
      ...stage,
      previous,
      percentageChange,
      isSignificant,
    };
  });
}

/**
 * Calculate historical comparison for channel distribution
 * @param currentSessions Current period sessions
 * @param previousSessions Previous period sessions
 * @param atoms Atoms data (invariant)
 * @returns Channel distribution with historical comparison
 */
export function calculateChannelsTrend(
  currentSessions: Session[],
  previousSessions: Session[],
  atoms: Atom[]
) {
  // Analyze current channel distribution
  const currentChannels = analyzeChannelDistribution(currentSessions, atoms);

  // Analyze previous channel distribution
  const previousChannels = analyzeChannelDistribution(previousSessions, atoms);

  // Create a map for easier lookup of previous data
  const previousChannelMap = new Map();
  previousChannels.forEach((channel) => {
    previousChannelMap.set(channel.name, channel.current);
  });

  // Combine current and previous data
  return currentChannels.map((currentChannel) => {
    const previousData = previousChannelMap.get(currentChannel.name) || {
      sessions: 0,
      percentage: 0,
    };

    const change =
      previousData.percentage > 0
        ? ((currentChannel.current.percentage - previousData.percentage) /
            previousData.percentage) *
          100
        : 0;

    return {
      ...currentChannel,
      previous: previousData,
      change,
    };
  });
}
