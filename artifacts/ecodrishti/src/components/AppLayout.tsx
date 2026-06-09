import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLogout } from '@workspace/api-client-react';
import {
  LayoutDashboard, Calculator, FileText, Users, Trophy, Zap,
  LogOut, Menu, X, Sun, Moon, Globe, Leaf, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', labelNp: 'ड्यासबोर्ड' },
  { path: '/carbon-calculator', icon: Calculator, label: 'Calculator', labelNp: 'क्याल्कुलेटर' },
  { path: '/reports', icon: FileText, label: 'Reports', labelNp: 'रिपोर्टहरू' },
  { path: '/community', icon: Users, label: 'Community', labelNp: 'समुदाय' },
  { path: '/challenges', icon: Zap, label: 'Challenges', labelNp: 'चुनौतीहरू' },
  { path: '/league', icon: Trophy, label: 'Eco League', labelNp: 'इको लिग' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
    logout();
  };

  const tierColors: Record<string, string> = {
    'Climate Champion': 'bg-amber-500 text-white',
    'Climate Leader': 'bg-emerald-600 text-white',
    'Climate Achiever': 'bg-teal-600 text-white',
    'Climate Starter': 'bg-slate-500 text-white',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen z-50 w-64 flex flex-col
        bg-sidebar text-sidebar-foreground
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto lg:h-full lg:shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border shrink-0">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">
              {lang === 'np' ? 'इकोदृष्टि एआई' : 'EcoDrishti AI'}
            </h1>
            <p className="text-[10px] text-sidebar-foreground/60 leading-tight">
              {lang === 'np' ? 'जलवायु बुद्धिमत्ता' : 'Climate Intelligence'}
            </p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-4 border-b border-sidebar-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/30 rounded-full flex items-center justify-center font-bold text-sm text-sidebar-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-[11px] text-sidebar-foreground/60 truncate">{user.schoolName}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs bg-accent/20 text-accent rounded-full px-2 py-0.5 font-medium">
                {user.ecoPoints} pts
              </span>
              {user.badge && (
                <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${tierColors[user.badge] || 'bg-muted text-muted-foreground'}`}>
                  {user.badge}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label, labelNp }) => {
            const active = location === path || (path !== '/' && location.startsWith(path));
            return (
              <Link key={path} href={path}>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150 group
                    ${active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{lang === 'np' ? labelNp : label}</span>
                  {active && <ChevronRight className="w-3 h-3 ml-auto opacity-70" />}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-2 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {theme === 'dark' ? (lang === 'np' ? 'उज्यालो' : 'Light') : (lang === 'np' ? 'अँध्यारो' : 'Dark')}
            </button>
            <button
              onClick={() => setLang(lang === 'en' ? 'np' : 'en')}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'en' ? 'NP' : 'EN'}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-300 hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {lang === 'np' ? 'बाहिर निस्कनुहोस्' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden shrink-0 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-1 rounded-md hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">EcoDrishti AI</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
