import { Router } from "express";
import { db, recommendationsTable, carbonSubmissionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getUserId } from "./middleware";

const router = Router();

interface RecTemplate {
  category: "transport" | "electricity" | "water" | "waste" | "general";
  title: string;
  titleNp: string;
  description: string;
  descriptionNp: string;
  estimatedCarbonReductionKg: number;
  difficulty: "easy" | "medium" | "hard";
  impact: "low" | "medium" | "high";
  timeline: string;
}

const RECOMMENDATIONS: Record<string, RecTemplate[]> = {
  transport: [
    {
      category: "transport",
      title: "Walk-to-School Week Campaign",
      titleNp: "विद्यालयमा हिँड्ने सप्ताह अभियान",
      description: "Organize a dedicated week where all students commit to walking or cycling to school. Reduces vehicle emissions significantly.",
      descriptionNp: "एउटा समर्पित सप्ताह आयोजना गर्नुहोस् जहाँ सबै विद्यार्थीहरू विद्यालयमा हिँड्न वा साइकल चलाउन प्रतिबद्ध हुन्छन्।",
      estimatedCarbonReductionKg: 250,
      difficulty: "easy",
      impact: "high",
      timeline: "1 week",
    },
    {
      category: "transport",
      title: "School Bus Optimization",
      titleNp: "विद्यालय बस अनुकूलन",
      description: "Optimize bus routes to reduce fuel consumption. Consolidate routes and fill buses to capacity.",
      descriptionNp: "इन्धन खपत घटाउन बस मार्गहरू अनुकूलन गर्नुहोस्। मार्गहरू एकीकृत गर्नुहोस्।",
      estimatedCarbonReductionKg: 180,
      difficulty: "medium",
      impact: "high",
      timeline: "1 month",
    },
    {
      category: "transport",
      title: "Carpool Program",
      titleNp: "कारपूल कार्यक्रम",
      description: "Establish a school carpool matching system for families living in the same area.",
      descriptionNp: "एउटै क्षेत्रमा बस्ने परिवारहरूको लागि कारपूल मिलान प्रणाली स्थापना गर्नुहोस्।",
      estimatedCarbonReductionKg: 120,
      difficulty: "medium",
      impact: "medium",
      timeline: "2 weeks",
    },
  ],
  electricity: [
    {
      category: "electricity",
      title: "LED Lighting Upgrade",
      titleNp: "एलईडी बत्ती अपग्रेड",
      description: "Replace all incandescent and fluorescent bulbs with LED. LED uses 75% less energy.",
      descriptionNp: "सबै इन्कान्डेसेन्ट र फ्लोरोसेन्ट बल्बहरू एलईडीसँग बदल्नुहोस्। एलईडीले ७५% कम ऊर्जा प्रयोग गर्दछ।",
      estimatedCarbonReductionKg: 85,
      difficulty: "medium",
      impact: "high",
      timeline: "1 month",
    },
    {
      category: "electricity",
      title: "Energy Saving Week",
      titleNp: "ऊर्जा बचत सप्ताह",
      description: "Implement a school-wide switch-off campaign. Turn off all lights, fans, and devices when not in use.",
      descriptionNp: "विद्यालयव्यापी स्विच-अफ अभियान लागू गर्नुहोस्। प्रयोगमा नभएका सबै बत्ती, पंखा र उपकरणहरू बन्द गर्नुहोस्।",
      estimatedCarbonReductionKg: 45,
      difficulty: "easy",
      impact: "medium",
      timeline: "1 week",
    },
    {
      category: "electricity",
      title: "Solar Panel Installation",
      titleNp: "सोलार प्यानल स्थापना",
      description: "Install rooftop solar panels to generate renewable electricity. Reduces grid dependency.",
      descriptionNp: "नवीकरणीय बिजुली उत्पन्न गर्न छाना सोलार प्यानल स्थापना गर्नुहोस्।",
      estimatedCarbonReductionKg: 350,
      difficulty: "hard",
      impact: "high",
      timeline: "3 months",
    },
  ],
  water: [
    {
      category: "water",
      title: "Rainwater Harvesting",
      titleNp: "वर्षाको पानी संकलन",
      description: "Install rainwater collection systems to reduce municipal water usage.",
      descriptionNp: "नगरपालिका पानी उपयोग घटाउन वर्षाको पानी संकलन प्रणाली स्थापना गर्नुहोस्।",
      estimatedCarbonReductionKg: 30,
      difficulty: "medium",
      impact: "medium",
      timeline: "2 months",
    },
    {
      category: "water",
      title: "Leak Detection Campaign",
      titleNp: "चुहावट पहिचान अभियान",
      description: "Audit all taps, pipes, and toilets for leaks. Fix leaks immediately.",
      descriptionNp: "चुहावटको लागि सबै धाराहरू, पाइपहरू र शौचालयहरू अडिट गर्नुहोस्। चुहावटहरू तुरुन्त ठीक गर्नुहोस्।",
      estimatedCarbonReductionKg: 20,
      difficulty: "easy",
      impact: "low",
      timeline: "1 week",
    },
  ],
  waste: [
    {
      category: "waste",
      title: "Plastic-Free Lunch Campaign",
      titleNp: "प्लास्टिक-मुक्त खाजा अभियान",
      description: "Ban single-use plastics in the cafeteria. Encourage reusable containers and water bottles.",
      descriptionNp: "क्याफेटेरियामा एकल-प्रयोग प्लास्टिक प्रतिबन्ध लगाउनुहोस्।",
      estimatedCarbonReductionKg: 60,
      difficulty: "easy",
      impact: "medium",
      timeline: "2 weeks",
    },
    {
      category: "waste",
      title: "Waste Segregation System",
      titleNp: "फोहोर छुट्याउने प्रणाली",
      description: "Set up separate bins for organic waste, recyclables, and general waste throughout school.",
      descriptionNp: "विद्यालयमा जैविक फोहोर, पुनःचक्रणयोग्य र सामान्य फोहोरको लागि छुट्टाछुट्टै डस्टबिन राख्नुहोस्।",
      estimatedCarbonReductionKg: 75,
      difficulty: "easy",
      impact: "medium",
      timeline: "1 week",
    },
    {
      category: "waste",
      title: "Composting Program",
      titleNp: "कम्पोस्टिङ कार्यक्रम",
      description: "Start a composting program for food waste from the school cafeteria.",
      descriptionNp: "विद्यालय क्याफेटेरियाको खाद्य फोहोरको लागि कम्पोस्टिङ कार्यक्रम सुरु गर्नुहोस्।",
      estimatedCarbonReductionKg: 40,
      difficulty: "medium",
      impact: "medium",
      timeline: "1 month",
    },
  ],
};

router.get("/recommendations", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const recs = await db.select().from(recommendationsTable)
    .where(eq(recommendationsTable.userId, userId))
    .orderBy(desc(recommendationsTable.createdAt));

  return res.json(recs.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/recommendations/generate", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { submissionId } = req.body;
  if (!submissionId) return res.status(400).json({ error: "submissionId required" });

  const [sub] = await db.select().from(carbonSubmissionsTable)
    .where(eq(carbonSubmissionsTable.id, submissionId)).limit(1);

  if (!sub) return res.status(404).json({ error: "Submission not found" });

  // Determine highest emission categories
  const catEmissions = [
    { key: "transport", value: sub.transportEmissionsKg },
    { key: "electricity", value: sub.electricityEmissionsKg },
    { key: "water", value: sub.waterEmissionsKg },
    { key: "waste", value: sub.wasteEmissionsKg },
  ].sort((a, b) => b.value - a.value);

  // Pick 2-3 recommendations per top category
  const toInsert: (typeof recommendationsTable.$inferInsert)[] = [];
  for (const cat of catEmissions.slice(0, 2)) {
    const templates = RECOMMENDATIONS[cat.key] ?? [];
    for (const t of templates.slice(0, 2)) {
      toInsert.push({
        userId,
        submissionId,
        ...t,
        status: "active",
      });
    }
  }

  const inserted = await db.insert(recommendationsTable).values(toInsert).returning();
  return res.json(inserted.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

export default router;
