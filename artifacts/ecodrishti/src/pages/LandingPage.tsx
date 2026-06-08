import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Leaf, BarChart3, Zap, Trophy, Users, Brain, ArrowRight, Sun, Moon, Globe, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stats = [
  { value: '500+', label: 'Schools in Nepal', labelNp: 'नेपालमा विद्यालयहरू' },
  { value: '2M+', label: 'Students Impacted', labelNp: 'प्रभावित विद्यार्थीहरू' },
  { value: '85K', label: 'kg CO₂ Reduced', labelNp: 'किग्रा CO₂ न्यूनीकरण' },
  { value: '12K', label: 'Challenges Completed', labelNp: 'चुनौतीहरू पूरा' },
];

const features = [
  {
    icon: BarChart3,
    title: 'Carbon Assessment Engine',
    titleNp: 'कार्बन मूल्याङ्कन इन्जिन',
    desc: 'Measure emissions across transportation, electricity, water, and waste with Nepal-specific emission factors.',
    descNp: 'नेपाल-विशिष्ट उत्सर्जन कारकहरूको साथ यातायात, बिजुली, पानी र फोहोरमा उत्सर्जन मापन गर्नुहोस्।',
    color: 'from-emerald-500/20 to-teal-500/10',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Brain,
    title: 'AI Recommendations',
    titleNp: 'एआई सिफारिसहरू',
    desc: 'Get personalized AI-powered action plans to reduce your school carbon footprint immediately.',
    descNp: 'विद्यालयको कार्बन फुटप्रिन्ट तत्काल घटाउन व्यक्तिगत एआई-संचालित कार्य योजनाहरू प्राप्त गर्नुहोस्।',
    color: 'from-amber-500/20 to-yellow-500/10',
    iconColor: 'text-amber-600',
  },
  {
    icon: Trophy,
    title: 'Inter-School Eco League',
    titleNp: 'अन्तर-विद्यालय इको लिग',
    desc: 'Compete fairly with similar schools. Government, community, and private schools in separate cohorts.',
    descNp: 'समान विद्यालयहरूसँग निष्पक्ष रूपमा प्रतिस्पर्धा गर्नुहोस्। सरकारी, सामुदायिक र निजी विद्यालयहरू छुट्टाछुट्टै समूहमा।',
    color: 'from-purple-500/20 to-pink-500/10',
    iconColor: 'text-purple-600',
  },
  {
    icon: Zap,
    title: 'Student Challenges',
    titleNp: 'विद्यार्थी चुनौतीहरू',
    desc: 'Walk-to-School Week, Energy Saving Week, Plastic-Free Lunch — earn EcoPoints and badges.',
    descNp: 'वाक-टु-स्कूल वीक, ऊर्जा बचत सप्ताह, प्लास्टिक-मुक्त खाजा — इकोपोइन्ट र ब्याजहरू कमाउनुहोस्।',
    color: 'from-blue-500/20 to-cyan-500/10',
    iconColor: 'text-blue-600',
  },
  {
    icon: Users,
    title: 'Community Sharing Hub',
    titleNp: 'सामुदायिक साझेदारी केन्द्र',
    desc: 'Share books, lab equipment, and resources. Reduce waste through circular economy principles.',
    descNp: 'पुस्तक, प्रयोगशाला उपकरण र स्रोतहरू साझा गर्नुहोस्। परिपत्र अर्थव्यवस्था सिद्धान्तहरूद्वारा फोहोर घटाउनुहोस्।',
    color: 'from-rose-500/20 to-orange-500/10',
    iconColor: 'text-rose-600',
  },
  {
    icon: BarChart3,
    title: 'Monthly Reports',
    titleNp: 'मासिक रिपोर्टहरू',
    desc: 'Professional sustainability reports generated automatically with league standings and trend analysis.',
    descNp: 'लिग स्थिति र प्रवृत्ति विश्लेषणको साथ स्वचालित रूपमा उत्पन्न पेशेवर दिगोपन रिपोर्टहरू।',
    color: 'from-teal-500/20 to-green-500/10',
    iconColor: 'text-teal-600',
  },
];

const tiers = [
  { name: 'Climate Starter', nameNp: 'जलवायु शुरुकर्ता', color: 'bg-slate-500', desc: 'Beginning the journey' },
  { name: 'Climate Achiever', nameNp: 'जलवायु प्राप्तकर्ता', color: 'bg-teal-600', desc: 'Making measurable progress' },
  { name: 'Climate Leader', nameNp: 'जलवायु नेता', color: 'bg-emerald-600', desc: 'Leading by example' },
  { name: 'Climate Champion', nameNp: 'जलवायु च्याम्पियन', color: 'bg-amber-500', desc: 'Inspiring the nation' },
];

export default function LandingPage() {
  const { lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">
              {lang === 'np' ? 'इकोदृष्टि एआई' : 'EcoDrishti AI'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'np' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'en' ? 'NP' : 'EN'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                {lang === 'np' ? 'लगइन' : 'Log In'}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="hidden sm:flex">
                {lang === 'np' ? 'सुरु गर्नुहोस्' : 'Get Started'}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 sm:px-6 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Leaf className="w-3.5 h-3.5" />
            {lang === 'np' ? 'नेपालको पहिलो विद्यालय जलवायु बुद्धिमत्ता प्लेटफर्म' : "Nepal's First School Climate Intelligence Platform"}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground leading-tight mb-4">
            {lang === 'np' ? (
              <>मापन गर्नुहोस्। <span className="text-primary">सिक्नुहोस्।</span> कार्बन <span className="text-accent">घटाउनुहोस्।</span></>
            ) : (
              <>Measure. <span className="text-primary">Learn.</span> Reduce <span className="text-accent">Carbon.</span></>
            )}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {lang === 'np'
              ? 'विद्यालयहरूलाई कार्बन फुटप्रिन्ट मापन गर्न, दिगोपन प्रगति ट्र्याक गर्न र डेटा-चालित जलवायु कार्यमा विद्यार्थीहरूलाई संलग्न गर्न सशक्त बनाउनुहोस्।'
              : 'Empowering schools to measure carbon footprint, track sustainability progress, and engage students in data-driven climate action.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 px-8">
                {lang === 'np' ? 'आफ्नो विद्यालय दर्ता गर्नुहोस्' : 'Register Your School'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="gap-2 px-8">
                {lang === 'np' ? 'साइन इन गर्नुहोस्' : 'Sign In'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.value} className="text-center">
                <div className="text-3xl font-extrabold text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {lang === 'np' ? s.labelNp : s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {lang === 'np' ? 'सम्पूर्ण जलवायु बुद्धिमत्ता प्लेटफर्म' : 'Complete Climate Intelligence Platform'}
            </h2>
            <p className="text-muted-foreground">
              {lang === 'np' ? 'एउटा एकीकृत प्रणालीमा सबै कुरा' : 'Everything you need in one integrated system'}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className={`rounded-2xl p-5 bg-gradient-to-br ${f.color} border border-border`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/60 dark:bg-black/30 mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {lang === 'np' ? f.titleNp : f.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {lang === 'np' ? f.descNp : f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* League Tiers */}
      <section className="py-16 px-4 sm:px-6 bg-card/30 border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {lang === 'np' ? 'इको लिग स्तरहरू' : 'Eco League Tiers'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {lang === 'np' ? 'आफ्नो जलवायु यात्रामा प्रगति गर्नुहोस्' : 'Progress through your climate journey'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tiers.map((tier) => (
              <div key={tier.name} className="bg-card border border-border rounded-xl p-4">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white mb-2 ${tier.color}`}>
                  {lang === 'np' ? tier.nameNp : tier.name}
                </span>
                <p className="text-xs text-muted-foreground">{tier.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-primary/10 rounded-3xl p-10 border border-primary/20">
            <Leaf className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-3">
              {lang === 'np' ? 'आजै सुरु गर्नुहोस्' : 'Start Today, Make an Impact'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {lang === 'np'
                ? 'आफ्नो विद्यालयलाई नेपालको हरित भविष्यको हिस्सा बनाउनुहोस्।'
                : 'Join schools across Nepal in building a measurable, data-driven sustainability future.'}
            </p>
            <Link href="/register">
              <Button size="lg" className="gap-2">
                {lang === 'np' ? 'नि:शुल्क सुरु गर्नुहोस्' : 'Get Started Free'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">EcoDrishti AI</span>
            <span className="text-xs text-muted-foreground">© 2025</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {lang === 'np' ? 'नेपालमा बनाइएको — जलवायु कार्यको लागि' : 'Built in Nepal — For Climate Action'}
          </p>
        </div>
      </footer>
    </div>
  );
}
