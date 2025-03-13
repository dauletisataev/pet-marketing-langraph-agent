import {
  DataQualityImprovements,
  ReportingImprovements,
  Session,
  Lead,
  Contact,
  Transaction,
  SourceData,
  Atom,
} from "../types";

/**
 * Generate suggestions for improving data quality
 */
export function generateDataQualityImprovements(
  sessions: Session[],
  leads: Lead[],
  contacts: Contact[],
  transactions: Transaction[],
  sourceData: SourceData[],
  atoms: Atom[]
): DataQualityImprovements {
  const dataCollection: string[] = [];
  const attribution: string[] = [];

  // Check for missing client IDs in sessions
  const sessionsWithoutClientIds = sessions.filter((s) => !s.mcid).length;
  const totalSessions = sessions.length;

  if (totalSessions > 0 && sessionsWithoutClientIds / totalSessions > 0.1) {
    dataCollection.push(
      "Improve client ID tracking in sessions - currently missing in " +
        ((sessionsWithoutClientIds / totalSessions) * 100).toFixed(2) +
        "% of sessions"
    );
  }

  // Check for missing Google client IDs in leads
  const leadsWithoutGoogleClientIds = leads.filter(
    (l) => !l.googleClientId
  ).length;
  const totalLeads = leads.length;

  if (totalLeads > 0 && leadsWithoutGoogleClientIds / totalLeads > 0.1) {
    dataCollection.push(
      "Improve Google Client ID tracking in leads - currently missing in " +
        ((leadsWithoutGoogleClientIds / totalLeads) * 100).toFixed(2) +
        "% of leads"
    );
  }

  // Check for gaps in the user journey
  const leadsMcIds = new Set(leads.map((l) => l.mcId));
  const contactsMcIds = new Set(contacts.map((c) => c.mcId));
  const transactionsMcIds = new Set(transactions.map((t) => t.mcId));

  const leadsNotConvertedToContacts = [...leadsMcIds].filter(
    (id) => !contactsMcIds.has(id)
  ).length;

  if (
    leadsMcIds.size > 0 &&
    leadsNotConvertedToContacts / leadsMcIds.size > 0.8
  ) {
    attribution.push(
      "High drop-off rate between leads and contacts - investigate lead qualification process"
    );
  }

  // Standard improvements for data quality
  dataCollection.push(
    "Implement server-side tracking to reduce data loss from ad blockers"
  );
  dataCollection.push(
    "Enhance user identification with consistent first-party cookies across domains"
  );
  dataCollection.push(
    "Validate UTM parameters for consistency and accuracy across marketing campaigns"
  );

  attribution.push(
    "Implement multi-touch attribution modeling to better understand the full customer journey"
  );
  attribution.push(
    "Consider time-decay models to give appropriate credit to touchpoints based on recency"
  );
  attribution.push(
    "Add view-through attribution for display and video channels to capture impression impact"
  );

  return {
    dataCollection,
    attribution,
  };
}

/**
 * Generate suggestions for improving reporting
 */
export function generateReportingImprovements(
  sessions: Session[],
  leads: Lead[],
  contacts: Contact[],
  transactions: Transaction[],
  sourceData: SourceData[],
  atoms: Atom[]
): ReportingImprovements {
  const additionalMetrics: string[] = [];
  const visualizations: string[] = [];
  const automations: string[] = [];

  // Additional metrics suggestions
  additionalMetrics.push(
    "Customer Lifetime Value (CLV) to better assess long-term customer profitability"
  );
  additionalMetrics.push(
    "Visitor-to-Lead Conversion Rate by channel to identify top-performing acquisition sources"
  );
  additionalMetrics.push(
    "Cost Per Lead (CPL) broken down by campaign to optimize lead generation efforts"
  );
  additionalMetrics.push(
    "Customer retention rate and churn metrics to monitor customer satisfaction"
  );

  // Visualization suggestions
  visualizations.push(
    "Multi-touch attribution funnel visualization showing channel impact at each customer journey stage"
  );
  visualizations.push(
    "Geographic heat map of customer concentration to identify regional performance patterns"
  );
  visualizations.push(
    "Cohort analysis chart to track how customer behavior evolves over time"
  );
  visualizations.push(
    "Campaign ROI comparison dashboard with time-series view for trend analysis"
  );

  // Automation suggestions
  automations.push(
    "Implement automated anomaly detection to flag unusual changes in conversion metrics"
  );
  automations.push(
    "Set up regular data quality audits to identify and fix tracking issues"
  );
  automations.push(
    "Create automated alerting for significant drops in channel performance"
  );
  automations.push(
    "Develop predictive models to forecast future conversion trends based on current data"
  );

  // Generate channel-specific suggestions if there are many channels
  const channelGroups = new Set(atoms.map((a) => a.sourceGroupName));

  if (channelGroups.size > 3) {
    additionalMetrics.push(
      "Channel-specific CAC and ROAS metrics to better compare performance across marketing channels"
    );
    visualizations.push(
      "Channel mix optimization tool to simulate budget allocation scenarios"
    );
  }

  // Device-specific suggestions
  const deviceCategories = new Set(sessions.map((s) => s.deviceCategory));
  if (deviceCategories.size > 1) {
    additionalMetrics.push(
      "Conversion rate by device type to identify platform-specific optimization opportunities"
    );
    visualizations.push(
      "Device performance comparison dashboard showing conversion funnel by device type"
    );
  }

  return {
    additionalMetrics,
    visualizations,
    automations,
  };
}
