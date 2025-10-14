import { useEffect } from 'react';
import { useLang } from '../lib/LangContext';

interface LanguageWrapperProps {
  children: React.ReactNode;
}

export default function LanguageWrapper({ children }: LanguageWrapperProps) {
  const { lang } = useLang();

  useEffect(() => {
    // Apply language attribute to the root HTML element
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-lang', lang);
  }, [lang]);

  return <>{children}</>;
}
