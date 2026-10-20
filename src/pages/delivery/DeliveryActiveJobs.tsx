import React, { useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Truck,
  Sprout,
  ShoppingBag,
  MapPin,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Clock,
  XCircle,
  Building2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const DeliveryActiveJobs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const partnerId = user?.id === 'u-delivery-1' ? 'dp-1' : 'dp-1';
  const [jobs, setJobs] = useState(store.jobs.filter((j) => j.partnerId === partnerId));
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentPartner = store.deliveryPartners.find((p) => p.id === partnerId);
  const isApproved = currentPartner?.approvalStatus === 'APPROVED';

  const handleUpdate = async (jobId: string, status: any) => {
    setErrorMsg(null);
    try {
      await agroApi.updateJobStatus(jobId, status);
      setJobs([...store.jobs.filter((j) => j.partnerId === partnerId)]);
      setNotice(`Job status advanced to: ${status}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Action failed');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Active Logistics Dispatch Workspace</h1>
        <p className="text-xs text-slate-500 mt-1">
          Unified control panel for farm pickups, warehouse handovers, and doorstep delivery OTP verifications.
        </p>
      </div>

      {!isApproved && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Pending Approval / Fleet Clearance:</span>
            <p className="mt-0.5">
              Only delivery partners with status <strong>APPROVED</strong> by an Administrator or Warehouse Manager may accept and execute routes.
            </p>
          </div>
        </div>
      )}

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        {jobs.map((job) => {
          const ord = store.orders.find((o) => o.id === job.orderId || o.orderNumber === job.orderNumber);
          const qcStatus = ord?.qualityStatus || 'PENDING';
          const isQcApproved = qcStatus === 'APPROVED';

          return (
            <div key={job.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-slate-900">{job.jobCode}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      job.type === 'PICKUP' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'
                    }`}
                  >
                    {job.type} OPERATION
                  </span>
                  <StatusBadge status={job.status} size="sm" />
                </div>
                <span className="text-xs font-mono text-slate-500">{job.assignedDate}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500">Product / Commodity:</span>
                  <div className="font-bold text-slate-900 text-sm">{job.productSummary}</div>
                  <div className="text-slate-500">
                    Consignment: <strong className="font-mono text-slate-800">{job.orderNumber}</strong>
                  </div>

                  {job.type === 'PICKUP' && (
                    <div className="pt-2 flex items-center gap-2">
                      <span className="text-slate-500 text-[11px]">Farm QC Clearance:</span>
                      <StatusBadge status={qcStatus} size="sm" />
                    </div>
                  )}

                  {job.type === 'DELIVERY' && (
                    <div className="pt-1 text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>OTP Delivery Confirmation Active</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {job.type === 'DELIVERY' && (
                    <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-slate-200 text-blue-900 font-bold text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>Pickup Godown: {job.godownName || job.originAddress}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span><strong>Origin:</strong> {job.originAddress}</span>
                  </div>
                  <div className="flex items-start gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Destination:</strong> {job.destinationAddress}</span>
                  </div>
                </div>
              </div>

              {/* Workflow Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {job.proofNotes ? (
                    <span className="text-slate-700 font-medium">Notes: {job.proofNotes}</span>
                  ) : (
                    <span>Next Step: Progress through authorized stages</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {job.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleUpdate(job.id, 'ACCEPTED')}
                      disabled={!isApproved}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      {job.type === 'DELIVERY' ? 'Accept Delivery Job' : 'Accept Assignment'}
                    </button>
                  )}

                  {/* Pickup stage: QC must be approved at farm before pickup */}
                  {job.status === 'ACCEPTED' && job.type === 'PICKUP' && (
                    <>
                      {isQcApproved ? (
                        <button
                          onClick={() => handleUpdate(job.id, 'PICKED_UP')}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Farm Pickup</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Farm QC {qcStatus} (Pickup On Hold)</span>
                        </span>
                      )}
                    </>
                  )}

                  {/* Delivery stage: Arrival at local godown */}
                  {job.status === 'ACCEPTED' && job.type === 'DELIVERY' && (
                    <button
                      onClick={() => handleUpdate(job.id, 'ARRIVED_AT_GODOWN')}
                      className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5 text-blue-200" />
                      <span>Confirm Arrival at Godown</span>
                    </button>
                  )}

                  {/* Delivery stage: Confirm product handover from godown */}
                  {job.status === 'ARRIVED_AT_GODOWN' && job.type === 'DELIVERY' && (
                    <button
                      onClick={async () => {
                        try {
                          await agroApi.deliveryPartnerConfirmReceipt(job.orderId, partnerId);
                          setJobs([...store.jobs.filter((j) => j.partnerId === partnerId)]);
                          setNotice('Produce receipt confirmed from local godown!');
                          setTimeout(() => setNotice(null), 3000);
                        } catch (err: any) {
                          setErrorMsg(err.message || 'Collection failed');
                        }
                      }}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Confirm Product Received</span>
                    </button>
                  )}

                  {/* Delivery stage: Start Out for Delivery */}
                  {job.type === 'DELIVERY' && (job.status === 'COLLECTED' || job.handoverConfirmed) && job.status !== 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => handleUpdate(job.id, 'OUT_FOR_DELIVERY')}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5 text-amber-100" />
                      <span>Start Out for Delivery</span>
                    </button>
                  )}

                  {job.status === 'PICKED_UP' && (
                    <button
                      onClick={() => handleUpdate(job.id, 'WAREHOUSE_HANDOVER')}
                      className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Transfer to Warehouse
                    </button>
                  )}

                  {job.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => navigate('/delivery/deliveries')}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Verify Customer Delivery OTP</span>
                    </button>
                  )}

                  {['DELIVERED', 'WAREHOUSE_HANDOVER'].includes(job.status) && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Stage Completed</span>
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
