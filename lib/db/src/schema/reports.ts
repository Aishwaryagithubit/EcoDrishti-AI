import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  totalEmissionsKg: real("total_emissions_kg").notNull().default(0),
  sustainabilityScore: real("sustainability_score").notNull().default(50),
  dataConfidenceScore: real("data_confidence_score").notNull().default(50),
  ecoLeagueRank: integer("eco_league_rank").notNull().default(1),
  highlights: text("highlights").notNull().default("[]"),
  challengesCompleted: integer("challenges_completed").notNull().default(0),
  activeStudents: integer("active_students").notNull().default(0),
  carbonReductionPercent: real("carbon_reduction_percent").notNull().default(0),
  transportEmissionsKg: real("transport_emissions_kg").notNull().default(0),
  electricityEmissionsKg: real("electricity_emissions_kg").notNull().default(0),
  waterEmissionsKg: real("water_emissions_kg").notNull().default(0),
  wasteEmissionsKg: real("waste_emissions_kg").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
