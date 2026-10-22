import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import { UserRole } from '../../types';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
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

  const handleQuickDemo = (role: UserRole, emailStr: string, path: string) => {
    setEmail(emailStr);
    switchDemoRole(role);
    navigate(path);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign in to AgroChain
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your agricultural supply chain management portal
          </p>
        </div>

        {/* Credentials Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email or Username</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Sign in as</label>
              <select
                required
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 text-slate-900"
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {{ admin: 'Admin', farmer: 'Farmer / Seller', buyer: 'Customer / Buyer', delivery: 'Delivery Partner', warehouse: 'Warehouse Staff', inspector: 'Quality Inspector' }[role]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold">Password</label>
                <Link to={location.pathname.startsWith('/admin-portal') ? '/admin-portal/reset-password' : '/password-reset'} className="text-emerald-700 hover:text-emerald-800 text-[11px] font-medium">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 text-slate-900"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {import.meta.env.DEV && (
            <>
            {/* Quick Demo 1-Click Access for Evaluation */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                1-Click Quick Demo Sign In
              </span>
              <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                All 6 Panels
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => handleQuickDemo(d.role, d.email, d.path)}
                  className="p-2 text-left rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-xs group"
                >
                  <div className="font-bold text-slate-800 group-hover:text-emerald-800 truncate">
                    {d.label}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{d.name}</div>
                </button>
              ))}
            </div>
          </div>
            </>
          )}
        </div>

        {location.pathname === '/login' && (
          <div className="text-center text-xs text-slate-500 space-y-2">
            <p>Staff access: <Link to="/warehouse-portal/login" className="text-emerald-700 font-bold hover:underline">Warehouse / Inspector</Link> · <Link to="/admin-portal/login" className="text-emerald-700 font-bold hover:underline">Admin Portal</Link></p>
          </div>
        )}
        <div className="text-center text-xs text-slate-500">
          Need an account?{' '}
          {availableRoles.some((role) => ['farmer', 'buyer', 'delivery'].includes(role)) && (
          <Link to="/register" className="text-emerald-700 font-bold hover:underline">
            Register as Farmer, Buyer, or Delivery Partner
          </Link>
          )}
        </div>
      </div>
    </div>
  );
};



