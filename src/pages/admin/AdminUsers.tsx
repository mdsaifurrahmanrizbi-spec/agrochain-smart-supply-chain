import React, { useState } from 'react';
import { store } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Users, Search, ShieldCheck } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState(store.users);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">User Directory & Role Permissions</h1>
        <p className="text-xs text-slate-500 mt-1">
          System users across all six roles: Admins, Farmers, Buyers, Delivery Partners, Warehouses, and Inspectors.
        </p>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
        >
          <option value="All">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="farmer">Farmers / Sellers</option>
          <option value="buyer">Buyers / Consumers</option>
          <option value="delivery">Delivery Partners</option>
          <option value="warehouse">Warehouse Managers</option>
          <option value="inspector">Quality Inspectors</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Operating Location</th>
                <th className="py-3 px-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{u.phone}</td>
                  <td className="py-3 px-4 font-semibold uppercase text-[11px] text-emerald-800">{u.role}</td>
                  <td className="py-3 px-4">{u.location}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={u.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
