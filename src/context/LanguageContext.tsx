import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'bn' | 'en';
type LanguageContextValue = { language: AppLanguage; setLanguage: (language: AppLanguage) => void; t: (english: string) => string; voiceLocale: 'bn-BD' | 'en-US' };
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
const STORAGE_KEY = 'agrochain-language';

const translations: Record<string, string> = {
  'Agricultural Marketplace':'কৃষিপণ্য বাজার','Supply Chain Process':'সরবরাহ শৃঙ্খল প্রক্রিয়া','About Platform':'প্ল্যাটফর্ম সম্পর্কে','Regional Hubs':'আঞ্চলিক কেন্দ্র',
  'View Cart':'কার্ট দেখুন','Sign In':'সাইন ইন','Sign Up':'নিবন্ধন করুন','Register':'নিবন্ধন','Login':'লগইন','Email':'ইমেইল','Password':'পাসওয়ার্ড',
  'Full Name':'পুরো নাম','Phone Number':'ফোন নম্বর','Language':'ভাষা','English':'ইংরেজি','বাংলা':'বাংলা','Choose language':'ভাষা নির্বাচন করুন',
  'Dashboard':'ড্যাশবোর্ড','Profile':'প্রোফাইল','Settings':'সেটিংস','Save Changes':'পরিবর্তন সংরক্ষণ করুন','Save':'সংরক্ষণ','Cancel':'বাতিল',
  'Search':'খুঁজুন','Search products...':'পণ্য খুঁজুন...','Search products':'পণ্য খুঁজুন','Products':'পণ্য','Orders':'অর্ডার','Payments':'পেমেন্ট','Reports':'রিপোর্ট',
  'Farmer':'কৃষক','Customer':'ক্রেতা','Delivery Partner':'ডেলিভারি পার্টনার','Warehouse':'গুদাম','Quality Inspector':'মান পরিদর্শক','Admin':'অ্যাডমিন',
  'Logout':'লগআউট','Log Out':'লগআউট','Welcome':'স্বাগতম','Home':'হোম','Contact':'যোগাযোগ','About':'আমাদের সম্পর্কে',
  'Loading...':'লোড হচ্ছে...','Submit':'জমা দিন','Continue':'চালিয়ে যান','Back':'পেছনে','Next':'পরবর্তী','Status':'অবস্থা','Pending':'অপেক্ষমাণ','Approved':'অনুমোদিত',
  'Name':'নাম','Location':'অবস্থান','Address':'ঠিকানা','District':'জেলা','Phone':'ফোন','Update Profile':'প্রোফাইল আপডেট করুন',
  'System Architecture & Backend Settings':'সিস্টেম আর্কিটেকচার ও ব্যাকএন্ড সেটিংস','Farmer Profile & Payout Settings':'কৃষক প্রোফাইল ও পেমেন্ট সেটিংস',
  'Manage your verified farmer identity and settlement mobile banking accounts.':'আপনার যাচাইকৃত কৃষক পরিচয় ও পেমেন্টের মোবাইল ব্যাংকিং অ্যাকাউন্ট পরিচালনা করুন।',
  'Agricultural Marketplace':'কৃষিপণ্য বাজার','Supply Chain':'সরবরাহ শৃঙ্খল','View Cart':'কার্ট দেখুন',
  'Voice to Text':'ভয়েস থেকে লেখা','Start Listening':'শোনা শুরু করুন','Stop Listening':'শোনা বন্ধ করুন','Listening...':'শোনা হচ্ছে...'
};

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : localStorage.getItem(STORAGE_KEY) === 'bn' ? 'bn' : 'en'; }
    catch { return 'en'; }
  });
  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage can be unavailable */ }
  }, []);
  useEffect(() => { document.documentElement.lang = language === 'bn' ? 'bn' : 'en'; }, [language]);
  const value = useMemo<LanguageContextValue>(() => ({
    language, setLanguage, t: (english: string) => language === 'en' ? english : (translations[english] || english),
    voiceLocale: language === 'bn' ? 'bn-BD' : 'en-US'
  }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
};
