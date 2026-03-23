import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────

vi.mock("./db", () => ({
  getAllClientProfiles: vi.fn().mockResolvedValue([
    {
      id: 1,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      fundingStatus: "pending",
      fundingNeeded: "50000.00",
      ficoScore: 720,
      totalBusinessIncome: "120000.00",
      personalIncome: "80000.00",
      businessName: "Doe Enterprises",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getClientProfileById: vi.fn().mockResolvedValue({
    id: 1,
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    fundingStatus: "pending",
    fundingNeeded: "50000.00",
    ficoScore: 720,
    totalBusinessIncome: "120000.00",
    personalIncome: "80000.00",
    businessName: "Doe Enterprises",
    internalNotes: "Admin only note",
    notes: "Client visible note",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  searchClientProfiles: vi.fn().mockResolvedValue([]),
  createClientProfile: vi.fn().mockResolvedValue({}),
  updateClientProfile: vi.fn().mockResolvedValue({}),
  deleteClientProfile: vi.fn().mockResolvedValue({}),
  getClientCredentialByUsername: vi.fn().mockResolvedValue(null),
  getClientCredentialByProfileId: vi.fn().mockResolvedValue(null),
  upsertClientCredential: vi.fn().mockResolvedValue({}),
  updateClientLastLogin: vi.fn().mockResolvedValue({}),
  createClientSession: vi.fn().mockResolvedValue({}),
  getClientSessionByToken: vi.fn().mockResolvedValue(null),
  deleteClientSession: vi.fn().mockResolvedValue({}),
  cleanExpiredSessions: vi.fn().mockResolvedValue({}),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue({}),
}));

// ─── Context factories ────────────────────────────────────────────────────

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      name: "Admin User",
      email: "admin@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function makeClientCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "client-open-id",
      name: "Regular User",
      email: "user@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("admin.listClients", () => {
  it("returns all clients for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.listClients({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("throws FORBIDDEN for non-admin user", async () => {
    const caller = appRouter.createCaller(makeClientCtx());
    await expect(caller.admin.listClients({})).rejects.toThrow("Admin access required");
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.admin.listClients({})).rejects.toThrow();
  });
});

describe("admin.getStats", () => {
  it("returns stats object for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const stats = await caller.admin.getStats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("funded");
    expect(stats).toHaveProperty("pending");
    expect(stats).toHaveProperty("avgFico");
  });

  it("throws FORBIDDEN for regular user", async () => {
    const caller = appRouter.createCaller(makeClientCtx());
    await expect(caller.admin.getStats()).rejects.toThrow("Admin access required");
  });
});

describe("admin.createClient", () => {
  it("creates a client successfully as admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.createClient({
      firstName: "John",
      lastName: "Smith",
      email: "john@example.com",
      fundingStatus: "pending",
    });
    expect(result.success).toBe(true);
  });

  it("throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(makeClientCtx());
    await expect(
      caller.admin.createClient({ firstName: "John", lastName: "Smith" })
    ).rejects.toThrow("Admin access required");
  });
});

describe("clientAuth.login", () => {
  it("throws UNAUTHORIZED when credentials not found", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.clientAuth.login({ username: "unknown", password: "wrongpass" })
    ).rejects.toThrow("Invalid username or password");
  });
});

describe("clientAuth.getProfile", () => {
  it("throws UNAUTHORIZED when session token is invalid", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.clientAuth.getProfile({ token: "invalid-token-xyz" })
    ).rejects.toThrow("Session expired");
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
