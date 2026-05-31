import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof userTable.$inferSelect;
