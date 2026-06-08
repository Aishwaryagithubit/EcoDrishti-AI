import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useGetCommunityPosts, getGetCommunityPostsQueryKey,
  useCreateCommunityPost,
  useLikeCommunityPost,
  useGetCommunityResources, getGetCommunityResourcesQueryKey,
  useShareResource,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommunityPostInputCategory, SharedResourceInputResourceType, SharedResourceInputCondition } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Heart, BookOpen, Plus, Package, Star, MessageSquare, Lightbulb, Bell, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const POST_CAT_ICONS: Record<string, React.ReactNode> = {
  achievement: <Award className="w-3 h-3" />,
  tip: <Lightbulb className="w-3 h-3" />,
  awareness: <Bell className="w-3 h-3" />,
  question: <MessageSquare className="w-3 h-3" />,
  celebration: <Star className="w-3 h-3" />,
};

const POST_CAT_COLORS: Record<string, string> = {
  achievement: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  tip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  awareness: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  question: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  celebration: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const RESOURCE_TYPE_LABELS: Record<string, { en: string; np: string }> = {
  reference_book: { en: 'Reference Book', np: 'सन्दर्भ पुस्तक' },
  story_book: { en: 'Story Book', np: 'कथा पुस्तक' },
  exam_material: { en: 'Exam Material', np: 'परीक्षा सामग्री' },
  educational_tool: { en: 'Educational Tool', np: 'शैक्षिक उपकरण' },
  lab_equipment: { en: 'Lab Equipment', np: 'प्रयोगशाला उपकरण' },
  learning_aid: { en: 'Learning Aid', np: 'सिकाइ सहायता' },
  other: { en: 'Other', np: 'अन्य' },
};

const COND_COLORS: Record<string, string> = {
  excellent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  fair: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function CommunityPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPostForm, setShowPostForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [postForm, setPostForm] = useState<{ content: string; category: CommunityPostInputCategory }>({ content: '', category: 'achievement' });
  const [resourceForm, setResourceForm] = useState<{ title: string; description: string; resourceType: SharedResourceInputResourceType; condition: SharedResourceInputCondition }>({ title: '', description: '', resourceType: 'reference_book', condition: 'good' });

  const { data: posts, isLoading: postsLoading } = useGetCommunityPosts({ query: { queryKey: getGetCommunityPostsQueryKey() } });
  const { data: resources, isLoading: resourcesLoading } = useGetCommunityResources({ query: { queryKey: getGetCommunityResourcesQueryKey() } });

  const createPost = useCreateCommunityPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCommunityPostsQueryKey() });
        setPostForm({ content: '', category: 'achievement' });
        setShowPostForm(false);
        toast({ title: lang === 'np' ? 'पोस्ट सफलतापूर्वक साझा गरियो!' : 'Post shared successfully!' });
      }
    }
  });

  const likePost = useLikeCommunityPost({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCommunityPostsQueryKey() }) }
  });

  const shareRes = useShareResource({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCommunityResourcesQueryKey() });
        setResourceForm({ title: '', description: '', resourceType: 'reference_book', condition: 'good' });
        setShowResourceForm(false);
        toast({ title: lang === 'np' ? 'स्रोत सफलतापूर्वक साझा गरियो!' : 'Resource shared successfully!' });
      }
    }
  });

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {lang === 'np' ? 'सामुदायिक साझेदारी केन्द्र' : 'Community Sharing Hub'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'np' ? 'विद्यार्थी र शिक्षकहरूको पर्यावरण समुदाय' : 'Environmental community for students and teachers'}
          </p>
        </div>

        <Tabs defaultValue="posts">
          <TabsList className="w-full">
            <TabsTrigger value="posts" className="flex-1">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              {lang === 'np' ? 'पोस्टहरू' : 'Posts'}
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex-1">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              {lang === 'np' ? 'स्रोतहरू' : 'Resources'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4 space-y-4">
            <Button size="sm" onClick={() => setShowPostForm(v => !v)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {lang === 'np' ? 'नयाँ पोस्ट' : 'New Post'}
            </Button>

            {showPostForm && (
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold">{lang === 'np' ? 'नयाँ पोस्ट सिर्जना गर्नुहोस्' : 'Create Post'}</h3>
                <Select value={postForm.category} onValueChange={v => setPostForm(f => ({ ...f, category: v as CommunityPostInputCategory }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries({ achievement: lang === 'np' ? 'उपलब्धि' : 'Achievement', tip: lang === 'np' ? 'सुझाव' : 'Tip', awareness: lang === 'np' ? 'जागरूकता' : 'Awareness', question: lang === 'np' ? 'प्रश्न' : 'Question', celebration: lang === 'np' ? 'उत्सव' : 'Celebration' }).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder={lang === 'np' ? 'आफ्नो विचार, उपलब्धि वा प्रश्न साझा गर्नुहोस्...' : 'Share your thoughts, achievements, or questions...'}
                  value={postForm.content}
                  onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))}
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setShowPostForm(false)}>
                    {lang === 'np' ? 'रद्द गर्नुहोस्' : 'Cancel'}
                  </Button>
                  <Button size="sm" onClick={() => createPost.mutate({ data: postForm })} disabled={!postForm.content || createPost.isPending}>
                    {createPost.isPending ? (lang === 'np' ? 'पोस्ट हुँदैछ...' : 'Posting...') : (lang === 'np' ? 'पोस्ट गर्नुहोस्' : 'Post')}
                  </Button>
                </div>
              </div>
            )}

            {postsLoading ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
            ) : posts && posts.length > 0 ? (
              posts.map(post => (
                <div key={post.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center font-bold text-sm text-primary flex-shrink-0">
                      {post.authorName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{post.authorName}</span>
                        <span className="text-xs text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">{post.authorRole}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${POST_CAT_COLORS[post.category]}`}>
                          {POST_CAT_ICONS[post.category]}
                          {post.category}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 mb-2">{post.content}</p>
                      {post.ecoPointsEarned && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                          +{post.ecoPointsEarned} EcoPoints
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    <button
                      onClick={() => likePost.mutate({ id: post.id })}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-500 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      {post.likes}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{lang === 'np' ? 'अहिलेसम्म कुनै पोस्ट छैन' : 'No posts yet'}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="resources" className="mt-4 space-y-4">
            <Button size="sm" onClick={() => setShowResourceForm(v => !v)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {lang === 'np' ? 'स्रोत साझा गर्नुहोस्' : 'Share Resource'}
            </Button>

            {showResourceForm && (
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold">{lang === 'np' ? 'शैक्षिक स्रोत साझा गर्नुहोस्' : 'Share Educational Resource'}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>{lang === 'np' ? 'शीर्षक' : 'Title'}</Label>
                    <Input placeholder={lang === 'np' ? 'पुस्तकको नाम...' : 'Resource name...'} value={resourceForm.title} onChange={e => setResourceForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{lang === 'np' ? 'स्रोत प्रकार' : 'Type'}</Label>
                    <Select value={resourceForm.resourceType} onValueChange={v => setResourceForm(f => ({ ...f, resourceType: v as SharedResourceInputResourceType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{lang === 'np' ? v.np : v.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{lang === 'np' ? 'अवस्था' : 'Condition'}</Label>
                    <Select value={resourceForm.condition} onValueChange={v => setResourceForm(f => ({ ...f, condition: v as SharedResourceInputCondition }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">{lang === 'np' ? 'उत्कृष्ट' : 'Excellent'}</SelectItem>
                        <SelectItem value="good">{lang === 'np' ? 'राम्रो' : 'Good'}</SelectItem>
                        <SelectItem value="fair">{lang === 'np' ? 'ठीकठाक' : 'Fair'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{lang === 'np' ? 'विवरण' : 'Description'}</Label>
                    <Textarea placeholder={lang === 'np' ? 'स्रोत बारे थप जानकारी...' : 'More info about this resource...'} value={resourceForm.description} onChange={e => setResourceForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setShowResourceForm(false)}>{lang === 'np' ? 'रद्द' : 'Cancel'}</Button>
                  <Button size="sm" onClick={() => shareRes.mutate({ data: resourceForm })} disabled={!resourceForm.title || shareRes.isPending}>
                    {shareRes.isPending ? (lang === 'np' ? 'साझा हुँदैछ...' : 'Sharing...') : (lang === 'np' ? 'साझा गर्नुहोस्' : 'Share')}
                  </Button>
                </div>
              </div>
            )}

            {resourcesLoading ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
            ) : resources && resources.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {resources.map(res => (
                  <div key={res.id} className={`bg-card border border-border rounded-xl p-4 ${!res.available ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm text-foreground">{res.title}</h4>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${COND_COLORS[res.condition]}`}>
                        {res.condition}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {lang === 'np' ? RESOURCE_TYPE_LABELS[res.resourceType]?.np : RESOURCE_TYPE_LABELS[res.resourceType]?.en}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{res.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {lang === 'np' ? 'दाता' : 'By'}: {res.donorName}
                      </span>
                      <span className={`text-xs font-medium ${res.available ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {res.available ? (lang === 'np' ? 'उपलब्ध' : 'Available') : (lang === 'np' ? 'माग भयो' : 'Requested')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{lang === 'np' ? 'अहिलेसम्म कुनै स्रोत छैन' : 'No resources shared yet'}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
