import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetReports, getGetReportsQueryKey, useGenerateReport } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Award, TrendingDown, TrendingUp, Trophy, Plus, Share2, Download, Linkedin, Facebook, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { npNum, npFixed } from '@/lib/nepali';

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_NP = ['जनवरी','फेब्रुअरी','मार्च','अप्रिल','मे','जुन','जुलाई','अगस्ट','सेप्टेम्बर','अक्टोबर','नोभेम्बर','डिसेम्बर'];

const TIER_STYLES: Record<string, { bg: string; text: string; icon: string; badgeBg: string }> = {
  'Climate Champion': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: '🏆', badgeBg: 'bg-amber-500' },
  'Climate Leader':   { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: '🌟', badgeBg: 'bg-emerald-600' },
  'Climate Achiever': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400', icon: '🌱', badgeBg: 'bg-teal-600' },
  'Climate Starter':  { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', icon: '🌿', badgeBg: 'bg-slate-500' },
};

function getTier(score: number): string {
  if (score >= 85) return 'Climate Champion';
  if (score >= 70) return 'Climate Leader';
  if (score >= 50) return 'Climate Achiever';
  return 'Climate Starter';
}

const DUMMY_REPORTS = [
  { id: 'd1', month: 6, year: 2026, sustainabilityScore: 78, totalEmissionsKg: 957, carbonReductionPercent: 8.4, ecoLeagueRank: 3, activeStudents: 460, challengesCompleted: 3, transportEmissionsKg: 690, electricityEmissionsKg: 122, waterEmissionsKg: 13, wasteEmissionsKg: 132, highlights: JSON.stringify(['Walk-to-School Week achieved 94% participation', 'Electricity reduced by 5% via LED replacements', 'Compost bin launched in school garden — 28 kg diverted from landfill']) },
  { id: 'd2', month: 5, year: 2026, sustainabilityScore: 72, totalEmissionsKg: 1044, carbonReductionPercent: 4.2, ecoLeagueRank: 4, activeStudents: 445, challengesCompleted: 2, transportEmissionsKg: 760, electricityEmissionsKg: 130, waterEmissionsKg: 14, wasteEmissionsKg: 140, highlights: JSON.stringify(['Plastic-free lunch day launched — 320 students participated', 'New energy monitors assigned to each classroom', 'School ranked #4 nationally — up from #6 last month']) },
  { id: 'd3', month: 4, year: 2026, sustainabilityScore: 65, totalEmissionsKg: 1089, carbonReductionPercent: -1.5, ecoLeagueRank: 6, activeStudents: 428, challengesCompleted: 1, transportEmissionsKg: 792, electricityEmissionsKg: 136, waterEmissionsKg: 15, wasteEmissionsKg: 146, highlights: JSON.stringify(['Emissions increased slightly due to diesel generator use during power outage', 'Recycling program expanded to cover 12 classrooms', 'First Eco Club meeting held — 42 students joined']) },
  { id: 'd4', month: 3, year: 2026, sustainabilityScore: 70, totalEmissionsKg: 1030, carbonReductionPercent: 3.8, ecoLeagueRank: 5, activeStudents: 420, challengesCompleted: 2, transportEmissionsKg: 740, electricityEmissionsKg: 128, waterEmissionsKg: 13, wasteEmissionsKg: 149, highlights: JSON.stringify(['Walk-to-school awareness session held for parents', 'Water usage reduced 8% after fixing 4 leaking taps', 'Eco challenge "No Single-Use Plastic Week" completed']) },
];

export default function ReportsPage() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const now = new Date();
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());

  const { data: reportsRaw, isLoading } = useGetReports({ query: { queryKey: getGetReportsQueryKey() } });
  const reports = (reportsRaw && reportsRaw.length > 0) ? reportsRaw : DUMMY_REPORTS;

  const genMutation = useGenerateReport({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetReportsQueryKey() });
        toast({ title: lang === 'np' ? '✅ रिपोर्ट सफलतापूर्वक उत्पन्न भयो!' : '✅ Report generated successfully!' });
      },
    }
  });

  const handleShare = (platform: 'linkedin' | 'facebook' | 'instagram', report: typeof DUMMY_REPORTS[0]) => {
    const tier = getTier(report.sustainabilityScore);
    const month = lang === 'np' ? MONTHS_NP[report.month - 1] : MONTHS_EN[report.month - 1];
    const text = encodeURIComponent(`🌱 ${lang === 'np' ? 'हाम्रो विद्यालयको' : 'Our school\'s'} ${month} ${report.year} ${lang === 'np' ? 'दिगोपन रिपोर्ट: ' : 'Sustainability Report: '}${report.sustainabilityScore}/100 — ${tier} ${TIER_STYLES[tier].icon} | ${report.totalEmissionsKg.toFixed(0)} kg CO₂ | Eco League #${report.ecoLeagueRank} #EcoDrishti #ClimateAction #Nepal`);
    const url = encodeURIComponent(window.location.href);
    const links: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      instagram: `https://www.instagram.com/`,
    };
    if (platform === 'instagram') {
      toast({ title: lang === 'np' ? 'इन्स्टाग्रामको लागि रिपोर्ट कपी गरियो! इन्स्टाग्राममा पेस्ट गर्नुहोस्।' : 'Report text copied! Paste it on Instagram.' });
      navigator.clipboard?.writeText(decodeURIComponent(text));
    } else {
      window.open(links[platform], '_blank', 'noopener,noreferrer,width=600,height=400');
    }
  };

  const handleDownload = (report: typeof DUMMY_REPORTS[0]) => {
    const tier = getTier(report.sustainabilityScore);
    const monthName = lang === 'np' ? MONTHS_NP[report.month - 1] : MONTHS_EN[report.month - 1];
    const highlights: string[] = (() => { try { return JSON.parse(report.highlights as unknown as string) as string[]; } catch { return []; } })();
    const content = [
      `EcoDrishti AI — Monthly Sustainability Report`,
      `${monthName} ${report.year}`,
      ``,
      `School: EcoDrishti Demo School`,
      `Tier: ${tier} ${TIER_STYLES[tier].icon}`,
      `Eco League Rank: #${report.ecoLeagueRank} (out of 10 similar size schools)`,
      ``,
      `== KEY METRICS ==`,
      `Sustainability Score:  ${report.sustainabilityScore}/100`,
      `Total CO₂ Emissions:   ${report.totalEmissionsKg.toFixed(1)} kg`,
      `Carbon Reduction:      ${report.carbonReductionPercent > 0 ? '↓' : '↑'} ${Math.abs(report.carbonReductionPercent).toFixed(1)}%`,
      `Active Students:       ${report.activeStudents}`,
      `Challenges Completed:  ${report.challengesCompleted}`,
      ``,
      `== EMISSION BREAKDOWN ==`,
      `Transport:   ${(report.transportEmissionsKg ?? 0).toFixed(1)} kg CO₂`,
      `Electricity: ${(report.electricityEmissionsKg ?? 0).toFixed(1)} kg CO₂`,
      `Waste:       ${(report.wasteEmissionsKg ?? 0).toFixed(1)} kg CO₂`,
      `Water:       ${(report.waterEmissionsKg ?? 0).toFixed(1)} kg CO₂`,
      ``,
      `== HIGHLIGHTS ==`,
      ...highlights.map(h => `• ${h}`),
      ``,
      `Generated by EcoDrishti AI — Nepal's First School Climate Intelligence Platform`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EcoDrishti_Report_${monthName}_${report.year}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: lang === 'np' ? '📥 रिपोर्ट डाउनलोड भयो!' : '📥 Report downloaded!' });
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {lang === 'np' ? 'मासिक रिपोर्टहरू' : 'Monthly Reports'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === 'np' ? 'दिगोपन प्रगति र इको लिग परिणामहरू' : 'Sustainability progress and Eco League results'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select value={genMonth} onChange={e => setGenMonth(+e.target.value)} className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background text-foreground outline-none">
              {MONTHS_EN.map((m, i) => <option key={m} value={i + 1}>{lang === 'np' ? MONTHS_NP[i] : m}</option>)}
            </select>
            <input type="number" value={genYear} onChange={e => setGenYear(+e.target.value)} min={2020} max={2030} className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background text-foreground outline-none w-20" />
            <Button size="sm" onClick={() => genMutation.mutate({ data: { month: genMonth, year: genYear } })} disabled={genMutation.isPending}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              {genMutation.isPending ? (lang === 'np' ? 'उत्पन्न...' : 'Generating...') : (lang === 'np' ? 'नयाँ रिपोर्ट' : 'New Report')}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-5">
            {reports.map(report => {
              const tier = getTier(report.sustainabilityScore);
              const tierStyle = TIER_STYLES[tier];
              const monthName = lang === 'np' ? MONTHS_NP[report.month - 1] : MONTHS_EN[report.month - 1];
              const highlights: string[] = (() => { try { return JSON.parse(report.highlights as unknown as string) as string[]; } catch { return []; } })();
              return (
                <div key={report.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary/10 to-transparent px-5 py-4 flex items-center justify-between border-b border-border flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        {monthName} {npNum(report.year, lang)}
                        <span className="text-xs font-normal text-muted-foreground">{lang === 'np' ? 'मासिक दिगोपन रिपोर्ट' : 'Monthly Sustainability Report'}</span>
                      </h3>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white ${tierStyle.badgeBg}`}>
                      <span>{tierStyle.icon}</span>
                      <span>{tier}</span>
                    </div>
                  </div>

                  <div className="p-5">
                    {/* KPI row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                      <div className="text-center p-3 bg-primary/5 rounded-xl">
                        <div className="text-2xl font-extrabold text-primary">{npFixed(report.sustainabilityScore, 0, lang)}</div>
                        <div className="text-xs text-muted-foreground">{lang === 'np' ? 'दिगोपन स्कोर' : 'Sustainability Score'}</div>
                      </div>
                      <div className="text-center p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                        <div className="text-2xl font-extrabold text-rose-600">{npFixed(report.totalEmissionsKg, 0, lang)} kg</div>
                        <div className="text-xs text-muted-foreground">{lang === 'np' ? 'कुल CO₂' : 'Total CO₂'}</div>
                      </div>
                      <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <div className={`text-2xl font-extrabold flex items-center justify-center gap-1 ${(report.carbonReductionPercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {(report.carbonReductionPercent ?? 0) >= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                          {npFixed(Math.abs(report.carbonReductionPercent ?? 0), 1, lang)}%
                        </div>
                        <div className="text-xs text-muted-foreground">{lang === 'np' ? 'CO₂ कटौती' : 'CO₂ Reduction'}</div>
                      </div>
                      <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <div className="text-2xl font-extrabold text-amber-600 flex items-center justify-center gap-1">
                          <Trophy className="w-4 h-4" />
                          #{npNum(report.ecoLeagueRank, lang)}
                        </div>
                        <div className="text-xs text-muted-foreground">{lang === 'np' ? 'लिग स्थान' : 'League Rank'}</div>
                      </div>
                    </div>

                    {/* League context */}
                    <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-4 h-4 text-amber-600" />
                        <h4 className="text-sm font-semibold text-foreground">{lang === 'np' ? 'अन्तर-विद्यालय इको लिग' : 'Inter-School Eco League'}</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="text-sm font-bold text-amber-600">#{npNum(report.ecoLeagueRank, lang)}</div>
                          <div className="text-xs text-muted-foreground">{lang === 'np' ? '१० समान-आकारका विद्यालय मध्ये' : 'out of 10 similar size schools'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground">{npNum(report.activeStudents ?? 0, lang)}</div>
                          <div className="text-xs text-muted-foreground">{lang === 'np' ? 'सक्रिय विद्यार्थी' : 'Active Students'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-emerald-600">{npNum(report.challengesCompleted ?? 0, lang)}</div>
                          <div className="text-xs text-muted-foreground">{lang === 'np' ? 'चुनौतीहरू पूरा' : 'Challenges Done'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Emission breakdown mini */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { label: lang === 'np' ? 'यातायात' : 'Transport', value: report.transportEmissionsKg, color: '#10b981' },
                        { label: lang === 'np' ? 'बिजुली' : 'Electricity', value: report.electricityEmissionsKg, color: '#f97316' },
                        { label: lang === 'np' ? 'फोहोर' : 'Waste', value: report.wasteEmissionsKg, color: '#8b5cf6' },
                        { label: lang === 'np' ? 'पानी' : 'Water', value: report.waterEmissionsKg, color: '#3b82f6' },
                      ].map(c => (
                        <div key={c.label} className="text-center p-2 bg-muted/30 rounded-lg">
                          <div className="text-xs font-bold" style={{ color: c.color }}>{npFixed(c.value ?? 0, 0, lang)} kg</div>
                          <div className="text-[10px] text-muted-foreground">{c.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Highlights */}
                    {highlights.length > 0 && (
                      <div className="mb-5">
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {lang === 'np' ? 'मुख्य बिन्दुहरू' : 'Highlights'}
                        </h5>
                        <div className="space-y-1.5">
                          {highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                              {h}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Share & Download row */}
                    <div className="pt-4 border-t border-border flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mr-1">
                        <Share2 className="w-3.5 h-3.5" />
                        {lang === 'np' ? 'साझा गर्नुहोस्:' : 'Share:'}
                      </span>
                      <button
                        onClick={() => handleShare('linkedin', report as unknown as typeof DUMMY_REPORTS[0])}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90 transition-colors"
                      >
                        <Linkedin className="w-3 h-3" />
                        LinkedIn
                      </button>
                      <button
                        onClick={() => handleShare('facebook', report as unknown as typeof DUMMY_REPORTS[0])}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1877F2] text-white hover:bg-[#1877F2]/90 transition-colors"
                      >
                        <Facebook className="w-3 h-3" />
                        Facebook
                      </button>
                      <button
                        onClick={() => handleShare('instagram', report as unknown as typeof DUMMY_REPORTS[0])}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                      >
                        <Instagram className="w-3 h-3" />
                        Instagram
                      </button>
                      <div className="flex-1" />
                      <Button size="sm" variant="outline" onClick={() => handleDownload(report as unknown as typeof DUMMY_REPORTS[0])} className="gap-1.5 text-xs">
                        <Download className="w-3.5 h-3.5" />
                        {lang === 'np' ? 'डाउनलोड रिपोर्ट' : 'Download Report'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
