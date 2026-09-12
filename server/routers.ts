import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createCategory, createExpense, deleteCategory, deleteExpense, getCategories, getExpenseStats, listExpenses } from "./db";
import { storagePut } from "./storage";

const monthInput = z.object({ year: z.number().int().min(2000).max(2200), month: z.number().int().min(1).max(12) });

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
    list: protectedProcedure.query(({ ctx }) => getCategories(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({ name: z.string().trim().min(1).max(120), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#3B7D78") }))
      .mutation(({ ctx, input }) => createCategory({ userId: ctx.user.id, name: input.name, color: input.color, icon: "circle" })),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteCategory(ctx.user.id, input.id)),
  }),
  expenses: router({
    list: protectedProcedure.input(monthInput).query(({ ctx, input }) => {
      const { from, to } = monthRange(input.year, input.month);
      return listExpenses(ctx.user.id, from, to);
    }),
    stats: protectedProcedure.input(monthInput).query(({ ctx, input }) => {
      const { from, to } = monthRange(input.year, input.month);
      return getExpenseStats(ctx.user.id, from, to);
    }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().trim().min(1).max(160),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        categoryId: z.number().int().positive().nullable().optional(),
        spentAt: z.date(),
        note: z.string().max(2000).nullable().optional(),
        receiptKey: z.string().max(500).nullable().optional(),
        receiptUrl: z.string().max(700).nullable().optional(),
      }))
      .mutation(({ ctx, input }) => createExpense({ ...input, userId: ctx.user.id, categoryId: input.categoryId ?? null, note: input.note ?? null, receiptKey: input.receiptKey ?? null, receiptUrl: input.receiptUrl ?? null })),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteExpense(ctx.user.id, input.id)),
  }),
  receipts: router({
    upload: protectedProcedure
      .input(z.object({ fileName: z.string().min(1).max(200), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]), base64: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        if (buffer.byteLength > 6 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "ไฟล์สลิปต้องมีขนาดไม่เกิน 6 MB" });
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
        return storagePut(`${ctx.user.id}/receipts/${Date.now()}-${safeName}`, buffer, input.mimeType);
      }),
  }),
});

export type AppRouter = typeof appRouter;
