import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';

export const DemoRoleSwitcher: React.FC = () => {
  const { user, role, switchDemoRole, isBackendConnected } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const roles: { id: UserRole; label: string; name: string; path: string; tag: string }[] = [
    { id: 'admin', label: 'Admin', name: 'Dr. Harun-ur-Rashid', path: '/admin/dashboard', tag: 'Full Control' },
    { id: 'farmer', label: 'Farmer / Seller', name: 'Md. Rafiqul Islam', path: '/farmer/dashboard', tag: 'Bogura Farm' },
    { id: 'buyer', label: 'Customer / Buyer', name: 'Tasnim Rahman', path: '/buyer/dashboard', tag: 'Dhaka Buyer' },
    { id: 'delivery', label: 'Delivery Partner', name: 'Kamal Hossain', path: '/delivery/dashboard', tag: 'Tejgaon & Savar' },
    { id: 'warehouse', label: 'Warehouse Manager', name: 'Anisul Haque', path: '/warehouse/dashboard', tag: 'Central Gazipur' },
    { id: 'inspector', label: 'Quality Inspector', name: 'Dr. Farzana Akter', path: '/inspector/dashboard', tag: 'Savar QC Lab' },
  ];

  const handleSelectRole = (r: UserRole, path: string) => {
    switchDemoRole(r);
    navigate(path);
  };

  return (
    <div className="fixed bottom-3 right-3 z-50 max-w-xl">
      <div className="bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-3 text-xs transition-all">
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold tracking-wider text-[10px] border border-amber-500/40">
              SWITCH PANEL
            </span>
            <span
              className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold tracking-wider text-[10px] border border-violet-500/40"
              title="Frontend demo role only; this is not proof of backend authentication"
            >
              DEMO MODE
            </span>
            <span className="text-slate-400">
              Current: <strong className="text-emerald-400">{user?.name ?? "No user"}</strong> ({role ? ({ admin: "Admin", farmer: "Farmer", buyer: "Buyer", delivery: "Delivery", warehouse: "Warehouse", inspector: "Inspector" } as const)[role] : "Guest"})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                isBackendConnected
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title={isBackendConnected ? 'Backend API reachable; authentication is checked separately' : 'Backend API is offline; local/demo mode may be active'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isBackendConnected ? 'Backend Connected' : 'Backend Offline'}
            </span>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title={collapsed ? 'Expand Switcher' : 'Minimize Switcher'}
            >
              {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="mt-2.5 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {roles.map((r) => {
                const isActive = role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRole(r.id, r.path)}
                    className={`text-left p-2 rounded-lg border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-xs'
                        : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-xs truncate">{r.label}</span>
                      {isActive && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate mt-0.5">{r.tag}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">Local Godown Operations:</span>
              <button
                onClick={() => {
                  switchDemoRole('warehouse');
                  navigate('/warehouse/godown');
                }}
                className="px-2.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/50 text-[11px] font-bold transition-colors flex items-center gap-1.5"
              >
                <span>{"\u{1F69C}"} Open Local Godown Hub (Tejgaon / Mirpur / Uttara)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



