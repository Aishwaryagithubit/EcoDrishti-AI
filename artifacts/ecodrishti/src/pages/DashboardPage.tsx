import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/components/AppLayout';
import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetEmissionsTrend, getGetEmissionsTrendQueryKey,
  useGetCategoryBreakdown, getGetCategoryBreakdownQueryKey,
} from '@workspace/api-client-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Leaf, TrendingDown, Users, Zap, Award, ShieldCheck, BarChart3, Flame, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useRef, useState } from 'react';
import { npNum, npFixed } from '@/lib/nepali';

function AnimatedNumber({ value, suffix = '', lang }: { value: number; suffix?: string; lang: string }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const end = value;
    const duration = 1400;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(end * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);
  return <span>{npNum(display, lang)}{suffix}</span>;
}

const DUMMY_TREND = [
  { month: 'Jan', transportKg: 712, electricityKg: 138, waterKg: 14, wasteKg: 148 },
  { month: 'Feb', transportKg: 698, electricityKg: 130, waterKg: 13, wasteKg: 140 },
  { month: 'Mar', transportKg: 720, electricityKg: 142, waterKg: 15, wasteKg: 152 },
  { month: 'Apr', transportKg: 680, electricityKg: 122, waterKg: 12, wasteKg: 135 },
  { month: 'May', transportKg: 660, electricityKg: 115, waterKg: 12, wasteKg: 128 },
  { month: 'Jun', transportKg: 690, electricityKg: 122, waterKg: 13, wasteKg: 132 },
];

const DUMMY_TREND_NP = [
  { month: 'जन', transportKg: 712, electricityKg: 138, waterKg: 14, wasteKg: 148 },
  { month: 'फेब', transportKg: 698, electricityKg: 130, waterKg: 13, wasteKg: 140 },
  { month: 'मार्च', transportKg: 720, electricityKg: 142, waterKg: 15, wasteKg: 152 },
  { month: 'अप्रिल', transportKg: 680, electricityKg: 122, waterKg: 12, wasteKg: 135 },
  { month: 'मे', transportKg: 660, electricityKg: 115, waterKg: 12, wasteKg: 128 },
  { month: 'जुन', transportKg: 690, electricityKg: 122, waterKg: 13, wasteKg: 132 },
];

const DUMMY_SUMMARY = {
  totalEmissionsKg: 957,
  sustainabilityScore: 78,
  activeStudents: 460,
  challengesCompleted: 3,
  carbonReductionPercent: 8.4,
  dataConfidenceScore: 87,
  ecoLeagueRank: 3,
  totalSchools: 10,
  transportEmissionsKg: 690,
  electricityEmissionsKg: 122,
  waterEmissionsKg: 13,
  wasteEmissionsKg: 132,
};

const SCORE_COLORS = { good: '#10b981', ok: '#f97316', bad: '#ef4444' };

export default function DashboardPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();

  const { data: summaryRaw, isLoading: sumLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });
  const { data: trendRaw, isLoading: trendLoading } = useGetEmissionsTrend({
    query: { queryKey: getGetEmissionsTrendQueryKey() }
  });
  const { data: breakdownRaw } = useGetCategoryBreakdown({
    query: { queryKey: getGetCategoryBreakdownQueryKey() }
  });

  const summary = summaryRaw ?? DUMMY_SUMMARY;
  const trendBase = Array.isArray(trendRaw) && trendRaw.length > 0 ? trendRaw : (lang === 'np' ? DUMMY_TREND_NP : DUMMY_TREND);
  const trend = Array.isArray(trendBase) ? trendBase : (lang === 'np' ? DUMMY_TREND_NP : DUMMY_TREND);

  const score = summary.sustainabilityScore ?? 0;
  const scoreColor = score >= 70 ? SCORE_COLORS.good : score >= 40 ? SCORE_COLORS.ok : SCORE_COLORS.bad;
  const scoreLabel = score >= 85
    ? (lang === 'np' ? 'उत्कृष्ट 🏆' : 'Excellent 🏆')
    : score >= 70
    ? (lang === 'np' ? 'राम्रो 🌟' : 'Good 🌟')
    : score >= 50
    ? (lang === 'np' ? 'ठीक छ' : 'Fair')
    : (lang === 'np' ? 'सुधार चाहिन्छ' : 'Needs Work');

  const kpis = [
    {
      label: lang === 'np' ? 'मासिक CO₂' : 'Monthly CO₂',
      value: Math.round(summary.totalEmissionsKg ?? 0),
      suffix: ' kg',
      icon: Flame,
      color: 'text-rose-500',
      bg: 'from-rose-500/15 to-rose-500/5',
      border: 'border-rose-200 dark:border-rose-800/40',
    },
    {
      label: lang === 'np' ? 'कार्बन कटौती' : 'Carbon Reduced',
      value: +(Math.abs(summary.carbonReductionPercent ?? 8.4).toFixed(1)),
      suffix: '%',
      icon: TrendingDown,
      color: 'text-emerald-600',
      bg: 'from-emerald-500/15 to-emerald-500/5',
      border: 'border-emerald-200 dark:border-emerald-800/40',
    },
    {
      label: lang === 'np' ? 'सक्रिय विद्यार्थीहरू' : 'Active Students',
      value: summary.activeStudents ?? 460,
      suffix: '',
      icon: Users,
      color: 'text-blue-600',
      bg: 'from-blue-500/15 to-blue-500/5',
      border: 'border-blue-200 dark:border-blue-800/40',
    },
    {
      label: lang === 'np' ? 'चुनौतीहरू पूरा' : 'Challenges Done',
      value: summary.challengesCompleted ?? 3,
      suffix: '',
      icon: Zap,
      color: 'text-orange-500',
      bg: 'from-orange-500/15 to-orange-500/5',
      border: 'border-orange-200 dark:border-orange-800/40',
    },
  ];

  const recentActivity = [
    { icon: '✅', text: lang === 'np' ? 'जुन महिनाको कार्बन डेटा सबमिट — ९५७ kg CO₂' : 'June carbon data submitted — 957 kg CO₂', time: lang === 'np' ? '२ घण्टा पहिले' : '2h ago', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    { icon: '🏆', text: lang === 'np' ? 'Walk-to-School चुनौती सम्पन्न — ९४% सहभागिता' : 'Walk-to-School challenge completed — 94% participation', time: lang === 'np' ? '१ दिन पहिले' : '1d ago', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
    { icon: '📈', text: lang === 'np' ? 'गत महिनाभन्दा ५% बिजुली बचत' : 'Electricity usage reduced 5% vs last month', time: lang === 'np' ? '३ दिन पहिले' : '3d ago', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { icon: '🌱', text: lang === 'np' ? 'विद्यालय राष्ट्रिय इको लिगमा #३ स्थानमा' : 'School climbed to #3 in National Eco League', time: lang === 'np' ? '१ हप्ता पहिले' : '1w ago', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  ];

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              {lang === 'np' ? `नमस्कार, ${user?.name} 👋` : `Welcome back, ${user?.name} 👋`}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {user?.schoolName}
              {summary && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-semibold">
                  🏅 {lang === 'np' ? `राष्ट्रिय #${npNum(summary.ecoLeagueRank, lang)} स्थान` : `National Rank #${summary.ecoLeagueRank}`}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Monthly Emissions Trend — TOP */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <span className="w-7 h-7 bg-primary/15 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </span>
                {lang === 'np' ? 'मासिक उत्सर्जन प्रवृत्ति' : 'Monthly Emissions Trend'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 ml-9">
                {lang === 'np' ? 'पिछला ६ महिना — CO₂ किलोग्राममा' : 'Last 6 months — CO₂ in kilograms'}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs">
              {[
                { color: '#10b981', label: lang === 'np' ? 'यातायात' : 'Transport' },
                { color: '#f97316', label: lang === 'np' ? 'बिजुली' : 'Electricity' },
                { color: '#3b82f6', label: lang === 'np' ? 'पानी' : 'Water' },
                { color: '#8b5cf6', label: lang === 'np' ? 'फोहोर' : 'Waste' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          {trendLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={Array.isArray(trend) ? trend : []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  {[
                    { id: 'g1', color: '#10b981' },
                    { id: 'g2', color: '#f97316' },
                    { id: 'g3', color: '#3b82f6' },
                    { id: 'g4', color: '#8b5cf6' },
                  ].map(g => (
                    <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={g.color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={g.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
                  labelStyle={{ fontWeight: '700', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="transportKg" stroke="#10b981" fill="url(#g1)" strokeWidth={2.5} name={lang === 'np' ? 'यातायात' : 'Transport'} />
                <Area type="monotone" dataKey="electricityKg" stroke="#f97316" fill="url(#g2)" strokeWidth={2.5} name={lang === 'np' ? 'बिजुली' : 'Electricity'} />
                <Area type="monotone" dataKey="waterKg" stroke="#3b82f6" fill="url(#g3)" strokeWidth={2.5} name={lang === 'np' ? 'पानी' : 'Water'} />
                <Area type="monotone" dataKey="wasteKg" stroke="#8b5cf6" fill="url(#g4)" strokeWidth={2.5} name={lang === 'np' ? 'फोहोर' : 'Waste'} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(kpi => (
            <div key={kpi.label} className={`bg-gradient-to-br ${kpi.bg} border ${kpi.border} rounded-2xl p-4 shadow-sm`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              {sumLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className={`text-2xl font-extrabold ${kpi.color}`}>
                  <AnimatedNumber value={kpi.value} suffix={kpi.suffix} lang={lang} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Score + Breakdown + League row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sustainability Score */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {lang === 'np' ? 'दिगोपन स्कोर' : 'Sustainability Score'}
              </span>
            </div>
            {sumLoading ? (
              <Skeleton className="h-28 w-full rounded-xl" />
            ) : (
              <>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-6xl font-black" style={{ color: scoreColor }}>
                    <AnimatedNumber value={score} lang={lang} />
                  </span>
                  <span className="text-xl text-muted-foreground mb-2">/100</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 mb-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${score}%`, background: `linear-gradient(90deg, ${scoreColor}99, ${scoreColor})` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: scoreColor }}>{scoreLabel}</span>
                  <span className="text-xs text-muted-foreground">
                    {lang === 'np' ? 'आत्मविश्वास' : 'Confidence'}: <strong className="text-foreground">{npNum(summary.dataConfidenceScore ?? 87, lang)}%</strong>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Category bars */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {lang === 'np' ? 'उत्सर्जन स्रोत अनुसार' : 'Emissions by Source'}
            </h3>
            <div className="space-y-3.5">
              {[
                { label: lang === 'np' ? 'यातायात' : 'Transport', value: summary.transportEmissionsKg ?? 690, color: '#10b981', icon: '🚌' },
                { label: lang === 'np' ? 'बिजुली' : 'Electricity', value: summary.electricityEmissionsKg ?? 122, color: '#f97316', icon: '⚡' },
                { label: lang === 'np' ? 'फोहोर' : 'Waste', value: summary.wasteEmissionsKg ?? 132, color: '#8b5cf6', icon: '♻️' },
                { label: lang === 'np' ? 'पानी' : 'Water', value: summary.waterEmissionsKg ?? 13, color: '#3b82f6', icon: '💧' },
              ].map(cat => {
                const total = (summary.totalEmissionsKg ?? 957) || 1;
                const pct = Math.round((cat.value / total) * 100);
                return (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-foreground font-medium">{cat.icon} {cat.label}</span>
                      <span className="font-bold" style={{ color: cat.color }}>{npFixed(cat.value, 0, lang)} kg</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Eco League callout */}
          <div className="bg-gradient-to-br from-orange-500/15 to-amber-500/5 border border-orange-300/40 dark:border-orange-700/30 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Award className="w-4 h-4 text-orange-500" />
                </div>
                <h3 className="font-bold text-sm text-foreground">
                  {lang === 'np' ? 'इको लिग स्थान' : 'Eco League Rank'}
                </h3>
              </div>
              {sumLoading ? <Skeleton className="h-20 w-full" /> : (
                <>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-5xl font-black text-orange-500">#{npNum(summary.ecoLeagueRank, lang)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'np'
                      ? `${npNum(summary.totalSchools, lang)} समान-आकारका विद्यालयहरू मध्ये`
                      : `out of ${summary.totalSchools} similar size schools`}
                  </p>
                </>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-orange-300/30 dark:border-orange-700/20 grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-bold text-foreground">{npNum(summary.activeStudents ?? 460, lang)}</div>
                <div className="text-[11px] text-muted-foreground">{lang === 'np' ? 'सक्रिय विद्यार्थी' : 'Active Students'}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-600">↓ {npFixed(Math.abs(summary.carbonReductionPercent ?? 8.4), 1, lang)}%</div>
                <div className="text-[11px] text-muted-foreground">{lang === 'np' ? 'CO₂ कटौती' : 'CO₂ Reduced'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-primary" />
            {lang === 'np' ? 'हालैका गतिविधिहरू' : 'Recent Activity'}
          </h3>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${item.color}`}>
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.text}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
