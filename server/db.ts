import { eq, like, or, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  clientProfiles,
  clientCredentials,
  clientSessions,
  InsertClientProfile,
  InsertClientCredential,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers (Manus OAuth) ────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Client Profile helpers ────────────────────────────────────────────────

export async function getAllClientProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(clientProfiles)
    .orderBy(desc(clientProfiles.createdAt));
}

export async function getClientProfileById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(clientProfiles)
    .where(eq(clientProfiles.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function searchClientProfiles(query: string) {
  const db = await getDb();
  if (!db) return [];
  const q = `%${query}%`;
  return db
    .select()
    .from(clientProfiles)
    .where(
      or(
        like(clientProfiles.firstName, q),
        like(clientProfiles.lastName, q),
        like(clientProfiles.email, q),
        like(clientProfiles.businessName, q)
      )
    )
    .orderBy(desc(clientProfiles.createdAt));
}

export async function createClientProfile(data: InsertClientProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientProfiles).values(data);
  return result[0];
}

export async function updateClientProfile(
  id: number,
  data: Partial<InsertClientProfile>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientProfiles).set(data).where(eq(clientProfiles.id, id));
}

export async function deleteClientProfile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete related credentials and sessions first
  await db
    .delete(clientCredentials)
    .where(eq(clientCredentials.clientProfileId, id));
  await db
    .delete(clientSessions)
    .where(eq(clientSessions.clientProfileId, id));
  await db.delete(clientProfiles).where(eq(clientProfiles.id, id));
}

// ─── Client Credentials helpers ───────────────────────────────────────────

export async function getClientCredentialByUsername(username: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(clientCredentials)
    .where(eq(clientCredentials.username, username))
    .limit(1);
  return result[0] ?? null;
}

export async function getClientCredentialByProfileId(profileId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(clientCredentials)
    .where(eq(clientCredentials.clientProfileId, profileId))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertClientCredential(data: InsertClientCredential) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(clientCredentials)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        username: data.username,
        passwordHash: data.passwordHash,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    });
}

export async function updateClientLastLogin(credentialId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(clientCredentials)
    .set({ lastLogin: new Date() })
    .where(eq(clientCredentials.id, credentialId));
}

// ─── Client Session helpers ────────────────────────────────────────────────

export async function createClientSession(
  clientProfileId: number,
  sessionToken: string,
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(clientSessions).values({ clientProfileId, sessionToken, expiresAt });
}

export async function getClientSessionByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(clientSessions)
    .where(
      and(
        eq(clientSessions.sessionToken, token),
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function deleteClientSession(token: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(clientSessions).where(eq(clientSessions.sessionToken, token));
}

export async function cleanExpiredSessions() {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  // Delete sessions where expiresAt < now
  const allSessions = await db.select().from(clientSessions);
  const expired = allSessions.filter((s) => s.expiresAt < now);
  for (const s of expired) {
    await db.delete(clientSessions).where(eq(clientSessions.id, s.id));
  }
}

// ─── Underwriting helpers ──────────────────────────────────────────────────

import {
  underwriting,
  onboardingItems,
  creditReports,
  creditAccounts,
  creditReportInquiries,
  fundingApplications,
  uploadedFiles,
  callLogs,
  InsertUnderwriting,
  InsertOnboardingItem,
  InsertCreditReport,
  InsertCreditAccount,
  InsertCreditReportInquiry,
  InsertFundingApplication,
  InsertUploadedFile,
  InsertCallLog,
} from "../drizzle/schema";

export async function getUnderwritingByClientId(clientProfileId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(underwriting).where(eq(underwriting.clientProfileId, clientProfileId)).limit(1);
  return result[0] ?? null;
}

export async function upsertUnderwriting(clientProfileId: number, data: Partial<InsertUnderwriting>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUnderwritingByClientId(clientProfileId);
  if (existing) {
    await db.update(underwriting).set({ ...data, updatedAt: new Date() }).where(eq(underwriting.clientProfileId, clientProfileId));
  } else {
    await db.insert(underwriting).values({ clientProfileId, ...data } as InsertUnderwriting);
  }
}

// ─── Onboarding helpers ────────────────────────────────────────────────────

export async function getOnboardingItems(clientProfileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(onboardingItems).where(eq(onboardingItems.clientProfileId, clientProfileId)).orderBy(onboardingItems.sortOrder);
}

export async function createOnboardingItem(data: InsertOnboardingItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(onboardingItems).values(data);
  return result[0];
}

export async function updateOnboardingItem(id: number, data: Partial<InsertOnboardingItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(onboardingItems).set({ ...data, updatedAt: new Date() }).where(eq(onboardingItems.id, id));
}

export async function deleteOnboardingItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(onboardingItems).where(eq(onboardingItems.id, id));
}

// ─── Credit Report helpers ─────────────────────────────────────────────────

export async function getCreditReportsByClientId(clientProfileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditReports).where(eq(creditReports.clientProfileId, clientProfileId)).orderBy(desc(creditReports.createdAt));
}

export async function getCreditReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(creditReports).where(eq(creditReports.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createCreditReport(data: InsertCreditReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(creditReports).values(data);
  return result[0];
}

export async function updateCreditReport(id: number, data: Partial<InsertCreditReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(creditReports).set({ ...data, updatedAt: new Date() }).where(eq(creditReports.id, id));
}

// ─── Credit Report Inquiry helpers ───────────────────────────────────────────
export async function getInquiriesByReportId(creditReportId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditReportInquiries).where(eq(creditReportInquiries.creditReportId, creditReportId)).orderBy(desc(creditReportInquiries.createdAt));
}

export async function createInquiry(data: InsertCreditReportInquiry) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(creditReportInquiries).values(data);
  return result[0].insertId;
}

export async function updateInquiry(id: number, data: Partial<InsertCreditReportInquiry>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(creditReportInquiries).set({ ...data, updatedAt: new Date() }).where(eq(creditReportInquiries.id, id));
}

export async function deleteInquiry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(creditReportInquiries).where(eq(creditReportInquiries.id, id));
}

export async function deleteCreditReport(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Credit accounts are now flat (no creditReportId FK), so only delete the report itself
  await db.delete(creditReports).where(eq(creditReports.id, id));
}

export async function getCreditAccountsByClientId(clientProfileId: number, creditReportId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = creditReportId
    ? and(eq(creditAccounts.clientProfileId, clientProfileId), eq(creditAccounts.creditReportId, creditReportId))
    : eq(creditAccounts.clientProfileId, clientProfileId);
  return db.select().from(creditAccounts).where(conditions).orderBy(creditAccounts.id);
}

export async function createCreditAccount(data: InsertCreditAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(creditAccounts).values(data);
  return result[0];
}

export async function updateCreditAccount(id: number, data: Partial<InsertCreditAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(creditAccounts).set({ ...data, updatedAt: new Date() }).where(eq(creditAccounts.id, id));
}

export async function deleteCreditAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(creditAccounts).where(eq(creditAccounts.id, id));
}

// ─── Funding Application helpers ───────────────────────────────────────────

export async function getFundingApplicationsByClientId(clientProfileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fundingApplications).where(eq(fundingApplications.clientProfileId, clientProfileId)).orderBy(fundingApplications.sortOrder, fundingApplications.id);
}

export async function createFundingApplication(data: InsertFundingApplication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(fundingApplications).values(data);
  return result[0];
}

export async function updateFundingApplication(id: number, data: Partial<InsertFundingApplication>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(fundingApplications).set({ ...data, updatedAt: new Date() }).where(eq(fundingApplications.id, id));
}

export async function deleteFundingApplication(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(fundingApplications).where(eq(fundingApplications.id, id));
}

// ─── Uploaded Files helpers ────────────────────────────────────────────────

export async function getUploadedFilesByClientId(clientProfileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(uploadedFiles).where(eq(uploadedFiles.clientProfileId, clientProfileId)).orderBy(desc(uploadedFiles.createdAt));
}

export async function createUploadedFile(data: InsertUploadedFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(uploadedFiles).values(data);
  return result[0];
}

export async function deleteUploadedFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(uploadedFiles).where(eq(uploadedFiles.id, id));
}

// ─── Call Log helpers ──────────────────────────────────────────────────────

export async function getCallLogsByClientId(clientProfileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(callLogs).where(eq(callLogs.clientProfileId, clientProfileId)).orderBy(desc(callLogs.createdAt));
}

export async function createCallLog(data: InsertCallLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(callLogs).values(data);
  return result[0];
}

export async function updateCallLog(id: number, data: Partial<InsertCallLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(callLogs).set({ ...data, updatedAt: new Date() }).where(eq(callLogs.id, id));
}

export async function deleteCallLog(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(callLogs).where(eq(callLogs.id, id));
}

// ─── Team Member helpers ───────────────────────────────────────────────────

import {
  teamMembers,
  InsertTeamMember,
} from "../drizzle/schema";

export async function getAllTeamMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamMembers).orderBy(teamMembers.firstName);
}

export async function getTeamMemberById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getTeamMemberByUsername(username: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(teamMembers).where(eq(teamMembers.username, username)).limit(1);
  return result[0] ?? null;
}

export async function createTeamMember(data: InsertTeamMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(teamMembers).values(data);
  return result[0];
}

export async function updateTeamMember(id: number, data: Partial<InsertTeamMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(teamMembers).set({ ...data, updatedAt: new Date() }).where(eq(teamMembers.id, id));
}

export async function deleteTeamMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
}

// ─── Team Member Session helpers ───────────────────────────────────────────

import {
  teamMemberSessions,
} from "../drizzle/schema";

export async function createTeamMemberSession(
  teamMemberId: number,
  sessionToken: string,
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(teamMemberSessions).values({ teamMemberId, sessionToken, expiresAt });
}

export async function getTeamMemberSessionByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(teamMemberSessions)
    .where(eq(teamMemberSessions.sessionToken, token))
    .limit(1);
  return result[0] ?? null;
}

export async function deleteTeamMemberSession(token: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(teamMemberSessions).where(eq(teamMemberSessions.sessionToken, token));
}

export async function updateTeamMemberLastLogin(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(teamMembers).set({ lastLogin: new Date() }).where(eq(teamMembers.id, id));
}

// ─── Billing Record helpers ────────────────────────────────────────────────
import {
  billingRecords,
  InsertBillingRecord,
  clientTasks,
  InsertClientTask,
  teamTasks,
  InsertTeamTask,
} from "../drizzle/schema";

export async function getBillingRecordsByClientId(clientProfileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(billingRecords).where(eq(billingRecords.clientProfileId, clientProfileId)).orderBy(desc(billingRecords.createdAt));
}
export async function createBillingRecord(data: InsertBillingRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(billingRecords).values(data);
  return result[0];
}
export async function updateBillingRecord(id: number, data: Partial<InsertBillingRecord>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(billingRecords).set({ ...data, updatedAt: new Date() }).where(eq(billingRecords.id, id));
}
export async function deleteBillingRecord(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(billingRecords).where(eq(billingRecords.id, id));
}

// ─── Client Task helpers ───────────────────────────────────────────────────
export async function getClientTasksByClientId(clientProfileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientTasks).where(eq(clientTasks.clientProfileId, clientProfileId)).orderBy(desc(clientTasks.createdAt));
}
export async function createClientTask(data: InsertClientTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientTasks).values(data);
  return result[0];
}
export async function updateClientTask(id: number, data: Partial<InsertClientTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientTasks).set({ ...data, updatedAt: new Date() }).where(eq(clientTasks.id, id));
}
export async function deleteClientTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clientTasks).where(eq(clientTasks.id, id));
}

// ─── Team Task helpers ─────────────────────────────────────────────────────
export async function getTeamTasksByClientId(clientProfileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamTasks).where(eq(teamTasks.clientProfileId, clientProfileId)).orderBy(desc(teamTasks.createdAt));
}
export async function createTeamTask(data: InsertTeamTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(teamTasks).values(data);
  return result[0];
}
export async function updateTeamTask(id: number, data: Partial<InsertTeamTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(teamTasks).set({ ...data, updatedAt: new Date() }).where(eq(teamTasks.id, id));
}
export async function deleteTeamTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(teamTasks).where(eq(teamTasks.id, id));
}
