import React from 'react';
import { Languages } from 'lucide-react';
import { AppLanguage, useLanguage } from '../../context/LanguageContext';

type Props = { compact?: boolean; className?: string };
export const LanguageSwitcher: React.FC<Props> = ({ compact = false, className = '' }) => {
  const { language, setLanguage } = useLanguage();
  const choose = (next: AppLanguage) => setLanguage(next);
  return (
    <div className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm ${className}`} role="group" aria-label="Language / ভাষা">
      <Languages className="ml-1 h-4 w-4 text-emerald-700" aria-hidden="true" />
      <button type="button" onClick={() => choose('en')} aria-pressed={language === 'en'} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${language === 'en' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>EN{compact ? '' : ' · English'}</button>
      <button type="button" onClick={() => choose('bn')} aria-pressed={language === 'bn'} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${language === 'bn' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>বাং{compact ? '' : ' · বাংলা'}</button>
    </div>
  );
};
