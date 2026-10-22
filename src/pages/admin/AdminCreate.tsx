import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowRight } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { agroApi } from '../../services/api';

export const AdminRecovery: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creationToken, setCreationToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const result = await agroApi.createAdminAccount({ name, email, password, creationToken });
      setMessage(result.message);
      setPassword('');
      setCreationToken('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin account creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4"><Logo size="lg" /></div>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Create New Admin Account</h1>
          <p className="mt-2 text-sm text-slate-600">Create an additional administrator account. Account creation must first be enabled in the backend hosting environment.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">New admin name</label>
            <input required type="text" maxLength={120} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />\n          </div>\n          <div>\n            <label className="mb-1 block text-sm font-semibold text-slate-700">New admin email</label>\n            <input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">New password (at least 12 characters)</label>
            <input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Admin creation token</label>
            <input required type="password" minLength={32} autoComplete="off" value={creationToken} onChange={(e) => setCreationToken(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
            <p className="mt-1 text-xs text-slate-500">Enter the existing ADMIN_BOOTSTRAP_TOKEN. Never share it in chat.</p>
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {message && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}<p className="mt-2">Disable ADMIN_ACCOUNT_CREATION_ENABLED in Render after account creation.</p><p className="mt-2"><Link to="/admin-portal/login" className="inline-flex items-center gap-1 font-bold underline">Go to Admin Login <ArrowRight className="h-4 w-4" /></Link></p></div>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{loading ? 'Creating account…' : 'Create Admin Account'}</button>
          <p className="text-center text-xs text-slate-500"><Link to="/admin-portal/login" className="underline">Back to Admin Login</Link></p>
        </form>
      </div>
    </main>
  );
};
