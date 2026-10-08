import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { appDownloadEvents, appVersionSessions, expenseCategories, expenseHistory, expenses, InsertExpense, InsertExpenseCategory, InsertUser, users } from "../drizzle/schema";
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      const value = user[field] ?? null;
      values[field] = value;
      updateSet[field] = value;
    }
  }
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
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const defaultCategories = [
  { name: "อาหาร", icon: "utensils", color: "#E47B56" },
  { name: "เดินทาง", icon: "car", color: "#5A8F8A" },
  { name: "บ้านและบิล", icon: "house", color: "#D3A84C" },
  { name: "ช้อปปิ้ง", icon: "shopping-bag", color: "#8D75A8" },
  { name: "สุขภาพ", icon: "heart-pulse", color: "#D86D79" },
];

export async function ensureDefaultCategories(userId: number, ownerKey = "legacy") {
  const db = await getDb();
  if (!db) return [];
  const existing = await db.select().from(expenseCategories).where(and(eq(expenseCategories.userId, userId), eq(expenseCategories.ownerKey, ownerKey)));
  if (existing.length > 0) return existing;
  await db.insert(expenseCategories).values(defaultCategories.map(item => ({ ...item, userId, ownerKey })));
  return db.select().from(expenseCategories).where(and(eq(expenseCategories.userId, userId), eq(expenseCategories.ownerKey, ownerKey))).orderBy(asc(expenseCategories.id));
}

export async function getCategories(userId: number, ownerKey = "legacy") {
  return ensureDefaultCategories(userId, ownerKey);
}

export async function createCategory(data: InsertExpenseCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(expenseCategories).values(data);
  const id = Number(result[0].insertId);
  const created = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id)).limit(1);
  return created[0];
}

export async function deleteCategory(userId: number, categoryId: number, ownerKey = "legacy") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(expenses).set({ categoryId: null }).where(and(eq(expenses.userId, userId), eq(expenses.ownerKey, ownerKey), eq(expenses.categoryId, categoryId)));
  await db.delete(expenseCategories).where(and(eq(expenseCategories.userId, userId), eq(expenseCategories.ownerKey, ownerKey), eq(expenseCategories.id, categoryId)));
}

export async function listExpenses(userId: number, from: Date, to: Date, ownerKey = "legacy") {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: expenses.id,
      userId: expenses.userId,
      categoryId: expenses.categoryId,
      title: expenses.title,
      recipientName: expenses.recipientName,
      amount: expenses.amount,
      spentAt: expenses.spentAt,
      dueDate: expenses.dueDate,
      recurrence: expenses.recurrence,
      referenceNumber: expenses.referenceNumber,
      note: expenses.note,
      receiptKey: expenses.receiptKey,
      receiptUrl: expenses.receiptUrl,
      createdAt: expenses.createdAt,
      categoryName: expenseCategories.name,
      categoryIcon: expenseCategories.icon,
      categoryColor: expenseCategories.color,
    })
    .from(expenses)
    .leftJoin(expenseCategories, and(eq(expenses.categoryId, expenseCategories.id), eq(expenses.ownerKey, expenseCategories.ownerKey)))
    .where(and(eq(expenses.userId, userId), eq(expenses.ownerKey, ownerKey), gte(expenses.spentAt, from), lt(expenses.spentAt, to)))
    .orderBy(desc(expenses.spentAt), desc(expenses.id));
}

export async function createExpense(data: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(expenses).values(data);
  const id = Number(result[0].insertId);
  const created = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  return created[0];
}

export async function updateExpense(userId: number, expenseId: number, ownerKey: string, data: Partial<InsertExpense>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const previous = await db.select().from(expenses).where(and(eq(expenses.userId, userId), eq(expenses.ownerKey, ownerKey), eq(expenses.id, expenseId))).limit(1);
  if (!previous[0]) return undefined;
  await db.insert(expenseHistory).values({ userId, ownerKey, expenseId, action: "updated", snapshot: JSON.stringify(previous[0]) });
  await db.update(expenses).set(data).where(and(eq(expenses.userId, userId), eq(expenses.ownerKey, ownerKey), eq(expenses.id, expenseId)));
  const updated = await db.select().from(expenses).where(and(eq(expenses.userId, userId), eq(expenses.ownerKey, ownerKey), eq(expenses.id, expenseId))).limit(1);
  return updated[0];
}

export async function deleteExpense(userId: number, expenseId: number, ownerKey = "legacy") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const previous = await db.select().from(expenses).where(and(eq(expenses.userId, userId), eq(expenses.ownerKey, ownerKey), eq(expenses.id, expenseId))).limit(1);
  if (!previous[0]) return;
  await db.insert(expenseHistory).values({ userId, ownerKey, expenseId, action: "deleted", snapshot: JSON.stringify(previous[0]) });
  await db.delete(expenses).where(and(eq(expenses.userId, userId), eq(expenses.ownerKey, ownerKey), eq(expenses.id, expenseId)));
}

export async function listExpenseHistory(userId: number, expenseId: number, ownerKey = "legacy") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(expenseHistory)
    .where(and(eq(expenseHistory.userId, userId), eq(expenseHistory.ownerKey, ownerKey), eq(expenseHistory.expenseId, expenseId)))
    .orderBy(desc(expenseHistory.changedAt), desc(expenseHistory.id));
}

export async function getExpenseStats(userId: number, from: Date, to: Date, ownerKey = "legacy") {
  const db = await getDb();
  if (!db) return { total: "0", count: 0 };
  const result = await db
    .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`, count: sql<number>`COUNT(*)` })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), eq(expenses.ownerKey, ownerKey), gte(expenses.spentAt, from), lt(expenses.spentAt, to)));
  return { total: String(result[0]?.total ?? "0"), count: Number(result[0]?.count ?? 0) };
}

export async function recordAppDownload(appVersion: string, platform: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(appDownloadEvents).values({ appVersion, platform });
}

export async function getAppDownloadStats() {
  const db = await getDb();
  if (!db) return { totalDownloads: 0, byVersion: [] as Array<{ version: string; downloads: number }> };
  const total = await db.select({ count: sql<number>`COUNT(*)` }).from(appDownloadEvents);
  const byVersion = await db.select({ version: appDownloadEvents.appVersion, downloads: sql<number>`COUNT(*)` }).from(appDownloadEvents).groupBy(appDownloadEvents.appVersion).orderBy(desc(sql`COUNT(*)`));
  const activeSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeByVersion = await db.select({ version: appVersionSessions.appVersion, users: sql<number>`COUNT(*)` }).from(appVersionSessions).where(gte(appVersionSessions.lastSeen, activeSince)).groupBy(appVersionSessions.appVersion).orderBy(desc(sql`COUNT(*)`));
  return { totalDownloads: Number(total[0]?.count ?? 0), byVersion: byVersion.map(row => ({ version: row.version, downloads: Number(row.downloads) })), activeByVersion: activeByVersion.map(row => ({ version: row.version, users: Number(row.users) })) };
}

export async function recordVersionUsage(clientId: string, appVersion: string, platform: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(appVersionSessions).values({ clientId, appVersion, platform }).onDuplicateKeyUpdate({ set: { appVersion, platform, lastSeen: new Date() } });
}
