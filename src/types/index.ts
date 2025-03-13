// Core data structures that represent our marketing data

export interface Session {
  id: string;
  mcid?: string; // client id, can be empty
  userPseudoId: string; // Google client id
  gaSessionId: string;
  datetimeShifted: string;
  deviceCategory: string;
  deviceMobileBrandName?: string;
  deviceMobileModelName?: string;
  deviceOperatingSystem: string;
  deviceOperatingSystemVersion?: string;
  geoCountry: string;
  geoRegion: string;
  geoCity: string;
  geoSubContinent?: string;
  geoMetro?: string;
}

export interface Lead {
  id: string;
  atomid: string; // source ID
  mcId: string; // client ID
  datetimeCreatedShifted: string;
  googleClientId: string;
  ch_isFirst4ContactAttribution: boolean;
}

export interface Contact {
  id: string;
  atomid: string; // source ID
  mcId: string; // client ID
  datetimeCreatedShifted: string;
  googleClientId: string;
  entityCreatedWith: string;
  ch_isFirst4ContactAttribution: boolean;
  ch_isFirst: boolean;
}

export interface Contact2Lead {
  leadId: string;
  contactId: string;
}

export interface Transaction {
  id: string;
  atomid: string; // source ID
  mcId: string; // client ID
  paymentDatetimeShifted: string;
  paidSumOriginalCurrency: number;
  ch_isFirstClientPaid: boolean;
}

export interface SourceData {
  date: string;
  atomId: string;
  shows: number;
  budgetSpent: number;
  clicks: number;
}

export interface Atom {
  atomId: string;
  name: string;
  sourceName: string;
  sourceGroupName: string;
  groupsOfSourceGroupName: string;
  isPaidName: string;
  campaignId?: string;
  adsetId?: string;
  adId?: string;
}

// Agent interfaces

export interface DataValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}

export interface MetricsAnalysis {
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
}

export interface ConversionAnalysis {
  stages: {
    name: string;
    current: number;
    previous: number;
    percentageChange: number;
    isSignificant: boolean;
  }[];
  insights: string[];
}

export interface ChannelDistributionAnalysis {
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
}

export interface DataQualityImprovements {
  dataCollection: string[];
  attribution: string[];
}

export interface ReportingImprovements {
  additionalMetrics: string[];
  visualizations: string[];
  automations: string[];
}

export interface DailyBrief {
  date: string;
  dataValidation: DataValidationResult;
  metricsAnalysis: MetricsAnalysis;
  conversionAnalysis: ConversionAnalysis;
  channelDistribution: ChannelDistributionAnalysis;
  dataQualityImprovements: DataQualityImprovements;
  reportingImprovements: ReportingImprovements;
  summary: string;
}
