import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

export const expenseCategories = mysqlTable("expenseCategories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ownerKey: varchar("ownerKey", { length: 64 }).notNull().default("legacy"),
  name: varchar("name", { length: 120 }).notNull(),
  icon: varchar("icon", { length: 32 }).notNull().default("circle"),
  color: varchar("color", { length: 24 }).notNull().default("#3B7D78"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ownerKey: varchar("ownerKey", { length: 64 }).notNull().default("legacy"),
  categoryId: int("categoryId"),
  title: varchar("title", { length: 160 }).notNull(),
  recipientName: varchar("recipientName", { length: 180 }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  spentAt: timestamp("spentAt").notNull(),
  dueDate: varchar("dueDate", { length: 10 }),
  recurrence: mysqlEnum("recurrence", ["none", "monthly"]).default("none").notNull(),
  referenceNumber: varchar("referenceNumber", { length: 500 }),
  note: text("note"),
  receiptKey: text("receiptKey"),
  receiptUrl: text("receiptUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const expenseHistory = mysqlTable("expenseHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ownerKey: varchar("ownerKey", { length: 64 }).notNull().default("legacy"),
  expenseId: int("expenseId").notNull(),
  action: mysqlEnum("action", ["updated", "deleted"]).notNull(),
  snapshot: text("snapshot").notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export const appDownloadEvents = mysqlTable("appDownloadEvents", {
  id: int("id").autoincrement().primaryKey(),
  appVersion: varchar("appVersion", { length: 32 }).notNull(),
  platform: varchar("platform", { length: 32 }).notNull().default("web"),
  downloadedAt: timestamp("downloadedAt").defaultNow().notNull(),
});

export const appVersionSessions = mysqlTable("appVersionSessions", {
  id: int("id").autoincrement().primaryKey(),
  clientId: varchar("clientId", { length: 64 }).notNull().unique(),
  appVersion: varchar("appVersion", { length: 32 }).notNull(),
  platform: varchar("platform", { length: 32 }).notNull().default("web"),
  lastSeen: timestamp("lastSeen").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;
export type ExpenseHistory = typeof expenseHistory.$inferSelect;
export type InsertExpenseHistory = typeof expenseHistory.$inferInsert;
export type AppDownloadEvent = typeof appDownloadEvents.$inferSelect;
export type InsertAppDownloadEvent = typeof appDownloadEvents.$inferInsert;
export type AppVersionSession = typeof appVersionSessions.$inferSelect;
export type InsertAppVersionSession = typeof appVersionSessions.$inferInsert;
