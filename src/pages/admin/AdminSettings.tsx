import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { store, agroApi } from '../../services/api';
import { Database, Server, RefreshCw, Check, AlertCircle, ShieldCheck } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { isBackendConnected } = useAuth();
  const [testing, setTesting] = useState(false);
  const [statusResult, setStatusResult] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusResult(null);
    const ok = await agroApi.checkBackendHealth();
    setTesting(false);
    if (ok) {
      setStatusResult('Successfully connected to Django REST Framework backend on port 8000!');
    } else {
      setStatusResult(
        'Django backend offline (http://localhost:8000/api). Operating in seamless interactive Demo Mode with full local state reactivity.'
      );
    }
  };

  const handleResetData = () => {
    store.resetAll();
    setResetMsg(true);
    setTimeout(() => {
      setResetMsg(false);
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">System Architecture & Backend Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Django REST Framework and PostgreSQL database integration diagnostics and mock store controls.
        </p>
      </div>

      {resetMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Local demo database reset to factory state. Reloading...</span>
        </div>
      )}

      {/* Django REST Integration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Server className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Django REST Framework Integration</h2>
              <p className="text-slate-500 text-xs">agricultural_blockchain_db · PostgreSQL · Core App</p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-md font-bold text-xs border ${
              isBackendConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {isBackendConnected ? 'Connected (Live DRF)' : 'Demo Mode (Interactive Mock Active)'}
          </span>
        </div>

        <div className="space-y-2 text-slate-700">
          <p>
            API Endpoint Target: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-emerald-900 font-bold">http://localhost:8000/api</code>
          </p>
          <p className="text-slate-500">
            Configure <code className="font-mono text-slate-700">VITE_API_URL</code> in environment to route requests to production or staging servers.
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 text-slate-700">
          <span className="font-bold text-slate-900 block">Existing REST Endpoints Verified in Postman:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>POST /api/login/ (JWT Authentication)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>GET /api/roles/ (Role Directory)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>GET /api/farmers/ (Farmer Profiles)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>GET /api/farms/ (Land Plots & GPS)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>GET /api/crops/ (Crop Varieties)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>GET /api/batches/ (Harvest Batches)</span>
            </div>
          </div>
        </div>

        {statusResult && (
          <div className="p-3 bg-slate-100 rounded-lg text-slate-800 font-medium border border-slate-200">
            {statusResult}
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing Endpoint...' : 'Ping Django Backend API'}</span>
          </button>

          <button
            onClick={handleResetData}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
          >
            Reset In-Memory Store to Factory Data
          </button>
        </div>
      </div>
    </div>
  );
};
