import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined, cookie: () => undefined } as TrpcContext["res"],
  };
}

describe("expense router validation", () => {
  it("rejects expense list requests with an invalid month", async () => {
    const caller = appRouter.createCaller(createContext({
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));

    await expect(caller.expenses.list({ year: 2026, month: 13 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("allows category reads without authentication", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.categories.list()).resolves.toBeDefined();
  });

  it("rejects unsupported receipt types before upload", async () => {
    const caller = appRouter.createCaller(createContext({
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));

    await expect(caller.receipts.ocr({ mimeType: "application/octet-stream" as never, base64: "abc" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
