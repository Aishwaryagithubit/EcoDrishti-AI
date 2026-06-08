import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetLeagueRankings, getGetLeagueRankingsQueryKey, useGetMySchoolLeagueStats, getGetMySchoolLeagueStatsQueryKey } from '@workspace/api-client-react';
import { Trophy, Medal, Star, ShieldCheck, Users, TrendingDown, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const TIER_STYLES: Record<string, { bg: string; text: string; badge: string; icon: string }> = {
  'Climate Champion': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-500 text-white', icon: '🏆' },
  'Climate Leader': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-600 text-white', icon: '🌟' },
  'Climate Achiever': { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-400', badge: 'bg-teal-600 text-white', icon: '🌱' },
  'Climate Starter': { bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-300', badge: 'bg-slate-500 text-white', icon: '🌿' },
};

const RANK_ICONS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaguePage() {
  const { lang } = useLanguage();

  const { data: rankings, isLoading } = useGetLeagueRankings({ query: { queryKey: getGetLeagueRankingsQueryKey() } });
  const { data: myStats } = useGetMySchoolLeagueStats({ query: { queryKey: getGetMySchoolLeagueStatsQueryKey() } });

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            {lang === 'np' ? 'अन्तर-विद्यालय इको लिग' : 'Inter-School Eco League'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'np' ? 'समान विद्यालयहरूसँग निष्पक्ष प्रतिस्पर्धा' : 'Fair competition with comparable schools across Nepal'}
          </p>
        </div>

        {/* Fairness note */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-xs text-blue-700 dark:text-blue-300">
          <ShieldCheck className="w-4 h-4 inline mr-2" />
          {lang === 'np'
            ? 'विद्यालयहरू प्रकार (सरकारी/सामुदायिक/निजी), आकार, र स्थान अनुसार समूहमा राखिन्छन् — निष्पक्ष तुलनाको लागि।'
            : 'Schools are grouped by type (government/community/private), size, and location to ensure fair comparison.'}
        </div>

        {/* My school stats */}
        {myStats && (
          <div className={`rounded-2xl p-5 border-2 border-primary/30 ${TIER_STYLES[myStats.tier]?.bg ?? 'bg-card'}`}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-foreground text-sm">{myStats.schoolName}</h3>
                <p className="text-xs text-muted-foreground">{lang === 'np' ? 'तपाईंको विद्यालय' : 'Your School'} · {myStats.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-amber-600">#{myStats.rank}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TIER_STYLES[myStats.tier]?.badge ?? 'bg-muted text-muted-foreground'}`}>
                  {TIER_STYLES[myStats.tier]?.icon} {myStats.tier}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Star, label: lang === 'np' ? 'दिगोपन स्कोर' : 'Score', value: myStats.sustainabilityScore.toFixed(1), color: 'text-primary' },
                { icon: TrendingDown, label: lang === 'np' ? 'CO₂ कटौती' : 'CO₂ Reduction', value: `${myStats.carbonReductionPercent.toFixed(1)}%`, color: 'text-emerald-600' },
                { icon: Users, label: lang === 'np' ? 'सहभागिता' : 'Participation', value: `${myStats.participationRate.toFixed(0)}%`, color: 'text-blue-600' },
                { icon: Zap, label: lang === 'np' ? 'चुनौती दर' : 'Challenge Rate', value: `${myStats.challengeCompletionRate.toFixed(0)}%`, color: 'text-amber-600' },
              ].map(stat => (
                <div key={stat.label} className="text-center p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                  <div className={`text-sm font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full leaderboard */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground">
              {lang === 'np' ? 'राष्ट्रिय लिडरबोर्ड' : 'National Leaderboard'}
            </h2>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : rankings && rankings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">{lang === 'np' ? 'स्थान' : 'Rank'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">{lang === 'np' ? 'विद्यालय' : 'School'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">{lang === 'np' ? 'स्तर' : 'Tier'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">{lang === 'np' ? 'स्कोर' : 'Score'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">{lang === 'np' ? 'CO₂ कटौती' : 'CO₂ Cut'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">{lang === 'np' ? 'सहभागिता' : 'Participation'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">{lang === 'np' ? 'डेटा विश्वास' : 'Data Conf.'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rankings.map(school => {
                    const isMe = school.isCurrentSchool;
                    const tierStyle = TIER_STYLES[school.tier] ?? TIER_STYLES['Climate Starter'];
                    return (
                      <tr key={school.id} className={`transition-colors ${isMe ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/30'}`}>
                        <td className="px-4 py-3 font-bold text-foreground">
                          {RANK_ICONS[school.rank] || `#${school.rank}`}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground text-xs sm:text-sm">{school.schoolName}</div>
                          <div className="text-[10px] text-muted-foreground">{school.location} · {school.schoolType}</div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierStyle.badge}`}>
                            {TIER_STYLES[school.tier]?.icon} {school.tier.split(' ').slice(-1)[0]}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-primary">{school.sustainabilityScore.toFixed(1)}</td>
                        <td className="px-4 py-3 text-emerald-600 font-medium hidden md:table-cell">{school.carbonReductionPercent.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{school.participationRate.toFixed(0)}%</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div className="h-1.5 bg-primary rounded-full" style={{ width: `${school.dataConfidenceScore}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{school.dataConfidenceScore.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{lang === 'np' ? 'अहिलेसम्म कुनै लिग डेटा छैन' : 'No league data yet'}</p>
            </div>
          )}
        </div>

        {/* Tier legend */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {lang === 'np' ? 'स्तर व्याख्या' : 'Tier Explanation'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { tier: 'Climate Starter', score: '0-49', desc: lang === 'np' ? 'शुरुवात' : 'Beginning' },
              { tier: 'Climate Achiever', score: '50-69', desc: lang === 'np' ? 'प्रगति' : 'Progress' },
              { tier: 'Climate Leader', score: '70-84', desc: lang === 'np' ? 'नेतृत्व' : 'Leadership' },
              { tier: 'Climate Champion', score: '85+', desc: lang === 'np' ? 'च्याम्पियन' : 'Champion' },
            ].map(t => (
              <div key={t.tier} className="text-center">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TIER_STYLES[t.tier]?.badge}`}>
                  {TIER_STYLES[t.tier]?.icon} {t.tier.split(' ').slice(-1)[0]}
                </span>
                <div className="text-[10px] text-muted-foreground mt-1">{t.desc} · {t.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
