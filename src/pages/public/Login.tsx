import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import { UserRole } from '../../types';
import { agroApi } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { GoogleSignInButton } from '../../components/common/GoogleSignInButton';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Sprout, Leaf, Eye, EyeOff, UserRound, Store, Truck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, switchDemoRole, setAuthenticatedSession } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const availableRoles: UserRole[] = location.pathname.startsWith('/admin-portal')
    ? ['admin']
    : location.pathname.startsWith('/warehouse-portal')
      ? ['warehouse', 'inspector']
      : ['farmer', 'buyer', 'delivery'];
  const [selectedRole, setSelectedRole] = useState<UserRole>(location.pathname === '/login' ? 'buyer' : availableRoles[0]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleAttempted, setGoogleAttempted] = useState(false);

  const demoAccounts: { role: UserRole; name: string; email: string; label: string; path: string }[] = [
    { role: 'admin', name: 'Dr. Harun-ur-Rashid', email: 'admin@agrochain.gov.bd', label: 'Admin (System)', path: '/admin/dashboard' },
    { role: 'farmer', name: 'Md. Rafiqul Islam', email: 'rafiqul.farmer@agrochain.com', label: 'Farmer (Bogura)', path: '/farmer/dashboard' },
    { role: 'buyer', name: 'Tasnim Rahman', email: 'tasnim.buyer@gmail.com', label: 'Customer (Dhaka)', path: '/buyer/dashboard' },
    { role: 'delivery', name: 'Kamal Hossain', email: 'kamal.logistics@agrochain.com', label: 'Delivery Partner', path: '/delivery/dashboard' },
    { role: 'warehouse', name: 'Anisul Haque', email: 'anisul.warehouse@agrochain.com', label: 'Warehouse Manager', path: '/warehouse/dashboard' },
    { role: 'inspector', name: 'Dr. Farzana Akter', email: 'farzana.qc@agrochain.gov.bd', label: 'Quality Inspector', path: '/inspector/dashboard' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authenticatedUser = await login(email, password, selectedRole);
      const rolePaths: Record<UserRole, string> = {
        admin: '/admin/dashboard',
        farmer: '/farmer/dashboard',
        buyer: '/buyer/dashboard',
        delivery: '/delivery/dashboard',
        warehouse: '/warehouse/dashboard',
        inspector: '/inspector/dashboard',
      };

      navigate(rolePaths[authenticatedUser.role] || '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setError('');
    setLoading(true);
    try {
      const result = await agroApi.googleAuth(credential, selectedRole === 'farmer' || selectedRole === 'buyer' ? selectedRole : undefined);
      if ('needsProfile' in result && result.needsProfile) {
        sessionStorage.setItem('agro_google_profile_token', result.profileToken);
        sessionStorage.setItem('agro_google_profile_name', result.name || '');
        sessionStorage.setItem('agro_google_profile_email', result.email || '');
        navigate('/google-profile');
        return;
      }
      if (!('token' in result) || !('user' in result)) throw new Error('The server returned an invalid Google authentication response');
      setAuthenticatedSession(result.token, result.user);
      const paths: Record<UserRole, string> = { admin: '/admin/dashboard', farmer: '/farmer/dashboard', buyer: '/buyer/dashboard', delivery: '/delivery/dashboard', warehouse: '/warehouse/dashboard', inspector: '/inspector/dashboard' };
      navigate(paths[result.user.role] || '/', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, selectedRole, setAuthenticatedSession]);

  const handleGoogleError = useCallback((message: string) => setError(message), []);

  const handleQuickDemo = (role: UserRole, emailStr: string, path: string) => {
    setEmail(emailStr);
    switchDemoRole(role);
    navigate(path);
  };

  return (
    <div className="auth-night-page auth-night-login min-h-screen bg-white text-slate-900">
      <style>{`
        .auth-night-login { min-height: 100vh; height: auto !important; background: #F8FAF9 !important; color: #1E293B !important; position: relative; overflow-x: hidden; overflow-y: visible !important; }
        .auth-night-login .auth-night-layout { min-height: calc(100vh - 80px); height: auto !important; align-items: flex-start !important; padding: 2rem 1rem 3rem; background: #F8FAF9 !important; overflow: visible !important; }
        .auth-night-login .auth-night-main { width: 100%; max-width: 34.375rem !important; }
        .auth-night-login .auth-glass-card { width: 100%; height: auto !important; max-height: none !important; overflow: visible !important; flex: 0 0 auto !important; max-width: 34.375rem !important; padding: 2rem !important; border: 1px solid #E2E8F0 !important; border-radius: 20px !important; background: #fff !important; color: #1E293B !important; box-shadow: 0 12px 32px rgba(15,23,42,.06) !important; backdrop-filter: none !important; }
        .auth-night-login .auth-form-panel { background: #fff !important; border-color: #fff !important; }
        .auth-night-login .auth-night-input { height: 50px; color: #1E293B !important; background: #fff !important; border: 1px solid #E2E8F0 !important; border-radius: 10px !important; box-shadow: 0 1px 3px rgba(15,23,42,.06); }
        .auth-night-login .auth-night-input::placeholder { color: #94A3B8 !important; }
        .auth-night-login .auth-night-input { padding-left: 44px !important; }
        .auth-night-login .auth-night-input:focus { border-color: #16A34A !important; box-shadow: 0 0 0 3px rgba(22,163,74,.14) !important; outline: none !important; }
        .auth-night-login .auth-night-input ~ button { color: #64748B !important; }
        .auth-night-login .auth-night-primary { width: 100% !important; height: 50px !important; min-height: 50px !important; padding-top: 0 !important; padding-bottom: 0 !important; border-radius: 9999px !important; background: #16A34A !important; color: #fff !important; font-weight: 700 !important; opacity: 1 !important; }
        .auth-night-login .auth-night-primary:hover { background: #15803D !important; }
        .auth-night-login .auth-role-button { white-space: nowrap !important; font-size: 14px !important; padding-left: 8px !important; padding-right: 8px !important; }
        .auth-night-login .auth-google-panel > p { color: #64748B !important; font-size: 12px !important; font-weight: 600 !important; }
        .auth-night-login .auth-google-panel > div > div[aria-label] { width: 100% !important; }
        .auth-night-login .auth-night-foot { background: transparent !important; border: 0 !important; padding: 0 !important; font-size: 14px !important; color: #64748B !important; opacity: 1 !important; }
        .auth-night-login .auth-night-foot p { color: #64748B !important; font-size: 14px !important; font-weight: 400 !important; opacity: 1 !important; }
        .auth-night-login .auth-night-foot a { color: #16A34A !important; font-weight: 700 !important; opacity: 1 !important; }
        .auth-night-login label { color: #1E293B !important; }
        .auth-night-login .auth-night-primary { min-height: 50px; background: #16A34A !important; color: #fff !important; border-radius: 9999px !important; box-shadow: none !important; }
        .auth-night-login .auth-night-primary:hover { background: #15803D !important; }
        .auth-night-login .auth-glass-card a { color: #16A34A; }
        .auth-night-login .auth-night-layout { position: relative; z-index: 1; }
        .auth-night-login .auth-night-main, .auth-night-login .auth-glass-card form { min-height: 0 !important; height: auto !important; max-height: none !important; overflow: visible !important; }
        html:has(.auth-night-login), body:has(.auth-night-login), #root:has(.auth-night-login) { height: auto !important; min-height: 100% !important; overflow-y: auto !important; }
        .auth-night-login .auth-glass-card { position: relative; z-index: 1; }
        .auth-night-login:before, .auth-night-login:after { content: ""; position: fixed; bottom: -28px; width: 150px; height: 170px; pointer-events: none; z-index: 0; opacity: .24; background: radial-gradient(ellipse at 30% 20%, #36a66c 0 18%, transparent 19%), radial-gradient(ellipse at 68% 43%, #36a66c 0 17%, transparent 18%), radial-gradient(ellipse at 35% 65%, #36a66c 0 17%, transparent 18%), radial-gradient(ellipse at 78% 83%, #36a66c 0 14%, transparent 15%); }
        .auth-night-login:before { left: -18px; transform: rotate(-24deg); }
        .auth-night-login:after { right: -18px; transform: scaleX(-1) rotate(-24deg); }
        .auth-night-login .auth-night-layout, .auth-night-login .auth-night-main { position: relative; z-index: 1; }
        .auth-night-login .auth-night-layout { display: flex; min-height: calc(100vh - 80px); height: auto !important; justify-content: center; align-items: flex-start !important; padding: 2rem 1rem 3rem; background: #ffffff !important; overflow: visible !important; }
        .auth-night-login .auth-night-main { width: 100%; max-width: 30rem; display: flex; align-items: flex-start !important; justify-content: center; padding: 0 !important; background: transparent !important; min-height: 0 !important; overflow: visible !important; }
        .auth-night-login .auth-glass-card { width: 100%; max-width: 30rem; height: auto !important; max-height: none !important; overflow: visible !important; flex: 0 0 auto !important; padding: 2rem; border: 1px solid #e2e8f0 !important; border-radius: 1.5rem; background: #ffffff !important; color: #0f172a !important; box-shadow: 0 20px 50px rgba(15, 23, 42, .08) !important; backdrop-filter: none !important; }
        .auth-night-login .auth-form-panel { background: #ffffff !important; border-color: #e2e8f0 !important; }
        .auth-night-login .auth-night-input { color: #1E293B !important; background: #ffffff !important; border: 1px solid #E2E8F0 !important; }
        .auth-night-login .auth-night-input::placeholder { color: #94a3b8 !important; }
        .auth-night-login .auth-night-primary { background: #16A34A !important; color: #ffffff !important; }
        
        .auth-night-login .auth-glass-card, .auth-night-login .auth-glass-card * { opacity: 1 !important; animation: none !important; }\n        .auth-night-login .auth-brand-name { color: #1E293B !important; opacity: 1 !important; font-weight: 800 !important; }\n        .auth-night-login .auth-brand-name span { color: #16A34A !important; opacity: 1 !important; }\n        .auth-night-login .auth-glass-card h2 { color: #1E293B !important; font-size: 36px !important; font-weight: 800 !important; opacity: 1 !important; }\n        .auth-night-login .auth-subtext { color: #64748B !important; opacity: 1 !important; }\n        .auth-night-login .auth-form-panel label { color: #1E293B !important; font-weight: 700 !important; opacity: 1 !important; }\n        .auth-night-login .auth-night-input { height: 50px !important; border: 1px solid #E2E8F0 !important; border-radius: 10px !important; background: #fff !important; color: #1E293B !important; opacity: 1 !important; box-shadow: none !important; }\n        .auth-night-login .auth-role-button { height: 50px !important; min-height: 50px !important; border: 1px solid #E2E8F0 !important; border-radius: 10px !important; background: #fff !important; color: #64748B !important; opacity: 1 !important; }\n        .auth-night-login .auth-role-button[aria-pressed=\"true\"] { background: #DCFCE7 !important; border-color: #16A34A !important; color: #16A34A !important; }\n        .auth-night-login .auth-forgot-link { display: flex !important; justify-content: flex-end !important; margin-top: 8px !important; color: #16A34A !important; font-size: 12px !important; font-weight: 700 !important; opacity: 1 !important; }
        .auth-night-login .auth-glass-card form { overflow: visible !important; }
        html:has(.auth-night-login), body:has(.auth-night-login), #root:has(.auth-night-login) { height: auto !important; min-height: 100% !important; overflow-y: auto !important; }
        .auth-night-login .auth-glass-card h2 { color: #1E293B !important; font-size: 36px !important; font-weight: 800 !important; line-height: 1.2 !important; }
        .auth-night-login .auth-brand-name { color: #1E293B !important; opacity: 1 !important; }
        .auth-night-login .auth-brand-name span { color: #16A34A !important; opacity: 1 !important; }
        .auth-night-login .auth-subtext { color: #64748B !important; opacity: 1 !important; }
        .auth-night-login .auth-form-panel label { color: #1E293B !important; font-weight: 700 !important; opacity: 1 !important; }
        .auth-night-login .auth-role-button { min-height: 50px; height: 50px; border: 1px solid #E2E8F0 !important; border-radius: 10px !important; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 8px; background: #fff !important; color: #64748B !important; opacity: 1 !important; }
        .auth-night-login .auth-role-button[aria-pressed="true"] { background: #DCFCE7 !important; border-color: #16A34A !important; color: #16A34A !important; }
        .auth-night-login .auth-role-button svg { width: 18px; height: 18px; flex-shrink: 0; }
        .auth-night-login .auth-night-input { height: 50px !important; background: #fff !important; border: 1px solid #E2E8F0 !important; border-radius: 10px !important; color: #1E293B !important; opacity: 1 !important; }
        .auth-night-login .auth-night-input:focus { border-color: #16A34A !important; }
        .auth-night-login .auth-forgot-link { display: flex; justify-content: flex-end; margin-top: 8px; color: #16A34A !important; font-size: 12px; font-weight: 700; }
        .auth-night-login .auth-night-primary { background: #16A34A !important; }
        @media (max-width: 640px) { .auth-night-login .auth-glass-card { padding: 1rem !important; } .auth-night-login .auth-night-layout { padding: 1rem; } .auth-night-login .auth-role-button { font-size: 11px; gap: 4px; } }
        @keyframes loginCropSway { 0%,100% { transform: rotate(-4deg) translateY(0); } 50% { transform: rotate(5deg) translateY(-4px); } }
        @keyframes loginSunDrift { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        @keyframes loginFieldGlow { 0%,100% { opacity:.25; } 50% { opacity:.55; } }
        .auth-night-login .auth-night-input { padding-left: 44px !important; }
        .auth-night-login .auth-night-input:focus { border-color: #16A34A !important; box-shadow: 0 0 0 3px rgba(22,163,74,.14) !important; outline: none !important; }
        .auth-night-login .auth-night-input ~ button { color: #64748B !important; }
        .auth-night-login .auth-night-primary { width: 100% !important; height: 50px !important; min-height: 50px !important; padding-top: 0 !important; padding-bottom: 0 !important; border-radius: 9999px !important; background: #16A34A !important; color: #fff !important; font-weight: 700 !important; opacity: 1 !important; }
        .auth-night-login .auth-night-primary:hover { background: #15803D !important; }
        .auth-night-login .auth-role-button { white-space: nowrap !important; font-size: 14px !important; padding-left: 8px !important; padding-right: 8px !important; }
        .auth-night-login .auth-google-panel > p { color: #64748B !important; font-size: 12px !important; font-weight: 600 !important; }
        .auth-night-login .auth-night-foot { background: transparent !important; border: 0 !important; padding: 0 !important; font-size: 14px !important; color: #64748B !important; opacity: 1 !important; }
        .auth-night-login .auth-night-foot p { color: #64748B !important; font-size: 14px !important; font-weight: 400 !important; opacity: 1 !important; }
        .auth-night-login .auth-night-foot a { color: #16A34A !important; font-weight: 700 !important; opacity: 1 !important; }
        @media (max-width: 640px) { .auth-night-login .auth-role-button { font-size: 14px !important; gap: 4px !important; padding-left: 8px !important; padding-right: 8px !important; } }
        @media (prefers-reduced-motion: reduce) { .login-agro-motion, .login-agro-motion * { animation: none !important; transition: none !important; } }
      `}</style>
      <div className="auth-night-layout mx-auto flex items-center justify-center bg-white px-4 py-6 sm:px-6" style={{ backgroundColor: "#ffffff", minHeight: "calc(100vh - 80px)" }}>
        <aside className="auth-night-old-aside hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(181,215,122,0.24),transparent_34%),linear-gradient(150deg,#174b34_0%,#0d3025_75%)]" />
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-300 text-emerald-950 shadow-lg"><Leaf className="h-7 w-7" /></span>
              <span><span className="block text-xl font-black tracking-tight">AgroChain</span><span className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-green-200">From soil to your door</span></span>
            </Link>
            <div className="mt-16 max-w-lg">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-green-100"><span className="h-2 w-2 rounded-full bg-green-300" /> BANGLADESH'S AGRICULTURAL NETWORK</p>
              <h1 className="text-4xl font-black leading-[1.12] tracking-tight xl:text-5xl">Fresh harvests. <span className="text-green-300">Stronger connections.</span></h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-emerald-50/80">Sign in to connect farmers, buyers and delivery partners in one trusted agricultural marketplace.</p>
            </div>
          </div>
          <div className="login-agro-motion relative mx-auto my-8 h-[255px] w-full max-w-[470px] overflow-hidden rounded-[1.6rem] border border-white/15 bg-gradient-to-b from-[#8fbd8b] via-[#d7e7a2] to-[#e8d99c] shadow-2xl shadow-black/20">
            <div className="absolute right-12 top-7 h-14 w-14 rounded-full bg-[#fff2b5] shadow-[0_0_45px_15px_rgba(255,242,181,0.28)]" style={{animation:'loginSunDrift 5s ease-in-out infinite'}} />
            <div className="absolute inset-x-0 bottom-0 h-24 rounded-[50%_50%_0_0] bg-[#69934f]" />
            <div className="absolute -bottom-7 -left-8 h-32 w-[120%] rotate-[-5deg] rounded-[50%] bg-[#3c713d]" />
            <div className="absolute -bottom-12 left-[-10%] h-28 w-[120%] rotate-[5deg] rounded-[50%] border-t-[16px] border-[#a4bd55] bg-[#245b35]" />
            <div className="absolute bottom-7 left-4 right-4 flex items-end justify-between text-4xl sm:text-5xl" aria-hidden="true">
              {['🌾','🌿','🌾','🌱','🌾','🌿','🌾'].map((crop, index) => <span key={index} style={{animation:'loginCropSway 2.8s ease-in-out infinite',animationDelay:`${index * 0.22}s`,transformOrigin:'bottom center'}}>{crop}</span>)}
            </div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-5xl drop-shadow-lg" style={{animation:'loginCropSway 3.2s ease-in-out infinite'}}>👨‍🌾</div>
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/35 via-transparent to-white/10" />
            <div className="absolute bottom-4 left-4 rounded-xl border border-white/30 bg-emerald-950/55 px-4 py-2.5 backdrop-blur-sm">
              <p className="text-xs font-bold text-white">Growing trust, together</p>
              <p className="mt-0.5 text-[10px] text-emerald-50">Every harvest has a story.</p>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-3 text-xs text-emerald-50/75"><ShieldCheck className="h-4 w-4 text-green-300" /><span>One connected platform for a better food supply chain.</span></div>
        </aside>

        <main className="auth-night-main w-full max-w-lg" style={{ width: "100%", maxWidth: "34rem", background: "transparent" }}>
          <div className="auth-glass-card auth-glass-card--login w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8" style={{ backgroundColor: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: "1.5rem", boxShadow: "0 16px 40px rgba(15,23,42,0.08)", padding: "1.75rem" }}>
            <div className="mb-5 flex flex-col items-center justify-center gap-2 text-center">
              <Link to="/" className="inline-flex items-center justify-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-white shadow-sm"><Leaf className="h-7 w-7" /></span></Link>
              <Link to="/" className="auth-brand-name text-2xl font-extrabold tracking-tight">Agro<span>Chain</span></Link>
            </div>
            <div className="mb-6 text-center">
              
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">Welcome Back</h2>
              <p className="auth-subtext mt-3 text-sm leading-6">Sign in to continue to your account.</p>
            </div>

            <div className="auth-form-panel" style={{ background: "#ffffff", borderColor: "#ffffff" }}>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="agro-login-email" className="mb-2 block text-sm font-semibold text-slate-700">Email or Username</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="agro-login-email" type="text" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email or username" className="auth-night-input w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10" />
                  </div>
                </div>
                <div>
                  <label htmlFor="agro-login-role" className="mb-2 block text-sm font-semibold text-slate-900">Role</label>
                  {location.pathname === '/login' ? (
                    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Choose role">
                      {([{ role: 'buyer' as UserRole, label: 'Buyer', Icon: UserRound }, { role: 'farmer' as UserRole, label: 'Seller', Icon: Store }, { role: 'delivery' as UserRole, label: 'Delivery Partner', Icon: Truck }]).map(({ role, label, Icon }) => <button key={role} type="button" onClick={() => setSelectedRole(role)} aria-pressed={selectedRole === role} className="auth-role-button min-w-0 text-xs font-semibold transition sm:text-sm"><Icon aria-hidden="true" />{label}</button>)}
                    </div>
                  ) : (
                    <select id="agro-login-role" required value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)} className="auth-night-input w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10">
                      {availableRoles.map((role) => <option key={role} value={role}>{{ admin: 'Admin', farmer: 'Farmer / Seller', buyer: 'Customer / Buyer', delivery: 'Delivery Partner', warehouse: 'Warehouse Staff', inspector: 'Quality Inspector' }[role]}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <div className="mb-2"><label htmlFor="agro-login-password" className="block text-sm font-semibold">Password</label></div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="agro-login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="auth-night-input w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10" />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30">
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                  <Link to={location.pathname.startsWith('/admin-portal') ? '/admin-portal/reset-password' : '/password-reset'} className="auth-forgot-link hover:underline">Forgot password?</Link>
                </div>
                {error && (!/Google sign-in is not configured|Google sign-in সেটআপ করা নেই/i.test(error) || googleAttempted) && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <button type="submit" disabled={loading} className="auth-night-primary flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span><ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {(location.pathname === '/login' && (selectedRole === 'farmer' || selectedRole === 'buyer')) && (
                <div className="auth-google-panel mt-5 border-t border-slate-100 pt-5" onPointerDown={() => setGoogleAttempted(true)}>
                  <p className="mb-3 text-center text-xs text-slate-500">{language === 'bn' ? 'অথবা Google দিয়ে চালিয়ে যান' : 'Or continue with Google'}</p>
                  <GoogleSignInButton mode="signin" language={language === 'bn' ? 'bn' : 'en'} disabled={loading} onCredential={handleGoogleCredential} onError={handleGoogleError} />
                </div>
              )}

              {import.meta.env.DEV && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">1-Click Quick Demo Sign In</span><span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">All 6 Panels</span></div>
                  <div className="grid grid-cols-2 gap-2">
                    {demoAccounts.map((d) => <button key={d.role} type="button" onClick={() => handleQuickDemo(d.role, d.email, d.path)} className="group rounded-xl border border-slate-200 p-2.5 text-left text-xs transition hover:border-emerald-400 hover:bg-emerald-50/50"><div className="truncate font-bold text-slate-800 group-hover:text-emerald-800">{d.label}</div><div className="truncate text-[10px] text-slate-500">{d.name}</div></button>)}
                  </div>
                </div>
              )}
            </div>

            {location.pathname === '/login' && <div className="auth-night-foot mt-5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-center text-xs text-slate-600"><p>Don't have an account? <Link to="/register" className="font-bold text-emerald-800 hover:underline">Register</Link></p></div>}
            {location.pathname === '/login' && <div className="auth-night-staff mt-4 text-center text-xs leading-6 text-slate-500"><p className="font-semibold text-slate-600">Staff access</p><p className="mt-1"><Link to="/warehouse-portal/login" className="font-bold text-emerald-700 hover:underline">Warehouse / Inspector</Link><span className="mx-2 text-slate-300">·</span><Link to="/admin-portal/login" className="font-bold text-emerald-700 hover:underline">Admin Portal</Link></p></div>}
            <p className="mt-7 text-center text-[11px] leading-5 text-slate-400">Secure access to your AgroChain account.</p>
          </div>
        </main>
      </div>

      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/80 p-4 backdrop-blur-md" role="status" aria-live="polite" aria-label="Authenticating your AgroChain account">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-white p-8 text-center shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1.5 overflow-hidden bg-emerald-100"><div className="h-full w-2/5 rounded-full bg-emerald-500 animate-[loading-bar_1.4s_ease-in-out_infinite]" /></div>
            <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
              <div className="absolute inset-1 rounded-full border-2 border-dashed border-emerald-200 animate-[spin_12s_linear_infinite]" /><div className="absolute inset-3 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" /><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 animate-pulse"><Sprout className="h-9 w-9" /></div><Leaf className="absolute right-0 top-3 h-6 w-6 text-green-500 animate-bounce" /><Leaf className="absolute bottom-2 left-0 h-5 w-5 rotate-[-35deg] text-emerald-500 animate-pulse" />
            </div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">AgroChain Secure Access</p><h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Welcome to AgroChain</h2><p className="mt-2 text-sm leading-6 text-slate-500">Securely connecting you to your agricultural network.</p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-800"><ShieldCheck className="h-4 w-4" /><span>Verifying your credentials</span><span className="flex gap-1" aria-hidden="true"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-600 [animation-delay:0ms]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-600 [animation-delay:150ms]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-600 [animation-delay:300ms]" /></span></div>
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span>Your password is never shown or shared on this screen.</span></div>
          </div>
          <style>{`@keyframes loading-bar { 0% { transform: translateX(-120%); } 100% { transform: translateX(260%); } } @media (prefers-reduced-motion: reduce) { .animate-spin, .animate-pulse, .animate-bounce { animation: none !important; } }`}</style>
        </div>
      )}
    </div>
  );
};



