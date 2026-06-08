import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'en' | 'np';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.calculator': 'Calculator',
    'nav.reports': 'Reports',
    'nav.community': 'Community',
    'nav.challenges': 'Challenges',
    'nav.league': 'Eco League',
    'nav.login': 'Log In',
    'nav.register': 'Sign Up',
    'app.title': 'EcoDrishti AI',
    'app.subtitle': 'School Climate Intelligence Platform',
  },
  np: {
    'nav.dashboard': 'ड्यासबोर्ड',
    'nav.calculator': 'क्याल्कुलेटर',
    'nav.reports': 'रिपोर्टहरू',
    'nav.community': 'समुदाय',
    'nav.challenges': 'चुनौतीहरू',
    'nav.league': 'इको लिग',
    'nav.login': 'लगइन गर्नुहोस्',
    'nav.register': 'दर्ता गर्नुहोस्',
    'app.title': 'इकोदृष्टि एआई',
    'app.subtitle': 'विद्यालय जलवायु बुद्धिमत्ता प्लेटफर्म',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('eco_lang') as Language;
    if (saved && (saved === 'en' || saved === 'np')) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('eco_lang', newLang);
  };

  const t = (key: string) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
