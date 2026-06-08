import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useRegister } from '@workspace/api-client-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Leaf, Eye, EyeOff, Globe, Sun, Moon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RegisterInputRole } from '@workspace/api-client-react';

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<{
    name: string; email: string; password: string; schoolName: string;
    role: 'admin' | 'teacher' | 'student';
  }>({
    name: '',
    email: '',
    password: '',
    schoolName: '',
    role: 'admin',
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user);
        navigate('/dashboard');
      },
      onError: () => {
        setError(lang === 'np' ? 'दर्ता असफल। कृपया पुनः प्रयास गर्नुहोस्।' : 'Registration failed. Please try again.');
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    registerMutation.mutate({ data: form });
  };

  return (
    <div className="min-h-screen bg-background flex">
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
            {lang === 'np' ? 'आफ्नो विद्यालय दर्ता गर्नुहोस्' : 'Register Your School'}
          </h2>
          <p className="text-white/70 max-w-sm">
            {lang === 'np'
              ? 'जलवायु मापन र दिगोपन ट्र्याकिङ सुरु गर्न आज नै सामेल हुनुहोस्।'
              : 'Join Nepal\'s growing network of schools committed to measurable climate action.'}
          </p>
        </div>
        <p className="text-white/40 text-xs">EcoDrishti AI © 2025</p>
      </div>

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
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {lang === 'np' ? 'खाता सिर्जना गर्नुहोस्' : 'Create Account'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {lang === 'np' ? 'पहिले नै खाता छ?' : 'Already have an account?'}{' '}
                <Link href="/login">
                  <span className="text-primary font-medium cursor-pointer hover:underline">
                    {lang === 'np' ? 'साइन इन गर्नुहोस्' : 'Sign in'}
                  </span>
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>{lang === 'np' ? 'पूरा नाम' : 'Full Name'}</Label>
                <Input
                  placeholder={lang === 'np' ? 'राम बहादुर' : 'Ram Bahadur'}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'np' ? 'इमेल ठेगाना' : 'Email Address'}</Label>
                <Input
                  type="email"
                  placeholder="admin@school.edu"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'np' ? 'विद्यालयको नाम' : 'School Name'}</Label>
                <Input
                  placeholder={lang === 'np' ? 'शान्ति माध्यमिक विद्यालय' : 'Shanti Secondary School'}
                  value={form.schoolName}
                  onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'np' ? 'भूमिका' : 'Role'}</Label>
                <Select value={form.role} onValueChange={val => setForm(f => ({ ...f, role: val as 'admin' | 'teacher' | 'student' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{lang === 'np' ? 'प्रशासक' : 'Admin'}</SelectItem>
                    <SelectItem value="teacher">{lang === 'np' ? 'शिक्षक' : 'Teacher'}</SelectItem>
                    <SelectItem value="student">{lang === 'np' ? 'विद्यार्थी' : 'Student'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{lang === 'np' ? 'पासवर्ड' : 'Password'}</Label>
                <div className="relative">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    minLength={6}
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

              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending
                  ? (lang === 'np' ? 'दर्ता हुँदैछ...' : 'Creating account...')
                  : (lang === 'np' ? 'खाता सिर्जना गर्नुहोस्' : 'Create Account')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
