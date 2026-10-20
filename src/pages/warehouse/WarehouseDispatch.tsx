import React, { useState } from 'react';
import { store, agroApi } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Package, Truck, Check, ArrowRight, UserCheck } from 'lucide-react';

export const WarehouseDispatch: React.FC = () => {
  const [jobs, setJobs] = useState(store.jobs.filter((j) => j.type === 'DELIVERY'));
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleHandoverToPartner = async (jobId: string) => {
    setErrorNotice(null);
    try {
      await agroApi.updateJobStatus(
        jobId,
        'OUT_FOR_DELIVERY',
        'Handed over to local delivery partner Kamal Hossain at Tejgaon Godown loading dock.'
      );
      setJobs([...store.jobs.filter((j) => j.type === 'DELIVERY')]);
      setSuccessNotice(`Package successfully dispatched to delivery partner.`);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      setErrorNotice(err.message || 'Dispatch failed.');
      setTimeout(() => setErrorNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dispatch Management & Partner Handover</h1>
        <p className="text-xs text-slate-500 mt-1">
          Prepare customer consignments, scan warehouse seals, and hand over crates to final delivery partners.
        </p>
      </div>

      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-rose-600" />
          <span>{errorNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-mono font-bold text-xs text-slate-900">{job.jobCode}</span>
              <StatusBadge status={job.status} size="sm" />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 text-sm">{job.productSummary}</div>
              <p className="text-slate-500">Order Consignment: <strong className="font-mono text-slate-700">{job.orderNumber}</strong></p>
              <p className="text-slate-600">Assigned Partner: <strong className="text-slate-900">{job.partnerName}</strong></p>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 space-y-1">
                <div><strong>Dispatch Dock:</strong> {job.originAddress}</div>
                <div><strong>Destination Customer:</strong> {job.destinationAddress}</div>
                {job.codAmount ? (
                  <div className="text-amber-800 font-semibold pt-1">
                    COD Collectable: ৳{job.codAmount.toLocaleString()}
                  </div>
                ) : (
                  <div className="text-emerald-800 font-semibold pt-1">Prepaid Online</div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">{job.assignedDate}</span>

              {job.status === 'ASSIGNED' ? (
                <button
                  onClick={() => handleHandoverToPartner(job.id)}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Hand Over to Partner</span>
                </button>
              ) : job.status === 'OUT_FOR_DELIVERY' ? (
                <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Out for Customer Delivery</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700">Delivered</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
