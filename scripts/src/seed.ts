import { db } from "@workspace/db";
import {
  usersTable, leagueSchoolsTable, challengesTable, carbonSubmissionsTable,
  communityPostsTable, sharedResourcesTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import * as crypto from "crypto";

function hashPass(p: string): string {
  return crypto.createHash("sha256").update(p + "eco_salt_2025").digest("hex");
}

async function seed() {
  // 1. Admin user
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, "admin@ecodrishti.edu")).limit(1);
  let adminId: number;
  if (existing.length === 0) {
    const [u] = await db.insert(usersTable).values({
      name: "Rajesh Sharma",
      email: "admin@ecodrishti.edu",
      passwordHash: hashPass("password123"),
      schoolName: "Shanti Secondary School",
      role: "admin",
      ecoPoints: 250,
      badge: "Climate Leader",
    }).returning();
    adminId = u.id;
    console.log("Created admin user:", adminId);
  } else {
    adminId = existing[0].id;
    console.log("Admin already exists:", adminId);
  }

  // 2. League schools
  const schools = await db.select().from(leagueSchoolsTable);
  if (schools.length === 0) {
    await db.insert(leagueSchoolsTable).values([
      { schoolName: "Budhanilkantha School", rank: 1, sustainabilityScore: 91.2, carbonReductionPercent: 22.5, participationRate: 88, challengeCompletionRate: 90, dataConfidenceScore: 95, tier: "Climate Champion", schoolType: "private", location: "Kathmandu" },
      { schoolName: "Lalitpur Secondary School", rank: 2, sustainabilityScore: 85.7, carbonReductionPercent: 18.3, participationRate: 82, challengeCompletionRate: 85, dataConfidenceScore: 88, tier: "Climate Champion", schoolType: "government", location: "Lalitpur" },
      { schoolName: "Shanti Secondary School", rank: 3, sustainabilityScore: 78.4, carbonReductionPercent: 12.1, participationRate: 75, challengeCompletionRate: 80, dataConfidenceScore: 85, tier: "Climate Leader", schoolType: "government", location: "Kathmandu" },
      { schoolName: "Tripadhi High School", rank: 4, sustainabilityScore: 72.1, carbonReductionPercent: 9.8, participationRate: 68, challengeCompletionRate: 72, dataConfidenceScore: 76, tier: "Climate Leader", schoolType: "community", location: "Bhaktapur" },
      { schoolName: "Nepal Adarsha School", rank: 5, sustainabilityScore: 65.3, carbonReductionPercent: 7.2, participationRate: 62, challengeCompletionRate: 65, dataConfidenceScore: 70, tier: "Climate Achiever", schoolType: "government", location: "Pokhara" },
      { schoolName: "Mount Everest Academy", rank: 6, sustainabilityScore: 58.9, carbonReductionPercent: 5.1, participationRate: 55, challengeCompletionRate: 60, dataConfidenceScore: 65, tier: "Climate Achiever", schoolType: "private", location: "Kathmandu" },
      { schoolName: "Janata Secondary School", rank: 7, sustainabilityScore: 51.2, carbonReductionPercent: 3.4, participationRate: 48, challengeCompletionRate: 52, dataConfidenceScore: 58, tier: "Climate Achiever", schoolType: "community", location: "Chitwan" },
      { schoolName: "Birendra Vidyalaya", rank: 8, sustainabilityScore: 44.7, carbonReductionPercent: 1.2, participationRate: 40, challengeCompletionRate: 44, dataConfidenceScore: 50, tier: "Climate Starter", schoolType: "government", location: "Butwal" },
      { schoolName: "Sagarmatha School", rank: 9, sustainabilityScore: 38.1, carbonReductionPercent: -1.5, participationRate: 35, challengeCompletionRate: 38, dataConfidenceScore: 42, tier: "Climate Starter", schoolType: "government", location: "Dharan" },
      { schoolName: "Rara Model School", rank: 10, sustainabilityScore: 31.5, carbonReductionPercent: -3.2, participationRate: 28, challengeCompletionRate: 32, dataConfidenceScore: 35, tier: "Climate Starter", schoolType: "community", location: "Surkhet" },
    ]);
    console.log("Seeded 10 league schools");
  }

  // 3. Challenges
  const chs = await db.select().from(challengesTable);
  if (chs.length === 0) {
    const now = new Date();
    const start = new Date(now); start.setDate(start.getDate() - 2);
    const end = new Date(now); end.setDate(end.getDate() + 5);
    const u1 = new Date(now); u1.setDate(u1.getDate() + 7);
    const u2 = new Date(u1); u2.setDate(u2.getDate() + 14);
    const p1 = new Date(now); p1.setDate(p1.getDate() - 30);
    const p2 = new Date(now); p2.setDate(p2.getDate() - 23);

    await db.insert(challengesTable).values([
      { title: "Walk-to-School Week", titleNp: "विद्यालयमा हिँड्ने सप्ताह", description: "All students walk or cycle to school for a full week. Track participation and celebrate results!", descriptionNp: "सबै विद्यार्थीहरू एक हप्ता विद्यालयमा हिँड्ने वा साइकल चलाउने।", category: "transport", durationDays: 7, ecoPointsReward: 100, co2AvoidedKg: 280, participantCount: 45, status: "active", startDate: start, endDate: end },
      { title: "Energy Saving Week", titleNp: "ऊर्जा बचत सप्ताह", description: "Turn off all lights and fans when not in use. Target: 20% electricity reduction.", descriptionNp: "प्रयोगमा नभएका बत्ती र पंखाहरू बन्द गर्नुहोस्। लक्ष्य: २०% बिजुली कटौती।", category: "energy", durationDays: 7, ecoPointsReward: 80, co2AvoidedKg: 320, participantCount: 52, status: "active", startDate: start, endDate: end },
      { title: "Plastic-Free Lunch", titleNp: "प्लास्टिक-मुक्त खाजा", description: "No single-use plastic during lunch for a full month. Use reusable containers only.", descriptionNp: "खाजाको समयमा एकल-प्रयोग प्लास्टिक नहोस्।", category: "waste", durationDays: 30, ecoPointsReward: 150, co2AvoidedKg: 180, participantCount: 85, status: "active", startDate: start, endDate: end },
      { title: "Water Conservation Drive", titleNp: "जल संरक्षण अभियान", description: "Reduce water waste by fixing leaks and promoting mindful usage.", descriptionNp: "चुहावट मर्मत गरेर पानी बर्बादी घटाउनुहोस्।", category: "water", durationDays: 14, ecoPointsReward: 60, co2AvoidedKg: 90, participantCount: 25, status: "upcoming", startDate: u1, endDate: u2 },
      { title: "Green School Garden", titleNp: "हरित विद्यालय बगैंचा", description: "Plant trees and maintain a school garden to improve biodiversity.", descriptionNp: "जैविक विविधता सुधार गर्न रुख रोप्नुहोस्।", category: "biodiversity", durationDays: 21, ecoPointsReward: 120, co2AvoidedKg: 60, participantCount: 35, status: "upcoming", startDate: u1, endDate: u2 },
      { title: "Zero-Waste Day", titleNp: "शून्य-फोहोर दिन", description: "One full day with zero waste sent to landfill. Compost, recycle, reuse everything!", descriptionNp: "ल्यान्डफिलमा शून्य फोहोर पठाउने एक पूर्ण दिन।", category: "waste", durationDays: 1, ecoPointsReward: 50, co2AvoidedKg: 200, participantCount: 15, status: "completed", startDate: p1, endDate: p2 },
    ]);
    console.log("Seeded 6 challenges");
  }

  // 4. Carbon submissions
  const subs = await db.select().from(carbonSubmissionsTable).where(eq(carbonSubmissionsTable.userId, adminId));
  if (subs.length === 0) {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    await db.insert(carbonSubmissionsTable).values([
      {
        userId: adminId, month: now.getMonth() + 1, year: now.getFullYear(),
        studentCount: 500, staffCount: 30,
        electricityKwh: 2800, waterLiters: 18000, wasteKg: 220, recyclingKg: 65, compostingKg: 40,
        busRiders: 200, walkersOrCyclers: 160, carRiders: 140, fuelLiters: 120,
        totalEmissionsKg: 2847.5, transportEmissionsKg: 1250.4, electricityEmissionsKg: 112.0, waterEmissionsKg: 5.4, wasteEmissionsKg: 62.5,
        sustainabilityScore: 78.4, dataConfidenceScore: 85, status: "verified",
      },
      {
        userId: adminId, month: prevMonth, year: prevYear,
        studentCount: 500, staffCount: 30,
        electricityKwh: 3200, waterLiters: 20000, wasteKg: 260, recyclingKg: 40,
        busRiders: 210, walkersOrCyclers: 140, carRiders: 150, fuelLiters: 140,
        totalEmissionsKg: 3245.2, transportEmissionsKg: 1450.8, electricityEmissionsKg: 128.0, waterEmissionsKg: 6.0, wasteEmissionsKg: 75.2,
        sustainabilityScore: 72.1, dataConfidenceScore: 78, status: "verified",
      },
    ]);
    console.log("Seeded 2 carbon submissions");
  }

  // 5. Community posts
  const posts = await db.select().from(communityPostsTable);
  if (posts.length === 0) {
    await db.insert(communityPostsTable).values([
      { userId: adminId, authorName: "Rajesh Sharma", authorRole: "admin", content: "Our school reduced plastic waste by 40% this month through the Plastic-Free Lunch campaign! Students are using reusable containers. So proud of our eco warriors! 🌿", category: "achievement", likes: 24, ecoPointsEarned: 50 },
      { userId: adminId, authorName: "Priya Thapa", authorRole: "teacher", content: "Just got the Walk-to-School Week results: 78% of our students walked or cycled! That's 280 kg CO₂ avoided. Amazing effort everyone! 🚶", category: "celebration", likes: 18, ecoPointsEarned: 30 },
      { userId: adminId, authorName: "Anish Gurung", authorRole: "student", content: "Tip: turning off computers completely (not sleep mode) saves so much electricity! Our class saved 15 kWh last week just from this habit.", category: "tip", likes: 12, ecoPointsEarned: 10 },
      { userId: adminId, authorName: "Sita Rai", authorRole: "teacher", content: "We're starting a school garden project next month. Anyone have composting tips or want to share seeds?", category: "question", likes: 7, ecoPointsEarned: 5 },
      { userId: adminId, authorName: "Ram Bahadur", authorRole: "student", content: "Successfully fixed 3 dripping taps in our school! Small actions, big impact. Water conservation matters! 💧", category: "awareness", likes: 15, ecoPointsEarned: 20 },
    ]);
    console.log("Seeded 5 community posts");
  }

  // 6. Shared resources
  const ress = await db.select().from(sharedResourcesTable);
  if (ress.length === 0) {
    await db.insert(sharedResourcesTable).values([
      { userId: adminId, title: "Class 10 Science Textbook Set", description: "20 science textbooks in excellent condition. Used for one year.", resourceType: "reference_book", condition: "excellent", donorName: "Rajesh Sharma", available: true },
      { userId: adminId, title: "Biology Lab Microscopes (5 units)", description: "Working microscopes available for sharing. Can be borrowed for project work.", resourceType: "lab_equipment", condition: "good", donorName: "Priya Thapa", available: true },
      { userId: adminId, title: "Math Workbooks Grade 8", description: "Solved math workbooks with detailed solutions. Good for reference.", resourceType: "exam_material", condition: "good", donorName: "Anish Gurung", available: true },
      { userId: adminId, title: "Globe and Atlas Collection", description: "3 globes and 5 atlas books for geography students.", resourceType: "educational_tool", condition: "excellent", donorName: "Sita Rai", available: false },
      { userId: adminId, title: "Solar System Model Kit", description: "Detailed solar system model. Perfect for science fairs.", resourceType: "learning_aid", condition: "good", donorName: "Ram Bahadur", available: true },
    ]);
    console.log("Seeded 5 shared resources");
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
