import React, { useEffect, useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Sprout,
  MapPin,
  CheckCircle,
  Truck,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Check,
} from 'lucide-react';

export const DeliveryPickups: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState(store.jobs.filter((j) => j.type === 'PICKUP'));

  useEffect(() => {
    let active = true;
    Promise.all([agroApi.getLogisticsJobs(), agroApi.getOrders()])
      .then(([freshJobs]) => {
        if (active) setJobs(freshJobs.filter((job) => job.type === 'PICKUP'));
      })
      .catch((error) => console.error('Could not refresh assigned pickups:', error));
    return () => { active = false; };
  }, []);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delivery partner approval verification
  const currentPartner = store.deliveryPartners.find(
    (p) => p.email === user?.email || p.id === 'dp-1'
  );
  const isApprovedPartner = currentPartner?.approvalStatus === 'APPROVED';

  const handleAction = async (jobId: string, status: any) => {
    setErrorMsg(null);
    try {
      await agroApi.updateJobStatus(jobId, status);
      setJobs([...store.jobs.filter((j) => j.type === 'PICKUP')]);
      setNotice(`Pickup stage updated successfully to: ${status}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed.');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Farm Origin Pickups</h1>
        <p className="text-xs text-slate-500 mt-1">
          Collect fresh agricultural produce from rural farms. Quality inspection must pass at the farm prior to pickup handover.
        </p>
      </div>

      {!isApprovedPartner && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Partner Authorization Notice:</span>
            <p className="mt-0.5">
              Your account status is currently <strong>{currentPartner?.approvalStatus || 'PENDING_APPROVAL'}</strong>.
              Only approved delivery partners can accept and fulfill pickup consignments.
            </p>
          </div>
        </div>
      )}

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* UPDATE 3 Farm QC Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Farm-Gate Quality Control Rule:</span>
          <p className="text-emerald-800/90 leading-relaxed">
            Quality Control occurs directly at the farmer's property <strong>before</strong> pickup completion.
            If QC is <strong>APPROVED</strong>, collection is unlocked. If <strong>RECHECK_REQUIRED</strong> or <strong>PENDING</strong>,
            the pickup remains on hold. If <strong>REJECTED</strong>, pickup is blocked to safeguard consumer standards.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map((j) => {
          const ord = store.orders.find((o) => o.id === j.orderId || o.orderNumber === j.orderNumber);
          const qcStatus = ord?.qualityStatus || 'PENDING';
          const isQcApproved = qcStatus === 'APPROVED';
          const isQcRejected = qcStatus === 'REJECTED';
          const isQcRecheck = qcStatus === 'RECHECK_REQUIRED' || qcStatus === 'PENDING';

          return (
            <div key={j.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-mono font-bold text-xs text-slate-900">{j.jobCode}</span>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={j.status} size="sm" />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-900 text-sm">{j.productSummary}</div>
                <p className="text-slate-500">
                  Order Ref: <strong className="font-mono text-slate-700">{j.orderNumber}</strong>
                </p>

                {/* Farm Quality Inspection Status Pill */}
                <div className="p-2.5 rounded-lg border bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${isQcApproved ? 'text-emerald-600' : isQcRejected ? 'text-rose-600' : 'text-amber-600'}`} />
                    <div>
                      <span className="text-[11px] font-semibold text-slate-700 block">Farm Origin QC Status:</span>
                      <span className="text-[10px] text-slate-500">Inspected by accredited agronomist</span>
                    </div>
                  </div>
                  <StatusBadge status={qcStatus} size="sm" />
                </div>

                <div className="pt-1 space-y-1 text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Farm Origin:</strong> {j.originAddress}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Dropoff Facility:</strong> {j.destinationAddress}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">{j.assignedDate}</span>

                <div className="space-x-2">
                  {j.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleAction(j.id, 'ACCEPTED')}
                      disabled={!isApprovedPartner}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Accept Assignment
                    </button>
                  )}

                  {j.status === 'ACCEPTED' && (
                    <>
                      {isQcApproved ? (
                        <button
                          onClick={() => handleAction(j.id, 'PICKED_UP')}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Confirm Farm Pickup</span>
                        </button>
                      ) : isQcRejected ? (
                        <span className="px-3 py-1.5 bg-rose-100 text-rose-800 rounded-lg text-xs font-bold border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Pickup Blocked (Farm QC Failed)</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>On Hold (Awaiting Farm QC)</span>
                        </span>
                      )}
                    </>
                  )}

                  {j.status === 'PICKED_UP' && (
                    <button
                      onClick={() => handleAction(j.id, 'WAREHOUSE_HANDOVER')}
                      className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Deliver to Warehouse</span>
                    </button>
                  )}

                  {j.status === 'WAREHOUSE_HANDOVER' && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Transferred to Warehouse</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
