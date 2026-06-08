import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leagueSchoolsTable = pgTable("league_schools", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").notNull(),
  rank: integer("rank").notNull().default(1),
  sustainabilityScore: real("sustainability_score").notNull().default(50),
  carbonReductionPercent: real("carbon_reduction_percent").notNull().default(0),
  participationRate: real("participation_rate").notNull().default(0),
  challengeCompletionRate: real("challenge_completion_rate").notNull().default(0),
  dataConfidenceScore: real("data_confidence_score").notNull().default(50),
  tier: text("tier").notNull().default("Climate Starter"),
  schoolType: text("school_type").notNull().default("government"),
  location: text("location").notNull().default("Kathmandu"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeagueSchoolSchema = createInsertSchema(leagueSchoolsTable).omit({ id: true, updatedAt: true });
export type InsertLeagueSchool = z.infer<typeof insertLeagueSchoolSchema>;
export type LeagueSchool = typeof leagueSchoolsTable.$inferSelect;
