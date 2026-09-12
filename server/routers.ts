import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createCategory, createExpense, deleteCategory, deleteExpense, getCategories, getExpenseStats, listExpenses, updateExpense } from "./db";
import { storagePut } from "./storage";

const monthInput = z.object({ year: z.number().int().min(2000).max(2200), month: z.number().int().min(1).max(12) });
const receiptMime = z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const ocrImage = z.object({
  mimeType: z.enum(["image/jpeg", "image/png"]),
  base64: z.string().min(1),
  label: z.string().max(40).optional(),
});
const ocrInput = z.object({
  mimeType: receiptMime.optional(),
  base64: z.string().min(1).optional(),
  attachments: z.array(ocrImage).max(4).optional(),
}).refine(input => (input.attachments?.length ?? 0) > 0 || Boolean(input.mimeType && input.base64), {
  message: "ต้องมีไฟล์สำหรับ OCR",
});
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
        referenceNumber: z.string().trim().max(500).nullable().optional(),
        note: z.string().max(2000).nullable().optional(),
        receiptKey: z.string().max(500).nullable().optional(),
        receiptUrl: z.string().max(700).nullable().optional(),
      }))
      .mutation(({ ctx, input }) => createExpense({ ...input, userId: 1, ownerKey: getOwnerKey(ctx), recipientName: input.recipientName ?? null, categoryId: input.categoryId ?? null, referenceNumber: input.referenceNumber ?? null, note: input.note ?? null, receiptKey: input.receiptKey ?? null, receiptUrl: input.receiptUrl ?? null })),
    update: publicProcedure
      .input(z.object({
        id: z.number().int().positive(),
        title: z.string().trim().min(1).max(160),
        recipientName: z.string().trim().max(180).nullable().optional(),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        categoryId: z.number().int().positive().nullable().optional(),
        spentAt: z.date(),
        referenceNumber: z.string().trim().max(500).nullable().optional(),
        note: z.string().max(2000).nullable().optional(),
        receiptKey: z.string().max(500).nullable().optional(),
        receiptUrl: z.string().max(700).nullable().optional(),
      }))
      .mutation(({ ctx, input }) => updateExpense(1, input.id, getOwnerKey(ctx), {
        title: input.title,
        recipientName: input.recipientName ?? null,
        amount: input.amount,
        categoryId: input.categoryId ?? null,
        spentAt: input.spentAt,
        referenceNumber: input.referenceNumber ?? null,
        note: input.note ?? null,
        receiptKey: input.receiptKey ?? null,
        receiptUrl: input.receiptUrl ?? null,
      })),
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
      .input(ocrInput)
      .mutation(async ({ input }) => {
        const attachments = input.attachments?.length
          ? input.attachments.map(page => ({
              type: "image_url" as const,
              image_url: { url: `data:${page.mimeType};base64,${page.base64}`, detail: "high" as const },
            }))
          : input.mimeType === "application/pdf"
            ? [{ type: "file_url" as const, file_url: { url: `data:${input.mimeType};base64,${input.base64}`, mime_type: input.mimeType } }]
            : [{ type: "image_url" as const, image_url: { url: `data:${input.mimeType};base64,${input.base64}`, detail: "high" as const } }];
        const response = await invokeLLM({
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "คุณเป็นระบบ OCR ใบเสร็จและใบแจ้งหนี้ภาษาไทย อ่านภาพทุกหน้าที่แนบมาอย่างละเอียด โดยเฉพาะบิลค่าอินเทอร์เน็ตบ้าน เช่น AIS Fibre ซึ่งอาจเป็นใบแจ้งหนี้หลายส่วน ให้ดึงข้อมูลตาม JSON schema เท่านั้น ห้ามเดาหรือเติมข้อมูลเอง\n\nกติกาการอ่านจำนวนเงิน: เลือกยอดที่ต้องชำระจริงหรือยอดรวมทั้งสิ้น (Total, ยอดเรียกเก็บ, จำนวนเงินที่ต้องชำระ, ยอดสุทธิ) ไม่ใช่เลขที่ใบแจ้งหนี้ เลขลูกค้า ค่าบริการรายเดือนก่อนภาษี หรือยอดค้างเก่า หากมีหลายยอดให้เลือกยอดสุดท้ายที่ผู้ใช้ต้องจ่ายในเอกสาร\nกติกาวันที่: ใช้วันที่ออกบิลหรือวันที่เรียกเก็บเงิน หากไม่มีให้ใช้วันครบกำหนดชำระ และแปลงปี พ.ศ. เป็น ค.ศ. ในรูปแบบ YYYY-MM-DD\nชื่อผู้รับเงิน: ใช้ชื่อบริษัท/ร้านค้า/ผู้ให้บริการที่ออกบิล เช่น AIS หรือชื่อบัญชีปลายทาง ไม่ใช้ชื่อผู้ใช้บริการ\nหากอ่านค่าใดไม่ได้ให้คืนค่า null และตั้ง confidence ตามความชัดเจนของข้อมูล" },
              ...attachments,
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
          maxTokens: 500,
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
