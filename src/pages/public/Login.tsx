import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import { UserRole } from '../../types';
import { agroApi } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { GoogleSignInButton } from '../../components/common/GoogleSignInButton';
import './AuthTheme.css';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Sprout, Leaf, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [authTheme, setAuthTheme] = useState<'lime' | 'night'>(() => { try { return localStorage.getItem('agrochain-auth-theme') === 'night' ? 'night' : 'lime'; } catch { return 'lime'; } });
  useEffect(() => { try { localStorage.setItem('agrochain-auth-theme', authTheme); } catch { /* storage unavailable */ } }, [authTheme]);
  const { login, switchDemoRole, setAuthenticatedSession } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const availableRoles: UserRole[] = location.pathname.startsWith('/admin-portal')
    ? ['admin']
    : location.pathname.startsWith('/warehouse-portal')
      ? ['warehouse', 'inspector']
      : ['farmer', 'buyer', 'delivery'];
  const [selectedRole, setSelectedRole] = useState<UserRole>(availableRoles[0]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="agro-auth-page relative min-h-screen px-4 py-5 sm:px-6 lg:px-10 lg:py-7" data-theme={authTheme}>
      <button type="button" className="agro-theme-toggle" onClick={() => setAuthTheme(authTheme === "lime" ? "night" : "lime")} aria-label="Toggle color theme">{authTheme === "lime" ? "☾ Night" : "☀ Lime"}</button>
      <style>{`
        @keyframes loginCropSway { 0%,100% { transform: rotate(-4deg) translateY(0); } 50% { transform: rotate(5deg) translateY(-4px); } }
        @keyframes loginSunDrift { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        @keyframes loginFieldGlow { 0%,100% { opacity:.25; } 50% { opacity:.55; } }
        @media (prefers-reduced-motion: reduce) { .login-agro-motion, .login-agro-motion * { animation: none !important; transition: none !important; } }
      `}</style>
      <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-[1040px] agro-auth-card overflow-hidden rounded-[28px] border shadow-[0_24px_80px_-28px_rgba(20,60,35,0.28)] lg:grid-cols-[1.02fr_0.98fr]">
        <aside className="agro-auth-illustration relative hidden overflow-hidden p-10 text-white lg:flex lg:min-h-[700px] lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(181,215,122,0.24),transparent_34%),linear-gradient(150deg,#174b34_0%,#0d3025_75%)]" />
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-300">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300 text-emerald-950 shadow-lg"><Sprout className="h-7 w-7" /></span>
              <span><span className="block text-xl font-black tracking-tight">AgroChain</span><span className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-lime-200">From soil to your door</span></span>
            </Link>
            <div className="mt-16 max-w-lg">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-lime-100"><span className="h-2 w-2 rounded-full bg-lime-300" /> BANGLADESH'S AGRICULTURAL NETWORK</p>
              <h1 className="text-4xl font-black leading-[1.12] tracking-tight xl:text-5xl">Fresh harvests. <span className="text-lime-300">Stronger connections.</span></h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-emerald-50/80">Sign in to connect farmers, buyers and delivery partners in one trusted agricultural marketplace.</p>
            </div>
          </div>
          <div className="login-agro-motion agro-login-scene relative mx-auto my-8 h-[255px] w-full max-w-[470px] overflow-hidden rounded-[1.6rem] border border-white/15 bg-gradient-to-b from-[#8fbd8b] via-[#d7e7a2] to-[#e8d99c] shadow-2xl shadow-black/20">
            <div className="agro-login-sun absolute right-12 top-7 h-14 w-14 rounded-full bg-[#fff2b5] shadow-[0_0_45px_15px_rgba(255,242,181,0.28)]" style={{animation:'loginSunDrift 5s ease-in-out infinite'}} />
            <div className="absolute inset-x-0 bottom-0 h-24 rounded-[50%_50%_0_0] bg-[#69934f]" />
            <div className="absolute -bottom-7 -left-8 h-32 w-[120%] rotate-[-5deg] rounded-[50%] bg-[#3c713d]" />
            <div className="agro-login-road absolute -bottom-12 left-[-10%] h-28 w-[120%] rotate-[5deg] rounded-[50%] border-t-[16px] border-[#a4bd55] bg-[#245b35]" />
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
          <div className="relative z-10 flex items-center gap-3 text-xs text-emerald-50/75"><ShieldCheck className="h-4 w-4 text-lime-300" /><span>One connected platform for a better food supply chain.</span></div>
        </aside>

        <main className="agro-auth-form flex items-center justify-center px-5 py-9 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between gap-3 lg:mb-10">
              <Link to="/" className="inline-flex items-center gap-2 lg:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-white"><Sprout className="h-6 w-6" /></span><span className="text-lg font-black text-emerald-950">AgroChain</span></Link>
              <span className="hidden lg:block text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">Welcome back</span>
              {location.pathname === '/login' && <Link to="/register" className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50">Create account <ArrowRight className="h-3.5 w-3.5" /></Link>}
            </div>
            <div className="mb-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"><Lock className="h-6 w-6" /></div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Sign in to AgroChain</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">Access your agricultural supply chain management portal.</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(15,50,30,0.35)] sm:p-7">
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="agro-login-email" className="mb-2 block text-sm font-semibold text-slate-700">Email or Username</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="agro-login-email" type="text" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email or username" className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10" />
                  </div>
                </div>
                <div>
                  <label htmlFor="agro-login-role" className="mb-2 block text-sm font-semibold text-slate-700">Sign in as</label>
                  <select id="agro-login-role" required value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)} className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10">
                    {availableRoles.map((role) => <option key={role} value={role}>{{ admin: 'Admin', farmer: 'Farmer / Seller', buyer: 'Customer / Buyer', delivery: 'Delivery Partner', warehouse: 'Warehouse Staff', inspector: 'Quality Inspector' }[role]}</option>)}
                  </select>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label htmlFor="agro-login-password" className="block text-sm font-semibold text-slate-700">Password</label>
                    <Link to={location.pathname.startsWith('/admin-portal') ? '/admin-portal/reset-password' : '/password-reset'} className="text-xs font-bold text-emerald-700 transition hover:text-emerald-900 hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="agro-login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10" />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30">
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
                {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition-all hover:-translate-y-0.5 hover:bg-emerald-900 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60">
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span><ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {(location.pathname === '/login' && (selectedRole === 'farmer' || selectedRole === 'buyer')) && (
                <div className="mt-5 border-t border-slate-100 pt-5">
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

            {location.pathname === '/login' && <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-center text-xs text-slate-600"><p>New to AgroChain? <Link to="/register" className="font-bold text-emerald-800 hover:underline">Register here</Link></p></div>}
            {location.pathname === '/login' && <div className="mt-4 text-center text-xs leading-6 text-slate-500"><p className="font-semibold text-slate-600">Staff access</p><p className="mt-1"><Link to="/warehouse-portal/login" className="font-bold text-emerald-700 hover:underline">Warehouse / Inspector</Link><span className="mx-2 text-slate-300">·</span><Link to="/admin-portal/login" className="font-bold text-emerald-700 hover:underline">Admin Portal</Link></p></div>}
            <p className="mt-7 text-center text-[11px] leading-5 text-slate-400">Secure access to your AgroChain account.</p>
          </div>
        </main>
      </div>

      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/80 p-4 backdrop-blur-md" role="status" aria-live="polite" aria-label="Authenticating your AgroChain account">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-white p-8 text-center shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1.5 overflow-hidden bg-emerald-100"><div className="h-full w-2/5 rounded-full bg-emerald-500 animate-[loading-bar_1.4s_ease-in-out_infinite]" /></div>
            <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
              <div className="absolute inset-1 rounded-full border-2 border-dashed border-emerald-200 animate-[spin_12s_linear_infinite]" /><div className="absolute inset-3 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" /><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 animate-pulse"><Sprout className="h-9 w-9" /></div><Leaf className="absolute right-0 top-3 h-6 w-6 text-lime-500 animate-bounce" /><Leaf className="absolute bottom-2 left-0 h-5 w-5 rotate-[-35deg] text-emerald-500 animate-pulse" />
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



