import React from 'react';
import { store } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { History, CheckCircle, Truck } from 'lucide-react';

export const DeliveryHistory: React.FC = () => {
  const allJobs = store.jobs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Historical Logistics Jobs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete archive of completed farm pickups, godown transfers, and doorstep handovers.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Job Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4">Origin / Destination</th>
                <th className="py-3 px-4">Execution Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Proof Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allJobs.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{j.jobCode}</td>
                  <td className="py-3 px-4 font-semibold">{j.type}</td>
                  <td className="py-3 px-4">{j.productSummary}</td>
                  <td className="py-3 px-4">
                    <div>{j.originAddress}</div>
                    <div className="text-[11px] text-slate-500">→ {j.destinationAddress}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{j.assignedDate}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={j.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">{j.proofNotes || 'Verified'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
