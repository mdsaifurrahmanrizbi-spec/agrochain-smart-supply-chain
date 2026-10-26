import React, { useCallback, useState } from 'react';
import { SproutNightBackground } from '../../components/common/SproutNightBackground';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import { UserRole } from '../../types';
import { agroApi } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { GoogleSignInButton } from '../../components/common/GoogleSignInButton';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Sprout, Leaf, Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-emerald-800">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white"><Sprout className="h-6 w-6" /></span>
            AgroChain
          </Link>
          <p className="mt-2 text-sm text-slate-500">Fresh from farms. Connected to you.</p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to your AgroChain account.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="agro-login-role" className="mb-1.5 block text-sm font-medium text-slate-700">Sign in as</label>
              <select id="agro-login-role" required value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
                {availableRoles.map((role) => <option key={role} value={role}>{{ admin: 'Admin', farmer: 'Farmer / Seller', buyer: 'Customer / Buyer', delivery: 'Delivery Partner', warehouse: 'Warehouse Staff', inspector: 'Quality Inspector' }[role]}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="agro-login-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email or Username</label>
              <input id="agro-login-email" type="text" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email or username" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="agro-login-password" className="block text-sm font-medium text-slate-700">Password</label>
                <Link to={location.pathname.startsWith('/admin-portal') ? '/admin-portal/reset-password' : '/password-reset'} className="text-xs font-medium text-emerald-700 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input id="agro-login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-11 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-700">
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign In'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {location.pathname === '/login' && (selectedRole === 'farmer' || selectedRole === 'buyer') && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="mb-3 text-center text-xs text-slate-500">{language === 'bn' ? 'অথবা Google দিয়ে চালিয়ে যান' : 'Or continue with Google'}</p>
              <GoogleSignInButton mode="signin" language={language === 'bn' ? 'bn' : 'en'} disabled={loading} onCredential={handleGoogleCredential} onError={handleGoogleError} />
            </div>
          )}

          {import.meta.env.DEV && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="mb-3 text-xs font-semibold text-slate-500">Quick demo sign in</p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((d) => <button key={d.role} type="button" onClick={() => handleQuickDemo(d.role, d.email, d.path)} className="rounded-lg border border-slate-200 p-2 text-left text-xs hover:border-emerald-400 hover:bg-emerald-50"><span className="block truncate font-semibold text-slate-800">{d.label}</span><span className="block truncate text-slate-500">{d.name}</span></button>)}
              </div>
            </div>
          )}

          {location.pathname === '/login' && <p className="mt-5 text-center text-sm text-slate-500">New to AgroChain? <Link to="/register" className="font-semibold text-emerald-700 hover:underline">Create an account</Link></p>}
        </section>

        {location.pathname === '/login' && <div className="mt-5 text-center text-xs text-slate-500">Staff access: <Link to="/warehouse-portal/login" className="font-medium text-emerald-700 hover:underline">Warehouse / Inspector</Link><span className="mx-2">·</span><Link to="/admin-portal/login" className="font-medium text-emerald-700 hover:underline">Admin Portal</Link></div>}
        <p className="mt-6 text-center text-xs text-slate-400">© AgroChain · Secure account access</p>
      </div>
      {loading && <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 p-4 backdrop-blur-sm" role="status" aria-live="polite"><div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-center shadow-lg"><div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" /><p className="text-sm font-medium text-slate-700">Signing in securely…</p></div></div>}
    </div>
  );
};
