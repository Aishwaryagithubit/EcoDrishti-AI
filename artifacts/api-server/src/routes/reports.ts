import { Router } from "express";
import { db, reportsTable, carbonSubmissionsTable, userChallengesTable, leagueSchoolsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getUserId, getUser } from "./middleware";

const router = Router();

router.get("/reports", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const reports = await db.select().from(reportsTable)
    .where(eq(reportsTable.userId, userId))
    .orderBy(desc(reportsTable.createdAt));

  return res.json(reports.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.get("/reports/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [report] = await db.select().from(reportsTable)
    .where(eq(reportsTable.id, parseInt(req.params.id))).limit(1);

  if (!report || report.userId !== userId) return res.status(404).json({ error: "Not found" });
  return res.json({ ...report, createdAt: report.createdAt.toISOString() });
});

router.post("/reports/generate", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { month, year } = req.body;
  if (!month || !year) return res.status(400).json({ error: "month and year required" });

  // Get submission for this month
  const submissions = await db.select().from(carbonSubmissionsTable)
    .where(and(
      eq(carbonSubmissionsTable.userId, userId),
      eq(carbonSubmissionsTable.month, month),
      eq(carbonSubmissionsTable.year, year),
    )).orderBy(desc(carbonSubmissionsTable.createdAt)).limit(1);

  const sub = submissions[0];

  // Previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevSubs = await db.select().from(carbonSubmissionsTable)
    .where(and(
      eq(carbonSubmissionsTable.userId, userId),
      eq(carbonSubmissionsTable.month, prevMonth),
      eq(carbonSubmissionsTable.year, prevYear),
    )).orderBy(desc(carbonSubmissionsTable.createdAt)).limit(1);
  const prev = prevSubs[0];

  const carbonReductionPercent = sub && prev && prev.totalEmissionsKg > 0
    ? ((prev.totalEmissionsKg - sub.totalEmissionsKg) / prev.totalEmissionsKg) * 100
    : 0;

  const completed = await db.select().from(userChallengesTable)
    .where(and(eq(userChallengesTable.userId, userId), eq(userChallengesTable.isCompleted, 1)));

  const user = await getUser(req);
  const allSchools = await db.select().from(leagueSchoolsTable).orderBy(leagueSchoolsTable.rank);
  const leagueEntry = allSchools.find(s => s.schoolName === user?.schoolName);

  const highlights: string[] = [];
  if (sub) {
    if (carbonReductionPercent > 5) highlights.push(`Reduced carbon emissions by ${carbonReductionPercent.toFixed(1)}% compared to last month`);
    if (sub.sustainabilityScore >= 70) highlights.push(`Achieved sustainability score of ${sub.sustainabilityScore.toFixed(0)}/100`);
    if (sub.dataConfidenceScore >= 80) highlights.push(`High data confidence score: ${sub.dataConfidenceScore.toFixed(0)}%`);
  }
  if (completed.length > 0) highlights.push(`Completed ${completed.length} eco challenges this period`);
  if (leagueEntry) highlights.push(`Ranked #${leagueEntry.rank} in Inter-School Eco League`);
  if (highlights.length === 0) highlights.push("Keep submitting carbon data to unlock insights");

  const [report] = await db.insert(reportsTable).values({
    userId,
    month,
    year,
    totalEmissionsKg: sub?.totalEmissionsKg ?? 0,
    sustainabilityScore: sub?.sustainabilityScore ?? 0,
    dataConfidenceScore: sub?.dataConfidenceScore ?? 0,
    ecoLeagueRank: leagueEntry?.rank ?? allSchools.length + 1,
    highlights: JSON.stringify(highlights),
    challengesCompleted: completed.length,
    activeStudents: sub?.studentCount ?? 0,
    carbonReductionPercent: Math.round(carbonReductionPercent * 10) / 10,
    transportEmissionsKg: sub?.transportEmissionsKg ?? 0,
    electricityEmissionsKg: sub?.electricityEmissionsKg ?? 0,
    waterEmissionsKg: sub?.waterEmissionsKg ?? 0,
    wasteEmissionsKg: sub?.wasteEmissionsKg ?? 0,
  }).returning();

  return res.status(201).json({ ...report, createdAt: report.createdAt.toISOString() });
});

export default router;
