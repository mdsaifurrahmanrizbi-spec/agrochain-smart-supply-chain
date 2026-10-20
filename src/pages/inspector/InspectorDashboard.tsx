import React from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShieldCheck, FileCheck, AlertTriangle, CheckCircle, Award, ArrowRight } from 'lucide-react';

export const InspectorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const checks = store.qualityChecks;
  const pendingChecks = checks.filter((c) => c.status === 'PENDING' || c.status === 'RECHECK_REQUIRED');
  const approvedChecks = checks.filter((c) => c.status === 'APPROVED');
  const rejectedChecks = checks.filter((c) => c.status === 'REJECTED');

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Agricultural Quality & Phytosanitary Control
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            {user?.name || 'Dr. Farzana Akter'} · Agronomy Inspection Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified Laboratory Agronomist · Savar & Gazipur Agri Quality Station
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/inspector/inspections')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            <span>Conduct Inspection</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pending Inspections"
          value={pendingChecks.length}
          subtitle="Batches awaiting clearance"
          icon={FileCheck}
          onClick={() => navigate('/inspector/assignments')}
        />
        <MetricCard
          title="Certified Approved"
          value={approvedChecks.length}
          subtitle="Passed moisture & residue safety"
          icon={ShieldCheck}
          trend={{ value: 'Cleared for dispatch', isPositive: true }}
          onClick={() => navigate('/inspector/history')}
        />
        <MetricCard
          title="Rejections & Quarantine"
          value={rejectedChecks.length}
          subtitle="Non-compliant pest / mold levels"
          icon={AlertTriangle}
          onClick={() => navigate('/inspector/history')}
        />
        <MetricCard
          title="Average Moisture Score"
          value="11.8%"
          subtitle="National safety baseline <12%"
          icon={Award}
        />
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Assigned Inspection Tasks</h3>
          <span className="text-xs text-slate-500">Quality gate enforces: No dispatch without approval</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">QC Code</th>
                <th className="py-3 px-4">Harvest Batch</th>
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4">Inspection Location</th>
                <th className="py-3 px-4">Moisture %</th>
                <th className="py-3 px-4">Pesticide (ppm)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {checks.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.id}</td>
                  <td className="py-3 px-4 font-mono text-emerald-800 font-semibold">{c.batchCode}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{c.cropName}</td>
                  <td className="py-3 px-4">{c.inspectionLocation === 'FARM' ? 'Seller Farm Gate' : 'Central Warehouse Dock'}</td>
                  <td className="py-3 px-4 font-mono tabular-nums">{c.moistureContentPercent}%</td>
                  <td className="py-3 px-4 font-mono tabular-nums">{c.pesticideResiduePpm} ppm</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate('/inspector/inspections')}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                    >
                      Audit Form
                    </button>
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
