import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, UserPlus, Users } from 'lucide-react';
import { agroApi, AdminAccount } from '../../services/api';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminAccount[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'warehouse' | 'inspector'>('warehouse');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await agroApi.getAdminUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const filtered = useMemo(() => users.filter((user) => {
    const query = search.toLowerCase();
    const matchSearch = user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    return matchSearch && (roleFilter === 'All' || user.role === roleFilter);
  }), [users, search, roleFilter]);

  const createStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      await agroApi.createStaffAccount({ name, email, password, role: staffRole });
      setName('');
      setEmail('');
      setPassword('');
      setNotice(`${staffRole === 'warehouse' ? 'Warehouse' : 'Inspector'} account created and active. Share its credentials securely with the staff member.`);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create staff account');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (user: AdminAccount, status: 'ACTIVE' | 'SUSPENDED') => {
    setError('');
    setNotice('');
    try {
      await agroApi.updateAccountStatus(user.id, status);
      setNotice(`${user.name}'s account is now ${status.toLowerCase()}.`);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update account status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Directory & Role Permissions</h1>
          <p className="mt-1 text-xs text-slate-500">Manage registered accounts, approve delivery partners, and create internal staff accounts.</p>
        </div>
        <button type="button" onClick={() => void loadUsers()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refresh accounts
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}

      <form onSubmit={createStaff} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-emerald-700" />
          <h2 className="font-bold text-slate-900">Create Warehouse / Inspector Account</h2>
        </div>
        <p className="text-xs text-slate-500">Only Admin can create these internal accounts. Use a unique email and a password of at least 12 characters.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">Full name
            <input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal" />
          </label>
          <label className="text-xs font-semibold text-slate-700">Email
            <input required type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal" />
          </label>
          <label className="text-xs font-semibold text-slate-700">Temporary password
            <input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal" />
          </label>
          <label className="text-xs font-semibold text-slate-700">Role
            <select value={staffRole} onChange={(e) => setStaffRole(e.target.value as 'warehouse' | 'inspector')} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal">
              <option value="warehouse">Warehouse Staff</option>
              <option value="inspector">Quality Inspector</option>
            </select>
          </label>
        </div>
        <button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
          <UserPlus className="h-4 w-4" /> {saving ? 'Creating account…' : 'Create Staff Account'}
        </button>
      </form>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-600" />
          <h2 className="font-bold text-slate-900">All Accounts</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{users.length}</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="search" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm sm:flex-1" />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <option value="All">All roles</option>
            <option value="admin">Admin</option>
            <option value="farmer">Farmer</option>
            <option value="buyer">Customer / Buyer</option>
            <option value="delivery">Delivery Partner</option>
            <option value="warehouse">Warehouse Staff</option>
            <option value="inspector">Quality Inspector</option>
          </select>
        </div>
        {loading ? <p className="py-6 text-center text-sm text-slate-500">Loading accounts…</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr><th className="px-3 py-3">Name</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-3 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-3 py-3 font-mono">{user.email}</td>
                    <td className="px-3 py-3 uppercase">{user.role}</td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800' : user.status === 'PENDING' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'}`}>{user.status}</span></td>
                    <td className="px-3 py-3">
                      {user.role === 'delivery' && user.status === 'PENDING' ? (
                        <button type="button" onClick={() => void changeStatus(user, 'ACTIVE')} className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 font-bold text-white hover:bg-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" /> Approve</button>
                      ) : user.role !== 'admin' ? (
                        <button type="button" onClick={() => void changeStatus(user, user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')} className="rounded-md border border-slate-200 px-2.5 py-1.5 font-semibold hover:bg-slate-50">{user.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}</button>
                      ) : <span className="text-slate-400">Protected</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">No accounts found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
