import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/components/AppLayout';
import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetEmissionsTrend, getGetEmissionsTrendQueryKey,
  useGetCategoryBreakdown, getGetCategoryBreakdownQueryKey,
} from '@workspace/api-client-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Leaf, TrendingDown, Users, Zap, Award, ShieldCheck, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useRef, useState } from 'react';

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const start = 0;
    const end = value;
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);
  return <span>{display.toLocaleString()}{suffix}</span>;
}

function EmissionsGlobe({ breakdown }: { breakdown: { category: string; percentage: number; color: string }[] }) {
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setRotation(r => (r + 0.5) % 360), 50);
    return () => clearInterval(id);
  }, []);

  const COLORS = ['#059669', '#0d9488', '#f59e0b', '#3b82f6', '#8b5cf6'];

  return (
    <div className="relative h-52 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-40 h-40 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #059669 0% 35%, #0d9488 35% 60%, #f59e0b 60% 78%, #3b82f6 78% 92%, #8b5cf6 92% 100%)',
            transform: `rotate(${rotation}deg)`,
            boxShadow: '0 0 40px rgba(5,150,105,0.3), inset 0 0 20px rgba(0,0,0,0.2)',
            transition: 'transform 0.05s linear',
          }}
        />
        <div className="absolute w-28 h-28 rounded-full bg-card flex flex-col items-center justify-center shadow-inner">
          <Leaf className="w-6 h-6 text-primary mb-1" />
          <span className="text-xs font-bold text-foreground">Emissions</span>
          <span className="text-[10px] text-muted-foreground">Breakdown</span>
        </div>
      </div>
    </div>
  );
}

const SCORE_COLORS = { good: '#059669', ok: '#f59e0b', bad: '#ef4444' };

export default function DashboardPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();

  const { data: summary, isLoading: sumLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });
  const { data: trend, isLoading: trendLoading } = useGetEmissionsTrend({
    query: { queryKey: getGetEmissionsTrendQueryKey() }
  });
  const { data: breakdown } = useGetCategoryBreakdown({
    query: { queryKey: getGetCategoryBreakdownQueryKey() }
  });

  const score = summary?.sustainabilityScore ?? 0;
  const scoreColor = score >= 70 ? SCORE_COLORS.good : score >= 40 ? SCORE_COLORS.ok : SCORE_COLORS.bad;
  const scoreLabel = score >= 70 ? (lang === 'np' ? 'उत्कृष्ट' : 'Excellent') : score >= 40 ? (lang === 'np' ? 'ठीक' : 'Good') : (lang === 'np' ? 'सुधार चाहिन्छ' : 'Needs Work');

  const kpis = [
    {
      label: lang === 'np' ? 'कुल उत्सर्जन' : 'Total Emissions',
      value: summary?.totalEmissionsKg ?? 0,
      suffix: ' kg',
      icon: BarChart3,
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
    },
    {
      label: lang === 'np' ? 'कार्बन कटौती' : 'Carbon Reduction',
      value: Math.abs(summary?.carbonReductionPercent ?? 0),
      suffix: '%',
      icon: TrendingDown,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: lang === 'np' ? 'सक्रिय विद्यार्थीहरू' : 'Active Students',
      value: summary?.activeStudents ?? 0,
      suffix: '',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: lang === 'np' ? 'चुनौतीहरू पूरा' : 'Challenges Done',
      value: summary?.challengesCompleted ?? 0,
      suffix: '',
      icon: Zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ];

  const catLabels: Record<string, string> = {
    Transport: lang === 'np' ? 'यातायात' : 'Transport',
    Electricity: lang === 'np' ? 'बिजुली' : 'Electricity',
    Water: lang === 'np' ? 'पानी' : 'Water',
    Waste: lang === 'np' ? 'फोहोर' : 'Waste',
  };

  const pieData = breakdown?.map(b => ({
    name: catLabels[b.category] || b.category,
    value: Math.round(b.percentage),
    color: b.color,
  })) ?? [];

  const PIE_COLORS = ['#059669', '#0d9488', '#3b82f6', '#8b5cf6'];

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {lang === 'np' ? `नमस्कार, ${user?.name}` : `Welcome back, ${user?.name}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === 'np' ? user?.schoolName : user?.schoolName}
              {summary && (
                <span className="ml-2 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                  #{lang === 'np' ? `${summary.ecoLeagueRank}वौ स्थान` : `Rank #${summary.ecoLeagueRank} of ${summary.totalSchools}`}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sustainability Score - Hero card */}
          <div className="lg:col-span-1 bg-gradient-to-br from-primary/10 to-teal-500/5 border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {lang === 'np' ? 'दिगोपन स्कोर' : 'Sustainability Score'}
              </span>
            </div>
            {sumLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : (
              <>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-extrabold" style={{ color: scoreColor }}>
                    <AnimatedNumber value={score} />
                  </span>
                  <span className="text-lg text-muted-foreground mb-1">/100</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-3">
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${score}%`, backgroundColor: scoreColor }}
                  />
                </div>
                <span className="text-sm font-medium" style={{ color: scoreColor }}>{scoreLabel}</span>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="w-3 h-3" />
                  {lang === 'np' ? 'डेटा आत्मविश्वास' : 'Data Confidence'}:
                  <span className="font-medium text-foreground">{summary?.dataConfidenceScore ?? 0}%</span>
                </div>
              </>
            )}
          </div>

          {/* 3D Globe / Breakdown */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {lang === 'np' ? 'उत्सर्जन स्रोत' : 'Emission Sources'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {lang === 'np' ? 'श्रेणी अनुसार वितरण' : 'Distribution by category'}
            </p>
            {breakdown && breakdown.length > 0 ? (
              <>
                <EmissionsGlobe breakdown={breakdown} />
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {pieData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                      <span className="font-medium ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-52 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">{lang === 'np' ? 'अहिलेसम्म डेटा छैन' : 'No data yet'}</p>
                  <p className="text-xs opacity-70">{lang === 'np' ? 'कार्बन क्याल्कुलेटर प्रयोग गर्नुहोस्' : 'Use the Carbon Calculator'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Category breakdown bars */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {lang === 'np' ? 'श्रेणी विवरण' : 'Category Breakdown'}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {lang === 'np' ? 'किलोग्राम CO₂ मा' : 'In kilograms of CO₂'}
            </p>
            <div className="space-y-3">
              {[
                { label: lang === 'np' ? 'यातायात' : 'Transport', value: summary?.transportEmissionsKg ?? 0, color: '#059669', icon: '🚌' },
                { label: lang === 'np' ? 'बिजुली' : 'Electricity', value: summary?.electricityEmissionsKg ?? 0, color: '#0d9488', icon: '⚡' },
                { label: lang === 'np' ? 'पानी' : 'Water', value: summary?.waterEmissionsKg ?? 0, color: '#3b82f6', icon: '💧' },
                { label: lang === 'np' ? 'फोहोर' : 'Waste', value: summary?.wasteEmissionsKg ?? 0, color: '#8b5cf6', icon: '♻️' },
              ].map(cat => {
                const total = (summary?.totalEmissionsKg ?? 1) || 1;
                const pct = Math.round((cat.value / total) * 100);
                return (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{cat.icon} {cat.label}</span>
                      <span className="font-medium">{cat.value.toFixed(1)} kg</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {!summary && sumLoading && <Skeleton className="h-40 w-full" />}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(kpi => (
            <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              {sumLoading ? (
                <Skeleton className="h-7 w-20 mb-1" />
              ) : (
                <div className={`text-2xl font-bold ${kpi.color}`}>
                  <AnimatedNumber value={kpi.value} suffix={kpi.suffix} />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Emissions Trend Chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {lang === 'np' ? 'मासिक उत्सर्जन प्रवृत्ति' : 'Monthly Emissions Trend'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {lang === 'np' ? 'पिछला ६ महिना' : 'Last 6 months — transport, electricity, water, waste'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {[
                { color: '#059669', label: lang === 'np' ? 'यातायात' : 'Transport' },
                { color: '#0d9488', label: lang === 'np' ? 'बिजुली' : 'Electricity' },
                { color: '#3b82f6', label: lang === 'np' ? 'पानी' : 'Water' },
                { color: '#8b5cf6', label: lang === 'np' ? 'फोहोर' : 'Waste' },
              ].map(l => (
                <div key={l.label} className="hidden sm:flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          {trendLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : trend && trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  {[
                    { id: 'g1', color: '#059669' },
                    { id: 'g2', color: '#0d9488' },
                    { id: 'g3', color: '#3b82f6' },
                    { id: 'g4', color: '#8b5cf6' },
                  ].map(g => (
                    <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={g.color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={g.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="transportKg" stroke="#059669" fill="url(#g1)" strokeWidth={2} name="Transport" />
                <Area type="monotone" dataKey="electricityKg" stroke="#0d9488" fill="url(#g2)" strokeWidth={2} name="Electricity" />
                <Area type="monotone" dataKey="waterKg" stroke="#3b82f6" fill="url(#g3)" strokeWidth={2} name="Water" />
                <Area type="monotone" dataKey="wasteKg" stroke="#8b5cf6" fill="url(#g4)" strokeWidth={2} name="Waste" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{lang === 'np' ? 'अहिलेसम्म डेटा छैन' : 'No trend data yet'}</p>
                <p className="text-xs opacity-70">{lang === 'np' ? 'कार्बन डेटा सबमिट गर्नुहोस्' : 'Submit carbon data to see trends'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Eco League rank callout */}
        {summary && (
          <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                {lang === 'np' ? 'अन्तर-विद्यालय इको लिग' : 'Inter-School Eco League'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {lang === 'np'
                  ? `तपाईंको विद्यालय ${summary.totalSchools} मध्ये #${summary.ecoLeagueRank} स्थानमा छ`
                  : `Your school is ranked #${summary.ecoLeagueRank} out of ${summary.totalSchools} schools`}
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
