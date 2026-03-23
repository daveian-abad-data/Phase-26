import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing Manus OAuth auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Client profiles table — stores all funding-related data for each client.
 */
export const clientProfiles = mysqlTable("client_profiles", {
  id: int("id").autoincrement().primaryKey(),

  // Personal Information
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }),
  email2: varchar("email2", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  phone2: varchar("phone2", { length: 32 }),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 64 }),
  zipCode: varchar("zipCode", { length: 16 }),
  birthDate: varchar("birthDate", { length: 32 }),
  ssn: varchar("ssn", { length: 32 }),
  driversLicenseNumber: varchar("driversLicenseNumber", { length: 64 }),
  driversLicenseExpirationDate: varchar("driversLicenseExpirationDate", { length: 32 }),
  driversLicenseIssuedState: varchar("driversLicenseIssuedState", { length: 128 }),
  hasSupportingDocuments: mysqlEnum("hasSupportingDocuments", ["yes", "no"]),
  creditProfileLogins: text("creditProfileLogins"),
  onboardingPreparationStatus: mysqlEnum("onboardingPreparationStatus", ["Pending", "Ready", "Ceased"]).default("Pending"),
  fileReviewOverallStatus: mysqlEnum("fileReviewOverallStatus", ["Pending", "Done", "Ceased"]),
  creditRepairStatus: mysqlEnum("creditRepairStatus", ["Pending", "Completed", "Failed"]),
  creditRepairNotes: text("creditRepairNotes"),
  creditRepairDateUpdated: varchar("creditRepairDateUpdated", { length: 32 }),
  creditRepairUpdatedBy: varchar("creditRepairUpdatedBy", { length: 128 }),

  // Business Information
  businessName: varchar("businessName", { length: 256 }),
  businessType: varchar("businessType", { length: 128 }),
  businessStartDate: varchar("businessStartDate", { length: 32 }),
  timeInBusiness: varchar("timeInBusiness", { length: 64 }),

  // Financial Data
  totalBusinessIncome: decimal("totalBusinessIncome", { precision: 15, scale: 2 }),
  personalIncome: decimal("personalIncome", { precision: 15, scale: 2 }),
  fundingNeeded: decimal("fundingNeeded", { precision: 15, scale: 2 }),
  ficoScore: int("ficoScore"),
  monthlyRevenue: decimal("monthlyRevenue", { precision: 15, scale: 2 }),
  existingDebt: decimal("existingDebt", { precision: 15, scale: 2 }),

  // Funding Details
  fundingPurpose: text("fundingPurpose"),
  fundingStatus: mysqlEnum("fundingStatus", [
    "pending",
    "under_review",
    "approved",
    "funded",
    "declined",
    "on_hold",
  ])
    .default("pending")
    .notNull(),
  fundingAmount: decimal("fundingAmount", { precision: 15, scale: 2 }),
  approvedDate: timestamp("approvedDate"),
  fundedDate: timestamp("fundedDate"),

  // Profile photo URL (stored in S3))
  photoUrl: text("photoUrl"),

  // Tier type
  tierType: varchar("tierType", { length: 64 }),

  // Invoice tracking
  invoiceAmountIssued: decimal("invoiceAmountIssued", { precision: 15, scale: 2 }),
  invoiceAmountPaid: decimal("invoiceAmountPaid", { precision: 15, scale: 2 }),

  // Progress Notes
  notes: text("notes"),
  internalNotes: text("internalNotes"),

  // Metadata
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientProfile = typeof clientProfiles.$inferSelect;
export type InsertClientProfile = typeof clientProfiles.$inferInsert;

/**
 * Client credentials table — stores username/password for client portal login.
 */
export const clientCredentials = mysqlTable("client_credentials", {
  id: int("id").autoincrement().primaryKey(),
  clientProfileId: int("clientProfileId").notNull().unique(),
  username: varchar("username", { length: 128 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 256 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastLogin: timestamp("lastLogin"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientCredential = typeof clientCredentials.$inferSelect;
export type InsertClientCredential = typeof clientCredentials.$inferInsert;

/**
 * Client sessions table — JWT-like sessions for client portal.
 */
export const clientSessions = mysqlTable("client_sessions", {
  id: int("id").autoincrement().primaryKey(),
  clientProfileId: int("clientProfileId").notNull(),
  sessionToken: varchar("sessionToken", { length: 256 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientSession = typeof clientSessions.$inferSelect;

/**
 * Underwriting table — initial client intake/qualification data.
 */
export const underwriting = mysqlTable("underwriting", {
  id: int("id").autoincrement().primaryKey(),
  clientProfileId: int("clientProfileId").notNull().unique(),

  underwriterPersonnel: varchar("underwriterPersonnel", { length: 256 }),
  underwritingCallDate: varchar("underwritingCallDate", { length: 32 }),
  sourceType: varchar("sourceType", { length: 128 }),

  // Contract
  contractType: varchar("contractType", { length: 128 }),
  dateContractSent: varchar("dateContractSent", { length: 32 }),
  dateContractSigned: varchar("dateContractSigned", { length: 32 }),

  // Funding
  fundingAmountNeededMin: decimal("fundingAmountNeededMin", { precision: 15, scale: 2 }),
  fundingAmountNeededMax: decimal("fundingAmountNeededMax", { precision: 15, scale: 2 }),
  fundingProjectionMin: decimal("fundingProjectionMin", { precision: 15, scale: 2 }),
  fundingProjectionMax: decimal("fundingProjectionMax", { precision: 15, scale: 2 }),
  urgency: varchar("urgency", { length: 128 }),
  expectedTimeFrame: varchar("expectedTimeFrame", { length: 128 }),

  // Income
  annualBusinessIncome: decimal("annualBusinessIncome", { precision: 15, scale: 2 }),
  annualPersonalIncome: decimal("annualPersonalIncome", { precision: 15, scale: 2 }),
  grossMonthlyIncome: decimal("grossMonthlyIncome", { precision: 15, scale: 2 }),
  totalMonthlyDebt: decimal("totalMonthlyDebt", { precision: 15, scale: 2 }),
  cashOnHand: decimal("cashOnHand", { precision: 15, scale: 2 }),

  // Credit
  initialTierType: varchar("initialTierType", { length: 64 }),
  initialFicoScore: int("initialFicoScore"),
  initialCreditUtilization: varchar("initialCreditUtilization", { length: 32 }),
  totalCreditLimit: decimal("totalCreditLimit", { precision: 15, scale: 2 }),
  creditDebt: decimal("creditDebt", { precision: 15, scale: 2 }),
  totalOpenAccounts: int("totalOpenAccounts"),
  totalInquiries: int("totalInquiries"),
  averageAccountAge: varchar("averageAccountAge", { length: 64 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Underwriting = typeof underwriting.$inferSelect;
export type InsertUnderwriting = typeof underwriting.$inferInsert;

/**
 * Onboarding checklist items — documents needed and bank relationships.
 */
export const onboardingItems = mysqlTable("onboarding_items", {
  id: int("id").autoincrement().primaryKey(),
  clientProfileId: int("clientProfileId").notNull(),
  category: mysqlEnum("category", ["document", "bank_relationship", "file_review"]).notNull(),
  label: varchar("label", { length: 256 }).notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  fileUrl: text("fileUrl"),
  fileName: varchar("fileName", { length: 256 }),
  itemType: varchar("itemType", { length: 128 }),
  status: varchar("status", { length: 64 }),
  dateUploaded: varchar("dateUploaded", { length: 32 }),
  dateCompleted: varchar("dateCompleted", { length: 32 }),
  bureauName: varchar("bureauName", { length: 128 }),
  accountName: varchar("accountName", { length: 256 }),
  dateOpened: varchar("dateOpened", { length: 32 }),
  dateUpdated: varchar("dateUpdated", { length: 32 }),
  notes: text("notes"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingItem = typeof onboardingItems.$inferSelect;
export type InsertOnboardingItem = typeof onboardingItems.$inferInsert;

/**
 * Credit reports — summary data from credit bureaus.
 */
export const creditReports = mysqlTable("credit_reports", {
  id: int("id").autoincrement().primaryKey(),
  clientProfileId: int("clientProfileId").notNull(),

  bureau: varchar("bureau", { length: 64 }),
  reportDate: varchar("reportDate", { length: 32 }),
  ficoScore: int("ficoScore"),
  ficoScoreModel: varchar("ficoScoreModel", { length: 64 }),

  // Account summary
  openAccounts: int("openAccounts"),
  closedAccounts: int("closedAccounts"),
  collectionsCount: int("collectionsCount"),
  averageAccountAge: varchar("averageAccountAge", { length: 64 }),
  oldestAccount: varchar("oldestAccount", { length: 64 }),

  // Credit usage
  creditUsagePercent: varchar("creditUsagePercent", { length: 16 }),
  creditUsed: decimal("creditUsed", { precision: 15, scale: 2 }),
  creditLimit: decimal("creditLimit", { precision: 15, scale: 2 }),

  // Debt summary
  creditCardDebt: decimal("creditCardDebt", { precision: 15, scale: 2 }),
  selfReportedBalance: decimal("selfReportedBalance", { precision: 15, scale: 2 }),
  loanDebt: decimal("loanDebt", { precision: 15, scale: 2 }),
  collectionsDebt: decimal("collectionsDebt", { precision: 15, scale: 2 }),
  totalDebt: decimal("totalDebt", { precision: 15, scale: 2 }),

  // Credit usage — Without Authorized User
  creditUsagePercentNoAU: varchar("creditUsagePercentNoAU", { length: 16 }),
  creditUsedNoAU: decimal("creditUsedNoAU", { precision: 15, scale: 2 }),
  creditLimitNoAU: decimal("creditLimitNoAU", { precision: 15, scale: 2 }),

  // Account summary extras
  selfReportedAccounts: int("selfReportedAccounts"),

  // Evaluation
  evaluation: mysqlEnum("evaluation", ["Poor", "Fair", "Good", "Very Good", "Exceptional"]),

  // Personal information (from the report)
  reportPersonName: varchar("reportPersonName", { length: 256 }),
  reportAlsoKnownAs: text("reportAlsoKnownAs"),
  reportYearOfBirth: varchar("reportYearOfBirth", { length: 16 }),
  reportAddresses: text("reportAddresses"),   // comma-separated list
  reportEmployers: text("reportEmployers"),    // comma-separated list

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreditReport = typeof creditReports.$inferSelect;
export type InsertCreditReport = typeof creditReports.$inferInsert;

/**
 * Credit report inquiries — hard/soft inquiries listed in a credit report.
 */
export const creditReportInquiries = mysqlTable("credit_report_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  creditReportId: int("creditReportId").notNull(),   // FK → credit_reports.id
  clientProfileId: int("clientProfileId").notNull(), // FK → client_profiles.id (for easy filtering)

  accountName: varchar("accountName", { length: 256 }),
  inquiredOn: varchar("inquiredOn", { length: 32 }),  // date string
  businessType: varchar("businessType", { length: 256 }),
  address: text("address"),
  contactNumber: varchar("contactNumber", { length: 64 }),
  note: text("note"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreditReportInquiry = typeof creditReportInquiries.$inferSelect;
export type InsertCreditReportInquiry = typeof creditReportInquiries.$inferInsert;

/**
 * Credit accounts — individual account rows from credit report.
 * Each account is linked to a specific credit report via creditReportId (FK).
 */
export const creditAccounts = mysqlTable("credit_accounts", {
  id: int("id").autoincrement().primaryKey(),
  clientProfileId: int("clientProfileId").notNull(),
  creditReportId: int("creditReportId"),                   // FK → credit_reports.id

  // Bureau + report date stored per account row for convenience
  bureau: varchar("bureau", { length: 64 }),               // Experian / Equifax / TransUnion
  reportDate: varchar("reportDate", { length: 32 }),       // Date report was pulled (manual)

  // Account identity
  accountName: varchar("accountName", { length: 256 }),
  openClosed: varchar("openClosed", { length: 16 }),       // Open / Closed
  responsibility: varchar("responsibility", { length: 64 }),
  accountNumber: varchar("accountNumber", { length: 64 }),
  dateOpened: varchar("dateOpened", { length: 32 }),
  statusUpdated: varchar("statusUpdated", { length: 32 }), // Date status was last updated (manual)
  accountType: varchar("accountType", { length: 128 }),
  status: varchar("status", { length: 128 }),

  // Balances & limits
  balance: decimal("balance", { precision: 15, scale: 2 }),
  creditLimit: decimal("creditLimit", { precision: 15, scale: 2 }),
  creditUsage: varchar("creditUsage", { length: 32 }),     // Manually entered (e.g. "45%")
  balanceUpdated: varchar("balanceUpdated", { length: 32 }), // Date balance was updated (manual)
  originalBalance: decimal("originalBalance", { precision: 15, scale: 2 }),
  paidOff: varchar("paidOff", { length: 32 }),             // Manual input percentage e.g. "75%"

  // Payment info
  monthlyPayment: decimal("monthlyPayment", { precision: 15, scale: 2 }),
  lastPaymentDate: varchar("lastPaymentDate", { length: 32 }),
  terms: varchar("terms", { length: 128 }),                // e.g. "60 months", "Revolving"

  // Account category
  creditAccountCategory: mysqlEnum("creditAccountCategory", ["Cards", "Car", "House", "Secured Loan", "Unsecured Loan", "Others"]),

  // Dispute notes
  dispute: text("dispute"),                                // Open text field for dispute statement

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreditAccount = typeof creditAccounts.$inferSelect;
export type InsertCreditAccount = typeof creditAccounts.$inferInsert;

/**
 * Funding applications — individual lender applications per funding round.
 */
export const fundingApplications = mysqlTable("funding_applications", {
  id: int("id").autoincrement().primaryKey(),
  clientProfileId: int("clientProfileId").notNull(),

  callDate: varchar("callDate", { length: 32 }),
  round: varchar("round", { length: 16 }),
  product: varchar("product", { length: 256 }),
  type: varchar("type", { length: 64 }),
  rates: varchar("rates", { length: 128 }),
  appliedLimit: decimal("appliedLimit", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 128 }).default("Pending").notNull(),

  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FundingApplication = typeof fundingApplications.$inferSelect;
export type InsertFundingApplication = typeof fundingApplications.$inferInsert;

/**
 * Uploaded files — documents uploaded by client or admin team.
 */
export const uploadedFiles = mysqlTable("uploaded_files", {
  id: int("id").autoincrement().primaryKey(),
  clientProfileId: int("clientProfileId").notNull(),

  originalName: varchar("originalName", { length: 256 }).notNull(),
  fileName: varchar("fileName", { length: 256 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  fileSize: int("fileSize"),
  category: varchar("category", { length: 128 }),
  uploadedBy: varchar("uploadedBy", { length: 256 }),
  uploadedByRole: mysqlEnum("uploadedByRole", ["admin", "client"]).default("admin").notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = typeof uploadedFiles.$inferInsert;

/**
 * Call logs — records of calls with clients.
 */
export const callLogs = mysqlTable("call_logs", {
  id: int("id").autoincrement().primaryKey(),
  clientProfileId: int("clientProfileId").notNull(),

  callTitle: varchar("callTitle", { length: 256 }).notNull(),
  callDate: varchar("callDate", { length: 32 }),
  callTime: varchar("callTime", { length: 32 }),
  host: varchar("host", { length: 256 }),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled", "no_show"]).default("scheduled").notNull(),
  recordingLink: text("recordingLink"),
  notes: text("notes"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = typeof callLogs.$inferInsert;

/**
 * Team members — internal staff/team accounts that can log into the admin panel.
 */
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),

  // Profile info
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }).notNull(),
  position: varchar("position", { length: 128 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),

  // Login credentials
  username: varchar("username", { length: 128 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 256 }).notNull(),

  // Status
  isActive: boolean("isActive").default(true).notNull(),
  lastLogin: timestamp("lastLogin"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * Team member sessions — JWT-like sessions for team member login.
 */
export const teamMemberSessions = mysqlTable("team_member_sessions", {
  id: int("id").autoincrement().primaryKey(),
  teamMemberId: int("teamMemberId").notNull(),
  sessionToken: varchar("sessionToken", { length: 256 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamMemberSession = typeof teamMemberSessions.$inferSelect;

/**
 * Billing records — individual billing entries per client.
 */
export const billingRecords = mysqlTable("billing_records", {
  id: int("id").autoincrement().primaryKey(),
  clientProfileId: int("clientProfileId").notNull(),

  billingStatus: mysqlEnum("billingStatus", ["pending", "partial", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  dateIssued: varchar("dateIssued", { length: 32 }),
  amountIssued: decimal("amountIssued", { precision: 15, scale: 2 }),
  amountPaid: decimal("amountPaid", { precision: 15, scale: 2 }),
  datePaid: varchar("datePaid", { length: 32 }),
  billingLink: text("billingLink"),
  notes: text("notes"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BillingRecord = typeof billingRecords.$inferSelect;
export type InsertBillingRecord = typeof billingRecords.$inferInsert;

/**
 * Client tasks — tasks assigned to clients by the admin team.
 */
export const clientTasks = mysqlTable("client_tasks", {
  id: int("id").autoincrement().primaryKey(),
  clientProfileId: int("clientProfileId").notNull(),

  taskTitle: varchar("taskTitle", { length: 256 }).notNull(),
  urgency: mysqlEnum("urgency", ["High", "Fair", "Low"]).default("Fair").notNull(),
  taskDetails: text("taskDetails"),
  dateAssigned: varchar("dateAssigned", { length: 32 }),
  dueDate: varchar("dueDate", { length: 32 }),
  status: mysqlEnum("status", ["Ongoing", "Complete", "Failed"]).default("Ongoing").notNull(),
  resultNotes: text("resultNotes"),
  completionRate: mysqlEnum("completionRate", ["0%", "10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"]).default("0%").notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientTask = typeof clientTasks.$inferSelect;
export type InsertClientTask = typeof clientTasks.$inferInsert;

/**
 * Team tasks — tasks assigned by team members to other team members for a client.
 */
export const teamTasks = mysqlTable("team_tasks", {
  id: int("id").autoincrement().primaryKey(),
  clientProfileId: int("clientProfileId").notNull(),

  taskTitle: varchar("taskTitle", { length: 256 }).notNull(),
  taskDetails: text("taskDetails"),
  urgency: mysqlEnum("urgency", ["High", "Fair", "Low"]).default("Fair").notNull(),
  assignedBy: varchar("assignedBy", { length: 256 }),
  assignedTo: varchar("assignedTo", { length: 256 }),
  dateAssigned: varchar("dateAssigned", { length: 32 }),
  dueDate: varchar("dueDate", { length: 32 }),
  status: mysqlEnum("status", ["Ongoing", "Complete", "Failed"]).default("Ongoing").notNull(),
  resultNotes: text("resultNotes"),
  completionRate: mysqlEnum("completionRate", ["0%", "10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"]).default("0%").notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamTask = typeof teamTasks.$inferSelect;
export type InsertTeamTask = typeof teamTasks.$inferInsert;
