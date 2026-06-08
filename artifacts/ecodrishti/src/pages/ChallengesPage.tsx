import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetChallenges, getGetChallengesQueryKey, useJoinChallenge, useCompleteChallenge } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Zap, Users, Clock, Star, CheckCircle, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const CAT_ICONS: Record<string, string> = {
  transport: '🚌',
  energy: '⚡',
  waste: '♻️',
  water: '💧',
  biodiversity: '🌿',
  general: '🌍',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-muted text-muted-foreground',
};

export default function ChallengesPage() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: challenges, isLoading } = useGetChallenges({ query: { queryKey: getGetChallengesQueryKey() } });

  const joinMutation = useJoinChallenge({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChallengesQueryKey() });
        toast({ title: lang === 'np' ? 'चुनौतीमा सामेल भइयो!' : 'Joined challenge!' });
      }
    }
  });

  const completeMutation = useCompleteChallenge({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChallengesQueryKey() });
        toast({ title: lang === 'np' ? 'चुनौती पूरा गरियो! EcoPoints अर्जित गरियो!' : 'Challenge completed! EcoPoints earned!' });
      }
    }
  });

  const active = challenges?.filter(c => c.status === 'active') ?? [];
  const upcoming = challenges?.filter(c => c.status === 'upcoming') ?? [];
  const completed = challenges?.filter(c => c.status === 'completed') ?? [];

  const ChallengeCard = ({ challenge }: { challenge: typeof challenges extends (infer T)[] | undefined ? T : never }) => {
    if (!challenge) return null;
    return (
      <div className={`bg-card border border-border rounded-2xl overflow-hidden transition-all hover:border-primary/30 hover:shadow-sm ${challenge.isCompleted ? 'opacity-75' : ''}`}>
        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
              {CAT_ICONS[challenge.category] || '🌍'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-0.5">
                <h3 className="font-semibold text-sm text-foreground leading-snug">
                  {lang === 'np' ? challenge.titleNp : challenge.title}
                </h3>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${STATUS_STYLES[challenge.status]}`}>
                  {lang === 'np'
                    ? challenge.status === 'active' ? 'सक्रिय' : challenge.status === 'upcoming' ? 'आगामी' : 'पूरा'
                    : challenge.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {lang === 'np' ? challenge.descriptionNp : challenge.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-600">
                <Star className="w-3 h-3" />
                {challenge.ecoPointsReward}
              </div>
              <div className="text-[10px] text-muted-foreground">EcoPoints</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-blue-600">
                <Users className="w-3 h-3" />
                {challenge.participantCount}
              </div>
              <div className="text-[10px] text-muted-foreground">{lang === 'np' ? 'सहभागी' : 'Participants'}</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-600">
                <TrendingDown className="w-3 h-3" />
                {challenge.co2AvoidedKg.toFixed(0)}
              </div>
              <div className="text-[10px] text-muted-foreground">kg CO₂</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {challenge.durationDays} {lang === 'np' ? 'दिन' : 'days'}
            </div>
            {challenge.status === 'active' && (
              challenge.isCompleted ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {lang === 'np' ? 'पूरा गरियो!' : 'Completed!'}
                </span>
              ) : challenge.isJoined ? (
                <Button
                  size="sm"
                  onClick={() => completeMutation.mutate({ id: challenge.id })}
                  disabled={completeMutation.isPending}
                  className="h-7 text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {lang === 'np' ? 'पूरा भयो' : 'Mark Complete'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => joinMutation.mutate({ id: challenge.id })}
                  disabled={joinMutation.isPending}
                  className="h-7 text-xs"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {lang === 'np' ? 'सामेल हुनुहोस्' : 'Join'}
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {lang === 'np' ? 'इको चुनौतीहरू' : 'Eco Challenges'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'np' ? 'जलवायु कार्यमा भाग लिनुहोस् र EcoPoints कमाउनुहोस्' : 'Participate in climate action and earn EcoPoints'}
          </p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-52 w-full rounded-2xl" />)}
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  {lang === 'np' ? 'सक्रिय चुनौतीहरू' : 'Active Challenges'}
                  <span className="bg-muted text-muted-foreground text-xs rounded-full px-2 py-0.5">{active.length}</span>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {active.map(c => <ChallengeCard key={c.id} challenge={c} />)}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  {lang === 'np' ? 'आगामी चुनौतीहरू' : 'Upcoming Challenges'}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcoming.map(c => <ChallengeCard key={c.id} challenge={c} />)}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                  {lang === 'np' ? 'पूरा भएका चुनौतीहरू' : 'Completed Challenges'}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completed.map(c => <ChallengeCard key={c.id} challenge={c} />)}
                </div>
              </div>
            )}

            {challenges?.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{lang === 'np' ? 'अहिलेसम्म कुनै चुनौती छैन' : 'No challenges yet'}</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
