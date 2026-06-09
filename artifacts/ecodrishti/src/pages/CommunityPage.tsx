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
import { Users, Heart, BookOpen, Plus, Package, Star, MessageSquare, Lightbulb, Bell, Award, Send, ImagePlus, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { npNum } from '@/lib/nepali';

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

interface Comment {
  id: string;
  author: string;
  text: string;
  time: Date;
  role: string;
}

const DUMMY_POSTS = [
  { id: 99901, authorName: 'Sita Sharma', authorRole: 'teacher', category: 'achievement', content: 'Excited to share that our school reduced electricity usage by 18% this month! LED lights in all classrooms and strict shutdown routine after class. 🌱', ecoPointsEarned: 50, likes: 14, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 99902, authorName: 'Ram Bahadur', authorRole: 'student', category: 'tip', content: 'Small tip: keep a water bottle at your desk instead of using cups. Our class saved an estimated 200 single-use cups this week alone! 💧', ecoPointsEarned: 30, likes: 22, createdAt: new Date(Date.now() - 3600000 * 26).toISOString() },
  { id: 99903, authorName: 'Ms. Poudel', authorRole: 'teacher', category: 'question', content: 'Has any school successfully set up a rainwater harvesting system? We\'re planning to install one and would love advice on the setup costs and logistics in Nepal.', ecoPointsEarned: null, likes: 8, createdAt: new Date(Date.now() - 3600000 * 72).toISOString() },
  { id: 99904, authorName: 'Eco Club Members', authorRole: 'student', category: 'celebration', content: '🎉 We just completed the "Walk to School Week" challenge with 94% participation! 485 students walked or cycled for 5 consecutive days. Proud of our school family!', ecoPointsEarned: 100, likes: 47, createdAt: new Date(Date.now() - 3600000 * 120).toISOString() },
  { id: 99905, authorName: 'Principal KC', authorRole: 'admin', category: 'awareness', content: 'Reminder: the national Eco League rankings update on the 1st of each month. Our school is currently #3 nationally. Let\'s keep pushing! Every action counts. 🏆', ecoPointsEarned: 20, likes: 31, createdAt: new Date(Date.now() - 3600000 * 200).toISOString() },
];

const DUMMY_RESOURCES = [
  { id: 99801, title: 'Class 9 Science Textbook (Set of 5)', description: 'Lightly used. Perfect condition. Sharing to reduce waste and help neighbouring schools.', resourceType: 'reference_book', condition: 'excellent', available: true, donorName: 'Sita Sharma', createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: 99802, title: 'Digital Multimeter (Fluke 101)', description: 'Lab-grade multimeter. Used by electronics students for 2 years. Still fully functional.', resourceType: 'lab_equipment', condition: 'good', available: true, donorName: 'Physics Dept, SHS', createdAt: new Date(Date.now() - 3600000 * 30).toISOString() },
  { id: 99803, title: 'Environmental Science Revision Kit', description: 'Includes flashcards, practice papers, and notes for Grade 11 & 12 environment curriculum.', resourceType: 'exam_material', condition: 'good', available: false, donorName: 'Ram Bahadur', createdAt: new Date(Date.now() - 3600000 * 100).toISOString() },
  { id: 99804, title: 'Solar Energy Working Model Kit', description: 'Student-built working model for solar energy demonstration. Ideal for science fairs.', resourceType: 'educational_tool', condition: 'excellent', available: true, donorName: 'Eco Club', createdAt: new Date(Date.now() - 3600000 * 200).toISOString() },
];

const DUMMY_COMMENTS: Record<number, Comment[]> = {
  99901: [
    { id: 'c1', author: 'Arjun K.', role: 'student', text: 'Amazing work! Our class is doing the same. Can you share what LED brand you used?', time: new Date(Date.now() - 3600000) },
    { id: 'c2', author: 'Ms. Adhikari', role: 'teacher', text: 'This is inspiring — will share with our principal!', time: new Date(Date.now() - 1800000) },
  ],
  99904: [
    { id: 'c3', author: 'Priya M.', role: 'student', text: 'We want to do this too! How did you convince car-riding students to walk?', time: new Date(Date.now() - 3600000 * 2) },
  ],
};

export default function CommunityPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPostForm, setShowPostForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [postForm, setPostForm] = useState<{ content: string; category: CommunityPostInputCategory }>({ content: '', category: 'achievement' });
  const [resourceForm, setResourceForm] = useState<{ title: string; description: string; resourceType: SharedResourceInputResourceType; condition: SharedResourceInputCondition; photoName: string }>({ title: '', description: '', resourceType: 'reference_book', condition: 'good', photoName: '' });
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [localComments, setLocalComments] = useState<Record<number, Comment[]>>(DUMMY_COMMENTS);
  const [localLikes, setLocalLikes] = useState<Record<number, number>>({});

  const { data: postsRaw, isLoading: postsLoading } = useGetCommunityPosts({ query: { queryKey: getGetCommunityPostsQueryKey() } });
  const { data: resourcesRaw, isLoading: resourcesLoading } = useGetCommunityResources({ query: { queryKey: getGetCommunityResourcesQueryKey() } });

  const posts = (postsRaw && postsRaw.length > 0) ? postsRaw : DUMMY_POSTS;
  const resources = (resourcesRaw && resourcesRaw.length > 0) ? resourcesRaw : DUMMY_RESOURCES;

  const createPost = useCreateCommunityPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCommunityPostsQueryKey() });
        setPostForm({ content: '', category: 'achievement' });
        setShowPostForm(false);
        toast({ title: lang === 'np' ? '✅ पोस्ट साझा गरियो!' : '✅ Post shared!' });
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
        setResourceForm({ title: '', description: '', resourceType: 'reference_book', condition: 'good', photoName: '' });
        setShowResourceForm(false);
        toast({ title: lang === 'np' ? '✅ स्रोत साझा गरियो!' : '✅ Resource shared!' });
      }
    }
  });

  const toggleComments = (postId: number) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const addComment = (postId: number) => {
    const text = (commentTexts[postId] || '').trim();
    if (!text) return;
    const newComment: Comment = {
      id: `local-${Date.now()}`,
      author: user?.name ?? 'You',
      role: 'teacher',
      text,
      time: new Date(),
    };
    setLocalComments(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), newComment] }));
    setCommentTexts(prev => ({ ...prev, [postId]: '' }));
    toast({ title: lang === 'np' ? '💬 टिप्पणी थपियो!' : '💬 Comment added!' });
  };

  const handleLocalLike = (postId: number) => {
    setLocalLikes(prev => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }));
    if (postsRaw && postsRaw.length > 0) {
      likePost.mutate({ id: postId });
    }
  };

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

          {/* ===== POSTS TAB ===== */}
          <TabsContent value="posts" className="mt-4 space-y-4">
            <Button size="sm" onClick={() => setShowPostForm(v => !v)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {lang === 'np' ? 'नयाँ पोस्ट' : 'New Post'}
            </Button>

            {showPostForm && (
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold">{lang === 'np' ? 'नयाँ पोस्ट' : 'Create Post'}</h3>
                <Select value={postForm.category} onValueChange={v => setPostForm(f => ({ ...f, category: v as CommunityPostInputCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Button size="sm" variant="outline" onClick={() => setShowPostForm(false)}>{lang === 'np' ? 'रद्द' : 'Cancel'}</Button>
                  <Button size="sm" onClick={() => createPost.mutate({ data: postForm })} disabled={!postForm.content || createPost.isPending}>
                    {createPost.isPending ? (lang === 'np' ? 'पोस्ट...' : 'Posting...') : (lang === 'np' ? 'पोस्ट गर्नुहोस्' : 'Post')}
                  </Button>
                </div>
              </div>
            )}

            {postsLoading ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
            ) : (
              posts.map(post => {
                const commentsForPost = localComments[post.id] ?? [];
                const isExpanded = expandedComments[post.id] ?? false;
                const extraLikes = localLikes[post.id] ?? 0;
                return (
                  <div key={post.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-colors">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center font-bold text-sm text-primary flex-shrink-0">
                          {post.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{post.authorName}</span>
                            <span className="text-xs text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">{post.authorRole}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${POST_CAT_COLORS[post.category]}`}>
                              {POST_CAT_ICONS[post.category]}
                              {lang === 'np'
                                ? post.category === 'achievement' ? 'उपलब्धि' : post.category === 'tip' ? 'सुझाव' : post.category === 'awareness' ? 'जागरूकता' : post.category === 'question' ? 'प्रश्न' : 'उत्सव'
                                : post.category}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90 mb-2 leading-relaxed">{post.content}</p>
                          {post.ecoPointsEarned && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                              +{npNum(post.ecoPointsEarned, lang)} EcoPoints
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-4">
                        <button
                          onClick={() => handleLocalLike(post.id)}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-500 transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          {npNum((post.likes ?? 0) + extraLikes, lang)}
                        </button>
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {npNum(commentsForPost.length, lang)} {lang === 'np' ? 'टिप्पणीहरू' : 'comments'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Comments section */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/20 p-4 space-y-3">
                        {commentsForPost.length > 0 && (
                          <div className="space-y-2.5">
                            {commentsForPost.map(c => (
                              <div key={c.id} className="flex items-start gap-2">
                                <div className="w-7 h-7 bg-secondary rounded-full flex items-center justify-center text-xs font-bold text-secondary-foreground flex-shrink-0">
                                  {c.author.charAt(0)}
                                </div>
                                <div className="flex-1 bg-card rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-semibold text-foreground">{c.author}</span>
                                    <span className="text-[10px] text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">{c.role}</span>
                                    <span className="text-[10px] text-muted-foreground ml-auto">{formatDistanceToNow(c.time, { addSuffix: true })}</span>
                                  </div>
                                  <p className="text-xs text-foreground/90">{c.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Add comment input */}
                        <div className="flex items-center gap-2 pt-1">
                          <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {user?.name?.charAt(0) ?? 'Y'}
                          </div>
                          <Input
                            placeholder={lang === 'np' ? 'टिप्पणी थप्नुहोस्...' : 'Add a comment...'}
                            className="flex-1 h-8 text-xs"
                            value={commentTexts[post.id] ?? ''}
                            onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') addComment(post.id); }}
                          />
                          <Button size="sm" className="h-8 w-8 p-0" onClick={() => addComment(post.id)}>
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* ===== RESOURCES TAB ===== */}
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
                    <Label className="text-xs">{lang === 'np' ? 'शीर्षक' : 'Title'}</Label>
                    <Input placeholder={lang === 'np' ? 'स्रोतको नाम...' : 'Resource name...'} value={resourceForm.title} onChange={e => setResourceForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">{lang === 'np' ? 'प्रकार' : 'Type'}</Label>
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
                    <Label className="text-xs">{lang === 'np' ? 'अवस्था' : 'Condition'}</Label>
                    <Select value={resourceForm.condition} onValueChange={v => setResourceForm(f => ({ ...f, condition: v as SharedResourceInputCondition }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">{lang === 'np' ? 'उत्कृष्ट' : 'Excellent'}</SelectItem>
                        <SelectItem value="good">{lang === 'np' ? 'राम्रो' : 'Good'}</SelectItem>
                        <SelectItem value="fair">{lang === 'np' ? 'ठीकठाक' : 'Fair'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{lang === 'np' ? 'फोटो थप्नुहोस्' : 'Add Photo'}</Label>
                    <label className="mt-1 flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <ImagePlus className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {resourceForm.photoName
                          ? resourceForm.photoName
                          : (lang === 'np' ? 'फोटो छान्नुहोस् (वैकल्पिक)' : 'Choose photo (optional)')}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          setResourceForm(f => ({ ...f, photoName: file?.name ?? '' }));
                        }}
                      />
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">{lang === 'np' ? 'विवरण' : 'Description'}</Label>
                    <Textarea placeholder={lang === 'np' ? 'स्रोत बारे थप जानकारी...' : 'More info about this resource...'} value={resourceForm.description} onChange={e => setResourceForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setShowResourceForm(false)}>{lang === 'np' ? 'रद्द' : 'Cancel'}</Button>
                  <Button size="sm" onClick={() => shareRes.mutate({ data: { title: resourceForm.title, description: resourceForm.description, resourceType: resourceForm.resourceType, condition: resourceForm.condition } })} disabled={!resourceForm.title || shareRes.isPending}>
                    {shareRes.isPending ? (lang === 'np' ? 'साझा...' : 'Sharing...') : (lang === 'np' ? 'साझा गर्नुहोस्' : 'Share')}
                  </Button>
                </div>
              </div>
            )}

            {resourcesLoading ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {resources.map(res => {
                  const commentsForRes = localComments[res.id] ?? [];
                  const isExpanded = expandedComments[res.id] ?? false;
                  return (
                    <div key={res.id} className={`bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-colors ${!res.available ? 'opacity-70' : ''}`}>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm text-foreground leading-snug">{res.title}</h4>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${COND_COLORS[res.condition]}`}>{lang === 'np' ? (res.condition === 'excellent' ? 'उत्कृष्ट' : res.condition === 'good' ? 'राम्रो' : 'ठीकठाक') : res.condition}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {lang === 'np' ? RESOURCE_TYPE_LABELS[res.resourceType]?.np : RESOURCE_TYPE_LABELS[res.resourceType]?.en}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{res.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{lang === 'np' ? 'दाता' : 'By'}: <strong className="text-foreground">{res.donorName}</strong></span>
                          <span className={`text-xs font-semibold ${res.available ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            {res.available ? (lang === 'np' ? '✅ उपलब्ध' : '✅ Available') : (lang === 'np' ? '🔒 माग भयो' : '🔒 Requested')}
                          </span>
                        </div>
                      </div>
                      {/* Comments for resource */}
                      <div className="border-t border-border px-4 py-2">
                        <button onClick={() => toggleComments(res.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {npNum(commentsForRes.length, lang)} {lang === 'np' ? 'टिप्पणीहरू' : 'comments'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-border bg-muted/20 p-3 space-y-2">
                          {commentsForRes.map(c => (
                            <div key={c.id} className="text-xs bg-card rounded-lg px-3 py-2">
                              <span className="font-semibold text-foreground">{c.author}</span>
                              <span className="text-muted-foreground"> · </span>
                              <span className="text-foreground/80">{c.text}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 pt-1">
                            <Input
                              placeholder={lang === 'np' ? 'प्रश्न सोध्नुहोस्...' : 'Ask a question...'}
                              className="flex-1 h-7 text-xs"
                              value={commentTexts[res.id] ?? ''}
                              onChange={e => setCommentTexts(prev => ({ ...prev, [res.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') addComment(res.id); }}
                            />
                            <Button size="sm" className="h-7 w-7 p-0" onClick={() => addComment(res.id)}>
                              <Send className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
