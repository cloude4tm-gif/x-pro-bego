import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const xproAdminsTable = pgTable("xpro_admins", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  hashedPassword: text("hashed_password").notNull(),
  isSudo: boolean("is_sudo").notNull().default(false),
  passwordResetAt: timestamp("password_reset_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type XproAdmin = typeof xproAdminsTable.$inferSelect;
export type InsertXproAdmin = typeof xproAdminsTable.$inferInsert;
