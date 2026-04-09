import { pgTable, serial, text, bigint, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const vpnUsersTable = pgTable("vpn_users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  uuid: text("uuid").notNull(),
  status: text("status").notNull().default("active"),
  dataLimit: bigint("data_limit", { mode: "number" }),
  dataLimitResetStrategy: text("data_limit_reset_strategy").default("no_reset"),
  usedTraffic: bigint("used_traffic", { mode: "number" }).default(0).notNull(),
  lifetimeUsedTraffic: bigint("lifetime_used_traffic", { mode: "number" }).default(0).notNull(),
  expireDate: timestamp("expire_date"),
  inbounds: jsonb("inbounds").default({}),
  note: text("note").default(""),
  subToken: text("sub_token").unique(),
  onlineAt: timestamp("online_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type VpnUser = typeof vpnUsersTable.$inferSelect;
export type InsertVpnUser = typeof vpnUsersTable.$inferInsert;
