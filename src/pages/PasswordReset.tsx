import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { agroApi } from '../services/api';
import { UserRole } from '../types';

const roles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'farmer', label: 'Farmer / Seller' },
  { value: 'buyer', label: 'Customer / Buyer' },
  { value: 'delivery', label: 'Delivery Partner' },
  { value: 'warehouse', label: 'Warehouse Staff' },
  { value: 'inspector', label: 'Quality Inspector' },
];

export const PasswordReset: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const adminOnly = location.pathname.startsWith('/admin-portal/');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(adminOnly ? 'admin' : 'buyer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const result = await agroApi.requestPasswordReset(email, adminOnly ? 'admin' : role);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request a reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const result = await agroApi.confirmPasswordReset(token, password);
      setMessage(result.message);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset the password. Request a new link.');
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = message.toLowerCase().includes('successfully');
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4"><Logo size="lg" /></div>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            {token ? <LockKeyhole className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">{token ? 'Set a new password' : 'Forgot your password?'}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {token ? 'Choose a strong password with at least 12 characters.' : 'We will email a secure, single-use reset link if the account matches.'}
          </p>
        </div>

        <form onSubmit={token ? submitReset : submitRequest} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {!token ? (
            <>
              {!adminOnly && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Account type</label>
                  <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                    {roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Account email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900" placeholder="you@example.com" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">New password</label>
                <input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
                <p className="mt-1 text-xs text-slate-500">Use at least 12 characters.</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Confirm new password</label>
                <input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
              </div>
            </>
          )}
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
          <button type="submit" disabled={loading || (!!token && isSuccess)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
            <span>{loading ? 'Please wait…' : token ? 'Reset Password' : 'Send Reset Link'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          {isSuccess && token && <button type="button" onClick={() => navigate('/admin-portal/login')} className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Go to Sign In</button>}
          <p className="text-center text-sm text-slate-500"><Link to={adminOnly ? '/admin-portal/login' : '/login'} className="font-semibold text-emerald-700 hover:underline">Back to sign in</Link></p>
        </form>
      </div>
    </main>
  );
};
