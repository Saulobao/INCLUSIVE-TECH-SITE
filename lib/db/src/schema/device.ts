import { pgTable, serial, text, boolean, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deviceTable = pgTable("device", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("ESP32 Baby Monitor"),
  online: boolean("online").notNull().default(false),
  batteryLevel: integer("battery_level").notNull().default(100),
  wifiSignal: integer("wifi_signal").notNull().default(-65),
  temperature: real("temperature").notNull().default(22.5),
  humidity: real("humidity").notNull().default(55.0),
  streamUrl: text("stream_url"),
  nightModeEnabled: boolean("night_mode_enabled").notNull().default(false),
  sensitivityLevel: integer("sensitivity_level").notNull().default(3),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(deviceTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof deviceTable.$inferSelect;
