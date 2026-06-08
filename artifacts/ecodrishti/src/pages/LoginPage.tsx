import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Leaf, Eye, EyeOff, Globe, Sun, Moon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('admin@ecodrishti.edu');
  const [password, setPassword] = useState('password123');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user);
        navigate('/dashboard');
      },
      onError: () => {
        setError(lang === 'np' ? 'अमान्य इमेल वा पासवर्ड' : 'Invalid email or password');
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 to-primary flex-col justify-between p-10">
        <div>
          <Link href="/">
            <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              {lang === 'np' ? 'घरमा फर्कनुहोस्' : 'Back to Home'}
            </button>
          </Link>
        </div>
        <div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            {lang === 'np' ? 'स्वागत छ!' : 'Welcome Back!'}
          </h2>
          <p className="text-white/70 max-w-sm">
            {lang === 'np'
              ? 'आफ्नो विद्यालयको जलवायु प्रगति ट्र्याक गर्न साइन इन गर्नुहोस्।'
              : "Sign in to continue tracking your school's climate progress and sustainability journey."}
          </p>
          <div className="mt-8 space-y-3">
            {['Carbon tracking', 'AI insights', 'League rankings'].map(t => (
              <div key={t} className="flex items-center gap-2 text-white/80 text-sm">
                <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                {t}
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-xs">EcoDrishti AI © 2025</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border lg:border-none">
          <div className="flex items-center gap-2 lg:hidden">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">EcoDrishti AI</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setLang(lang === 'en' ? 'np' : 'en')} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
              <Globe className="w-4 h-4" />
            </button>
            <button onClick={toggleTheme} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {lang === 'np' ? 'साइन इन गर्नुहोस्' : 'Sign In'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {lang === 'np' ? 'आफ्नो खाता छैन?' : "Don't have an account?"}{' '}
                <Link href="/register">
                  <span className="text-primary font-medium cursor-pointer hover:underline">
                    {lang === 'np' ? 'दर्ता गर्नुहोस्' : 'Sign up'}
                  </span>
                </Link>
              </p>
            </div>

            {/* Demo credentials hint */}
            <div className="mb-5 p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs text-muted-foreground">
              <strong className="text-foreground">Demo:</strong> admin@ecodrishti.edu / password123
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{lang === 'np' ? 'इमेल' : 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={lang === 'np' ? 'admin@school.edu' : 'admin@school.edu'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{lang === 'np' ? 'पासवर्ड' : 'Password'}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending
                  ? (lang === 'np' ? 'साइन इन हुँदैछ...' : 'Signing in...')
                  : (lang === 'np' ? 'साइन इन गर्नुहोस्' : 'Sign In')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
