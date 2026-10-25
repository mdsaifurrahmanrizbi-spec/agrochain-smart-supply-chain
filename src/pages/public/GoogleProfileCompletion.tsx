import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, ShoppingBag, Phone } from 'lucide-react';
import { agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const GoogleProfileCompletion: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthenticatedSession } = useAuth();
  const { language } = useLanguage();
  const [role, setRole] = useState<'farmer' | 'buyer'>('farmer');
  const [phone, setPhone] = useState('+880');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bn = language === 'bn';
  const profileToken = sessionStorage.getItem('agro_google_profile_token');
  const googleName = sessionStorage.getItem('agro_google_profile_name') || '';
  const googleEmail = sessionStorage.getItem('agro_google_profile_email') || '';

  if (!profileToken) {
    return <main className="mx-auto max-w-lg p-8 text-center"><p className="mb-4 text-slate-700">{bn ? 'Google প্রোফাইল সেশন পাওয়া যায়নি। আবার Google দিয়ে শুরু করুন।' : 'Google profile session was not found. Please start again with Google.'}</p><Link to="/register" className="font-bold text-emerald-700 underline">{bn ? 'রেজিস্ট্রেশন' : 'Register'}</Link></main>;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!/^\+8801[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ''))) {
      setError(bn ? 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (+8801XXXXXXXXX)।' : 'Enter a valid Bangladesh mobile number (+8801XXXXXXXXX).');
      return;
    }
    setLoading(true);
    try {
      const result = await agroApi.completeGoogleProfile({ profileToken, role, phone: phone.replace(/[\s-]/g, '') });
      sessionStorage.removeItem('agro_google_profile_token');
      sessionStorage.removeItem('agro_google_profile_name');
      sessionStorage.removeItem('agro_google_profile_email');
      setAuthenticatedSession(result.token, result.user);
      navigate(role === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : (bn ? 'প্রোফাইল সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।' : 'Could not complete your profile. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7ef] px-4 py-10">
      <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-9">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800"><Sprout className="h-6 w-6" /></div>
        <h1 className="text-2xl font-black text-slate-950">{bn ? 'প্রোফাইল সম্পন্ন করুন' : 'Complete your profile'}</h1>
        <p className="mt-2 text-sm text-slate-600">{bn ? 'আপনার Google অ্যাকাউন্ট' : 'Your Google account'}: <strong>{googleName || googleEmail}</strong> {googleEmail && googleName ? <span>({googleEmail})</span> : null}</p>
        <form className="mt-6 space-y-5" onSubmit={submit}>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-700">{bn ? 'আমি যোগ দিচ্ছি' : 'I am joining as'}</legend>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setRole('farmer')} aria-pressed={role === 'farmer'} className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold ${role === 'farmer' ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-600'}`}><Sprout className="h-4 w-4" />{bn ? 'কৃষক / বিক্রেতা' : 'Farmer / Seller'}</button>
              <button type="button" onClick={() => setRole('buyer')} aria-pressed={role === 'buyer'} className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold ${role === 'buyer' ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-600'}`}><ShoppingBag className="h-4 w-4" />{bn ? 'ক্রেতা' : 'Buyer / Customer'}</button>
            </div>
          </fieldset>
          <div>
            <label htmlFor="google-mobile" className="mb-2 block text-sm font-semibold text-slate-700">{bn ? 'মোবাইল নম্বর' : 'Mobile number'}</label>
            <div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="google-mobile" type="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" /></div>
          </div>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={loading} type="submit" className="w-full rounded-xl bg-emerald-800 py-3.5 text-sm font-bold text-white disabled:opacity-60">{loading ? (bn ? 'সংরক্ষণ হচ্ছে…' : 'Saving…') : (bn ? 'প্রোফাইল সম্পন্ন করুন' : 'Complete profile')}</button>
        </form>
      </section>
    </main>
  );
};
