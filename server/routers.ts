import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getAllClientProfiles,
  getClientProfileById,
  searchClientProfiles,
  createClientProfile,
  updateClientProfile,
  deleteClientProfile,
  getClientCredentialByUsername,
  getClientCredentialByProfileId,
  upsertClientCredential,
  updateClientLastLogin,
  createClientSession,
  getClientSessionByToken,
  deleteClientSession,
  cleanExpiredSessions,
  getUnderwritingByClientId,
  upsertUnderwriting,
  getOnboardingItems,
  createOnboardingItem,
  updateOnboardingItem,
  deleteOnboardingItem,
  getCreditReportsByClientId,
  getCreditReportById,
  getInquiriesByReportId,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  createCreditReport,
  updateCreditReport,
  deleteCreditReport,
  getCreditAccountsByClientId,
  createCreditAccount,
  updateCreditAccount,
  deleteCreditAccount,
  getFundingApplicationsByClientId,
  createFundingApplication,
  updateFundingApplication,
  deleteFundingApplication,
  getUploadedFilesByClientId,
  createUploadedFile,
  deleteUploadedFile,
  getCallLogsByClientId,
  createCallLog,
  updateCallLog,
  deleteCallLog,
  getAllTeamMembers,
  getTeamMemberById,
  getTeamMemberByUsername,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  createTeamMemberSession,
  getTeamMemberSessionByToken,
  deleteTeamMemberSession,
  updateTeamMemberLastLogin,
  getBillingRecordsByClientId,
  createBillingRecord,
  updateBillingRecord,
  deleteBillingRecord,
  getClientTasksByClientId,
  createClientTask,
  updateClientTask,
  deleteClientTask,
  getTeamTasksByClientId,
  createTeamTask,
  updateTeamTask,
  deleteTeamTask,
} from "./db";
import { nanoid } from "nanoid";
import { createHash } from "crypto";
import { storagePut } from "./storage";

// ─── Helpers ──────────────────────────────────────────────────────────────

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "funding_salt_2024").digest("hex");
}

// staffProcedure: allows both Manus OAuth admins AND team members with a valid session
const staffProcedure = publicProcedure.use(async ({ ctx, next }) => {
  // Check OAuth admin
  if (ctx.user && ctx.user.role === "admin") {
    return next({ ctx });
  }
  // Check team member session cookie
  const token = (ctx.req.cookies as Record<string, string>)?.team_session;
  if (token) {
    const session = await getTeamMemberSessionByToken(token);
    if (session && session.expiresAt > new Date()) {
      const member = await getTeamMemberById(session.teamMemberId);
      if (member && member.isActive) {
        return next({ ctx });
      }
    }
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "Staff access required" });
});
// Keep adminProcedure alias for backward compatibility
const adminProcedure = staffProcedure;

// ─── Client Profile Input Schema ──────────────────────────────────────────

const clientProfileInput = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().nullable(),
  email2: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  phone2: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  ssn: z.string().optional().nullable(),
  driversLicenseNumber: z.string().optional().nullable(),
  driversLicenseExpirationDate: z.string().optional().nullable(),
  driversLicenseIssuedState: z.string().optional().nullable(),
  hasSupportingDocuments: z.enum(["yes", "no"]).optional().nullable(),
  creditProfileLogins: z.string().optional().nullable(),
  onboardingPreparationStatus: z.enum(["Pending", "Ready", "Ceased"]).optional().nullable(),
  fileReviewOverallStatus: z.enum(["Pending", "Done", "Ceased"]).optional().nullable(),
  creditRepairStatus: z.enum(["Pending", "Completed", "Failed"]).optional().nullable(),
  creditRepairNotes: z.string().optional().nullable(),
  creditRepairDateUpdated: z.string().optional().nullable(),
  creditRepairUpdatedBy: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  businessType: z.string().optional().nullable(),
  businessStartDate: z.string().optional().nullable(),
  timeInBusiness: z.string().optional().nullable(),
  totalBusinessIncome: z.string().optional().nullable(),
  personalIncome: z.string().optional().nullable(),
  fundingNeeded: z.string().optional().nullable(),
  ficoScore: z.number().int().min(300).max(850).optional().nullable(),
  monthlyRevenue: z.string().optional().nullable(),
  existingDebt: z.string().optional().nullable(),
  fundingPurpose: z.string().optional().nullable(),
  fundingStatus: z
    .enum(["pending", "under_review", "approved", "funded", "declined", "on_hold"])
    .optional(),
  fundingAmount: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// ─── Client ID Generator ──────────────────────────────────────────────────
function generateClientId(firstName: string, lastName: string, middleName?: string): string {
  const now = new Date();
  const initials = [
    firstName.trim().charAt(0),
    middleName ? middleName.trim().charAt(0) : null,
    lastName.trim().charAt(0),
  ]
    .filter(Boolean)
    .join("")
    .toUpperCase();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${initials}-${mm}${dd}${yyyy}-${hh}${min}`;
}

// ─── App Router ───────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  teamAuth: router({
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const member = await getTeamMemberByUsername(input.username);
        if (!member || !member.isActive) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password" });
        }
        const hash = hashPassword(input.password);
        if (hash !== member.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password" });
        }
        const token = nanoid(64);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await createTeamMemberSession(member.id, token, expiresAt);
        await updateTeamMemberLastLogin(member.id);
        ctx.res.cookie("team_session", token, {
          ...getSessionCookieOptions(ctx.req),
          expires: expiresAt,
        });
        return {
          success: true,
          member: {
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            position: member.position,
            email: member.email,
            username: member.username,
          },
        };
      }),

    me: publicProcedure.query(async ({ ctx }) => {
      const token = (ctx.req.cookies as Record<string, string>)?.team_session;
      if (!token) return null;
      const session = await getTeamMemberSessionByToken(token);
      if (!session || session.expiresAt < new Date()) return null;
      const member = await getTeamMemberById(session.teamMemberId);
      if (!member || !member.isActive) return null;
      return {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        position: member.position,
        email: member.email,
        username: member.username,
        isTeamMember: true,
      };
    }),

    logout: publicProcedure.mutation(async ({ ctx }) => {
      const token = (ctx.req.cookies as Record<string, string>)?.team_session;
      if (token) {
        await deleteTeamMemberSession(token);
        ctx.res.clearCookie("team_session", { path: "/" });
      }
      return { success: true };
    }),
  }),

  team: router({
    list: adminProcedure.query(async () => {
      const members = await getAllTeamMembers();
      return members.map((m) => ({
        ...m,
        passwordHash: undefined, // never expose hash to frontend
      }));
    }),

    create: adminProcedure
      .input(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          position: z.string().optional().nullable(),
          email: z.string().email().optional().nullable(),
          phone: z.string().optional().nullable(),
          username: z.string().min(3),
          password: z.string().min(6),
        })
      )
      .mutation(async ({ input }) => {
        const existing = await getTeamMemberByUsername(input.username);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Username already taken" });
        await createTeamMember({
          firstName: input.firstName,
          lastName: input.lastName,
          position: input.position ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          username: input.username,
          passwordHash: hashPassword(input.password),
          isActive: true,
        });
        return { success: true };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number().int(),
          firstName: z.string().min(1).optional(),
          lastName: z.string().min(1).optional(),
          position: z.string().optional().nullable(),
          email: z.string().email().optional().nullable(),
          phone: z.string().optional().nullable(),
          username: z.string().min(3).optional(),
          password: z.string().min(6).optional().nullable(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, password, ...rest } = input;
        const updateData: Record<string, unknown> = { ...rest };
        if (password) updateData.passwordHash = hashPassword(password);
        // Check username uniqueness if changing
        if (rest.username) {
          const existing = await getTeamMemberByUsername(rest.username);
          if (existing && existing.id !== id) throw new TRPCError({ code: "CONFLICT", message: "Username already taken" });
        }
        await updateTeamMember(id, updateData as any);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteTeamMember(input.id);
        return { success: true };
      }),
  }),

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Client Portal Auth (username/password) ─────────────────────────────
  clientAuth: router({
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input }) => {
        await cleanExpiredSessions();

        const credential = await getClientCredentialByUsername(input.username);
        if (!credential || !credential.isActive) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid username or password",
          });
        }

        const hash = hashPassword(input.password);
        if (hash !== credential.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid username or password",
          });
        }

        await updateClientLastLogin(credential.id);

        const token = nanoid(64);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await createClientSession(credential.clientProfileId, token, expiresAt);

        return { token, clientProfileId: credential.clientProfileId };
      }),

    logout: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        await deleteClientSession(input.token);
        return { success: true };
      }),

    getProfile: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const session = await getClientSessionByToken(input.token);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
        }

        const profile = await getClientProfileById(session.clientProfileId);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
        }

        // Strip internal notes from client view
        const { internalNotes: _internal, ...safeProfile } = profile;
        return safeProfile;
      }),
    getCreditReports: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const session = await getClientSessionByToken(input.token);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
        }
        return getCreditReportsByClientId(session.clientProfileId);
      }),
    getCreditAccounts: publicProcedure
      .input(z.object({ token: z.string(), creditReportId: z.number().optional().nullable() }))
      .query(async ({ input }) => {
        const session = await getClientSessionByToken(input.token);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
        }
        return getCreditAccountsByClientId(session.clientProfileId, input.creditReportId ?? undefined);
      }),
    getInquiries: publicProcedure
      .input(z.object({ token: z.string(), creditReportId: z.number() }))
      .query(async ({ input }) => {
        const session = await getClientSessionByToken(input.token);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
        }
        return getInquiriesByReportId(input.creditReportId);
      }),
    getFundingApplications: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const session = await getClientSessionByToken(input.token);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
        }
        return getFundingApplicationsByClientId(session.clientProfileId);
      }),
    getUnderwriting: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const session = await getClientSessionByToken(input.token);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
        }
        return getUnderwritingByClientId(session.clientProfileId);
      }),
    getBillingRecords: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const session = await getClientSessionByToken(input.token);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
        }
        return getBillingRecordsByClientId(session.clientProfileId);
      }),
    getClientTasks: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const session = await getClientSessionByToken(input.token);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
        }
        return getClientTasksByClientId(session.clientProfileId);
      }),
  }),
  // ─── Admin Procedures ─────────────────────────────────────────────────────
  admin: router({
    listClients: adminProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        if (input?.search && input.search.trim()) {
          return searchClientProfiles(input.search.trim());
        }
        return getAllClientProfiles();
      }),

    getClient: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const profile = await getClientProfileById(input.id);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
        }
        return profile;
      }),

    createClient: adminProcedure
      .input(clientProfileInput)
      .mutation(async ({ input }) => {
        await createClientProfile({ ...input } as any);
        return { success: true };
      }),

    updateClient: adminProcedure
      .input(z.object({ id: z.number(), data: clientProfileInput.partial() }))
      .mutation(async ({ input }) => {
        await updateClientProfile(input.id, input.data as any);
        return { success: true };
      }),

    deleteClient: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteClientProfile(input.id);
        return { success: true };
      }),

    setClientCredentials: adminProcedure
      .input(
        z.object({
          clientProfileId: z.number(),
          username: z.string().min(3),
          password: z.string().min(6),
        })
      )
      .mutation(async ({ input }) => {
        const passwordHash = hashPassword(input.password);
        await upsertClientCredential({
          clientProfileId: input.clientProfileId,
          username: input.username,
          passwordHash,
          isActive: true,
        });
        return { success: true };
      }),

    getClientCredential: adminProcedure
      .input(z.object({ clientProfileId: z.number() }))
      .query(async ({ input }) => {
        const cred = await getClientCredentialByProfileId(input.clientProfileId);
        if (!cred) return null;
        return { username: cred.username, isActive: cred.isActive, lastLogin: cred.lastLogin };
      }),

    importFromSheets: adminProcedure
      .input(
        z.object({
          sheetId: z.string(),
          apiKey: z.string().optional(),
          sheetName: z.string().optional(),
          columnMapping: z.record(z.string(), z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Fetch Google Sheets data via public API
        const sheetName = input.sheetName || "Sheet1";
        const range = encodeURIComponent(`${sheetName}!A1:Z1000`);
        const apiKey = input.apiKey || process.env.GOOGLE_SHEETS_API_KEY || "";

        let url: string;
        if (apiKey) {
          url = `https://sheets.googleapis.com/v4/spreadsheets/${input.sheetId}/values/${range}?key=${apiKey}`;
        } else {
          // Try public CSV export
          url = `https://docs.google.com/spreadsheets/d/${input.sheetId}/export?format=csv&sheet=${sheetName}`;
        }

        let rows: string[][];
        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`Failed to fetch sheet: ${res.status} ${res.statusText}`);
          }

          if (apiKey) {
            const json = await res.json() as { values?: string[][] };
            rows = json.values || [];
          } else {
            const csv = await res.text();
            rows = parseCSV(csv);
          }
        } catch (err: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Could not fetch Google Sheet: ${err.message}`,
          });
        }

        if (rows.length < 2) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Sheet appears to be empty or has no data rows",
          });
        }

        const headers = rows[0].map((h) => h.trim().toLowerCase());
        const dataRows = rows.slice(1);

        const mapping: Record<string, string> = input.columnMapping || buildDefaultMapping(headers);

        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (row.every((cell) => !cell.trim())) continue; // skip empty rows

          try {
            const profile = mapRowToProfile(headers, row, mapping);
            if (!profile.firstName && !profile.lastName) {
              skipped++;
              continue;
            }
            await createClientProfile(profile as any);
            imported++;
          } catch (err: any) {
            errors.push(`Row ${i + 2}: ${err.message}`);
            skipped++;
          }
        }

        return { imported, skipped, errors };
      }),

    previewSheetImport: adminProcedure
      .input(
        z.object({
          sheetId: z.string(),
          apiKey: z.string().optional(),
          sheetName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const sheetName = input.sheetName || "Sheet1";
        const apiKey = input.apiKey || process.env.GOOGLE_SHEETS_API_KEY || "";

        let url: string;
        if (apiKey) {
          const range = encodeURIComponent(`${sheetName}!A1:Z10`);
          url = `https://sheets.googleapis.com/v4/spreadsheets/${input.sheetId}/values/${range}?key=${apiKey}`;
        } else {
          url = `https://docs.google.com/spreadsheets/d/${input.sheetId}/export?format=csv&sheet=${sheetName}`;
        }

        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`${res.status} ${res.statusText}`);
          }

          let rows: string[][];
          if (apiKey) {
            const json = await res.json() as { values?: string[][] };
            rows = (json.values || []).slice(0, 10);
          } else {
            const csv = await res.text();
            rows = parseCSV(csv).slice(0, 10);
          }

          if (rows.length === 0) return { headers: [], preview: [], mapping: {} };

          const headers = rows[0].map((h) => h.trim());
          const preview = rows.slice(1);
          const mapping: Record<string, string> = buildDefaultMapping(headers.map((h) => h.toLowerCase()));

          return { headers, preview, mapping };
        } catch (err: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Could not fetch Google Sheet: ${err.message}`,
          });
        }
      }),

    // ─── Photo Upload ──────────────────────────────────────────────────────
    uploadClientPhoto: adminProcedure
      .input(z.object({ clientId: z.number(), base64: z.string(), mimeType: z.string() }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const key = `client-photos/${input.clientId}-${nanoid(8)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await updateClientProfile(input.clientId, { photoUrl: url });
        return { url };
      }),

    // ─── Underwriting ──────────────────────────────────────────────────────
    getUnderwriting: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        const result = await getUnderwritingByClientId(input.clientId);
        return result ?? null;
      }),

    saveUnderwriting: adminProcedure
      .input(z.object({
        clientId: z.number(),
        underwriterPersonnel: z.string().optional().nullable(),
        underwritingCallDate: z.string().optional().nullable(),
        sourceType: z.string().optional().nullable(),
        contractType: z.string().optional().nullable(),
        dateContractSent: z.string().optional().nullable(),
        dateContractSigned: z.string().optional().nullable(),
        fundingAmountNeededMin: z.string().optional().nullable(),
        fundingAmountNeededMax: z.string().optional().nullable(),
        fundingProjectionMin: z.string().optional().nullable(),
        fundingProjectionMax: z.string().optional().nullable(),
        urgency: z.string().optional().nullable(),
        expectedTimeFrame: z.string().optional().nullable(),
        annualBusinessIncome: z.string().optional().nullable(),
        annualPersonalIncome: z.string().optional().nullable(),
        grossMonthlyIncome: z.string().optional().nullable(),
        totalMonthlyDebt: z.string().optional().nullable(),
        cashOnHand: z.string().optional().nullable(),
        initialTierType: z.string().optional().nullable(),
        initialFicoScore: z.number().int().optional().nullable(),
        initialCreditUtilization: z.string().optional().nullable(),
        totalCreditLimit: z.string().optional().nullable(),
        creditDebt: z.string().optional().nullable(),
        totalOpenAccounts: z.number().int().optional().nullable(),
        totalInquiries: z.number().int().optional().nullable(),
        averageAccountAge: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { clientId, ...data } = input;
        await upsertUnderwriting(clientId, data as any);
        return { success: true };
      }),

    // ─── Onboarding ────────────────────────────────────────────────────────
    getOnboarding: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => getOnboardingItems(input.clientId)),

    addOnboardingItem: adminProcedure
      .input(z.object({
        clientProfileId: z.number(),
        category: z.enum(["document", "bank_relationship", "file_review"]),
        label: z.string().min(1),
        sortOrder: z.number().int().optional(),
        fileUrl: z.string().optional().nullable(),
        fileName: z.string().optional().nullable(),
        itemType: z.string().optional().nullable(),
        status: z.string().optional().nullable(),
        dateUploaded: z.string().optional().nullable(),
        dateCompleted: z.string().optional().nullable(),
        bureauName: z.string().optional().nullable(),
        accountName: z.string().optional().nullable(),
        dateOpened: z.string().optional().nullable(),
        dateUpdated: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        await createOnboardingItem({ ...input, isCompleted: false });
        return { success: true };
      }),

    updateOnboardingItem: adminProcedure
      .input(z.object({
        id: z.number(),
        isCompleted: z.boolean().optional(),
        label: z.string().optional(),
        fileUrl: z.string().optional().nullable(),
        fileName: z.string().optional().nullable(),
        itemType: z.string().optional().nullable(),
        status: z.string().optional().nullable(),
        dateUploaded: z.string().optional().nullable(),
        dateCompleted: z.string().optional().nullable(),
        bureauName: z.string().optional().nullable(),
        accountName: z.string().optional().nullable(),
        dateOpened: z.string().optional().nullable(),
        dateUpdated: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateOnboardingItem(id, data);
        return { success: true };
      }),

    deleteOnboardingItem: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteOnboardingItem(input.id);
        return { success: true };
      }),

    // ─── Credit Reports ────────────────────────────────────────────────────
    getCreditReports: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => getCreditReportsByClientId(input.clientId)),

    createCreditReport: adminProcedure
      .input(z.object({
        clientProfileId: z.number(),
        bureau: z.string().optional().nullable(),
        reportDate: z.string().optional().nullable(),
        ficoScore: z.number().int().optional().nullable(),
        ficoScoreModel: z.string().optional().nullable(),
        evaluation: z.enum(["Poor", "Fair", "Good", "Very Good", "Exceptional"]).optional().nullable(),
        openAccounts: z.number().int().optional().nullable(),
        selfReportedAccounts: z.number().int().optional().nullable(),
        closedAccounts: z.number().int().optional().nullable(),
        collectionsCount: z.number().int().optional().nullable(),
        averageAccountAge: z.string().optional().nullable(),
        oldestAccount: z.string().optional().nullable(),
        creditUsagePercent: z.string().optional().nullable(),
        creditUsed: z.string().optional().nullable(),
        creditLimit: z.string().optional().nullable(),
        creditUsagePercentNoAU: z.string().optional().nullable(),
        creditUsedNoAU: z.string().optional().nullable(),
        creditLimitNoAU: z.string().optional().nullable(),
        creditCardDebt: z.string().optional().nullable(),
        selfReportedBalance: z.string().optional().nullable(),
        loanDebt: z.string().optional().nullable(),
        collectionsDebt: z.string().optional().nullable(),
        totalDebt: z.string().optional().nullable(),
        reportPersonName: z.string().optional().nullable(),
        reportAlsoKnownAs: z.string().optional().nullable(),
        reportYearOfBirth: z.string().optional().nullable(),
        reportAddresses: z.string().optional().nullable(),
        reportEmployers: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        await createCreditReport(input as any);
        return { success: true };
      }),
    updateCreditReport: adminProcedure
      .input(z.object({
        id: z.number(),
        bureau: z.string().optional().nullable(),
        reportDate: z.string().optional().nullable(),
        ficoScore: z.number().int().optional().nullable(),
        ficoScoreModel: z.string().optional().nullable(),
        evaluation: z.enum(["Poor", "Fair", "Good", "Very Good", "Exceptional"]).optional().nullable(),
        openAccounts: z.number().int().optional().nullable(),
        selfReportedAccounts: z.number().int().optional().nullable(),
        closedAccounts: z.number().int().optional().nullable(),
        collectionsCount: z.number().int().optional().nullable(),
        averageAccountAge: z.string().optional().nullable(),
        oldestAccount: z.string().optional().nullable(),
        creditUsagePercent: z.string().optional().nullable(),
        creditUsed: z.string().optional().nullable(),
        creditLimit: z.string().optional().nullable(),
        creditUsagePercentNoAU: z.string().optional().nullable(),
        creditUsedNoAU: z.string().optional().nullable(),
        creditLimitNoAU: z.string().optional().nullable(),
        creditCardDebt: z.string().optional().nullable(),
        selfReportedBalance: z.string().optional().nullable(),
        loanDebt: z.string().optional().nullable(),
        collectionsDebt: z.string().optional().nullable(),
        totalDebt: z.string().optional().nullable(),
        reportPersonName: z.string().optional().nullable(),
        reportAlsoKnownAs: z.string().optional().nullable(),
        reportYearOfBirth: z.string().optional().nullable(),
        reportAddresses: z.string().optional().nullable(),
        reportEmployers: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCreditReport(id, data as any);
        return { success: true };
      }),

        deleteCreditReport: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCreditReport(input.id);
        return { success: true };
      }),
    getInquiries: adminProcedure
      .input(z.object({ creditReportId: z.number() }))
      .query(async ({ input }) => getInquiriesByReportId(input.creditReportId)),
    createInquiry: adminProcedure
      .input(z.object({
        creditReportId: z.number(),
        clientProfileId: z.number(),
        accountName: z.string().optional().nullable(),
        inquiredOn: z.string().optional().nullable(),
        businessType: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        contactNumber: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        await createInquiry(input as any);
        return { success: true };
      }),
    updateInquiry: adminProcedure
      .input(z.object({
        id: z.number(),
        accountName: z.string().optional().nullable(),
        inquiredOn: z.string().optional().nullable(),
        businessType: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        contactNumber: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateInquiry(id, data as any);
        return { success: true };
      }),
    deleteInquiry: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteInquiry(input.id);
        return { success: true };
      }),

     getCreditAccounts: adminProcedure
      .input(z.object({ clientId: z.number(), creditReportId: z.number().optional().nullable() }))
      .query(async ({ input }) => getCreditAccountsByClientId(input.clientId, input.creditReportId ?? undefined)),
    addCreditAccount: adminProcedure
      .input(z.object({
        clientProfileId: z.number(),
        creditReportId: z.number().optional().nullable(),
        bureau: z.string().optional().nullable(),
        reportDate: z.string().optional().nullable(),
        accountName: z.string().optional().nullable(),
        openClosed: z.string().optional().nullable(),
        responsibility: z.string().optional().nullable(),
        accountNumber: z.string().optional().nullable(),
        dateOpened: z.string().optional().nullable(),
        statusUpdated: z.string().optional().nullable(),
        accountType: z.string().optional().nullable(),
        status: z.string().optional().nullable(),
        balance: z.string().optional().nullable(),
        creditLimit: z.string().optional().nullable(),
        creditUsage: z.string().optional().nullable(),
        balanceUpdated: z.string().optional().nullable(),
        originalBalance: z.string().optional().nullable(),
        paidOff: z.string().optional().nullable(),
        monthlyPayment: z.string().optional().nullable(),
        lastPaymentDate: z.string().optional().nullable(),
        terms: z.string().optional().nullable(),
        creditAccountCategory: z.enum(["Cards", "Car", "House", "Secured Loan", "Unsecured Loan", "Others"]).optional().nullable(),
        dispute: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        await createCreditAccount(input as any);
        return { success: true };
      }),
    updateCreditAccount: adminProcedure
      .input(z.object({
        id: z.number(),
        creditReportId: z.number().optional().nullable(),
        bureau: z.string().optional().nullable(),
        reportDate: z.string().optional().nullable(),
        accountName: z.string().optional().nullable(),
        openClosed: z.string().optional().nullable(),
        responsibility: z.string().optional().nullable(),
        accountNumber: z.string().optional().nullable(),
        dateOpened: z.string().optional().nullable(),
        statusUpdated: z.string().optional().nullable(),
        accountType: z.string().optional().nullable(),
        status: z.string().optional().nullable(),
        balance: z.string().optional().nullable(),
        creditLimit: z.string().optional().nullable(),
        creditUsage: z.string().optional().nullable(),
        balanceUpdated: z.string().optional().nullable(),
        originalBalance: z.string().optional().nullable(),
        paidOff: z.string().optional().nullable(),
        monthlyPayment: z.string().optional().nullable(),
        lastPaymentDate: z.string().optional().nullable(),
        terms: z.string().optional().nullable(),
        creditAccountCategory: z.enum(["Cards", "Car", "House", "Secured Loan", "Unsecured Loan", "Others"]).optional().nullable(),
        dispute: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCreditAccount(id, data as any);
        return { success: true };
      }),

    deleteCreditAccount: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCreditAccount(input.id);
        return { success: true };
      }),

    // ─── Funding Applications ──────────────────────────────────────────────
    getFundingApplications: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => getFundingApplicationsByClientId(input.clientId)),

    addFundingApplication: adminProcedure
      .input(z.object({
        clientProfileId: z.number(),
        callDate: z.string().optional().nullable(),
        round: z.string().optional().nullable(),
        product: z.string().optional().nullable(),
        type: z.string().optional().nullable(),
        rates: z.string().optional().nullable(),
         appliedLimit: z.string().optional().nullable(),
        status: z.string().optional(),
        sortOrder: z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        const { appliedLimit, ...rest } = input;
        const data = { ...rest, appliedLimit: appliedLimit ? appliedLimit.replace(/[^0-9.]/g, "") || null : null };
        await createFundingApplication(data as any);
        return { success: true };
      }),
    updateFundingApplication: adminProcedure
      .input(z.object({
        id: z.number(),
        callDate: z.string().optional().nullable(),
        round: z.string().optional().nullable(),
        product: z.string().optional().nullable(),
        type: z.string().optional().nullable(),
        rates: z.string().optional().nullable(),
        appliedLimit: z.string().optional().nullable(),
        status: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, appliedLimit, ...rest } = input;
        const data = { ...rest, appliedLimit: appliedLimit ? appliedLimit.replace(/[^0-9.]/g, "") || null : null };
        await updateFundingApplication(id, data as any);
        return { success: true };
      }),

    deleteFundingApplication: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFundingApplication(input.id);
        return { success: true };
      }),

    // ─── Uploaded Files ────────────────────────────────────────────────────
    getUploadedFiles: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => getUploadedFilesByClientId(input.clientId)),

    uploadFile: adminProcedure
      .input(z.object({
        clientProfileId: z.number(),
        originalName: z.string(),
        base64: z.string(),
        mimeType: z.string(),
        category: z.string().optional().nullable(),
        uploadedBy: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.originalName.split(".").pop() || "bin";
        const key = `client-files/${input.clientProfileId}/${nanoid(8)}-${input.originalName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await createUploadedFile({
          clientProfileId: input.clientProfileId,
          originalName: input.originalName,
          fileName: input.originalName,
          fileUrl: url,
          fileKey: key,
          mimeType: input.mimeType,
          fileSize: buffer.length,
          category: input.category || null,
          uploadedBy: input.uploadedBy || ctx.user?.name || "Admin",
          uploadedByRole: "admin",
        });
        return { url };
      }),

    deleteFile: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteUploadedFile(input.id);
        return { success: true };
      }),

    // ─── Call Logs ─────────────────────────────────────────────────────────
    getCallLogs: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => getCallLogsByClientId(input.clientId)),

    addCallLog: adminProcedure
      .input(z.object({
        clientProfileId: z.number(),
        callTitle: z.string().min(1),
        callDate: z.string().optional().nullable(),
        callTime: z.string().optional().nullable(),
        host: z.string().optional().nullable(),
        status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
        recordingLink: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        await createCallLog(input as any);
        return { success: true };
      }),

    updateCallLog: adminProcedure
      .input(z.object({
        id: z.number(),
        callTitle: z.string().optional(),
        callDate: z.string().optional().nullable(),
        callTime: z.string().optional().nullable(),
        host: z.string().optional().nullable(),
        status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
        recordingLink: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCallLog(id, data as any);
        return { success: true };
      }),

    deleteCallLog: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCallLog(input.id);
        return { success: true };
      }),

      getStats: adminProcedure.query(async () => {
      const all = await getAllClientProfiles();
      const total = all.length;
      const pending = all.filter((c) => c.fundingStatus === "pending").length;
      const underReview = all.filter((c) => c.fundingStatus === "under_review").length;
      const approved = all.filter((c) => c.fundingStatus === "approved").length;
      const funded = all.filter((c) => c.fundingStatus === "funded").length;
      const declined = all.filter((c) => c.fundingStatus === "declined").length;
      const onHold = all.filter((c) => c.fundingStatus === "on_hold").length;
      // Total funded clients = clients that have a fundingAmount set (approved/funded)
      const totalFundedClients = all.filter((c) => c.fundingAmount && parseFloat((c.fundingAmount as string) || "0") > 0).length;
      // Total funded amount = sum of all fundingAmount values
      const totalFundedAmount = all.reduce(
        (sum, c) => sum + parseFloat((c.fundingAmount as string) || "0"),
        0
      );
      // Billing totals from invoiceAmountIssued and invoiceAmountPaid
      const totalBillingIssued = all.reduce(
        (sum, c) => sum + parseFloat((c.invoiceAmountIssued as string) || "0"),
        0
      );
      const totalBillingCollected = all.reduce(
        (sum, c) => sum + parseFloat((c.invoiceAmountPaid as string) || "0"),
        0
      );
      return {
        total,
        pending,
        underReview,
        approved,
        funded,
        declined,
        onHold,
        totalFundedClients,
        totalFundedAmount,
        totalBillingIssued,
        totalBillingCollected,
      };
    }),

    // ─── Billing procedures ───────────────────────────────────────────────
    getBillingRecords: adminProcedure
      .input(z.object({ clientProfileId: z.number() }))
      .query(async ({ input }) => {
        return getBillingRecordsByClientId(input.clientProfileId);
      }),
    createBillingRecord: adminProcedure
      .input(z.object({
        clientProfileId: z.number(),
        billingStatus: z.string().optional(),
        dateIssued: z.string().optional().nullable(),
        amountIssued: z.string().optional().nullable(),
        amountPaid: z.string().optional().nullable(),
        datePaid: z.string().optional().nullable(),
        billingLink: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { amountIssued, amountPaid, ...rest } = input;
        const data = {
          ...rest,
          billingStatus: (rest.billingStatus || "pending") as "pending" | "partial" | "paid" | "overdue" | "cancelled",
          amountIssued: amountIssued ? amountIssued.replace(/[^0-9.]/g, "") || null : null,
          amountPaid: amountPaid ? amountPaid.replace(/[^0-9.]/g, "") || null : null,
        };
        await createBillingRecord(data as any);
        return { success: true };
      }),
    updateBillingRecord: adminProcedure
      .input(z.object({
        id: z.number(),
        billingStatus: z.string().optional(),
        dateIssued: z.string().optional().nullable(),
        amountIssued: z.string().optional().nullable(),
        amountPaid: z.string().optional().nullable(),
        datePaid: z.string().optional().nullable(),
        billingLink: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, amountIssued, amountPaid, ...rest } = input;
        const data = {
          ...rest,
          amountIssued: amountIssued ? amountIssued.replace(/[^0-9.]/g, "") || null : null,
          amountPaid: amountPaid ? amountPaid.replace(/[^0-9.]/g, "") || null : null,
        };
        await updateBillingRecord(id, data as any);
        return { success: true };
      }),
    deleteBillingRecord: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteBillingRecord(input.id);
        return { success: true };
      }),

    // ─── Client Task procedures ───────────────────────────────────────────
    getClientTasks: adminProcedure
      .input(z.object({ clientProfileId: z.number() }))
      .query(async ({ input }) => {
        return getClientTasksByClientId(input.clientProfileId);
      }),
    createClientTask: adminProcedure
      .input(z.object({
        clientProfileId: z.number(),
        taskTitle: z.string().min(1),
        urgency: z.enum(["High", "Fair", "Low"]).optional(),
        taskDetails: z.string().optional().nullable(),
        dateAssigned: z.string().optional().nullable(),
        dueDate: z.string().optional().nullable(),
        status: z.enum(["Ongoing", "Complete", "Failed"]).optional(),
        resultNotes: z.string().optional().nullable(),
        completionRate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createClientTask(input as any);
        return { success: true };
      }),
    updateClientTask: adminProcedure
      .input(z.object({
        id: z.number(),
        taskTitle: z.string().min(1).optional(),
        urgency: z.enum(["High", "Fair", "Low"]).optional(),
        taskDetails: z.string().optional().nullable(),
        dateAssigned: z.string().optional().nullable(),
        dueDate: z.string().optional().nullable(),
        status: z.enum(["Ongoing", "Complete", "Failed"]).optional(),
        resultNotes: z.string().optional().nullable(),
        completionRate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateClientTask(id, data as any);
        return { success: true };
      }),
    deleteClientTask: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteClientTask(input.id);
        return { success: true };
      }),

    // ─── Team Task procedures ─────────────────────────────────────────────
    getTeamTasks: adminProcedure
      .input(z.object({ clientProfileId: z.number() }))
      .query(async ({ input }) => {
        return getTeamTasksByClientId(input.clientProfileId);
      }),
    createTeamTask: adminProcedure
      .input(z.object({
        clientProfileId: z.number(),
        taskTitle: z.string().min(1),
        taskDetails: z.string().optional().nullable(),
        urgency: z.enum(["High", "Fair", "Low"]).optional(),
        assignedBy: z.string().optional().nullable(),
        assignedTo: z.string().optional().nullable(),
        dateAssigned: z.string().optional().nullable(),
        dueDate: z.string().optional().nullable(),
        status: z.enum(["Ongoing", "Complete", "Failed"]).optional(),
        resultNotes: z.string().optional().nullable(),
        completionRate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createTeamTask(input as any);
        return { success: true };
      }),
    updateTeamTask: adminProcedure
      .input(z.object({
        id: z.number(),
        taskTitle: z.string().min(1).optional(),
        taskDetails: z.string().optional().nullable(),
        urgency: z.enum(["High", "Fair", "Low"]).optional(),
        assignedBy: z.string().optional().nullable(),
        assignedTo: z.string().optional().nullable(),
        dateAssigned: z.string().optional().nullable(),
        dueDate: z.string().optional().nullable(),
        status: z.enum(["Ongoing", "Complete", "Failed"]).optional(),
        resultNotes: z.string().optional().nullable(),
        completionRate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateTeamTask(id, data as any);
        return { success: true };
      }),
    deleteTeamTask: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTeamTask(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// ─── Team Router (appended after main router) ─────────────────────────────
// Note: team procedures are declared inline in the main appRouter above.

// ─── CSV Parser ───────────────────────────────────────────────────────────

function parseCSV(csv: string): string[][] {
  const lines = csv.split(/\r?\n/);
  return lines
    .map((line) => {
      const cells: string[] = [];
      let inQuote = false;
      let cell = "";
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuote = !inQuote;
        } else if (ch === "," && !inQuote) {
          cells.push(cell.trim());
          cell = "";
        } else {
          cell += ch;
        }
      }
      cells.push(cell.trim());
      return cells;
    })
    .filter((row) => row.some((c) => c.trim()));
}

// ─── Column Mapping ───────────────────────────────────────────────────────

const FIELD_ALIASES: Record<string, string[]> = {
  firstName: ["first name", "firstname", "first_name", "fname", "given name"],
  lastName: ["last name", "lastname", "last_name", "lname", "surname", "family name"],
  email: ["email", "email address", "e-mail"],
  phone: ["phone", "phone number", "telephone", "mobile", "cell"],
  address: ["address", "street address", "street"],
  city: ["city"],
  state: ["state", "province"],
  zipCode: ["zip", "zip code", "postal code", "zipcode"],
  businessName: ["business name", "company", "company name", "business", "dba"],
  businessType: ["business type", "entity type", "type of business"],
  businessStartDate: ["business start date", "start date", "date started"],
  timeInBusiness: ["time in business", "years in business", "business age"],
  totalBusinessIncome: ["total business income", "business income", "annual revenue", "gross revenue"],
  personalIncome: ["personal income", "annual income", "income"],
  fundingNeeded: ["funding needed", "amount needed", "loan amount", "requested amount"],
  ficoScore: ["fico", "fico score", "credit score", "credit"],
  monthlyRevenue: ["monthly revenue", "monthly income", "monthly sales"],
  existingDebt: ["existing debt", "current debt", "total debt"],
  fundingPurpose: ["funding purpose", "purpose", "use of funds", "loan purpose"],
  fundingStatus: ["status", "funding status", "application status"],
  notes: ["notes", "comments", "remarks"],
};

function buildDefaultMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      const idx = headers.findIndex((h) => h === alias);
      if (idx !== -1) {
        mapping[field] = headers[idx];
        break;
      }
    }
  }
  return mapping;
}

function mapRowToProfile(
  headers: string[],
  row: string[],
  mapping: Record<string, string | undefined>
): Record<string, unknown> {
  const getVal = (fieldName: string): string | null => {
    const colName = mapping[fieldName] as string | undefined;
    if (!colName) return null;
    const idx = headers.findIndex((h) => h.toLowerCase() === colName.toLowerCase());
    if (idx === -1) return null;
    return row[idx]?.trim() || null;
  };

  const profile: Record<string, unknown> = {
    firstName: getVal("firstName") || "Unknown",
    lastName: getVal("lastName") || "",
    email: getVal("email"),
    phone: getVal("phone"),
    address: getVal("address"),
    city: getVal("city"),
    state: getVal("state"),
    zipCode: getVal("zipCode"),
    businessName: getVal("businessName"),
    businessType: getVal("businessType"),
    businessStartDate: getVal("businessStartDate"),
    timeInBusiness: getVal("timeInBusiness"),
    totalBusinessIncome: getVal("totalBusinessIncome"),
    personalIncome: getVal("personalIncome"),
    fundingNeeded: getVal("fundingNeeded"),
    monthlyRevenue: getVal("monthlyRevenue"),
    existingDebt: getVal("existingDebt"),
    fundingPurpose: getVal("fundingPurpose"),
    notes: getVal("notes"),
    fundingStatus: "pending",
  };

  const ficoRaw = getVal("ficoScore");
  if (ficoRaw) {
    const num = parseInt(ficoRaw.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num >= 300 && num <= 850) profile.ficoScore = num;
  }

  const statusRaw = getVal("fundingStatus")?.toLowerCase();
  const validStatuses = ["pending", "under_review", "approved", "funded", "declined", "on_hold"];
  if (statusRaw && validStatuses.includes(statusRaw)) {
    profile.fundingStatus = statusRaw;
  }

  return profile;
}
