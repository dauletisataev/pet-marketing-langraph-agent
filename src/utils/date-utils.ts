import { Session, Lead, Contact, Transaction, SourceData } from "../types";

/**
 * Calculate start date for a historical analysis period
 * @param currentDate The current analysis date
 * @param lookbackDays Number of days to look back for the comparison period
 * @returns The start date of the historical period in YYYY-MM-DD format
 */
export function calculatePreviousPeriodStartDate(
  currentDate: string,
  lookbackDays: number = 30
): string {
  const currentDateObj = new Date(currentDate);
  const pastDateObj = new Date(currentDateObj);
  pastDateObj.setDate(currentDateObj.getDate() - lookbackDays);

  // Format the past date as YYYY-MM-DD
  return pastDateObj.toISOString().split("T")[0];
}

/**
 * Extract the date part from a datetime string
 * @param dateTimeStr DateTime string in any format that includes the date
 * @returns Date part of the string in YYYY-MM-DD format
 */
export function extractDatePart(dateTimeStr: string): string {
  return dateTimeStr.split(" ")[0]; // Get just the date part
}

/**
 * Filter sessions by date range
 * @param sessions Array of sessions to filter
 * @param startDate Start date (inclusive) in YYYY-MM-DD format
 * @param endDate End date (exclusive) in YYYY-MM-DD format
 * @returns Filtered sessions
 */
export function filterSessionsByDateRange(
  sessions: Session[],
  startDate: string,
  endDate: string
): Session[] {
  return sessions.filter((session) => {
    const sessionDate = extractDatePart(session.datetimeShifted);
    return sessionDate >= startDate && sessionDate < endDate;
  });
}

/**
 * Filter leads by date range
 * @param leads Array of leads to filter
 * @param startDate Start date (inclusive) in YYYY-MM-DD format
 * @param endDate End date (exclusive) in YYYY-MM-DD format
 * @returns Filtered leads
 */
export function filterLeadsByDateRange(
  leads: Lead[],
  startDate: string,
  endDate: string
): Lead[] {
  return leads.filter((lead) => {
    const leadDate = extractDatePart(lead.datetimeCreatedShifted);
    return leadDate >= startDate && leadDate < endDate;
  });
}

/**
 * Filter contacts by date range
 * @param contacts Array of contacts to filter
 * @param startDate Start date (inclusive) in YYYY-MM-DD format
 * @param endDate End date (exclusive) in YYYY-MM-DD format
 * @returns Filtered contacts
 */
export function filterContactsByDateRange(
  contacts: Contact[],
  startDate: string,
  endDate: string
): Contact[] {
  return contacts.filter((contact) => {
    const contactDate = extractDatePart(contact.datetimeCreatedShifted);
    return contactDate >= startDate && contactDate < endDate;
  });
}

/**
 * Filter transactions by date range
 * @param transactions Array of transactions to filter
 * @param startDate Start date (inclusive) in YYYY-MM-DD format
 * @param endDate End date (exclusive) in YYYY-MM-DD format
 * @returns Filtered transactions
 */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] {
  return transactions.filter((tx) => {
    const txDate = extractDatePart(tx.paymentDatetimeShifted);
    return txDate >= startDate && txDate < endDate;
  });
}

/**
 * Filter source data by date range
 * @param sourceData Array of source data to filter
 * @param startDate Start date (inclusive) in YYYY-MM-DD format
 * @param endDate End date (exclusive) in YYYY-MM-DD format
 * @returns Filtered source data
 */
export function filterSourceDataByDateRange(
  sourceData: SourceData[],
  startDate: string,
  endDate: string
): SourceData[] {
  return sourceData.filter((sd) => {
    return sd.date >= startDate && sd.date < endDate;
  });
}
