import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { agroApi } from '../../services/api';

export const AdminSetup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const result = await agroApi.bootstrapAdmin({ name, email, password, bootstrapToken });
      setMessage(result.message);
      setName('');
      setEmail('');
      setPassword('');
      setBootstrapToken('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4"><Logo size="lg" /></div>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Initial Admin Setup</h1>
          <p className="mt-2 text-sm text-slate-600">Create the first administrator account. This setup closes permanently after an admin exists.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Admin full name</label>
            <input required maxLength={120} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Admin email</label>
            <input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Password (at least 12 characters)</label>
            <input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">One-time setup token</label>
            <input required type="password" minLength={32} autoComplete="off" value={bootstrapToken} onChange={(e) => setBootstrapToken(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
            <p className="mt-1 text-xs text-slate-500">Enter the ADMIN_BOOTSTRAP_TOKEN configured in the backend hosting settings. Do not share it with anyone.</p>
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {message && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}<p className="mt-2"><Link to="/admin-portal/login" className="inline-flex items-center gap-1 font-bold underline">Go to Admin Login <ArrowRight className="h-4 w-4" /></Link></p></div>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{loading ? 'Creating secure admin account…' : 'Create First Admin'}</button>
          <p className="text-center text-xs text-slate-500"><Link to="/admin-portal/login" className="underline">Back to Admin Login</Link></p>
        </form>
      </div>
    </main>
  );
};
