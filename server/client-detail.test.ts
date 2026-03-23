import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "admin@test.com",
      name: "Admin User",
      loginMethod: "google",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function makeUserCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user-open-id",
      email: "user@test.com",
      name: "Regular User",
      loginMethod: "google",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("admin procedures - access control", () => {
  it("non-admin cannot list clients", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.admin.listClients({})).rejects.toThrow();
  });

  it("admin can list clients", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.listClients({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can get stats", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.getStats();
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("pending");
    expect(result).toHaveProperty("funded");
  });
});

describe("admin procedures - underwriting", () => {
  it("non-admin cannot access underwriting", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.admin.getUnderwriting({ clientId: 1 })).rejects.toThrow();
  });

  it("admin can get underwriting for a client", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.getUnderwriting({ clientId: 999999 });
    // Returns null or undefined for non-existent client, not an error
    expect(result === null || result === undefined || typeof result === "object").toBe(true);
  });
});

describe("admin procedures - onboarding", () => {
  it("admin can get onboarding items for a client", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.getOnboarding({ clientId: 999999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin procedures - funding applications", () => {
  it("admin can get funding applications for a client", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.getFundingApplications({ clientId: 999999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin procedures - credit reports", () => {
  it("admin can get credit reports for a client", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.getCreditReports({ clientId: 999999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin procedures - uploaded files", () => {
  it("admin can get uploaded files for a client", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.getUploadedFiles({ clientId: 999999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin procedures - call logs", () => {
  it("admin can get call logs for a client", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.getCallLogs({ clientId: 999999 });
    expect(Array.isArray(result)).toBe(true);
  });
});
