import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { createHash } from "crypto";
import * as dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

function hashPassword(password) {
  return createHash("sha256").update(password + "funding_salt_2024").digest("hex");
}

// ─── 1. Insert 5 client profiles ─────────────────────────────────────────────
const clients = [
  {
    firstName: "Margaret", lastName: "Tomdio",
    email: "margaret.tomdio@email.com", phone: "832-555-0101",
    address: "28718 Pearl Bridge Ln", city: "Katy", state: "TX", zipCode: "77494",
    businessName: "Maxim Home Health LLC", businessType: "Healthcare", businessStartDate: "2018-03-15", timeInBusiness: "7 years",
    totalBusinessIncome: "480000.00", personalIncome: "120000.00", fundingNeeded: "350000.00",
    ficoScore: 806, monthlyRevenue: "40000.00", existingDebt: "453569.00",
    fundingPurpose: "Expand healthcare staffing and purchase medical equipment",
    fundingStatus: "funded", fundingAmount: "92100.00",
    tierType: "Tier 1", invoiceAmountIssued: "9210.00", invoiceAmountPaid: "9210.00",
    notes: "Client fully funded across 6 rounds. Excellent credit profile.",
  },
  {
    firstName: "Fred", lastName: "Yeboah",
    email: "fred.yeboah@email.com", phone: "713-555-0202",
    address: "4521 Westheimer Rd", city: "Houston", state: "TX", zipCode: "77027",
    businessName: "Yeboah Logistics Inc", businessType: "Transportation", businessStartDate: "2020-06-01", timeInBusiness: "5 years",
    totalBusinessIncome: "320000.00", personalIncome: "95000.00", fundingNeeded: "200000.00",
    ficoScore: 742, monthlyRevenue: "26000.00", existingDebt: "185000.00",
    fundingPurpose: "Fleet expansion and warehouse lease",
    fundingStatus: "under_review", fundingAmount: "0.00",
    tierType: "Tier 2", invoiceAmountIssued: "0.00", invoiceAmountPaid: "0.00",
    notes: "Underwriting complete. Pending onboarding documents.",
  },
  {
    firstName: "Sandra", lastName: "Reeves",
    email: "sandra.reeves@email.com", phone: "214-555-0303",
    address: "1102 Oak Cliff Blvd", city: "Dallas", state: "TX", zipCode: "75208",
    businessName: "Reeves Real Estate Group", businessType: "Real Estate", businessStartDate: "2016-09-10", timeInBusiness: "9 years",
    totalBusinessIncome: "750000.00", personalIncome: "180000.00", fundingNeeded: "500000.00",
    ficoScore: 778, monthlyRevenue: "62000.00", existingDebt: "620000.00",
    fundingPurpose: "Acquisition of 3 rental properties in DFW area",
    fundingStatus: "approved", fundingAmount: "145000.00",
    tierType: "Tier 1", invoiceAmountIssued: "14500.00", invoiceAmountPaid: "7250.00",
    notes: "Approved for initial round. Second round pending property appraisal.",
  },
  {
    firstName: "Marcus", lastName: "Delgado",
    email: "marcus.delgado@email.com", phone: "512-555-0404",
    address: "890 Congress Ave", city: "Austin", state: "TX", zipCode: "78701",
    businessName: "Delgado Tech Solutions", businessType: "Technology", businessStartDate: "2022-01-20", timeInBusiness: "3 years",
    totalBusinessIncome: "210000.00", personalIncome: "75000.00", fundingNeeded: "150000.00",
    ficoScore: 698, monthlyRevenue: "17500.00", existingDebt: "95000.00",
    fundingPurpose: "Software development team expansion and office space",
    fundingStatus: "pending", fundingAmount: "0.00",
    tierType: "Tier 3", invoiceAmountIssued: "0.00", invoiceAmountPaid: "0.00",
    notes: "New client. Underwriting call scheduled for next week.",
  },
  {
    firstName: "Denise", lastName: "Fontaine",
    email: "denise.fontaine@email.com", phone: "504-555-0505",
    address: "3300 Magazine St", city: "New Orleans", state: "LA", zipCode: "70115",
    businessName: "Fontaine Catering & Events", businessType: "Food & Beverage", businessStartDate: "2015-04-22", timeInBusiness: "10 years",
    totalBusinessIncome: "390000.00", personalIncome: "110000.00", fundingNeeded: "275000.00",
    ficoScore: 724, monthlyRevenue: "32500.00", existingDebt: "210000.00",
    fundingPurpose: "Commercial kitchen renovation and event venue deposit",
    fundingStatus: "on_hold", fundingAmount: "0.00",
    tierType: "Tier 2", invoiceAmountIssued: "0.00", invoiceAmountPaid: "0.00",
    notes: "On hold pending resolution of tax lien from 2023.",
  },
];

console.log("Inserting client profiles...");
const insertedIds = [];
for (const c of clients) {
  const [result] = await connection.execute(
    `INSERT INTO client_profiles 
      (firstName, lastName, email, phone, address, city, state, zipCode,
       businessName, businessType, businessStartDate, timeInBusiness,
       totalBusinessIncome, personalIncome, fundingNeeded, ficoScore,
       monthlyRevenue, existingDebt, fundingPurpose, fundingStatus,
       fundingAmount, tierType, invoiceAmountIssued, invoiceAmountPaid,
       notes, isActive, createdAt, updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,NOW(),NOW())`,
    [
      c.firstName, c.lastName, c.email, c.phone, c.address, c.city, c.state, c.zipCode,
      c.businessName, c.businessType, c.businessStartDate, c.timeInBusiness,
      c.totalBusinessIncome, c.personalIncome, c.fundingNeeded, c.ficoScore,
      c.monthlyRevenue, c.existingDebt, c.fundingPurpose, c.fundingStatus,
      c.fundingAmount, c.tierType, c.invoiceAmountIssued, c.invoiceAmountPaid,
      c.notes,
    ]
  );
  insertedIds.push(result.insertId);
  console.log(`  ✓ ${c.firstName} ${c.lastName} → id=${result.insertId}`);
}

// ─── 2. Client credentials ────────────────────────────────────────────────────
console.log("Inserting client credentials...");
const credentials = [
  { username: "margaret.tomdio", password: "Tomdio@2026" },
  { username: "fred.yeboah", password: "Yeboah@2026" },
  { username: "sandra.reeves", password: "Reeves@2026" },
  { username: "marcus.delgado", password: "Delgado@2026" },
  { username: "denise.fontaine", password: "Fontaine@2026" },
];
for (let i = 0; i < 5; i++) {
  await connection.execute(
    `INSERT INTO client_credentials (clientProfileId, username, passwordHash, isActive, createdAt, updatedAt)
     VALUES (?,?,?,1,NOW(),NOW())`,
    [insertedIds[i], credentials[i].username, hashPassword(credentials[i].password)]
  );
  console.log(`  ✓ ${credentials[i].username}`);
}

// ─── 3. Underwriting data ─────────────────────────────────────────────────────
console.log("Inserting underwriting data...");
const underwritingData = [
  { underwriterPersonnel: "Ian Abad", underwritingCallDate: "2026-01-15", sourceType: "Referral", contractType: "10% Agreement", dateContractSent: "2026-01-16", dateContractSigned: "2026-01-20", fundingAmountNeededMin: "300000", fundingAmountNeededMax: "400000", fundingProjectionMin: "500000", fundingProjectionMax: "600000", urgency: "3 months", expectedTimeFrame: "5 months", annualBusinessIncome: "480000", annualPersonalIncome: "120000", cashOnHand: "85000", initialTierType: "Tier 1", initialFicoScore: 806, initialCreditUtilization: "26%", totalCreditLimit: "85000", creditDebt: "21931", totalOpenAccounts: 8, totalInquiries: 3, averageAccountAge: "7 yrs 3 mos" },
  { underwriterPersonnel: "Ian Abad", underwritingCallDate: "2026-02-01", sourceType: "Online Ad", contractType: "8% Agreement", dateContractSent: "2026-02-03", dateContractSigned: "2026-02-07", fundingAmountNeededMin: "150000", fundingAmountNeededMax: "250000", fundingProjectionMin: "300000", fundingProjectionMax: "400000", urgency: "2 months", expectedTimeFrame: "4 months", annualBusinessIncome: "320000", annualPersonalIncome: "95000", cashOnHand: "42000", initialTierType: "Tier 2", initialFicoScore: 742, initialCreditUtilization: "38%", totalCreditLimit: "52000", creditDebt: "19760", totalOpenAccounts: 6, totalInquiries: 5, averageAccountAge: "5 yrs 1 mo" },
  { underwriterPersonnel: "Sarah Kim", underwritingCallDate: "2026-01-25", sourceType: "Referral", contractType: "10% Agreement", dateContractSent: "2026-01-27", dateContractSigned: "2026-02-01", fundingAmountNeededMin: "400000", fundingAmountNeededMax: "600000", fundingProjectionMin: "700000", fundingProjectionMax: "900000", urgency: "1 month", expectedTimeFrame: "3 months", annualBusinessIncome: "750000", annualPersonalIncome: "180000", cashOnHand: "120000", initialTierType: "Tier 1", initialFicoScore: 778, initialCreditUtilization: "22%", totalCreditLimit: "110000", creditDebt: "24200", totalOpenAccounts: 11, totalInquiries: 2, averageAccountAge: "9 yrs 6 mos" },
  { underwriterPersonnel: "Sarah Kim", underwritingCallDate: "2026-02-20", sourceType: "Social Media", contractType: "8% Agreement", dateContractSent: "2026-02-22", dateContractSigned: "2026-02-28", fundingAmountNeededMin: "100000", fundingAmountNeededMax: "200000", fundingProjectionMin: "200000", fundingProjectionMax: "300000", urgency: "4 months", expectedTimeFrame: "6 months", annualBusinessIncome: "210000", annualPersonalIncome: "75000", cashOnHand: "28000", initialTierType: "Tier 3", initialFicoScore: 698, initialCreditUtilization: "55%", totalCreditLimit: "35000", creditDebt: "19250", totalOpenAccounts: 4, totalInquiries: 8, averageAccountAge: "3 yrs 2 mos" },
  { underwriterPersonnel: "Ian Abad", underwritingCallDate: "2026-01-10", sourceType: "Referral", contractType: "10% Agreement", dateContractSent: "2026-01-12", dateContractSigned: "2026-01-18", fundingAmountNeededMin: "200000", fundingAmountNeededMax: "350000", fundingProjectionMin: "400000", fundingProjectionMax: "500000", urgency: "2 months", expectedTimeFrame: "4 months", annualBusinessIncome: "390000", annualPersonalIncome: "110000", cashOnHand: "55000", initialTierType: "Tier 2", initialFicoScore: 724, initialCreditUtilization: "42%", totalCreditLimit: "68000", creditDebt: "28560", totalOpenAccounts: 7, totalInquiries: 4, averageAccountAge: "6 yrs 8 mos" },
];
for (let i = 0; i < 5; i++) {
  const u = underwritingData[i];
  await connection.execute(
    `INSERT INTO underwriting 
      (clientProfileId, underwriterPersonnel, underwritingCallDate, sourceType,
       contractType, dateContractSent, dateContractSigned,
       fundingAmountNeededMin, fundingAmountNeededMax, fundingProjectionMin, fundingProjectionMax,
       urgency, expectedTimeFrame, annualBusinessIncome, annualPersonalIncome, cashOnHand,
       initialTierType, initialFicoScore, initialCreditUtilization, totalCreditLimit,
       creditDebt, totalOpenAccounts, totalInquiries, averageAccountAge, createdAt, updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
    [insertedIds[i], u.underwriterPersonnel, u.underwritingCallDate, u.sourceType,
     u.contractType, u.dateContractSent, u.dateContractSigned,
     u.fundingAmountNeededMin, u.fundingAmountNeededMax, u.fundingProjectionMin, u.fundingProjectionMax,
     u.urgency, u.expectedTimeFrame, u.annualBusinessIncome, u.annualPersonalIncome, u.cashOnHand,
     u.initialTierType, u.initialFicoScore, u.initialCreditUtilization, u.totalCreditLimit,
     u.creditDebt, u.totalOpenAccounts, u.totalInquiries, u.averageAccountAge]
  );
}
console.log("  ✓ Underwriting data inserted for all 5 clients");

// ─── 4. Onboarding items ──────────────────────────────────────────────────────
console.log("Inserting onboarding items...");
const onboardingDocs = ["Driver's License", "Social Security Card", "Most Recent Utility Bills (2)", "Bank Statements (3 months)", "Business License"];
const bankRelationships = ["Navy Federal Credit Union", "USAA", "Wells Fargo", "Bank of America", "Chase"];
for (let i = 0; i < 5; i++) {
  for (let j = 0; j < onboardingDocs.length; j++) {
    await connection.execute(
      `INSERT INTO onboarding_items (clientProfileId, category, label, isCompleted, sortOrder, createdAt, updatedAt)
       VALUES (?,?,?,?,?,NOW(),NOW())`,
      [insertedIds[i], "document", onboardingDocs[j], j < (i + 1) % 5 ? 1 : 0, j]
    );
  }
  for (let j = 0; j < bankRelationships.length; j++) {
    await connection.execute(
      `INSERT INTO onboarding_items (clientProfileId, category, label, isCompleted, sortOrder, createdAt, updatedAt)
       VALUES (?,?,?,?,?,NOW(),NOW())`,
      [insertedIds[i], "bank_relationship", `Open ${bankRelationships[j]}`, j < (i + 2) % 5 ? 1 : 0, j]
    );
  }
}
console.log("  ✓ Onboarding items inserted");

// ─── 5. Credit reports ────────────────────────────────────────────────────────
console.log("Inserting credit reports...");
const creditReportData = [
  { bureau: "Experian", reportDate: "2026-02-26", ficoScore: 806, ficoScoreModel: "FICO Score 8", openAccounts: 8, closedAccounts: 12, collectionsCount: 0, averageAccountAge: "7 yrs 3 mos", oldestAccount: "19 yrs 3 mos", creditUsagePercent: "26%", creditUsed: "21931", creditLimit: "85000", creditCardDebt: "21931", loanDebt: "431638", collectionsDebt: "0", totalDebt: "453569" },
  { bureau: "TransUnion", reportDate: "2026-02-15", ficoScore: 742, ficoScoreModel: "FICO Score 8", openAccounts: 6, closedAccounts: 8, collectionsCount: 1, averageAccountAge: "5 yrs 1 mo", oldestAccount: "12 yrs 4 mos", creditUsagePercent: "38%", creditUsed: "19760", creditLimit: "52000", creditCardDebt: "19760", loanDebt: "165240", collectionsDebt: "0", totalDebt: "185000" },
  { bureau: "Equifax", reportDate: "2026-02-20", ficoScore: 778, ficoScoreModel: "FICO Score 8", openAccounts: 11, closedAccounts: 9, collectionsCount: 0, averageAccountAge: "9 yrs 6 mos", oldestAccount: "22 yrs 1 mo", creditUsagePercent: "22%", creditUsed: "24200", creditLimit: "110000", creditCardDebt: "24200", loanDebt: "595800", collectionsDebt: "0", totalDebt: "620000" },
  { bureau: "Experian", reportDate: "2026-03-01", ficoScore: 698, ficoScoreModel: "FICO Score 8", openAccounts: 4, closedAccounts: 5, collectionsCount: 2, averageAccountAge: "3 yrs 2 mos", oldestAccount: "7 yrs 8 mos", creditUsagePercent: "55%", creditUsed: "19250", creditLimit: "35000", creditCardDebt: "19250", loanDebt: "75750", collectionsDebt: "0", totalDebt: "95000" },
  { bureau: "TransUnion", reportDate: "2026-02-10", ficoScore: 724, ficoScoreModel: "FICO Score 8", openAccounts: 7, closedAccounts: 10, collectionsCount: 0, averageAccountAge: "6 yrs 8 mos", oldestAccount: "15 yrs 2 mos", creditUsagePercent: "42%", creditUsed: "28560", creditLimit: "68000", creditCardDebt: "28560", loanDebt: "181440", collectionsDebt: "0", totalDebt: "210000" },
];
const creditReportIds = [];
for (let i = 0; i < 5; i++) {
  const cr = creditReportData[i];
  const [result] = await connection.execute(
    `INSERT INTO credit_reports 
      (clientProfileId, bureau, reportDate, ficoScore, ficoScoreModel,
       openAccounts, closedAccounts, collectionsCount, averageAccountAge, oldestAccount,
       creditUsagePercent, creditUsed, creditLimit,
       creditCardDebt, loanDebt, collectionsDebt, totalDebt, createdAt, updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
    [insertedIds[i], cr.bureau, cr.reportDate, cr.ficoScore, cr.ficoScoreModel,
     cr.openAccounts, cr.closedAccounts, cr.collectionsCount, cr.averageAccountAge, cr.oldestAccount,
     cr.creditUsagePercent, cr.creditUsed, cr.creditLimit,
     cr.creditCardDebt, cr.loanDebt, cr.collectionsDebt, cr.totalDebt]
  );
  creditReportIds.push(result.insertId);
}
// Add a few credit accounts for client 1 (Margaret)
const accounts1 = [
  ["Toyota Motor Credit", "Open", "Joint", "7040XXXXXXXX", "Sep 16, 2023", "January 2026", "Auto Loan", "Open/Never late", "22886", "34450", "66%", "598", "1/17/2026"],
  ["Bank of America", "Open", "Individual", "XXXX", "Oct 20, 2025", "February 2026", "Credit card", "Open/Never late", "4019", "5200", "77%", "40", "1/22/2026"],
  ["Citicards CBNA", "Open", "Individual", "5285XXXXXXXX", "Sep 17, 2023", "March 2026", "Credit Card", "Open/Never late", "31", "10000", "0%", "31", "2/18/2026"],
  ["WFBNA Card", "Open", "Individual", "4141XXXXXXXX", "Feb 19, 2023", "February 2026", "Credit card", "Open/Never late", "16322", "22000", "74%", "164", "2/3/2026"],
  ["SoFi Bank", "Open", "Individual", "PL2713XXX", "8/4/2025", "January 2026", "Unsecured", "Open/Never late", "77570", "82500", "6%", "1691", "1/5/2026"],
];
for (const acc of accounts1) {
  await connection.execute(
    `INSERT INTO credit_accounts (creditReportId, clientProfileId, accountName, openClosed, responsibility, accountNumber, dateOpened, statusUpdated, accountType, status, balance, creditLimit, creditUsage, monthlyPayment, lastPaymentDate, createdAt, updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
    [creditReportIds[0], insertedIds[0], ...acc]
  );
}
console.log("  ✓ Credit reports and accounts inserted");

// ─── 6. Funding applications ──────────────────────────────────────────────────
console.log("Inserting funding applications...");
// Client 1 - Margaret (fully funded, 6 rounds)
const margaretFunding = [
  ["01/30/2026", "R1", "Farmers Insurance FCU P-LOC", "PLOC", "Low-Int", "15000", "Approved (I)"],
  ["01/30/2026", "R1", "Farmers Insurance FCU Visa Select", "B-CC", "0% 12 mo", "5000", "Conditionally Approved"],
  ["02/03/2026", "R2", "SoFi Personal Loan", "PLOAN", "Low-Int", null, "Denied"],
  ["02/03/2026", "R2", "LightStream", "PLOAN", "Low-Int", "40000", "Approved (I)"],
  ["02/04/2026", "R3", "Wells Fargo Personal Loan", "PLOAN", "Low-Int", null, "Denied"],
  ["02/05/2026", "R4", "Service PLOC", "PLOC", "Low-Int", "20000", "Approved (I)"],
  ["02/24/2026", "R5", "Chase Ink Business Unlimited", "B-CC", "0% 12 mo", "8000", "Approved (I)"],
  ["03/02/2026", "R6", "Amex Blue Biz Cash", "B-CC", "0% 12 mo", "2000", "Approved (I)"],
  ["03/02/2026", "R6", "Navy Fed Visa Sig CC", "P-CC", "0% 12 mo", "7100", "Approved (I)"],
];
for (let j = 0; j < margaretFunding.length; j++) {
  const [callDate, round, product, type, rates, limit, status] = margaretFunding[j];
  await connection.execute(
    `INSERT INTO funding_applications (clientProfileId, callDate, round, product, type, rates, appliedLimit, status, sortOrder, createdAt, updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
    [insertedIds[0], callDate, round, product, type, rates, limit, status, j]
  );
}
// Client 2 - Fred (in progress)
const fredFunding = [
  ["02/10/2026", "R1", "Navy Federal Business Loan", "PLOAN", "Low-Int", "25000", "Approved (I)"],
  ["02/10/2026", "R1", "USAA Personal Loan", "PLOAN", "Low-Int", null, "Denied"],
  ["02/17/2026", "R2", "Chase Ink Business Cash", "B-CC", "0% 15 mo", "12000", "Pending"],
];
for (let j = 0; j < fredFunding.length; j++) {
  const [callDate, round, product, type, rates, limit, status] = fredFunding[j];
  await connection.execute(
    `INSERT INTO funding_applications (clientProfileId, callDate, round, product, type, rates, appliedLimit, status, sortOrder, createdAt, updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
    [insertedIds[1], callDate, round, product, type, rates, limit, status, j]
  );
}
// Client 3 - Sandra (approved)
const sandraFunding = [
  ["02/05/2026", "R1", "Wells Fargo Business Line", "PLOC", "Low-Int", "50000", "Approved (I)"],
  ["02/05/2026", "R1", "Citi Business Card", "B-CC", "0% 12 mo", "15000", "Approved (I)"],
  ["02/12/2026", "R2", "Amex Business Gold", "B-CC", "0% 12 mo", "30000", "Approved (I)"],
  ["02/12/2026", "R2", "Capital One Spark", "B-CC", "0% 9 mo", "25000", "Conditionally Approved"],
  ["02/20/2026", "R3", "SoFi Business Loan", "PLOAN", "Low-Int", "25000", "Approved (I)"],
];
for (let j = 0; j < sandraFunding.length; j++) {
  const [callDate, round, product, type, rates, limit, status] = sandraFunding[j];
  await connection.execute(
    `INSERT INTO funding_applications (clientProfileId, callDate, round, product, type, rates, appliedLimit, status, sortOrder, createdAt, updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
    [insertedIds[2], callDate, round, product, type, rates, limit, status, j]
  );
}
console.log("  ✓ Funding applications inserted");

// ─── 7. Call logs ─────────────────────────────────────────────────────────────
console.log("Inserting call logs...");
const callLogsData = [
  [insertedIds[0], "Underwriting Call", "01/15/2026", "10:00 AM", "Ian Abad", "completed", "https://zoom.us/rec/sample1", "Client qualified. Tier 1. Proceeding to onboarding."],
  [insertedIds[0], "Onboarding Call", "01/22/2026", "2:00 PM", "Ian Abad", "completed", "https://zoom.us/rec/sample2", "All documents submitted. Bank accounts opened."],
  [insertedIds[0], "Funding Round 1 Call", "01/30/2026", "11:00 AM", "Ian Abad", "completed", "https://zoom.us/rec/sample3", "R1 submitted. Farmers FCU approved."],
  [insertedIds[1], "Underwriting Call", "02/01/2026", "9:00 AM", "Ian Abad", "completed", "https://zoom.us/rec/sample4", "Client qualified for Tier 2. Needs 3 more bank statements."],
  [insertedIds[1], "Onboarding Follow-up", "02/15/2026", "3:00 PM", "Ian Abad", "completed", null, "Pending SSN and utility bills."],
  [insertedIds[2], "Underwriting Call", "01/25/2026", "1:00 PM", "Sarah Kim", "completed", "https://zoom.us/rec/sample5", "Excellent profile. Tier 1 qualified immediately."],
  [insertedIds[2], "Funding Strategy Call", "02/05/2026", "10:30 AM", "Sarah Kim", "completed", "https://zoom.us/rec/sample6", "Submitted 5 applications across 3 lenders."],
  [insertedIds[3], "Underwriting Call", "02/20/2026", "4:00 PM", "Sarah Kim", "completed", null, "Tier 3. High inquiries. Needs credit repair first."],
  [insertedIds[3], "Credit Strategy Call", "03/05/2026", "11:00 AM", "Ian Abad", "scheduled", null, "Discuss credit repair plan before funding."],
  [insertedIds[4], "Underwriting Call", "01/10/2026", "9:30 AM", "Ian Abad", "completed", "https://zoom.us/rec/sample7", "Tier 2. Tax lien identified. On hold pending resolution."],
];
for (const log of callLogsData) {
  await connection.execute(
    `INSERT INTO call_logs (clientProfileId, callTitle, callDate, callTime, host, status, recordingLink, notes, createdAt, updatedAt)
     VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())`,
    log
  );
}
console.log("  ✓ Call logs inserted");

console.log("\n✅ Seed complete! 5 clients created:");
console.log("  1. Margaret Tomdio   → margaret.tomdio / Tomdio@2026   (Funded)");
console.log("  2. Fred Yeboah       → fred.yeboah / Yeboah@2026       (Under Review)");
console.log("  3. Sandra Reeves     → sandra.reeves / Reeves@2026     (Approved)");
console.log("  4. Marcus Delgado    → marcus.delgado / Delgado@2026   (Pending)");
console.log("  5. Denise Fontaine   → denise.fontaine / Fontaine@2026 (On Hold)");

await connection.end();
