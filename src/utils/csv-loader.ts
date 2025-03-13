import fs from "fs-extra";
import { join } from "path";
import csvParser from "csv-parser";
import {
  Session,
  Lead,
  Contact,
  Contact2Lead,
  Transaction,
  SourceData,
  Atom,
} from "../types";

// Helper to convert string boolean values to actual booleans
const parseBoolean = (value: string | undefined | null): boolean => {
  if (value === undefined || value === null || value === "") {
    return false;
  }
  return value.toString().toLowerCase() === "true" || value === "1";
};

// Helper to convert numeric strings to numbers
const parseNumber = (value: string | undefined | null): number => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }
  const parsed = parseFloat(value.toString().replace(",", "."));
  return isNaN(parsed) ? 0 : parsed;
};

// Main function to load any CSV file and convert it to a typed array
export async function loadCsv<T>(
  filePath: string,
  transformer?: (row: any) => T
): Promise<T[]> {
  const results: T[] = [];

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(
        csvParser({
          separator: ";", // Use semicolon as delimiter
        })
      )
      .on("data", (row) => {
        if (transformer) {
          results.push(transformer(row));
        } else {
          results.push(row as T);
        }
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

// Type-specific loaders with appropriate transformers
export async function loadSessions(filePath: string): Promise<Session[]> {
  return loadCsv<Session>(filePath, (row) => ({
    id: row.id,
    mcid: row.Mcid,
    userPseudoId: row.UserPseudoId,
    gaSessionId: row.GaSessionId,
    datetimeShifted: row.DatetimeShifted,
    deviceCategory: row.DeviceCategory,
    deviceMobileBrandName: row.DeviceMobileBrandName,
    deviceMobileModelName: row.DeviceMobileModelName,
    deviceOperatingSystem: row.DeviceOperatingSystem,
    deviceOperatingSystemVersion: row.DeviceOperatingSystemVersion,
    geoCountry: row.GeoCountry,
    geoRegion: row.GeoRegion,
    geoCity: row.GeoCity,
    geoSubContinent: row.GeoSubContinent,
    geoMetro: row.GeoMetro,
  }));
}

export async function loadLeads(filePath: string): Promise<Lead[]> {
  return loadCsv<Lead>(filePath, (row) => {
    return {
      id: row.id,
      atomid: row.atomid,
      mcId: row.McId,
      datetimeCreatedShifted: row.DatetimeCreatedShifted,
      googleClientId: row.GoogleClientId,
      ch_isFirst4ContactAttribution: parseBoolean(
        row.ch_isFirst4ContactAttribution
      ),
    };
  });
}

export async function loadContacts(filePath: string): Promise<Contact[]> {
  return loadCsv<Contact>(filePath, (row) => ({
    id: row.id,
    atomid: row.atomid,
    mcId: row.McId,
    datetimeCreatedShifted: row.DatetimeCreatedShifted,
    googleClientId: row.GoogleClientId,
    entityCreatedWith: row.EntityCreatedWith,
    ch_isFirst4ContactAttribution: parseBoolean(
      row.ch_isFirst4ContactAttribution
    ),
    ch_isFirst: parseBoolean(row.ch_isFirst),
  }));
}

export async function loadContact2Leads(
  filePath: string
): Promise<Contact2Lead[]> {
  return loadCsv<Contact2Lead>(filePath, (row) => ({
    leadId: row.leadId,
    contactId: row.contactId,
  }));
}

export async function loadTransactions(
  filePath: string
): Promise<Transaction[]> {
  return loadCsv<Transaction>(filePath, (row) => ({
    id: row.Id,
    atomid: row.atomid,
    mcId: row.McId,
    paymentDatetimeShifted: row.PaymentDatetimeShifted,
    paidSumOriginalCurrency: parseNumber(row.PaidSumOriginalCurrency),
    ch_isFirstClientPaid: parseBoolean(row.ch_isFirstClientPaid),
  }));
}

export async function loadSourceData(filePath: string): Promise<SourceData[]> {
  return loadCsv<SourceData>(filePath, (row) => ({
    date: row.Date,
    atomId: row.AtomId,
    shows: parseNumber(row.Shows),
    budgetSpent: parseNumber(row.BudgetSpent),
    clicks: parseNumber(row.Clicks),
  }));
}

export async function loadAtoms(filePath: string): Promise<Atom[]> {
  return loadCsv<Atom>(filePath, (row) => ({
    atomId: row.AtomId,
    name: row.Name,
    sourceName: row.SourceName,
    sourceGroupName: row.SourceGroupName,
    groupsOfSourceGroupName: row.GroupsOfSourceGroupName,
    isPaidName: row.IsPaidName,
    campaignId: row.CampaignId,
    adsetId: row.AdsetId,
    adId: row.AdId,
  }));
}

// Function to load all data files for a specific prefix
export async function loadDataSet(
  dataDir: string,
  prefix: string // Changed type from "ai.test" | "ai.control" to string
) {
  try {
    const sessions = await loadSessions(join(dataDir, `${prefix}Sessions.csv`));
    const leads = await loadLeads(join(dataDir, `${prefix}Leads.csv`));
    const contacts = await loadContacts(join(dataDir, `${prefix}Contacts.csv`));
    const contact2Leads = await loadContact2Leads(
      join(dataDir, `${prefix}Contacts2Leads.csv`)
    );
    const transactions = await loadTransactions(
      join(dataDir, `${prefix}Transactions.csv`)
    );
    const sourceData = await loadSourceData(
      join(dataDir, `${prefix}SourceData.csv`)
    );
    const atoms = await loadAtoms(join(dataDir, `${prefix}Atoms.csv`));

    return {
      sessions,
      leads,
      contacts,
      contact2Leads,
      transactions,
      sourceData,
      atoms,
    };
  } catch (error) {
    console.error("Error loading dataset:", error);
    throw error;
  }
}
