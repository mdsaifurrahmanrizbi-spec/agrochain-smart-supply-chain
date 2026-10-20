import React from 'react';
import { store } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShieldCheck, FileCheck, Award } from 'lucide-react';

export const AdminQualityChecks: React.FC = () => {
  const checks = store.qualityChecks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Platform Quality Control Audits</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete ledger of agronomic moisture, pesticide tests, and phytosanitary clearance certificates.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">QC Code</th>
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4">Harvest Batch Code</th>
                <th className="py-3 px-4">Origin Farmer</th>
                <th className="py-3 px-4">Agronomist Inspector</th>
                <th className="py-3 px-4">Moisture %</th>
                <th className="py-3 px-4">Pesticide Residue</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {checks.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{c.cropName}</td>
                  <td className="py-3 px-4 font-mono text-emerald-800 font-semibold">{c.batchCode}</td>
                  <td className="py-3 px-4">{c.farmerName} ({c.farmLocation})</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{c.inspectorName}</td>
                  <td className="py-3 px-4 font-mono tabular-nums">{c.moistureContentPercent}%</td>
                  <td className="py-3 px-4 font-mono tabular-nums">{c.pesticideResiduePpm} ppm</td>
                  <td className="py-3 px-4">{c.grade}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={c.status} size="sm" />
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
