import { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubmitCarbonData, useGenerateRecommendations, useGetRecommendations, getGetRecommendationsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Zap, Droplets, Trash2, Bus, Brain, TrendingDown, CheckCircle, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FACTORS = {
  electricity: 0.04,   // kg CO₂ / kWh (Nepal hydro grid)
  water: 0.0003,       // kg CO₂ / liter
  waste: 0.5,          // kg CO₂ / kg waste (to landfill)
  wasteSaved: 0.1,     // kg CO₂ / kg recycled or composted
  bus: 0.05,           // kg CO₂ / student / day
  car: 0.12,           // kg CO₂ / student / day
  fuel: 2.31,          // kg CO₂ / liter diesel
};

const SCHOOL_DAYS = 22; // average working days per month

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
  electricityKwh: '2840',
  waterLiters: '41500',
  wasteKg: '265', recyclingKg: '48', compostingKg: '32',
  busRiders: '192', walkersOrCyclers: '148', carRiders: '97', fuelLiters: '118',
};

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_NP = ['जनवरी','फेब्रुअरी','मार्च','अप्रिल','मे','जुन','जुलाई','अगस्ट','सेप्टेम्बर','अक्टोबर','नोभेम्बर','डिसेम्बर'];

function n(s: string): number { return parseFloat(s) || 0; }

function calcEmissions(d: FormData) {
  const electricity = n(d.electricityKwh) * FACTORS.electricity;
  const water = n(d.waterLiters) * FACTORS.water;
  const waste = Math.max(0, (n(d.wasteKg) - n(d.recyclingKg) - n(d.compostingKg))) * FACTORS.waste;
  const bus = n(d.busRiders) * SCHOOL_DAYS * FACTORS.bus;
  const car = n(d.carRiders) * SCHOOL_DAYS * FACTORS.car;
  const fuel = n(d.fuelLiters) * FACTORS.fuel;
  const transport = bus + car + fuel;
  const total = electricity + water + waste + transport;
  const people = (d.studentCount || 0) + (d.staffCount || 0);
  const perPerson = people > 0 ? total / people : 0;
  const score = Math.max(0, Math.min(100, 100 - perPerson * 5));
  return { electricity, water, waste, transport, total, perPerson, score };
}

const DIFF_COLORS: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  hard: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
};

export default function CarbonCalculatorPage() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormData>(DEFAULT);
  const [submitted, setSubmitted] = useState<{ id: number; total: number; score: number } | null>(null);

  const emissions = useMemo(() => calcEmissions(form), [form]);

  const submitMutation = useSubmitCarbonData({
    mutation: {
      onSuccess: (data) => {
        setSubmitted({ id: data.id, total: data.totalEmissionsKg, score: data.sustainabilityScore });
        toast({ title: lang === 'np' ? '✅ डेटा सफलतापूर्वक सबमिट भयो!' : '✅ Data submitted successfully!' });
      },
      onError: () => {
        toast({ title: lang === 'np' ? '❌ सबमिट गर्न सकिएन।' : '❌ Submission failed.', variant: 'destructive' });
      }
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

  const pct = (v: number) => emissions.total > 0 ? Math.round((v / emissions.total) * 100) : 0;
  const scoreColor = emissions.score >= 70 ? '#10b981' : emissions.score >= 50 ? '#f97316' : '#ef4444';

  const catColor: Record<string, string> = {
    transport: 'text-emerald-600', electricity: 'text-orange-500',
    water: 'text-blue-600', waste: 'text-purple-600', general: 'text-amber-600',
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            {lang === 'np' ? 'कार्बन क्याल्कुलेटर' : 'Carbon Footprint Calculator'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === 'np' ? 'वास्तविक डेटा भर्नुहोस् — तपाईंले टाइप गर्दा उत्सर्जन स्वतः गणना हुन्छ।' : 'Fill in your school\'s monthly data — emissions calculate in real time as you type.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Form — left 3/5 */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4">

            {/* Period + School */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-primary/15 rounded-md flex items-center justify-center text-primary text-xs font-bold">1</span>
                {lang === 'np' ? 'विद्यालय जानकारी' : 'School Info'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{lang === 'np' ? 'महिना' : 'Month'}</Label>
                  <select
                    value={form.month}
                    onChange={e => setForm(f => ({ ...f, month: +e.target.value }))}
                    className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  >
                    {MONTHS_EN.map((m, i) => (
                      <option key={i} value={i + 1}>{lang === 'np' ? MONTHS_NP[i] : m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">{lang === 'np' ? 'वर्ष' : 'Year'}</Label>
                  <Input type="number" min={2020} max={2030} value={form.year} onChange={set('year')} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{lang === 'np' ? 'विद्यार्थी संख्या' : 'Students'}</Label>
                  <Input type="number" min={1} value={form.studentCount} onChange={set('studentCount')} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{lang === 'np' ? 'शिक्षक/कर्मचारी' : 'Staff'}</Label>
                  <Input type="number" min={1} value={form.staffCount} onChange={set('staffCount')} className="mt-1" />
                </div>
              </div>
            </div>

            {/* Energy */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-md flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-orange-500" />
                </span>
                {lang === 'np' ? 'बिजुली' : 'Electricity'}
              </h3>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">{lang === 'np' ? 'मासिक बिजुली खपत' : 'Monthly Electricity Usage'}</Label>
                  <span className="text-[10px] text-orange-500 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">
                    {FACTORS.electricity} kg CO₂/kWh
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} placeholder="e.g. 2840" value={form.electricityKwh} onChange={set('electricityKwh')} className="flex-1" />
                  <span className="text-xs text-muted-foreground font-medium">kWh</span>
                </div>
                {n(form.electricityKwh) > 0 && (
                  <p className="text-xs text-orange-600 font-medium mt-1">
                    → {(n(form.electricityKwh) * FACTORS.electricity).toFixed(1)} kg CO₂
                  </p>
                )}
              </div>
            </div>

            {/* Water */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                </span>
                {lang === 'np' ? 'पानी' : 'Water'}
              </h3>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">{lang === 'np' ? 'मासिक पानी उपयोग' : 'Monthly Water Usage'}</Label>
                  <span className="text-[10px] text-blue-500 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                    {FACTORS.water} kg CO₂/liter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} placeholder="e.g. 41500" value={form.waterLiters} onChange={set('waterLiters')} className="flex-1" />
                  <span className="text-xs text-muted-foreground font-medium">liters</span>
                </div>
                {n(form.waterLiters) > 0 && (
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    → {(n(form.waterLiters) * FACTORS.water).toFixed(1)} kg CO₂
                  </p>
                )}
              </div>
            </div>

            {/* Waste */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-md flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5 text-purple-500" />
                </span>
                {lang === 'np' ? 'फोहोर' : 'Waste'}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'wasteKg' as const, label: lang === 'np' ? 'कुल फोहोर' : 'Total Waste', unit: 'kg', hint: '→ 0.5 kg CO₂/kg' },
                  { key: 'recyclingKg' as const, label: lang === 'np' ? 'पुनःचक्रण' : 'Recycled', unit: 'kg', hint: '✓ saves CO₂' },
                  { key: 'compostingKg' as const, label: lang === 'np' ? 'कम्पोस्ट' : 'Composted', unit: 'kg', hint: '✓ saves CO₂' },
                ].map(f => (
                  <div key={f.key}>
                    <Label className="text-xs">{f.label}</Label>
                    <Input type="number" min={0} placeholder="0" value={form[f.key]} onChange={set(f.key)} className="mt-1 text-sm" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">{f.hint}</p>
                  </div>
                ))}
              </div>
              {n(form.wasteKg) > 0 && (
                <p className="text-xs text-purple-600 font-medium">
                  → {Math.max(0, n(form.wasteKg) - n(form.recyclingKg) - n(form.compostingKg)).toFixed(0)} kg landfill × 0.5 = {emissions.waste.toFixed(1)} kg CO₂
                </p>
              )}
            </div>

            {/* Transport */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-md flex items-center justify-center">
                  <Bus className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                {lang === 'np' ? 'यातायात' : 'Transportation'}
              </h3>
              <p className="text-xs text-muted-foreground -mt-1">
                {lang === 'np' ? `गणना: विद्यार्थी × ${SCHOOL_DAYS} दिन × उत्सर्जन कारक` : `Calculated as: students × ${SCHOOL_DAYS} school days/month × emission factor`}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">{lang === 'np' ? 'बसमा आउने' : 'Bus Riders'}</Label>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">0.05 kg/day</span>
                  </div>
                  <Input type="number" min={0} placeholder="e.g. 192" value={form.busRiders} onChange={set('busRiders')} />
                  {n(form.busRiders) > 0 && <p className="text-[10px] text-emerald-600 mt-0.5">→ {(n(form.busRiders) * SCHOOL_DAYS * FACTORS.bus).toFixed(0)} kg CO₂</p>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">{lang === 'np' ? 'कारमा आउने' : 'Car Riders'}</Label>
                    <span className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded-full">0.12 kg/day</span>
                  </div>
                  <Input type="number" min={0} placeholder="e.g. 97" value={form.carRiders} onChange={set('carRiders')} />
                  {n(form.carRiders) > 0 && <p className="text-[10px] text-rose-500 mt-0.5">→ {(n(form.carRiders) * SCHOOL_DAYS * FACTORS.car).toFixed(0)} kg CO₂</p>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">{lang === 'np' ? 'पैदल/साइकल' : 'Walk / Cycle'}</Label>
                    <span className="text-[10px] text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded-full">0 kg CO₂ 🌿</span>
                  </div>
                  <Input type="number" min={0} placeholder="e.g. 148" value={form.walkersOrCyclers} onChange={set('walkersOrCyclers')} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">{lang === 'np' ? 'इन्धन (डिजेल)' : 'Diesel Fuel'}</Label>
                    <span className="text-[10px] text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">2.31 kg/liter</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input type="number" min={0} placeholder="e.g. 118" value={form.fuelLiters} onChange={set('fuelLiters')} />
                    <span className="text-xs text-muted-foreground">L</span>
                  </div>
                  {n(form.fuelLiters) > 0 && <p className="text-[10px] text-red-600 mt-0.5">→ {(n(form.fuelLiters) * FACTORS.fuel).toFixed(0)} kg CO₂</p>}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={submitMutation.isPending}>
              {submitMutation.isPending
                ? (lang === 'np' ? '⏳ सबमिट हुँदैछ...' : '⏳ Submitting...')
                : (lang === 'np' ? 'डेटा सेभ गर्नुहोस् →' : 'Save & Submit Data →')}
            </Button>
          </form>

          {/* Live Results panel — right 2/5 */}
          <div className="lg:col-span-2 space-y-4">
            <div className="sticky top-4 space-y-4">
              {/* Live preview */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">
                    {lang === 'np' ? 'लाइभ गणना' : 'Live Calculation'}
                  </h3>
                  <span className="ml-auto text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium animate-pulse">
                    {lang === 'np' ? 'स्वत: अपडेट' : 'Auto-updating'}
                  </span>
                </div>

                {/* Total */}
                <div className="text-center mb-4 py-3 bg-card rounded-xl border border-border">
                  <div className="text-4xl font-black text-rose-500">{emissions.total.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground font-medium">kg CO₂ {lang === 'np' ? 'यस महिना' : 'this month'}</div>
                  {(form.studentCount + form.staffCount) > 0 && (
                    <div className="text-sm font-semibold text-foreground mt-1">
                      {emissions.perPerson.toFixed(2)} kg / {lang === 'np' ? 'व्यक्ति' : 'person'}
                    </div>
                  )}
                </div>

                {/* Score gauge */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium">{lang === 'np' ? 'दिगोपन स्कोर' : 'Sustainability Score'}</span>
                    <span className="font-extrabold text-sm" style={{ color: scoreColor }}>{emissions.score.toFixed(0)}/100</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-300"
                      style={{ width: `${emissions.score}%`, background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})` }}
                    />
                  </div>
                  <p className="text-xs font-semibold mt-1" style={{ color: scoreColor }}>
                    {emissions.score >= 85 ? '🏆 ' + (lang === 'np' ? 'उत्कृष्ट!' : 'Excellent!')
                      : emissions.score >= 70 ? '🌟 ' + (lang === 'np' ? 'राम्रो!' : 'Good!')
                      : emissions.score >= 50 ? '🌱 ' + (lang === 'np' ? 'सुधार गर्दै' : 'Getting Better')
                      : '⚠️ ' + (lang === 'np' ? 'सुधार चाहिन्छ' : 'Needs Work')}
                  </p>
                </div>

                {/* Category bars */}
                <div className="space-y-2.5">
                  {[
                    { label: lang === 'np' ? '🚌 यातायात' : '🚌 Transport', value: emissions.transport, color: '#10b981' },
                    { label: lang === 'np' ? '⚡ बिजुली' : '⚡ Electricity', value: emissions.electricity, color: '#f97316' },
                    { label: lang === 'np' ? '♻️ फोहोर' : '♻️ Waste', value: emissions.waste, color: '#8b5cf6' },
                    { label: lang === 'np' ? '💧 पानी' : '💧 Water', value: emissions.water, color: '#3b82f6' },
                  ].map(cat => (
                    <div key={cat.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-foreground font-medium">{cat.label}</span>
                        <span className="font-bold" style={{ color: cat.color }}>
                          {cat.value.toFixed(0)} kg ({pct(cat.value)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ width: `${pct(cat.value)}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emission factors reference */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
                  {lang === 'np' ? 'नेपाल उत्सर्जन कारकहरू' : 'Nepal Emission Factors'}
                </h4>
                <div className="space-y-1.5">
                  {[
                    { label: 'Electricity', value: '0.04 kg CO₂/kWh', note: 'Hydro grid' },
                    { label: 'Water', value: '0.0003 kg CO₂/L', note: 'Treatment' },
                    { label: 'Waste', value: '0.5 kg CO₂/kg', note: 'Landfill' },
                    { label: 'School bus', value: '0.05 kg CO₂/student/day', note: '' },
                    { label: 'Car/taxi', value: '0.12 kg CO₂/student/day', note: '' },
                    { label: 'Diesel', value: '2.31 kg CO₂/liter', note: 'Generator' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-mono font-medium text-foreground">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submitted result */}
              {submitted && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {lang === 'np' ? 'सफलतापूर्वक सेभ भयो!' : 'Saved Successfully!'}
                    </h4>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-3">
                    {lang === 'np'
                      ? `कुल: ${submitted.total.toFixed(0)} kg CO₂ | स्कोर: ${submitted.score.toFixed(0)}/100`
                      : `Total: ${submitted.total.toFixed(0)} kg CO₂ | Score: ${submitted.score.toFixed(0)}/100`}
                  </p>
                  {!recommendations?.length && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400"
                      onClick={() => genRecMutation.mutate({ data: { submissionId: submitted.id } })}
                      disabled={genRecMutation.isPending}
                    >
                      <Brain className="w-3.5 h-3.5 mr-1.5" />
                      {genRecMutation.isPending
                        ? (lang === 'np' ? 'उत्पन्न हुँदैछ...' : 'Generating...')
                        : (lang === 'np' ? 'एआई सिफारिस लिनुहोस्' : 'Get AI Recommendations')}
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
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-orange-500" />
              {lang === 'np' ? 'एआई सिफारिसहरू' : 'AI Recommendations'}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {recommendations.map(rec => (
                <div key={rec.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-lg`}>
                      {rec.category === 'transport' ? '🚌' : rec.category === 'electricity' ? '⚡' : rec.category === 'water' ? '💧' : '♻️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-sm text-foreground">
                          {lang === 'np' ? rec.titleNp : rec.title}
                        </h4>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${DIFF_COLORS[rec.difficulty]}`}>
                          {rec.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {lang === 'np' ? rec.descriptionNp : rec.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs font-medium">
                        <span className="flex items-center gap-1 text-emerald-600">
                          <TrendingDown className="w-3 h-3" />
                          {rec.estimatedCarbonReductionKg.toFixed(0)} kg CO₂ saved
                        </span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
