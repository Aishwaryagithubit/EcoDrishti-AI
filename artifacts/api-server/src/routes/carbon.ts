import { Router } from "express";
import { db, carbonSubmissionsTable, leagueSchoolsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { SubmitCarbonDataBody } from "@workspace/api-zod";
import { getUserId, getUser } from "./middleware";

const router = Router();

// Nepal-specific emission factors
const FACTORS = {
  electricity_kwh: 0.04,    // kg CO2/kWh (Nepal hydro grid - very low)
  water_liter: 0.0003,      // kg CO2/liter
  waste_kg: 0.5,            // kg CO2/kg waste
  recycling_kg: -0.3,       // kg CO2 saved/kg recycled
  composting_kg: -0.2,      // kg CO2 saved/kg composted
  bus_student_km: 0.05,     // kg CO2/student/day (school bus)
  car_student_km: 0.12,     // kg CO2/student/day (car)
  fuel_liter: 2.31,         // kg CO2/liter diesel
  // Proxy factors
  classroom_electricity: 80, // kWh/month per classroom
  light_electricity: 0.04,   // kWh/hour per bulb
  fan_electricity: 0.08,     // kWh/hour per fan
  computer_lab_kwh: 120,     // kWh/month extra
};

function calculateEmissions(data: {
  electricityKwh?: number | null;
  classroomCount?: number | null;
  lightCount?: number | null;
  fanCount?: number | null;
  hasComputerLab?: boolean | null;
  waterLiters?: number | null;
  wasteKg?: number | null;
  recyclingKg?: number | null;
  compostingKg?: number | null;
  busRiders?: number | null;
  walkersOrCyclers?: number | null;
  carRiders?: number | null;
  fuelLiters?: number | null;
  studentCount: number;
  staffCount: number;
}) {
  let confidence = 100;
  let electricityKwh = data.electricityKwh ?? 0;
  let waterLiters = data.waterLiters ?? 0;
  let wasteKg = data.wasteKg ?? 0;

  // Proxy estimation if exact data missing
  if (!data.electricityKwh) {
    confidence -= 20;
    const rooms = data.classroomCount ?? Math.ceil((data.studentCount + data.staffCount) / 25);
    const lights = data.lightCount ?? rooms * 4;
    const fans = data.fanCount ?? rooms * 2;
    const hoursPerDay = 7;
    const daysPerMonth = 22;
    electricityKwh = (lights * FACTORS.light_electricity + fans * FACTORS.fan_electricity) * hoursPerDay * daysPerMonth;
    if (data.hasComputerLab) electricityKwh += FACTORS.computer_lab_kwh;
    if (!data.classroomCount) confidence -= 10;
  }

  if (!data.waterLiters) {
    confidence -= 15;
    waterLiters = (data.studentCount + data.staffCount) * 15 * 22; // 15L/person/day
  }

  if (!data.wasteKg) {
    confidence -= 15;
    wasteKg = (data.studentCount + data.staffCount) * 0.1 * 22; // 0.1kg/person/day
  }

  // Calculate emissions
  const electricityKg = electricityKwh * FACTORS.electricity_kwh;
  const waterKg = waterLiters * FACTORS.water_liter;
  const recyclingCredit = (data.recyclingKg ?? 0) * Math.abs(FACTORS.recycling_kg);
  const compostCredit = (data.compostingKg ?? 0) * Math.abs(FACTORS.composting_kg);
  const wasteKgEmissions = Math.max(0, wasteKg * FACTORS.waste_kg - recyclingCredit - compostCredit);

  let transportKg = 0;
  if (data.fuelLiters) {
    transportKg += data.fuelLiters * FACTORS.fuel_liter;
  }
  if (data.busRiders) {
    transportKg += data.busRiders * FACTORS.bus_student_km * 2 * 22; // 2 trips/day, 22 days
  }
  if (data.carRiders) {
    transportKg += data.carRiders * FACTORS.car_student_km * 2 * 22;
  }
  if (!data.busRiders && !data.carRiders && !data.fuelLiters) {
    confidence -= 15;
    // Assume 40% bus, 30% car, 30% walk
    transportKg = (data.studentCount * 0.4 * FACTORS.bus_student_km + data.studentCount * 0.3 * FACTORS.car_student_km) * 2 * 22;
  }

  const total = electricityKg + waterKg + wasteKgEmissions + transportKg;

  // Sustainability score (inverse of per-student emissions, normalized)
  const perStudent = total / (data.studentCount + data.staffCount);
  const score = Math.max(0, Math.min(100, 100 - (perStudent * 5)));

  return {
    transportEmissionsKg: Math.round(transportKg * 100) / 100,
    electricityEmissionsKg: Math.round(electricityKg * 100) / 100,
    waterEmissionsKg: Math.round(waterKg * 100) / 100,
    wasteEmissionsKg: Math.round(wasteKgEmissions * 100) / 100,
    totalEmissionsKg: Math.round(total * 100) / 100,
    sustainabilityScore: Math.round(score * 10) / 10,
    dataConfidenceScore: Math.max(20, confidence),
  };
};

router.get("/carbon/submissions", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const submissions = await db.select().from(carbonSubmissionsTable)
    .where(eq(carbonSubmissionsTable.userId, userId))
    .orderBy(desc(carbonSubmissionsTable.createdAt));

  return res.json(submissions.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/carbon/submissions", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parse = SubmitCarbonDataBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid data" });

  const data = parse.data;
  const calc = calculateEmissions({
    ...data,
    hasComputerLab: data.hasComputerLab ?? null,
  });

  const [sub] = await db.insert(carbonSubmissionsTable).values({
    userId,
    month: data.month,
    year: data.year,
    studentCount: data.studentCount,
    staffCount: data.staffCount,
    electricityKwh: data.electricityKwh ?? null,
    classroomCount: data.classroomCount ?? null,
    lightCount: data.lightCount ?? null,
    fanCount: data.fanCount ?? null,
    hasComputerLab: data.hasComputerLab ? 1 : 0,
    waterLiters: data.waterLiters ?? null,
    wasteKg: data.wasteKg ?? null,
    recyclingKg: data.recyclingKg ?? null,
    compostingKg: data.compostingKg ?? null,
    busRiders: data.busRiders ?? null,
    walkersOrCyclers: data.walkersOrCyclers ?? null,
    carRiders: data.carRiders ?? null,
    fuelLiters: data.fuelLiters ?? null,
    notes: data.notes ?? null,
    ...calc,
    status: "pending",
  }).returning();

  // Update league rankings
  const user = await getUser(req);
  if (user) {
    const existing = await db.select().from(leagueSchoolsTable)
      .where((t) => eq(t.schoolName, user.schoolName)).limit(1);

    if (existing.length > 0) {
      await db.update(leagueSchoolsTable)
        .set({ sustainabilityScore: calc.sustainabilityScore, dataConfidenceScore: calc.dataConfidenceScore })
        .where(eq(leagueSchoolsTable.schoolName, user.schoolName));
    }
  }

  return res.status(201).json({ ...sub, createdAt: sub.createdAt.toISOString() });
});

router.get("/carbon/submissions/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = parseInt(req.params.id);
  const [sub] = await db.select().from(carbonSubmissionsTable)
    .where(eq(carbonSubmissionsTable.id, id)).limit(1);

  if (!sub || sub.userId !== userId) return res.status(404).json({ error: "Not found" });
  return res.json({ ...sub, createdAt: sub.createdAt.toISOString() });
});

export default router;
