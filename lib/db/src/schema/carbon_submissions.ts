import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const carbonSubmissionsTable = pgTable("carbon_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  studentCount: integer("student_count").notNull(),
  staffCount: integer("staff_count").notNull(),
  electricityKwh: real("electricity_kwh"),
  classroomCount: integer("classroom_count"),
  lightCount: integer("light_count"),
  fanCount: integer("fan_count"),
  hasComputerLab: integer("has_computer_lab"),
  waterLiters: real("water_liters"),
  wasteKg: real("waste_kg"),
  recyclingKg: real("recycling_kg"),
  compostingKg: real("composting_kg"),
  busRiders: integer("bus_riders"),
  walkersOrCyclers: integer("walkers_or_cyclers"),
  carRiders: integer("car_riders"),
  fuelLiters: real("fuel_liters"),
  totalEmissionsKg: real("total_emissions_kg").notNull().default(0),
  transportEmissionsKg: real("transport_emissions_kg").notNull().default(0),
  electricityEmissionsKg: real("electricity_emissions_kg").notNull().default(0),
  waterEmissionsKg: real("water_emissions_kg").notNull().default(0),
  wasteEmissionsKg: real("waste_emissions_kg").notNull().default(0),
  sustainabilityScore: real("sustainability_score").notNull().default(50),
  dataConfidenceScore: real("data_confidence_score").notNull().default(50),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCarbonSubmissionSchema = createInsertSchema(carbonSubmissionsTable).omit({ id: true, createdAt: true });
export type InsertCarbonSubmission = z.infer<typeof insertCarbonSubmissionSchema>;
export type CarbonSubmission = typeof carbonSubmissionsTable.$inferSelect;
