import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmitCarbonData, useGenerateRecommendations, useGetRecommendations, getGetRecommendationsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calculator, Zap, Droplets, Trash2, Bus, Brain, TrendingDown, CheckCircle, ChevronRight, ClipboardList, Target, Users, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { npNum, npFixed } from '@/lib/nepali';

const FACTORS = {
  electricity: 0.04,
  water: 0.0003,
  waste: 0.5,
  bus: 0.05,
  car: 0.12,
  fuel: 2.31,
};
const SCHOOL_DAYS = 22;

interface FormData {
  month: number; year: number;
  studentCount: number; staffCount: number;
  electricityKwh: string;
  waterLiters: string;
  wasteKg: string; recyclingKg: string; compostingKg: string;
  busRiders: string; walkersOrCyclers: string; carRiders: string; fuelLiters: string;
}

const now = new Date();
const DEFAULT: FormData = {
  month: now.getMonth() + 1, year: now.getFullYear(),
  studentCount: 485, staffCount: 32,
  electricityKwh: '2840', waterLiters: '41500',
  wasteKg: '265', recyclingKg: '48', compostingKg: '32',
  busRiders: '192', walkersOrCyclers: '148', carRiders: '97', fuelLiters: '118',
};

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_NP = ['जनवरी','फेब्रुअरी','मार्च','अप्रिल','मे','जुन','जुलाई','अगस्ट','सेप्टेम्बर','अक्टोबर','नोभेम्बर','डिसेम्बर'];

function n(s: string): number { return parseFloat(s) || 0; }

function calcEmissions(d: FormData) {
  const electricity = n(d.electricityKwh) * FACTORS.electricity;
  const water = n(d.waterLiters) * FACTORS.water;
  const landfill = Math.max(0, n(d.wasteKg) - n(d.recyclingKg) - n(d.compostingKg));
  const waste = landfill * FACTORS.waste;
  const bus = n(d.busRiders) * SCHOOL_DAYS * FACTORS.bus;
  const car = n(d.carRiders) * SCHOOL_DAYS * FACTORS.car;
  const fuel = n(d.fuelLiters) * FACTORS.fuel;
  const transport = bus + car + fuel;
  const total = electricity + water + waste + transport;
  const people = d.studentCount + d.staffCount;
  const perPerson = people > 0 ? total / people : 0;
  return { electricity, water, waste, transport, total, perPerson, landfill };
}

interface WorkPlanRec {
  id: number;
  title: string;
  titleNp: string;
  description: string;
  descriptionNp: string;
  category: string;
  difficulty: string;
  estimatedCarbonReductionKg: number;
}

function generateWorkPlan(rec: WorkPlanRec, schoolName: string, lang: string) {
  const plans: Record<string, { weeks: { week: number; title: string; titleNp: string; tasks: string[]; tasksNp: string[] }[]; responsible: string; responsibleNp: string }> = {
    transport: {
      weeks: [
        { week: 1, title: 'Baseline Assessment', titleNp: 'आधारभूत मूल्याङ्कन', tasks: ['Survey all students on travel mode', 'Map distances from school for each zone', 'Identify safe walking/cycling routes'], tasksNp: ['सबै विद्यार्थीको यातायात ढाँचाको सर्वेक्षण', 'विद्यालयबाट प्रत्येक क्षेत्रको दूरी नक्सा बनाउने', 'सुरक्षित हिँड्ने/साइकल मार्ग पहिचान'] },
        { week: 2, title: 'Awareness Campaign', titleNp: 'जागरूकता अभियान', tasks: ['Hold assembly on transport emissions', 'Create walk/cycle pledge board', 'Notify parents via school circular'], tasksNp: ['यातायात उत्सर्जनमा सभा', 'हिँड्ने/साइकल प्रतिज्ञा बोर्ड बनाउने', 'अभिभावकलाई परिपत्र पठाउने'] },
        { week: 3, title: 'Implementation', titleNp: 'कार्यान्वयन', tasks: ['Launch "Walk to School" week', 'Set up bicycle parking area', 'Track daily participation rates'], tasksNp: ['"विद्यालय हिँडेर जाने" सप्ताह सुरु', 'साइकल पार्किङ क्षेत्र स्थापना', 'दैनिक सहभागिता दर ट्र्याक'] },
        { week: 4, title: 'Review & Report', titleNp: 'समीक्षा र प्रतिवेदन', tasks: ['Measure CO₂ reduction achieved', 'Reward top participating classrooms', 'Submit results to EcoDrishti dashboard'], tasksNp: ['CO₂ कटौती मापन', 'शीर्ष सहभागी कक्षाकोठाहरूलाई पुरस्कार', 'नतिजा ड्यासबोर्डमा सबमिट'] },
      ],
      responsible: 'Eco Club + PE Department',
      responsibleNp: 'इको क्लब + शारीरिक शिक्षा विभाग',
    },
    electricity: {
      weeks: [
        { week: 1, title: 'Energy Audit', titleNp: 'ऊर्जा अडिट', tasks: ['List all electrical appliances by room', 'Measure standby consumption', 'Identify top 3 energy-wasting areas'], tasksNp: ['कोठाद्वारा सबै विद्युत उपकरण सूची', 'स्ट्यान्डबाई खपत मापन', 'शीर्ष ३ ऊर्जा बर्बादी क्षेत्र पहिचान'] },
        { week: 2, title: 'Quick Wins', titleNp: 'तत्काल सुधार', tasks: ['Put energy reminders on all switches', 'Set AC/fan schedules (off after school)', 'Replace top 5 bulbs with LED'], tasksNp: ['सबै स्विचमा ऊर्जा सम्झाइपत्र', 'AC/पंखा समयतालिका (विद्यालय पछि बन्द)', 'शीर्ष ५ बल्बलाई LED ले प्रतिस्थापन'] },
        { week: 3, title: 'Student Monitors', titleNp: 'विद्यार्थी निगरानी', tasks: ['Appoint energy monitors per class', 'Daily lights-off checklist', 'Track meter readings weekly'], tasksNp: ['प्रत्येक कक्षाको ऊर्जा निगरानी नियुक्त', 'दैनिक बत्ती बन्द जाँचसूची', 'साप्ताहिक मिटर रिडिङ ट्र्याक'] },
        { week: 4, title: 'Measure Impact', titleNp: 'प्रभाव मापन', tasks: ['Compare kWh to previous month', 'Calculate CO₂ saved', 'Present findings to school management'], tasksNp: ['गत महिनासँग kWh तुलना', 'बचाइएको CO₂ गणना', 'विद्यालय व्यवस्थापनलाई निष्कर्ष प्रस्तुत'] },
      ],
      responsible: 'Science Department + Facility Manager',
      responsibleNp: 'विज्ञान विभाग + सुविधा प्रबन्धक',
    },
    waste: {
      weeks: [
        { week: 1, title: 'Waste Audit', titleNp: 'फोहोर अडिट', tasks: ['Weigh waste per day for one week', 'Categorize: organic, plastic, paper', 'Identify main waste sources (canteen, classrooms)'], tasksNp: ['एक हप्ता प्रतिदिन फोहोर तौल', 'वर्गीकरण: जैविक, प्लास्टिक, कागज', 'मुख्य फोहोर स्रोत पहिचान'] },
        { week: 2, title: 'Segregation Setup', titleNp: 'पृथकीकरण स्थापना', tasks: ['Place color-coded bins in every room', 'Train students on what goes where', 'Set up compost pit in school garden'], tasksNp: ['प्रत्येक कोठामा रंग-कोड बिन', 'विद्यार्थीलाई के कहाँ जाने प्रशिक्षण', 'विद्यालय बगैँचामा कम्पोस्ट गड्ढा'] },
        { week: 3, title: 'Plastic-Free Campaign', titleNp: 'प्लास्टिकमुक्त अभियान', tasks: ['Launch plastic-free lunch initiative', 'Replace single-use cups with reusables', 'Tally daily plastic items avoided'], tasksNp: ['प्लास्टिकमुक्त दिउँसो खाजा पहल', 'एकल-प्रयोग कप पुनः प्रयोगयोग्यले प्रतिस्थापन', 'दैनिक प्लास्टिक वस्तु बचत गणना'] },
        { week: 4, title: 'Compost & Report', titleNp: 'कम्पोस्ट र प्रतिवेदन', tasks: ['Harvest first compost batch', 'Measure waste reduction (kg vs week 1)', 'Share results in school newsletter'], tasksNp: ['पहिलो कम्पोस्ट ब्याच संकलन', 'फोहोर कटौती मापन (kg बनाम सप्ताह १)', 'विद्यालय समाचारपत्रमा नतिजा साझा'] },
      ],
      responsible: 'Eco Club + Canteen Manager',
      responsibleNp: 'इको क्लब + क्यान्टिन प्रबन्धक',
    },
    water: {
      weeks: [
        { week: 1, title: 'Water Audit', titleNp: 'पानी अडिट', tasks: ['Check all taps and pipes for leaks', 'Measure daily water meter reading', 'Survey student water bottle habits'], tasksNp: ['सबै धारा र पाइप चुहावट जाँच', 'दैनिक पानी मिटर रिडिङ', 'विद्यार्थी पानी बोतल बानी सर्वेक्षण'] },
        { week: 2, title: 'Fix & Install', titleNp: 'मर्मत र स्थापना', tasks: ['Repair identified leaky taps', 'Put water-saving reminders at sinks', 'Install aerators on high-use taps'], tasksNp: ['पहिचान गरिएको चुहिने धारा मर्मत', 'धारामा पानी बचाउने सम्झाइपत्र', 'उच्च-प्रयोग धारामा एरेटर स्थापना'] },
        { week: 3, title: 'Rainwater Awareness', titleNp: 'वर्षाजल जागरूकता', tasks: ['Explore rainwater harvesting options', 'Plant water-efficient plants in garden', 'No-plastic-bottle campaign in canteen'], tasksNp: ['वर्षाजल संकलन विकल्प अन्वेषण', 'बगैँचामा पानी-कुशल बिरुवा रोप्ने', 'क्यान्टिनमा प्लास्टिक बोतल रहित अभियान'] },
        { week: 4, title: 'Review & Sustain', titleNp: 'समीक्षा र दिगोपन', tasks: ['Compare month water bill vs previous', 'Calculate liters saved', 'Write up water conservation policy'], tasksNp: ['गत महिना पानी बिल तुलना', 'बचाइएको लिटर गणना', 'पानी संरक्षण नीति तयार'] },
      ],
      responsible: 'Science Dept + Administrative Staff',
      responsibleNp: 'विज्ञान विभाग + प्रशासनिक कर्मचारी',
    },
    general: {
      weeks: [
        { week: 1, title: 'Baseline & Goals', titleNp: 'आधारभूत र लक्ष्य', tasks: ['Identify top 3 emission sources from last report', 'Set measurable monthly reduction target', 'Form green team with student representatives'], tasksNp: ['गत रिपोर्टबाट शीर्ष ३ उत्सर्जन स्रोत', 'मापनयोग्य मासिक कटौती लक्ष्य निर्धारण', 'विद्यार्थी प्रतिनिधिसहित हरित टोली गठन'] },
        { week: 2, title: 'Education & Engagement', titleNp: 'शिक्षा र संलग्नता', tasks: ['Hold climate assembly for all students', 'Create class-level eco competition', 'Involve parents via take-home sheet'], tasksNp: ['सबै विद्यार्थीलाई जलवायु सभा', 'कक्षा-स्तरीय इको प्रतियोगिता', 'घर-घर पत्रिका मार्फत अभिभावक संलग्नता'] },
        { week: 3, title: 'Actions Across School', titleNp: 'विद्यालयभर कार्यहरू', tasks: ['Assign one eco action per class per week', 'Track and post results on notice board', 'Interview students for newsletter story'], tasksNp: ['प्रति कक्षा प्रति हप्ता एक इको कार्य', 'सूचना बोर्डमा नतिजा ट्र्याक र पोस्ट', 'समाचारपत्र कथाका लागि विद्यार्थी अन्तर्वार्ता'] },
        { week: 4, title: 'Celebrate & Continue', titleNp: 'उत्सव र निरन्तरता', tasks: ['Award eco champion class/student', 'Submit data to EcoDrishti for scoring', 'Plan next month actions'], tasksNp: ['इको च्याम्पियन कक्षा/विद्यार्थीलाई पुरस्कार', 'स्कोरिङका लागि ड्यासबोर्डमा डेटा सबमिट', 'अर्को महिनाका कार्यहरू योजना'] },
      ],
      responsible: 'School Principal + Eco Club',
      responsibleNp: 'प्रधानाध्यापक + इको क्लब',
    },
  };
  return plans[rec.category] ?? plans['general'];
}

const DIFF_COLORS: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  hard: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
};

export default function CarbonCalculatorPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormData>(DEFAULT);
  const [submitted, setSubmitted] = useState<{ id: number; total: number; score: number } | null>(null);
  const [workPlanRec, setWorkPlanRec] = useState<WorkPlanRec | null>(null);

  const emissions = useMemo(() => calcEmissions(form), [form]);

  const submitMutation = useSubmitCarbonData({
    mutation: {
      onSuccess: (data) => {
        setSubmitted({ id: data.id, total: data.totalEmissionsKg, score: data.sustainabilityScore });
        toast({ title: lang === 'np' ? '✅ डेटा सफलतापूर्वक सबमिट भयो!' : '✅ Data submitted successfully!' });
      },
      onError: () => toast({ title: lang === 'np' ? '❌ सबमिट गर्न सकिएन।' : '❌ Submission failed.', variant: 'destructive' }),
    },
  });

  const genRecMutation = useGenerateRecommendations({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRecommendationsQueryKey() });
        toast({ title: lang === 'np' ? '🤖 एआई सिफारिसहरू तयार!' : '🤖 AI Recommendations ready!' });
      },
    },
  });

  const { data: recommendations } = useGetRecommendations({
    query: { enabled: !!submitted, queryKey: getGetRecommendationsQueryKey() }
  });

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.type === 'number' ? +e.target.value : e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      data: {
        month: form.month, year: form.year,
        studentCount: form.studentCount, staffCount: form.staffCount,
        electricityKwh: n(form.electricityKwh) || null,
        waterLiters: n(form.waterLiters) || null,
        wasteKg: n(form.wasteKg) || null,
        recyclingKg: n(form.recyclingKg) || null,
        compostingKg: n(form.compostingKg) || null,
        busRiders: n(form.busRiders) || null,
        walkersOrCyclers: n(form.walkersOrCyclers) || null,
        carRiders: n(form.carRiders) || null,
        fuelLiters: n(form.fuelLiters) || null,
      }
    });
  };

  const workPlan = workPlanRec ? generateWorkPlan(workPlanRec, user?.schoolName ?? 'Your School', lang) : null;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            {lang === 'np' ? 'कार्बन फुटप्रिन्ट क्याल्कुलेटर' : 'Carbon Footprint Calculator'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === 'np' ? 'मासिक डेटा भर्नुहोस् — उत्सर्जन स्वतः गणना हुन्छ।' : 'Fill in monthly data — emissions calculate in real time as you type.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* ===== Form — left 3/5 ===== */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4">
            {/* School Info */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-primary/15 rounded-md flex items-center justify-center text-primary text-xs font-bold">1</span>
                {lang === 'np' ? 'विद्यालय जानकारी' : 'School Info'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{lang === 'np' ? 'महिना' : 'Month'}</Label>
                  <select value={form.month} onChange={e => setForm(f => ({ ...f, month: +e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
                    {MONTHS_EN.map((m, i) => <option key={i} value={i + 1}>{lang === 'np' ? MONTHS_NP[i] : m}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">{lang === 'np' ? 'वर्ष' : 'Year'}</Label>
                  <Input type="number" min={2020} max={2030} value={form.year} onChange={set('year')} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{lang === 'np' ? 'विद्यार्थी' : 'Students'}</Label>
                  <Input type="number" min={1} value={form.studentCount} onChange={set('studentCount')} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{lang === 'np' ? 'कर्मचारी' : 'Staff'}</Label>
                  <Input type="number" min={1} value={form.staffCount} onChange={set('staffCount')} className="mt-1" />
                </div>
              </div>
            </div>

            {/* Electricity */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-md flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-orange-500" /></span>
                {lang === 'np' ? 'बिजुली' : 'Electricity'}
              </h3>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">{lang === 'np' ? 'मासिक बिजुली खपत' : 'Monthly Usage'}</Label>
                  <span className="text-[10px] text-orange-500 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">0.04 kg CO₂/kWh</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} placeholder="e.g. 2840" value={form.electricityKwh} onChange={set('electricityKwh')} className="flex-1" />
                  <span className="text-xs text-muted-foreground font-medium">kWh</span>
                </div>
                {n(form.electricityKwh) > 0 && <p className="text-xs text-orange-600 font-semibold mt-1">→ {npFixed(n(form.electricityKwh) * FACTORS.electricity, 1, lang)} kg CO₂</p>}
              </div>
            </div>

            {/* Water */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center"><Droplets className="w-3.5 h-3.5 text-blue-500" /></span>
                {lang === 'np' ? 'पानी' : 'Water'}
              </h3>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">{lang === 'np' ? 'मासिक पानी उपयोग' : 'Monthly Usage'}</Label>
                  <span className="text-[10px] text-blue-500 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">0.0003 kg CO₂/L</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} placeholder="e.g. 41500" value={form.waterLiters} onChange={set('waterLiters')} className="flex-1" />
                  <span className="text-xs text-muted-foreground font-medium">liters</span>
                </div>
                {n(form.waterLiters) > 0 && <p className="text-xs text-blue-600 font-semibold mt-1">→ {npFixed(n(form.waterLiters) * FACTORS.water, 1, lang)} kg CO₂</p>}
              </div>
            </div>

            {/* Waste */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-md flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-purple-500" /></span>
                {lang === 'np' ? 'फोहोर' : 'Waste'}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: 'wasteKg' as const, label: lang === 'np' ? 'कुल फोहोर' : 'Total Waste', hint: '0.5 kg CO₂/kg' },
                  { key: 'recyclingKg' as const, label: lang === 'np' ? 'पुनःचक्रण' : 'Recycled', hint: '✓ saves CO₂' },
                  { key: 'compostingKg' as const, label: lang === 'np' ? 'कम्पोस्ट' : 'Composted', hint: '✓ saves CO₂' },
                ] as const).map(f => (
                  <div key={f.key}>
                    <Label className="text-xs">{f.label}</Label>
                    <Input type="number" min={0} placeholder="0" value={form[f.key]} onChange={set(f.key)} className="mt-1 text-sm" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">{f.hint}</p>
                  </div>
                ))}
              </div>
              {n(form.wasteKg) > 0 && <p className="text-xs text-purple-600 font-semibold">{npFixed(emissions.landfill, 0, lang)} kg {lang === 'np' ? 'ल्यान्डफिल' : 'landfill'} → {npFixed(emissions.waste, 1, lang)} kg CO₂</p>}
            </div>

            {/* Transport */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-md flex items-center justify-center"><Bus className="w-3.5 h-3.5 text-emerald-600" /></span>
                {lang === 'np' ? 'यातायात' : 'Transportation'}
              </h3>
              <p className="text-xs text-muted-foreground -mt-1">{lang === 'np' ? `विद्यार्थी × ${npNum(SCHOOL_DAYS, lang)} दिन × उत्सर्जन कारक` : `Students × ${SCHOOL_DAYS} school days × emission factor`}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">{lang === 'np' ? 'बसमा' : 'By Bus'}</Label>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">0.05 kg/day</span>
                  </div>
                  <Input type="number" min={0} placeholder="192" value={form.busRiders} onChange={set('busRiders')} />
                  {n(form.busRiders) > 0 && <p className="text-[10px] text-emerald-600 mt-0.5">→ {npFixed(n(form.busRiders) * SCHOOL_DAYS * FACTORS.bus, 0, lang)} kg CO₂</p>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">{lang === 'np' ? 'कारमा' : 'By Car'}</Label>
                    <span className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded-full">0.12 kg/day</span>
                  </div>
                  <Input type="number" min={0} placeholder="97" value={form.carRiders} onChange={set('carRiders')} />
                  {n(form.carRiders) > 0 && <p className="text-[10px] text-rose-500 mt-0.5">→ {npFixed(n(form.carRiders) * SCHOOL_DAYS * FACTORS.car, 0, lang)} kg CO₂</p>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">{lang === 'np' ? 'पैदल/साइकल' : 'Walk/Cycle'}</Label>
                    <span className="text-[10px] text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded-full">0 CO₂ 🌿</span>
                  </div>
                  <Input type="number" min={0} placeholder="148" value={form.walkersOrCyclers} onChange={set('walkersOrCyclers')} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">{lang === 'np' ? 'डिजेल (L)' : 'Diesel (L)'}</Label>
                    <span className="text-[10px] text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">2.31 kg/L</span>
                  </div>
                  <Input type="number" min={0} placeholder="118" value={form.fuelLiters} onChange={set('fuelLiters')} />
                  {n(form.fuelLiters) > 0 && <p className="text-[10px] text-red-600 mt-0.5">→ {npFixed(n(form.fuelLiters) * FACTORS.fuel, 0, lang)} kg CO₂</p>}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? (lang === 'np' ? '⏳ सबमिट हुँदैछ...' : '⏳ Submitting...') : (lang === 'np' ? 'डेटा सेभ गर्नुहोस् →' : 'Save & Submit Data →')}
            </Button>
          </form>

          {/* ===== Right panel — 2/5 ===== */}
          <div className="lg:col-span-2 space-y-4">
            <div className="sticky top-4 space-y-4">
              {/* Live Total */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">{lang === 'np' ? 'लाइभ गणना' : 'Live Calculation'}</h3>
                  <span className="ml-auto text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium animate-pulse">
                    {lang === 'np' ? 'स्वत: अपडेट' : 'Live'}
                  </span>
                </div>
                <div className="text-center py-4 bg-card rounded-xl border border-border mb-3">
                  <div className="text-5xl font-black text-rose-500">{npFixed(emissions.total, 0, lang)}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">kg CO₂e {lang === 'np' ? 'यस महिना' : 'this month'}</div>
                  {(form.studentCount + form.staffCount) > 0 && (
                    <div className="text-sm font-semibold text-foreground mt-1">
                      {npFixed(emissions.perPerson, 2, lang)} kg / {lang === 'np' ? 'व्यक्ति' : 'person'}
                    </div>
                  )}
                </div>
                {/* Category mini-totals */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { icon: '🚌', label: lang === 'np' ? 'यातायात' : 'Transport', value: emissions.transport, color: 'text-emerald-600' },
                    { icon: '⚡', label: lang === 'np' ? 'बिजुली' : 'Electricity', value: emissions.electricity, color: 'text-orange-500' },
                    { icon: '♻️', label: lang === 'np' ? 'फोहोर' : 'Waste', value: emissions.waste, color: 'text-purple-600' },
                    { icon: '💧', label: lang === 'np' ? 'पानी' : 'Water', value: emissions.water, color: 'text-blue-600' },
                  ].map(c => (
                    <div key={c.label} className="bg-muted/40 rounded-lg p-2 flex items-center gap-1.5">
                      <span>{c.icon}</span>
                      <div>
                        <div className={`font-bold ${c.color}`}>{npFixed(c.value, 0, lang)} kg</div>
                        <div className="text-muted-foreground text-[10px]">{c.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nepal Emission Factors */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
                  {lang === 'np' ? 'नेपाल उत्सर्जन कारकहरू' : 'Nepal Emission Factors'}
                </h4>
                <div className="space-y-1.5">
                  {[
                    { label: lang === 'np' ? 'बिजुली (जलविद्युत)' : 'Electricity (Hydro)', value: '0.04 kg/kWh' },
                    { label: lang === 'np' ? 'पानी उपचार' : 'Water Treatment', value: '0.0003 kg/L' },
                    { label: lang === 'np' ? 'ल्यान्डफिल फोहोर' : 'Landfill Waste', value: '0.50 kg/kg' },
                    { label: lang === 'np' ? 'विद्यालय बस' : 'School Bus', value: '0.05 kg/student/day' },
                    { label: lang === 'np' ? 'कार/ट्याक्सी' : 'Car/Taxi', value: '0.12 kg/student/day' },
                    { label: lang === 'np' ? 'डिजेल' : 'Diesel', value: '2.31 kg/liter' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-mono font-semibold text-foreground">{r.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 italic">
                  {lang === 'np' ? 'स्रोत: नेपाल विद्युत प्राधिकरण, IPCC २०२१' : 'Source: Nepal Electricity Authority, IPCC 2021'}
                </p>
              </div>

              {/* AI Proxy Card */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/5 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold uppercase tracking-[0.22em] mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  Proxy AI
                </div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  {lang === 'np' ? 'How can i help you without proper data?' : 'How can i help you without proper data?'}
                </p>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  {lang === 'np'
                    ? 'प्रत्येक अनुमानलाई उपयोगी, व्यवहारिक र विद्यालय-उपयुक्त बनाउँदै Proxy AI ले तपाईंलाई अर्को चरणमा लैजान्छ।'
                    : 'Proxy AI turns rough inputs into practical school-ready estimates, recommendations, and action plans.'}
                </p>
                <Link href="/proxy-ai">
                  <Button className="w-full gap-2 font-bold shadow-lg shadow-emerald-500/10" variant="default">
                    <Brain className="w-4 h-4" />
                    <span className="text-base">Proxy AI</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </Button>
                </Link>
              </div>

              {/* Submitted result */}
              {submitted && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {lang === 'np' ? 'सफलतापूर्वक सेभ!' : 'Saved Successfully!'}
                    </h4>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-3">
                    {lang === 'np'
                      ? `कुल: ${npFixed(submitted.total, 0, lang)} kg CO₂ | स्कोर: ${npFixed(submitted.score, 0, lang)}/100`
                      : `Total: ${submitted.total.toFixed(0)} kg CO₂ | Score: ${submitted.score.toFixed(0)}/100`}
                  </p>
                  {!recommendations?.length && (
                    <Button size="sm" variant="outline" className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400"
                      onClick={() => genRecMutation.mutate({ data: { submissionId: submitted.id } })} disabled={genRecMutation.isPending}>
                      <Brain className="w-3.5 h-3.5 mr-1.5" />
                      {genRecMutation.isPending ? (lang === 'np' ? 'उत्पन्न हुँदैछ...' : 'Generating...') : (lang === 'np' ? 'एआई सिफारिस लिनुहोस्' : 'Get AI Recommendations')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-orange-500" />
              {lang === 'np' ? 'एआई सिफारिसहरू' : 'AI Recommendations'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {lang === 'np' ? 'एउटा सिफारिस छान्नुहोस् → हामी तपाईंको विद्यालयका लागि व्यक्तिगत कार्य योजना बनाउँछौं।' : 'Choose a recommendation → we\'ll create a personalised action plan for your school.'}
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {recommendations.map(rec => (
                <div key={rec.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer" onClick={() => setWorkPlanRec(rec)}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-lg">
                      {rec.category === 'transport' ? '🚌' : rec.category === 'electricity' ? '⚡' : rec.category === 'water' ? '💧' : '♻️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-sm text-foreground">{lang === 'np' ? rec.titleNp : rec.title}</h4>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${DIFF_COLORS[rec.difficulty]}`}>{rec.difficulty}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{lang === 'np' ? rec.descriptionNp : rec.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <TrendingDown className="w-3 h-3" />
                          {npFixed(rec.estimatedCarbonReductionKg, 0, lang)} kg CO₂ {lang === 'np' ? 'बचत' : 'saved'}
                        </span>
                        <span className="text-xs text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                          <ClipboardList className="w-3.5 h-3.5" />
                          {lang === 'np' ? 'कार्य योजना →' : 'Work Plan →'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work Plan Modal */}
        <Dialog open={!!workPlanRec} onOpenChange={open => { if (!open) setWorkPlanRec(null); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                {lang === 'np' ? 'व्यक्तिगत कार्य योजना' : 'Personalised Work Plan'}
              </DialogTitle>
            </DialogHeader>
            {workPlanRec && workPlan && (
              <div className="space-y-4">
                {/* Rec summary */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{workPlanRec.category === 'transport' ? '🚌' : workPlanRec.category === 'electricity' ? '⚡' : workPlanRec.category === 'water' ? '💧' : '♻️'}</span>
                    <h3 className="font-bold text-foreground text-sm">{lang === 'np' ? workPlanRec.titleNp : workPlanRec.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{lang === 'np' ? workPlanRec.descriptionNp : workPlanRec.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <TrendingDown className="w-3 h-3" />
                      {npFixed(workPlanRec.estimatedCarbonReductionKg, 0, lang)} kg CO₂ {lang === 'np' ? 'बचत' : 'reduction'}
                    </span>
                    <span className="flex items-center gap-1 text-foreground font-semibold">
                      <Users className="w-3 h-3" />
                      {lang === 'np' ? workPlan.responsibleNp : workPlan.responsible}
                    </span>
                    <span className="flex items-center gap-1 text-blue-600 font-semibold">
                      <Target className="w-3 h-3" />
                      {lang === 'np' ? `${user?.schoolName ?? 'तपाईंको विद्यालय'} — ४ हप्ता योजना` : `${user?.schoolName ?? 'Your School'} — 4-week plan`}
                    </span>
                  </div>
                </div>

                {/* 4-week plan */}
                <div className="space-y-3">
                  {workPlan.weeks.map(week => (
                    <div key={week.week} className="border border-border rounded-xl overflow-hidden">
                      <div className={`px-4 py-2.5 flex items-center gap-2 font-semibold text-sm ${
                        week.week === 1 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : week.week === 2 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : week.week === 3 ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                        : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      }`}>
                        <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">{npNum(week.week, lang)}</span>
                        {lang === 'np' ? `सप्ताह ${npNum(week.week, lang)}: ${week.titleNp}` : `Week ${week.week}: ${week.title}`}
                      </div>
                      <ul className="p-3 space-y-1.5">
                        {(lang === 'np' ? week.tasksNp : week.tasks).map((task, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <Button className="w-full" onClick={() => setWorkPlanRec(null)}>
                  {lang === 'np' ? '✅ कार्य योजना स्वीकार गर्नुहोस्' : '✅ Accept This Work Plan'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
