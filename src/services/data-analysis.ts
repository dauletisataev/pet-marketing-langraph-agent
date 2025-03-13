import {
  Session,
  Lead,
  Contact,
  Transaction,
  SourceData,
  Atom,
  MetricsAnalysis,
  ConversionAnalysis,
  ChannelDistributionAnalysis,
} from "../types";

// Calculate ROAS (Return on Ad Spend)
export function calculateROAS(
  transactions: Transaction[],
  sourceData: SourceData[]
): number {
  const totalRevenue = transactions.reduce(
    (sum, tx) => sum + tx.paidSumOriginalCurrency,
    0
  );
  const totalAdSpend = sourceData.reduce(
    (sum, src) => sum + src.budgetSpent,
    0
  );

  // Avoid division by zero
  if (totalAdSpend === 0) return 0;

  return totalRevenue / totalAdSpend;
}

// Calculate CAC (Customer Acquisition Cost)
export function calculateCAC(
  transactions: Transaction[],
  sourceData: SourceData[]
): number {
  const uniqueCustomers = new Set(
    transactions.filter((tx) => tx.ch_isFirstClientPaid).map((tx) => tx.mcId)
  ).size;

  const totalAdSpend = sourceData.reduce(
    (sum, src) => sum + src.budgetSpent,
    0
  );

  // Avoid division by zero
  if (uniqueCustomers === 0) return 0;

  return totalAdSpend / uniqueCustomers;
}

// Calculate conversion rates at different stages
export function calculateConversionRates(
  sessions: Session[],
  leads: Lead[],
  contacts: Contact[],
  transactions: Transaction[]
): ConversionAnalysis["stages"] {
  // Count unique users at each stage (using mcId where available, or userPseudoId for sessions)
  const uniqueVisitors = new Set(sessions.map((s) => s.mcid || s.userPseudoId))
    .size;

  const uniqueLeads = new Set(leads.map((l) => l.mcId)).size;

  const uniqueContacts = new Set(contacts.map((c) => c.mcId)).size;

  const uniqueCustomers = new Set(
    transactions.filter((tx) => tx.ch_isFirstClientPaid).map((tx) => tx.mcId)
  ).size;

  // Calculate conversion rates (as percentages)
  const visitorToLeadRate =
    uniqueVisitors > 0 ? (uniqueLeads / uniqueVisitors) * 100 : 0;
  const leadToContactRate =
    uniqueLeads > 0 ? (uniqueContacts / uniqueLeads) * 100 : 0;
  const contactToCustomerRate =
    uniqueContacts > 0 ? (uniqueCustomers / uniqueContacts) * 100 : 0;
  const overallConversionRate =
    uniqueVisitors > 0 ? (uniqueCustomers / uniqueVisitors) * 100 : 0;

  return [
    {
      name: "Visitor to Lead",
      current: visitorToLeadRate,
      previous: 0, // Will be populated later with historical data
      percentageChange: 0, // Will be calculated later
      isSignificant: false, // Will be determined later
    },
    {
      name: "Lead to Contact",
      current: leadToContactRate,
      previous: 0,
      percentageChange: 0,
      isSignificant: false,
    },
    {
      name: "Contact to Customer",
      current: contactToCustomerRate,
      previous: 0,
      percentageChange: 0,
      isSignificant: false,
    },
    {
      name: "Overall (Visitor to Customer)",
      current: overallConversionRate,
      previous: 0,
      percentageChange: 0,
      isSignificant: false,
    },
  ];
}

// Analyze channel distribution
export function analyzeChannelDistribution(
  sessions: Session[],
  atoms: Atom[]
): ChannelDistributionAnalysis["channels"] {
  // Create a mapping from atomId to channel info
  const atomIdToChannel = new Map<
    string,
    {
      sourceName: string;
      sourceGroupName: string;
      isPaidName: string;
    }
  >();

  atoms.forEach((atom) => {
    atomIdToChannel.set(atom.atomId, {
      sourceName: atom.sourceName,
      sourceGroupName: atom.sourceGroupName,
      isPaidName: atom.isPaidName,
    });
  });

  // Count sessions by channel
  const channelCounts = new Map<string, number>();
  const totalSessions = sessions.length;

  // For each session, find its source channel and increment the count
  // Note: This is a simplified approach. In a real application, you would need
  // to join sessions with source data based on user journey attribution

  // For this example, we'll just count by channel groups
  atoms.forEach((atom) => {
    const channel = atom.sourceGroupName;
    const currentCount = channelCounts.get(channel) || 0;
    channelCounts.set(channel, currentCount + 1);
  });

  // Convert to the required format
  const result: ChannelDistributionAnalysis["channels"] = [];

  for (const [channelName, count] of channelCounts.entries()) {
    result.push({
      name: channelName,
      current: {
        sessions: count,
        percentage: (count / Math.max(totalSessions, 1)) * 100,
      },
      previous: {
        sessions: 0, // Will be populated with historical data
        percentage: 0,
      },
      change: 0, // Will be calculated later
    });
  }

  return result;
}

// Check data validity (simple version)
export function checkDataValidity(
  sessions: Session[],
  leads: Lead[],
  contacts: Contact[],
  transactions: Transaction[],
  sourceData: SourceData[],
  atoms: Atom[]
) {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for empty datasets
  if (sessions.length === 0) issues.push("Sessions dataset is empty");
  if (leads.length === 0) issues.push("Leads dataset is empty");
  if (contacts.length === 0) issues.push("Contacts dataset is empty");
  if (transactions.length === 0) issues.push("Transactions dataset is empty");
  if (sourceData.length === 0) issues.push("Source data dataset is empty");
  if (atoms.length === 0) issues.push("Atoms dataset is empty");

  // Check for missing mcIds across datasets
  const sessionMcIds = new Set(
    sessions.filter((s) => s.mcid).map((s) => s.mcid)
  );
  const leadMcIds = new Set(leads.map((l) => l.mcId));
  const contactMcIds = new Set(contacts.map((c) => c.mcId));
  const transactionMcIds = new Set(transactions.map((t) => t.mcId));

  // Check for leads without sessions
  const leadsWithoutSessions = [...leadMcIds].filter(
    (id) => !sessionMcIds.has(id)
  );
  if (leadsWithoutSessions.length > 0) {
    const percentage = (leadsWithoutSessions.length / leadMcIds.size) * 100;
    issues.push(
      `${percentage.toFixed(2)}% of leads have no corresponding session data`
    );
    suggestions.push(
      "Improve session tracking to ensure all leads have associated session data"
    );
  }

  // Check for transactions without contacts
  const transactionsWithoutContacts = [...transactionMcIds].filter(
    (id) => !contactMcIds.has(id)
  );
  if (transactionsWithoutContacts.length > 0) {
    const percentage =
      (transactionsWithoutContacts.length / transactionMcIds.size) * 100;
    issues.push(
      `${percentage.toFixed(
        2
      )}% of transactions have no corresponding contact data`
    );
    suggestions.push(
      "Improve contact tracking to ensure all transactions have associated contact data"
    );
  }

  // Simple data volume check (significant drop in data volume compared to usual)
  // In a real application, you would compare with historical averages
  const expectedSessionsPerDay = 1000; // Example threshold
  const sessionsPerDay = sessions.length; // Simplification - assuming data is for one day

  if (sessionsPerDay < expectedSessionsPerDay * 0.7) {
    issues.push(
      `Session volume (${sessionsPerDay}) is significantly lower than expected (${expectedSessionsPerDay})`
    );
    suggestions.push(
      "Check if there are tracking issues or a genuine decrease in traffic"
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
  };
}

// Calculate significance of change
export function isChangeSigificant(
  current: number,
  previous: number,
  threshold = 10
): boolean {
  if (previous === 0) return current > 0;

  const percentageChange = Math.abs(((current - previous) / previous) * 100);
  return percentageChange >= threshold;
}

// Generate insights about why metrics might have changed (simplified)
export function generatePossibleReasons(
  metricName: string,
  current: number,
  previous: number,
  sessions: Session[],
  sourceData: SourceData[],
  atoms: Atom[]
): string[] {
  const reasons: string[] = [];
  const percentChange =
    previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const increased = current > previous;

  // Generic reasons based on metric type
  if (metricName === "ROAS") {
    if (increased) {
      reasons.push(
        "Improved ad targeting may have led to higher conversion rates"
      );
      reasons.push(
        "Better performing products or offers could be driving higher order values"
      );
      reasons.push(
        "Seasonal effects might be positively impacting purchasing behavior"
      );
    } else {
      reasons.push(
        "Ad costs may have increased without a corresponding increase in revenue"
      );
      reasons.push(
        "Ad targeting may be less effective, reaching less qualified prospects"
      );
      reasons.push(
        "Competitive landscape may have changed, affecting conversion rates"
      );
    }
  } else if (metricName === "CAC") {
    if (increased) {
      reasons.push(
        "Rising ad costs in the market may be increasing acquisition costs"
      );
      reasons.push(
        "Decreased ad effectiveness could be requiring more spend per acquisition"
      );
      reasons.push(
        "Market saturation might be making it harder to find new customers"
      );
    } else {
      reasons.push(
        "Improved targeting strategies may be more efficiently acquiring customers"
      );
      reasons.push(
        "Optimization of ad spend across channels could be reducing waste"
      );
      reasons.push(
        "Increased brand awareness might be lowering the cost to convert customers"
      );
    }
  }

  // Add a data-backed reason if possible
  // Check if there's a significant change in traffic from paid vs. non-paid sources
  const paidAtomIds = new Set(
    atoms
      .filter((a) => a.isPaidName.toLowerCase() === "paid")
      .map((a) => a.atomId)
  );

  const paidSourceData = sourceData.filter((sd) => paidAtomIds.has(sd.atomId));
  const totalPaidSpend = paidSourceData.reduce(
    (sum, sd) => sum + sd.budgetSpent,
    0
  );
  const totalPaidClicks = paidSourceData.reduce(
    (sum, sd) => sum + sd.clicks,
    0
  );

  if (totalPaidSpend > 0) {
    const cpc = totalPaidClicks > 0 ? totalPaidSpend / totalPaidClicks : 0;
    reasons.push(
      `Average cost per click across paid channels is ${cpc.toFixed(2)}`
    );
  }

  return reasons;
}
