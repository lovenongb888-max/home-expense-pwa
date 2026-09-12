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
  referenceNumber: varchar("referenceNumber", { length: 500 }),
  note: text("note"),
  receiptKey: text("receiptKey"),
  receiptUrl: text("receiptUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;
