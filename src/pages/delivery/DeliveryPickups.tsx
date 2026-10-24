import React, { useEffect, useState } from 'react';
import { store, agroApi } from '../../services/api';
import type { QualityCheck } from '../../types';
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
        const partner = store.deliveryPartners.find((p) => p.email === user?.email || p.id === 'dp-1');
        if (active) setJobs(freshJobs.filter((job) => job.type === 'PICKUP' && (!partner || job.partnerId === partner.id)));
      })
      .catch((error) => console.error('Could not refresh assigned pickups:', error));
    return () => { active = false; };
  }, []);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedQcJob, setSelectedQcJob] = useState<string | null>(null);
  const [qcForm, setQcForm] = useState({
    grade: 'Grade A - Premium' as QualityCheck['grade'],
    moistureContentPercent: '',
    pesticideResiduePpm: '',
    foreignMatterPercent: '',
    decision: 'APPROVED' as QualityCheck['status'],
    remarks: '',
  });

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

  const handleSubmitFarmQc = async (event: React.FormEvent<HTMLFormElement>, jobId: string) => {
    event.preventDefault();
    setErrorMsg(null);
    try {
      const job = store.jobs.find((item) => item.id === jobId);
      if (!job) throw new Error('Pickup assignment not found.');
      const order = store.orders.find((item) => item.id === job.orderId);
      if (!order) throw new Error('Order not found for this pickup.');
      const qc = store.qualityChecks.find((item) => item.orderId === order.id || item.id === order.qualityCheckId);
      if (!qc) throw new Error('QC record is missing. Ask admin to refresh or create the QC record.');
      if (!currentPartner || currentPartner.id !== job.partnerId) {
        throw new Error('Only the assigned pickup person can perform this farm-gate inspection.');
      }
      if (!qcForm.remarks.trim()) throw new Error('Enter inspection remarks.');
      const result = await agroApi.updateQualityCheck(qc.id, {
        inspectorId: currentPartner.id,
        inspectorName: currentPartner.name,
        inspectionDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        inspectionLocation: 'FARM',
        grade: qcForm.grade,
        moistureContentPercent: Number(qcForm.moistureContentPercent),
        pesticideResiduePpm: Number(qcForm.pesticideResiduePpm),
        foreignMatterPercent: Number(qcForm.foreignMatterPercent),
        status: qcForm.decision,
        remarks: qcForm.remarks.trim(),
      });
      setJobs([...store.jobs.filter((item) => item.type === 'PICKUP' && item.partnerId === currentPartner.id)]);
      setSelectedQcJob(null);
      setNotice(result.status === 'APPROVED' ? 'QC passed. Farm pickup is now unlocked.' : result.status === 'REJECTED' ? 'QC failed. Pickup remains blocked.' : 'QC requires recheck. Pickup remains on hold.');
      setTimeout(() => setNotice(null), 4500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save farm QC inspection.');
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
                      <span className="text-[10px] text-slate-500">Inspected and recorded by the assigned pickup person</span>
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
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1.5 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>{qcStatus === 'RECHECK_REQUIRED' ? 'Recheck Required' : 'Awaiting Farm QC'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const qc = store.qualityChecks.find((item) => item.orderId === j.orderId || item.id === ord?.qualityCheckId);
                              setQcForm({
                                grade: qc?.grade && qc.grade !== 'Not graded' ? qc.grade : 'Grade A - Premium',
                                moistureContentPercent: qc?.status !== 'PENDING' ? String(qc?.moistureContentPercent ?? '') : '',
                                pesticideResiduePpm: qc?.status !== 'PENDING' ? String(qc?.pesticideResiduePpm ?? '') : '',
                                foreignMatterPercent: qc?.status !== 'PENDING' ? String(qc?.foreignMatterPercent ?? '') : '',
                                decision: 'APPROVED',
                                remarks: '',
                              });
                              setSelectedQcJob(j.id);
                            }}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                          >
                            Inspect & Record QC
                          </button>
                        </div>
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

      {selectedQcJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="farm-qc-title" className="my-6 w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl sm:p-7">
            <div className="mb-5">
              <h2 id="farm-qc-title" className="text-lg font-bold text-slate-900">Farm-gate quality inspection</h2>
              <p className="mt-1 text-xs text-slate-500">Record actual measurements before allowing pickup. The assigned pickup person is the QC inspector for this consignment.</p>
            </div>
            <form onSubmit={(event) => handleSubmitFarmQc(event, selectedQcJob)} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Product grade</label>
                <select required value={qcForm.grade} onChange={(event) => setQcForm({ ...qcForm, grade: event.target.value as QualityCheck['grade'] })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="Grade A - Premium">Grade A - Premium</option>
                  <option value="Grade B - Standard">Grade B - Standard</option>
                  <option value="Grade C - Commercial">Grade C - Commercial</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div><label className="mb-1 block text-xs font-semibold text-slate-700">Moisture %</label><input required type="number" min="0" max="100" step="0.01" value={qcForm.moistureContentPercent} onChange={(event) => setQcForm({ ...qcForm, moistureContentPercent: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-xs font-semibold text-slate-700">Pesticide ppm</label><input required type="number" min="0" step="0.001" value={qcForm.pesticideResiduePpm} onChange={(event) => setQcForm({ ...qcForm, pesticideResiduePpm: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-xs font-semibold text-slate-700">Foreign matter %</label><input required type="number" min="0" max="100" step="0.01" value={qcForm.foreignMatterPercent} onChange={(event) => setQcForm({ ...qcForm, foreignMatterPercent: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="mb-1 block text-xs font-semibold text-slate-700">Inspection remarks</label><textarea required rows={3} value={qcForm.remarks} onChange={(event) => setQcForm({ ...qcForm, remarks: event.target.value })} placeholder="Record the actual product condition and inspection findings." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-semibold text-slate-700">QC decision</label><select value={qcForm.decision} onChange={(event) => setQcForm({ ...qcForm, decision: event.target.value as QualityCheck['status'] })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="APPROVED">QC Passed — unlock pickup</option><option value="RECHECK_REQUIRED">Recheck Required — hold pickup</option><option value="REJECTED">QC Failed — block pickup</option></select></div>
              <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Enter measurements from the physical inspection only. Pickup remains blocked unless QC is passed.</p>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedQcJob(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Save QC decision</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
