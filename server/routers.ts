import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createCategory, createExpense, deleteCategory, deleteExpense, getCategories, getExpenseStats, listExpenses } from "./db";
import { storagePut } from "./storage";

const monthInput = z.object({ year: z.number().int().min(2000).max(2200), month: z.number().int().min(1).max(12) });
const receiptMime = z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const ownerKeyCache = new WeakMap<object, string>();

function getOwnerKey(ctx: { req: { headers: { cookie?: string } }; res: { cookie: (name: string, value: string, options?: Record<string, unknown>) => void } }) {
  const cached = ownerKeyCache.get(ctx);
  if (cached) return cached;
  const existing = ctx.req.headers.cookie?.split(";").map(item => item.trim()).find(item => item.startsWith("baan-rao-workspace="))?.slice("baan-rao-workspace=".length);
  if (existing && /^[a-f0-9-]{20,64}$/.test(existing)) {
    ownerKeyCache.set(ctx, existing);
    return existing;
  }
  const created = randomUUID();
  ctx.res.cookie("baan-rao-workspace", created, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 60 * 60 * 24 * 365 * 5, path: "/" });
  ownerKeyCache.set(ctx, created);
  return created;
}

function monthRange(year: number, month: number) {
  const thaiOffsetMs = 7 * 60 * 60 * 1000;
  return {
    from: new Date(Date.UTC(year, month - 1, 1) - thaiOffsetMs),
    to: new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1) - thaiOffsetMs),
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  categories: router({
    list: publicProcedure.query(({ ctx }) => getCategories(1, getOwnerKey(ctx))),
    create: publicProcedure
      .input(z.object({ name: z.string().trim().min(1).max(120), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#3B7D78") }))
      .mutation(({ ctx, input }) => createCategory({ userId: 1, ownerKey: getOwnerKey(ctx), name: input.name, color: input.color, icon: "circle" })),
    delete: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteCategory(1, input.id, getOwnerKey(ctx))),
  }),
  expenses: router({
    list: publicProcedure.input(monthInput).query(({ ctx, input }) => {
      const { from, to } = monthRange(input.year, input.month);
      return listExpenses(1, from, to, getOwnerKey(ctx));
    }),
    stats: publicProcedure.input(monthInput).query(({ ctx, input }) => {
      const { from, to } = monthRange(input.year, input.month);
      return getExpenseStats(1, from, to, getOwnerKey(ctx));
    }),
    create: publicProcedure
      .input(z.object({
        title: z.string().trim().min(1).max(160),
        recipientName: z.string().trim().max(180).nullable().optional(),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        categoryId: z.number().int().positive().nullable().optional(),
        spentAt: z.date(),
        note: z.string().max(2000).nullable().optional(),
        receiptKey: z.string().max(500).nullable().optional(),
        receiptUrl: z.string().max(700).nullable().optional(),
      }))
      .mutation(({ ctx, input }) => createExpense({ ...input, userId: 1, ownerKey: getOwnerKey(ctx), recipientName: input.recipientName ?? null, categoryId: input.categoryId ?? null, note: input.note ?? null, receiptKey: input.receiptKey ?? null, receiptUrl: input.receiptUrl ?? null })),
    delete: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteExpense(1, input.id, getOwnerKey(ctx))),
  }),
  receipts: router({
    upload: publicProcedure
      .input(z.object({ fileName: z.string().min(1).max(200), mimeType: receiptMime, base64: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        if (buffer.byteLength > 6 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "ไฟล์สลิปต้องมีขนาดไม่เกิน 6 MB" });
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
        return storagePut(`anonymous/receipts/${Date.now()}-${safeName}`, buffer, input.mimeType);
      }),
    ocr: publicProcedure
      .input(z.object({ mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]), base64: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const attachment = input.mimeType === "application/pdf"
          ? { type: "file_url" as const, file_url: { url: `data:${input.mimeType};base64,${input.base64}`, mime_type: input.mimeType } }
          : { type: "image_url" as const, image_url: { url: `data:${input.mimeType};base64,${input.base64}`, detail: "high" as const } };
        const response = await invokeLLM({
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "อ่านสลิปการโอนเงินภาษาไทยจากภาพนี้ แล้วดึงข้อมูลตาม JSON schema เท่านั้น หากอ่านไม่ได้ให้คืนค่า null ห้ามเดาหรือเติมข้อมูลเอง วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD และ amount เป็นตัวเลขทศนิยม เช่น 1250.00 ชื่อผู้รับคือชื่อบัญชีหรือชื่อผู้รับเงินปลายทางที่ปรากฏในสลิป" },
              attachment,
            ],
          }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "thai_transfer_slip",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  amount: { type: ["string", "null"] },
                  transactionDate: { type: ["string", "null"] },
                  recipientName: { type: ["string", "null"] },
                  confidence: { type: "number" },
                },
                required: ["amount", "transactionDate", "recipientName", "confidence"],
                additionalProperties: false,
              },
            },
          },
          maxTokens: 300,
        });
        const raw = response.choices[0]?.message?.content;
        const text = Array.isArray(raw) ? raw.filter(part => part.type === "text").map(part => part.text).join("\n") : raw;
        if (!text) throw new TRPCError({ code: "BAD_GATEWAY", message: "AI ไม่สามารถอ่านข้อมูลจากสลิปได้" });
        try {
          return JSON.parse(text) as { amount: string | null; transactionDate: string | null; recipientName: string | null; confidence: number };
        } catch {
          throw new TRPCError({ code: "BAD_GATEWAY", message: "รูปแบบข้อมูลจาก AI ไม่ถูกต้อง กรุณาลองใหม่" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
