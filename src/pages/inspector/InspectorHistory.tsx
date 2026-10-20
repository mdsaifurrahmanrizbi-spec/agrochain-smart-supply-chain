import React from 'react';
import { store } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShieldCheck, Award, FileText } from 'lucide-react';

export const InspectorHistory: React.FC = () => {
  const checks = store.qualityChecks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Quality Certificates & Inspection Log</h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical certificates issued for grain and vegetable harvests with laboratory verification hashes.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Certificate #</th>
                <th className="py-3 px-4">Crop Commodity</th>
                <th className="py-3 px-4">Batch Code</th>
                <th className="py-3 px-4">Quality Grade</th>
                <th className="py-3 px-4">Moisture %</th>
                <th className="py-3 px-4">Pesticide (ppm)</th>
                <th className="py-3 px-4">Inspection Date</th>
                <th className="py-3 px-4">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {checks.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {c.certificateNumber || 'QC-PENDING'}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{c.cropName}</td>
                  <td className="py-3 px-4 font-mono text-emerald-800 font-semibold">{c.batchCode}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{c.grade}</td>
                  <td className="py-3 px-4 font-mono tabular-nums">{c.moistureContentPercent}%</td>
                  <td className="py-3 px-4 font-mono tabular-nums">{c.pesticideResiduePpm}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{c.inspectionDate}</td>
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
