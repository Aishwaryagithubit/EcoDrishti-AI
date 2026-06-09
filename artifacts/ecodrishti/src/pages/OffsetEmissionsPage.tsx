import { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Leaf, Brain, TrendingDown, ChevronRight, Target, Users, ClipboardList, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { npNum, npFixed } from '@/lib/nepali';

interface ProxyAnswers {
  studentCount: number;
  staffCount: number;
  walkPct: number;
  busPct: number;
  carPct: number;
  energySource: 'grid' | 'solar' | 'diesel' | 'mixed';
  monthlyBill: number;
  hasCanteen: boolean;
  meatDaysPerWeek: number;
  wasteManagement: 'landfill' | 'segregated' | 'compost';
  waterSource: 'municipality' | 'well' | 'bottled';
  hasGarden: boolean;
  schoolDays: number;
}

const DEFAULT: ProxyAnswers = {
  studentCount: 500, staffCount: 35,
  walkPct: 30, busPct: 40, carPct: 30,
  energySource: 'grid', monthlyBill: 8500,
  hasCanteen: true, meatDaysPerWeek: 3,
  wasteManagement: 'segregated',
  waterSource: 'municipality',
  hasGarden: false, schoolDays: 22,
};

function calcProxy(a: ProxyAnswers) {
  const total = a.studentCount + a.staffCount;

  // Transport
  const busStudents = Math.round(a.studentCount * a.busPct / 100);
  const carStudents = Math.round(a.studentCount * a.carPct / 100);
  const transport = (busStudents * a.schoolDays * 0.05) + (carStudents * a.schoolDays * 0.12);

  // Electricity (estimate kWh from bill: avg NRs 11/kWh in Nepal)
  const kwhEstimate = a.monthlyBill / 11;
  const elecFactor = a.energySource === 'diesel' ? 0.7 : a.energySource === 'solar' ? 0.01 : a.energySource === 'mixed' ? 0.1 : 0.04;
  const electricity = kwhEstimate * elecFactor;

  // Water
  const waterFactor = a.waterSource === 'bottled' ? 0.08 : a.waterSource === 'municipality' ? 0.0003 : 0.0001;
  const waterLiters = total * 5 * a.schoolDays;
  const water = waterLiters * waterFactor;

  // Waste
  const dailyWasteKg = total * 0.05;
  const monthlyWaste = dailyWasteKg * a.schoolDays;
  const wasteFactor = a.wasteManagement === 'landfill' ? 0.5 : a.wasteManagement === 'segregated' ? 0.3 : 0.1;
  const waste = monthlyWaste * wasteFactor;

  // Canteen/food
  const food = a.hasCanteen ? (a.studentCount * a.meatDaysPerWeek * 4 * 0.8) : 0;

  const totalKg = transport + electricity + water + waste + food;
  const perPerson = total > 0 ? totalKg / total : 0;
  const score = Math.max(0, Math.min(100, 100 - perPerson * 5));
  return { transport, electricity, water, waste, food, totalKg, perPerson, score };
}

interface ProxyRec {
  id: string;
  category: string;
  title: string;
  titleNp: string;
  description: string;
  descriptionNp: string;
  saving: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

function makeRecs(r: ReturnType<typeof calcProxy>, lang: string): ProxyRec[] {
  const recs: ProxyRec[] = [];
  if (r.transport > 200) recs.push({ id: 'trans', category: 'transport', title: 'Shift More Students to Walking/Cycling', titleNp: 'अधिक विद्यार्थीलाई हिँड्ने/साइकलमा स्थानान्तरण गर्नुहोस्', description: 'Increase walk/cycle share by 10% — reduces transport emissions significantly.', descriptionNp: 'हिँड्ने/साइकल अंश १०% बढाउनुहोस् — यातायात उत्सर्जन उल्लेखनीय रूपमा घट्छ।', saving: r.transport * 0.12, difficulty: 'medium' });
  if (r.electricity > 100) recs.push({ id: 'elec', category: 'electricity', title: 'Install Solar Panels & LED Lighting', titleNp: 'सोलार प्यानल र LED बत्ती जडान गर्नुहोस्', description: 'Switch to solar and replace all fluorescent lights with LED to cut electricity by 60%.', descriptionNp: 'सोलारमा स्विच गर्नुहोस् र सबै बत्तीलाई LED ले प्रतिस्थापन गरी बिजुली ६०% घटाउनुहोस्।', saving: r.electricity * 0.6, difficulty: 'hard' });
  if (r.waste > 50) recs.push({ id: 'waste', category: 'waste', title: 'Full Waste Segregation & Composting', titleNp: 'पूर्ण फोहोर पृथकीकरण र कम्पोस्टिङ', description: 'Move from landfill to compost — divert 80% of organic waste from landfill.', descriptionNp: 'ल्यान्डफिलबाट कम्पोस्टमा जानुहोस् — ८०% जैविक फोहोर ल्यान्डफिलबाट हटाउनुहोस्।', saving: r.waste * 0.6, difficulty: 'easy' });
  if (r.food > 100) recs.push({ id: 'food', category: 'general', title: 'Introduce Plant-Based Canteen Menus', titleNp: 'बिरुवामा आधारित क्यान्टिन मेनु सुरु गर्नुहोस्', description: 'Reduce meat days from 3 to 1 per week — cuts food-related emissions by 50%.', descriptionNp: 'मासु दिन ३ बाट १ प्रति हप्तामा घटाउनुहोस् — खाना सम्बन्धी उत्सर्जन ५०% घट्छ।', saving: r.food * 0.5, difficulty: 'medium' });
  if (r.water > 20) recs.push({ id: 'water', category: 'water', title: 'Rainwater Harvesting System', titleNp: 'वर्षाजल संकलन प्रणाली', description: 'Collect rainwater for toilets and garden use — reduces municipal water draw by 30%.', descriptionNp: 'शौचालय र बगैँचाका लागि वर्षाजल संकलन — नगरपालिका पानी खिंच ३०% घट्छ।', saving: r.water * 0.3, difficulty: 'hard' });
  // Ensure at least 3 recs
  if (recs.length < 3) recs.push({ id: 'audit', category: 'general', title: 'Monthly Carbon Monitoring Program', titleNp: 'मासिक कार्बन अनुगमन कार्यक्रम', description: 'Track emissions monthly and set reduction targets — builds accountability.', descriptionNp: 'मासिक उत्सर्जन ट्र्याक गर्नुहोस् र कटौती लक्ष्य राख्नुहोस्।', saving: r.totalKg * 0.05, difficulty: 'easy' });
  return recs.slice(0, 5);
}

const DIFF_COLORS: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  hard: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
};

const WORK_PLANS: Record<string, { weeks: { week: number; title: string; titleNp: string; tasks: string[]; tasksNp: string[] }[] }> = {
  trans: { weeks: [
    { week: 1, title: 'Map Travel Patterns', titleNp: 'यात्रा ढाँचा नक्सा', tasks: ['Survey all students on how they commute', 'Mark walking zones on school map', 'Identify safe cycle routes'], tasksNp: ['विद्यार्थीको यातायात सर्वेक्षण', 'विद्यालय नक्सामा हिँड्ने क्षेत्र', 'सुरक्षित साइकल मार्ग पहिचान'] },
    { week: 2, title: 'Launch Campaign', titleNp: 'अभियान सुरु', tasks: ['Hold "Walk to School" assembly', 'Create pledge wall', 'Contact parents by SMS'], tasksNp: ['हिँड्ने सभा', 'प्रतिज्ञा दीवार', 'अभिभावकलाई SMS'] },
    { week: 3, title: 'Run Challenge', titleNp: 'चुनौती चलाउने', tasks: ['Daily walk/cycle tally per class', 'Award stickers to participants', 'Announce weekly leaderboard'], tasksNp: ['कक्षाको दैनिक गणना', 'सहभागीलाई स्टिकर', 'साप्ताहिक लिडरबोर्ड'] },
    { week: 4, title: 'Measure & Celebrate', titleNp: 'मापन र उत्सव', tasks: ['Calculate CO₂ saved', 'Award winning class', 'Submit to EcoDrishti'], tasksNp: ['CO₂ बचत गणना', 'विजेता कक्षालाई पुरस्कार', 'ड्यासबोर्डमा सबमिट'] },
  ]},
  elec: { weeks: [
    { week: 1, title: 'Energy Audit', titleNp: 'ऊर्जा अडिट', tasks: ['List all electrical devices', 'Measure standby loads', 'Identify top waste areas'], tasksNp: ['सबै विद्युत उपकरण सूची', 'स्ट्यान्डबाई लोड मापन', 'शीर्ष बर्बादी क्षेत्र'] },
    { week: 2, title: 'Quick Fixes', titleNp: 'तत्काल सुधार', tasks: ['Put reminders on all switches', 'Set auto-off schedules', 'Replace 10 bulbs with LED'], tasksNp: ['स्विचमा सम्झाइपत्र', 'स्वत: बन्द समयतालिका', '१० बल्बलाई LED प्रतिस्थापन'] },
    { week: 3, title: 'Student Monitors', titleNp: 'विद्यार्थी निगरानी', tasks: ['Appoint energy monitor per class', 'Daily checklist before leaving', 'Track weekly readings'], tasksNp: ['कक्षाको ऊर्जा निगरानी', 'जाँदा दैनिक जाँचसूची', 'साप्ताहिक रिडिङ'] },
    { week: 4, title: 'Report Savings', titleNp: 'बचत रिपोर्ट', tasks: ['Compare kWh to last month', 'Calculate CO₂ avoided', 'Present to management'], tasksNp: ['गत महिनासँग kWh', 'बचाइएको CO₂', 'व्यवस्थापनलाई प्रस्तुत'] },
  ]},
};

export default function OffsetEmissionsPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<ProxyAnswers>(DEFAULT);
  const [showResults, setShowResults] = useState(false);
  const [selectedRec, setSelectedRec] = useState<ProxyRec | null>(null);

  const result = useMemo(() => calcProxy(answers), [answers]);
  const recs = useMemo(() => showResults ? makeRecs(result, lang) : [], [result, lang, showResults]);

  const scoreColor = result.score >= 70 ? '#10b981' : result.score >= 50 ? '#f97316' : '#ef4444';
  const h = new Date().getHours();
  const greeting = h < 12 ? (lang === 'np' ? 'शुभ प्रभात 🌅' : 'Good morning 🌅') : h < 17 ? (lang === 'np' ? 'शुभ दिनमध्यान ☀️' : 'Good afternoon ☀️') : (lang === 'np' ? 'शुभ सन्ध्या 🌙' : 'Good evening 🌙');

  const wp = selectedRec ? (WORK_PLANS[selectedRec.id] ?? WORK_PLANS['elec']) : null;

  const sel = (key: keyof ProxyAnswers) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.type === 'number' ? +e.target.value : e.target.value;
    setAnswers(a => ({ ...a, [key]: v }));
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/carbon-calculator">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {lang === 'np' ? 'क्याल्कुलेटरमा फर्कनुहोस्' : 'Back to Calculator'}
            </button>
          </Link>
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5">
            <p className="text-lg font-bold text-foreground">{greeting}</p>
            <p className="text-base font-semibold text-foreground mt-1">
              {lang === 'np' ? `स्वागत छ, ${user?.name?.split(' ')[0] ?? ''}!` : `Welcome, ${user?.name?.split(' ')[0] ?? ''}!`}
            </p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {lang === 'np'
                ? 'यो उपकरणले तपाईंलाई आफ्नो विद्यालयको कार्बन उत्सर्जन बुझ्न मद्दत गर्छ। केही सरल प्रश्नहरूको उत्तर दिएर, तपाईंले जलवायु परिवर्तनमा आफ्नो प्रभावको बारेमा बहुमूल्य जानकारी प्राप्त गर्नुहुन्छ। के तपाईं आफ्नो पर्यावरणीय प्रभाव नियन्त्रण गर्न तयार हुनुहुन्छ? हामी मिलेर तपाईंको कार्बन फुटप्रिन्ट अन्वेषण गरौं।'
                : "This tool helps you understand your school's carbon emissions. By answering a few simple questions, you'll gain valuable insights into your impact on climate change. Ready to take charge of your environmental impact? Let's explore your carbon footprint together."}
            </p>
          </div>
        </div>

        {/* Proxy Questions */}
        <div className="space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            {lang === 'np' ? 'प्रश्नहरूको उत्तर दिनुहोस्' : 'Answer Proxy Questions'}
          </h2>

          {/* Q1 - School size */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {lang === 'np' ? '१. विद्यालयको आकार' : '1. School Size'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{lang === 'np' ? 'विद्यार्थी' : 'Students'}</Label>
                <input type="number" min={1} value={answers.studentCount} onChange={sel('studentCount')} className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <Label className="text-xs">{lang === 'np' ? 'शिक्षक/कर्मचारी' : 'Staff'}</Label>
                <input type="number" min={1} value={answers.staffCount} onChange={sel('staffCount')} className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>

          {/* Q2 - Transport */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {lang === 'np' ? '२. विद्यार्थीहरू कसरी विद्यालय आउँछन्? (% अनुमान)' : '2. How do students commute? (% estimate)'}
            </h3>
            <p className="text-xs text-muted-foreground">{lang === 'np' ? 'जोड १००% हुनुपर्छ' : 'Should sum to 100%'}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'walkPct' as const, label: lang === 'np' ? '🚶 पैदल/साइकल' : '🚶 Walk/Cycle' },
                { key: 'busPct' as const, label: lang === 'np' ? '🚌 बस' : '🚌 Bus' },
                { key: 'carPct' as const, label: lang === 'np' ? '🚗 कार/ट्याक्सी' : '🚗 Car/Taxi' },
              ].map(f => (
                <div key={f.key}>
                  <Label className="text-xs">{f.label}</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <input type="number" min={0} max={100} value={answers[f.key]} onChange={sel(f.key)} className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/30" />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Q3 - Energy */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {lang === 'np' ? '३. ऊर्जा र बिजुली' : '3. Energy & Electricity'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{lang === 'np' ? 'मुख्य ऊर्जा स्रोत' : 'Main Energy Source'}</Label>
                <select value={answers.energySource} onChange={sel('energySource')} className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="grid">{lang === 'np' ? 'जाति ग्रिड (जलविद्युत)' : 'Grid (Hydro Nepal)'}</option>
                  <option value="solar">{lang === 'np' ? 'सोलार प्यानल' : 'Solar Panels'}</option>
                  <option value="diesel">{lang === 'np' ? 'डिजेल जेनेरेटर' : 'Diesel Generator'}</option>
                  <option value="mixed">{lang === 'np' ? 'मिश्रित' : 'Mixed'}</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">{lang === 'np' ? 'मासिक बिजुली बिल (रु.)' : 'Monthly Electricity Bill (NPR)'}</Label>
                <input type="number" min={0} value={answers.monthlyBill} onChange={sel('monthlyBill')} className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>

          {/* Q4 - Canteen */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {lang === 'np' ? '४. क्यान्टिन र खाना' : '4. Canteen & Food'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="canteen" checked={answers.hasCanteen} onChange={sel('hasCanteen')} className="w-4 h-4 accent-primary" />
                <Label htmlFor="canteen" className="text-xs cursor-pointer">{lang === 'np' ? 'क्यान्टिन छ?' : 'Has canteen?'}</Label>
              </div>
              {answers.hasCanteen && (
                <div>
                  <Label className="text-xs">{lang === 'np' ? 'प्रति हप्ता मासु दिन' : 'Meat days per week'}</Label>
                  <input type="number" min={0} max={5} value={answers.meatDaysPerWeek} onChange={sel('meatDaysPerWeek')} className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              )}
            </div>
          </div>

          {/* Q5 - Waste & Water */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {lang === 'np' ? '५. फोहोर र पानी' : '5. Waste & Water'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{lang === 'np' ? 'फोहोर व्यवस्थापन' : 'Waste Management'}</Label>
                <select value={answers.wasteManagement} onChange={sel('wasteManagement')} className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="landfill">{lang === 'np' ? 'मिश्रित ल्यान्डफिल' : 'Mixed Landfill'}</option>
                  <option value="segregated">{lang === 'np' ? 'पृथकीकृत संकलन' : 'Segregated Collection'}</option>
                  <option value="compost">{lang === 'np' ? 'कम्पोस्ट + पुनःचक्रण' : 'Compost + Recycling'}</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">{lang === 'np' ? 'पानीको स्रोत' : 'Water Source'}</Label>
                <select value={answers.waterSource} onChange={sel('waterSource')} className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="municipality">{lang === 'np' ? 'नगरपालिका आपूर्ति' : 'Municipality Supply'}</option>
                  <option value="well">{lang === 'np' ? 'इनार/भूमिगत' : 'Well/Groundwater'}</option>
                  <option value="bottled">{lang === 'np' ? 'बोतल पानी' : 'Bottled Water'}</option>
                </select>
              </div>
            </div>
          </div>

          <Button className="w-full h-11 text-base font-semibold" onClick={() => setShowResults(true)}>
            <Brain className="w-4 h-4 mr-2" />
            {lang === 'np' ? 'कार्बन फुटप्रिन्ट गणना गर्नुहोस्' : 'Calculate Carbon Footprint'}
          </Button>
        </div>

        {/* Results */}
        {showResults && (
          <div className="space-y-5">
            {/* Score */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-primary" />
                {lang === 'np' ? `${user?.schoolName ?? 'तपाईंको विद्यालय'} — कार्बन रिपोर्ट` : `${user?.schoolName ?? 'Your School'} — Carbon Report`}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                <div className="text-center p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800/30">
                  <div className="text-3xl font-black text-rose-500">{npFixed(result.totalKg, 0, lang)}</div>
                  <div className="text-xs text-muted-foreground">kg CO₂e {lang === 'np' ? 'अनुमानित' : 'estimated'}</div>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="text-3xl font-black" style={{ color: scoreColor }}>{npFixed(result.score, 0, lang)}</div>
                  <div className="text-xs text-muted-foreground">{lang === 'np' ? 'दिगोपन स्कोर' : 'Sustainability Score'}</div>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 col-span-2 sm:col-span-1">
                  <div className="text-3xl font-black text-blue-600">{npFixed(result.perPerson, 2, lang)}</div>
                  <div className="text-xs text-muted-foreground">kg CO₂ / {lang === 'np' ? 'व्यक्ति' : 'person'}</div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: lang === 'np' ? 'यातायात' : 'Transport', v: result.transport, c: '#10b981' },
                  { label: lang === 'np' ? 'बिजुली' : 'Electricity', v: result.electricity, c: '#f97316' },
                  { label: lang === 'np' ? 'फोहोर' : 'Waste', v: result.waste, c: '#8b5cf6' },
                  { label: lang === 'np' ? 'पानी' : 'Water', v: result.water, c: '#3b82f6' },
                  { label: lang === 'np' ? 'खाना' : 'Food', v: result.food, c: '#f43f5e' },
                ].map(c => (
                  <div key={c.label} className="text-center p-2 bg-muted/30 rounded-lg">
                    <div className="text-xs font-bold" style={{ color: c.c }}>{npFixed(c.v, 0, lang)}</div>
                    <div className="text-[10px] text-muted-foreground">{c.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div>
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-500" />
                {lang === 'np' ? 'एआई सिफारिसहरू' : 'AI Recommendations'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {lang === 'np' ? 'एउटा छान्नुहोस् → तपाईंको विद्यालयका लागि व्यक्तिगत ४-हप्ते कार्य योजना।' : 'Choose one → get a personalised 4-week action plan for your school.'}
              </p>
              <div className="space-y-3">
                {recs.map(rec => (
                  <div key={rec.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group" onClick={() => setSelectedRec(rec)}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-lg">
                        {rec.category === 'transport' ? '🚌' : rec.category === 'electricity' ? '⚡' : rec.category === 'water' ? '💧' : rec.category === 'general' ? '🌍' : '♻️'}
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
                            {npFixed(rec.saving, 0, lang)} kg CO₂ {lang === 'np' ? 'बचत' : 'saved'}
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
          </div>
        )}

        {/* Work Plan Modal */}
        <Dialog open={!!selectedRec} onOpenChange={o => { if (!o) setSelectedRec(null); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                {lang === 'np' ? 'व्यक्तिगत ४-हप्ते कार्य योजना' : 'Personalised 4-Week Work Plan'}
              </DialogTitle>
            </DialogHeader>
            {selectedRec && wp && (
              <div className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <h3 className="font-bold text-sm text-foreground mb-1">{lang === 'np' ? selectedRec.titleNp : selectedRec.title}</h3>
                  <p className="text-xs text-muted-foreground">{lang === 'np' ? selectedRec.descriptionNp : selectedRec.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs font-semibold">
                    <span className="text-emerald-600 flex items-center gap-1"><TrendingDown className="w-3 h-3" />{npFixed(selectedRec.saving, 0, lang)} kg CO₂</span>
                    <span className="text-blue-600 flex items-center gap-1"><Target className="w-3 h-3" />{user?.schoolName ?? (lang === 'np' ? 'तपाईंको विद्यालय' : 'Your School')}</span>
                  </div>
                </div>
                {wp.weeks.map(week => (
                  <div key={week.week} className="border border-border rounded-xl overflow-hidden">
                    <div className={`px-4 py-2.5 flex items-center gap-2 font-semibold text-sm ${
                      week.week === 1 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700' : week.week === 2 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : week.week === 3 ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700'
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
                <Button className="w-full" onClick={() => setSelectedRec(null)}>
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
