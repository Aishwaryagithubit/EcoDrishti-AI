import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetReports, getGetReportsQueryKey, useGenerateReport } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Award, TrendingDown, TrendingUp, Users, Zap, Plus, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_NP = ['जनवरी','फेब्रुअरी','मार्च','अप्रिल','मे','जुन','जुलाई','अगस्ट','सेप्टेम्बर','अक्टोबर','नोभेम्बर','डिसेम्बर'];

const TIER_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  'Climate Champion': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: '🏆' },
  'Climate Leader': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: '🌟' },
  'Climate Achiever': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400', icon: '🌱' },
  'Climate Starter': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', icon: '🌿' },
};

function getTier(score: number): string {
  if (score >= 85) return 'Climate Champion';
  if (score >= 70) return 'Climate Leader';
  if (score >= 50) return 'Climate Achiever';
  return 'Climate Starter';
}

export default function ReportsPage() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const now = new Date();
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());

  const { data: reports, isLoading } = useGetReports({
    query: { queryKey: getGetReportsQueryKey() }
  });

  const genMutation = useGenerateReport({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetReportsQueryKey() });
        toast({ title: lang === 'np' ? 'रिपोर्ट सफलतापूर्वक उत्पन्न भयो!' : 'Report generated successfully!' });
      },
    }
  });

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
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
            <select value={genMonth} onChange={e => setGenMonth(+e.target.value)} className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background">
              {MONTHS_EN.map((m, i) => <option key={m} value={i + 1}>{lang === 'np' ? MONTHS_NP[i] : m}</option>)}
            </select>
            <input type="number" value={genYear} onChange={e => setGenYear(+e.target.value)} min={2020} max={2030} className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background w-20" />
            <Button size="sm" onClick={() => genMutation.mutate({ data: { month: genMonth, year: genYear } })} disabled={genMutation.isPending}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              {genMutation.isPending ? (lang === 'np' ? 'उत्पन्न हुँदैछ...' : 'Generating...') : (lang === 'np' ? 'रिपोर्ट उत्पन्न गर्नुहोस्' : 'Generate Report')}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map(report => {
              const tier = getTier(report.sustainabilityScore);
              const tierStyle = TIER_STYLES[tier];
              const monthName = lang === 'np' ? MONTHS_NP[report.month - 1] : MONTHS_EN[report.month - 1];
              const highlights: string[] = (() => {
                try { return JSON.parse(report.highlights as unknown as string) as string[]; } catch { return []; }
              })();
              return (
                <div key={report.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary/10 to-teal-500/5 px-5 py-4 flex items-center justify-between border-b border-border">
                    <div>
                      <h3 className="font-bold text-foreground">
                        {monthName} {report.year}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {lang === 'np' ? 'मासिक दिगोपन रिपोर्ट' : 'Monthly Sustainability Report'}
                        </span>
                      </h3>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${tierStyle.bg} ${tierStyle.text}`}>
                      <span>{tierStyle.icon}</span>
                      <span>{tier}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    {/* KPI row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                      <div className="text-center">
                        <div className="text-xl font-extrabold text-primary">{report.sustainabilityScore.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">{lang === 'np' ? 'दिगोपन स्कोर' : 'Sustainability Score'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-extrabold text-rose-600">{report.totalEmissionsKg.toFixed(0)} kg</div>
                        <div className="text-xs text-muted-foreground">{lang === 'np' ? 'कुल CO₂' : 'Total CO₂'}</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-xl font-extrabold flex items-center justify-center gap-1 ${(report.carbonReductionPercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {(report.carbonReductionPercent ?? 0) >= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                          {Math.abs(report.carbonReductionPercent ?? 0).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">{lang === 'np' ? 'कटौती' : 'Reduction'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-extrabold text-amber-600 flex items-center justify-center gap-1">
                          <Trophy className="w-4 h-4" />
                          #{report.ecoLeagueRank}
                        </div>
                        <div className="text-xs text-muted-foreground">{lang === 'np' ? 'इको लिग स्थान' : 'Eco League Rank'}</div>
                      </div>
                    </div>

                    {/* Inter-School Eco League Section */}
                    <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-4 h-4 text-amber-600" />
                        <h4 className="text-sm font-semibold text-foreground">
                          {lang === 'np' ? 'अन्तर-विद्यालय इको लिग परिणाम' : 'Inter-School Eco League Result'}
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="text-sm font-bold text-amber-600">#{report.ecoLeagueRank}</div>
                          <div className="text-xs text-muted-foreground">{lang === 'np' ? 'राष्ट्रिय स्थान' : 'National Rank'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground">{report.activeStudents}</div>
                          <div className="text-xs text-muted-foreground">{lang === 'np' ? 'सक्रिय विद्यार्थी' : 'Active Students'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-emerald-600">{report.challengesCompleted}</div>
                          <div className="text-xs text-muted-foreground">{lang === 'np' ? 'चुनौतीहरू पूरा' : 'Challenges Done'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Category breakdown mini */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { label: lang === 'np' ? 'यातायात' : 'Transport', value: report.transportEmissionsKg, color: '#059669' },
                        { label: lang === 'np' ? 'बिजुली' : 'Electricity', value: report.electricityEmissionsKg, color: '#0d9488' },
                        { label: lang === 'np' ? 'पानी' : 'Water', value: report.waterEmissionsKg, color: '#3b82f6' },
                        { label: lang === 'np' ? 'फोहोर' : 'Waste', value: report.wasteEmissionsKg, color: '#8b5cf6' },
                      ].map(c => (
                        <div key={c.label} className="text-center p-2 bg-muted/30 rounded-lg">
                          <div className="text-xs font-bold" style={{ color: c.color }}>{(c.value ?? 0).toFixed(0)} kg</div>
                          <div className="text-[10px] text-muted-foreground">{c.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Highlights */}
                    {highlights.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {lang === 'np' ? 'मुख्य बिन्दुहरू' : 'Highlights'}
                        </h5>
                        <div className="space-y-1">
                          {highlights.map((h: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1 flex-shrink-0" />
                              {h}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold text-foreground mb-1">{lang === 'np' ? 'अहिलेसम्म कुनै रिपोर्ट छैन' : 'No reports yet'}</h3>
            <p className="text-sm text-muted-foreground">{lang === 'np' ? 'माथिबाट आफ्नो पहिलो मासिक रिपोर्ट उत्पन्न गर्नुहोस्।' : 'Generate your first monthly report using the button above.'}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
