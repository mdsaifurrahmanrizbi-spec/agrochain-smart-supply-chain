import React from 'react';
import { AppLanguage, useLanguage } from '../../context/LanguageContext';

type Props = { compact?: boolean; className?: string };

export const LanguageSwitcher: React.FC<Props> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();
  const choose = (next: AppLanguage) => setLanguage(next);

  return (
    <div className={`inline-flex h-9 w-[176px] shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm ${className}`} role="group" aria-label="ভাষা নির্বাচন">
      <button type="button" onClick={() => choose('en')} aria-pressed={language === 'en'} className={`h-7 min-w-[76px] rounded-md px-2 text-xs font-semibold transition ${language === 'en' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`} title="English" aria-label="English">EN - English</button>
      <button type="button" onClick={() => choose('bn')} aria-pressed={language === 'bn'} className={`h-7 min-w-[76px] rounded-md px-2 text-xs font-semibold transition ${language === 'bn' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`} title="বাংলা" aria-label="বাংলা">বাং - বাংলা</button>
    </div>
  );
};
