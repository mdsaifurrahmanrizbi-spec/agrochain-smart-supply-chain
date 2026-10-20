import React, { useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LogisticsJob, Order } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShoppingBag,
  MapPin,
  CheckCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  AlertCircle,
  HelpCircle,
  Lock,
  Building2,
  Truck,
  ArrowRight,
} from 'lucide-react';

export const DeliveryDeliveries: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState(store.jobs.filter((j) => j.type === 'DELIVERY'));
  const [selectedJob, setSelectedJob] = useState<LogisticsJob | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // OTP Verification state
  const [otpInput, setOtpInput] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Find partner record
  const currentPartner = store.deliveryPartners.find(
    (p) => p.email === user?.email || p.id === 'dp-1'
  );
  const isApproved = currentPartner?.approvalStatus === 'APPROVED';
  const partnerId = currentPartner?.id || 'dp-1';

  const refreshJobs = () => {
    setJobs([...store.jobs.filter((j) => j.type === 'DELIVERY')]);
  };

  // Step 2: Accept Delivery Job
  const handleAcceptJob = async (jobId: string) => {
    setErrorMsg(null);
    try {
      await agroApi.updateJobStatus(jobId, 'ACCEPTED');
      refreshJobs();
      setActionNotice('Delivery job accepted! Please proceed to the assigned local godown.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept job');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Step 4: Confirm Arrival at Godown
  const handleConfirmArrival = async (jobId: string) => {
    setErrorMsg(null);
    try {
      await agroApi.updateJobStatus(jobId, 'ARRIVED_AT_GODOWN');
      refreshJobs();
      setActionNotice('Arrival confirmed at local godown! Report to godown manager to inspect and receive produce.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to confirm arrival');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Step 5: Confirm Product Received from Godown
  const handleConfirmProductReceived = async (job: LogisticsJob) => {
    setErrorMsg(null);
    try {
      await agroApi.deliveryPartnerConfirmReceipt(job.orderId, partnerId);
      refreshJobs();
      setActionNotice('Product receipt confirmed! Crates collected from godown and ready for delivery.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Handover receipt failed');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Step 6: Click "Out for Delivery"
  const handleStartOutForDelivery = async (jobId: string) => {
    setErrorMsg(null);
    try {
      await agroApi.deliveryPartnerOutForDelivery(jobId, partnerId);
      refreshJobs();
      setActionNotice('Produce is now OUT FOR DELIVERY! Customer has received their secret delivery OTP.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Cannot mark out for delivery');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Step 7: Open OTP Modal
  const handleOpenOtpModal = (job: LogisticsJob) => {
    const ord = store.orders.find((o) => o.id === job.orderId || o.orderNumber === job.orderNumber);
    setSelectedJob(job);
    setSelectedOrder(ord || null);
    setOtpInput('');
    setProofNotes('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const result = await agroApi.verifyDeliveryOtp(
        selectedJob.orderId,
        otpInput,
        partnerId,
        proofNotes || 'Handed directly to recipient after customer OTP verification.'
      );

      setSuccessMsg(result.message);
      refreshJobs();

      setTimeout(() => {
        setSelectedJob(null);
        setSelectedOrder(null);
        setSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed. Please re-check code.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Doorstep Customer Deliveries</h1>
        <p className="text-xs text-slate-500 mt-1">
          Perform complete last-mile fulfillment: Accept Assignment → Visit Godown → Receive Produce → Out for Delivery → Verify Doorstep OTP.
        </p>
      </div>

      {!isApproved && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Account Registration Pending or Suspended:</span>
            <p className="mt-0.5">
              Your delivery partner status is currently <strong>{currentPartner?.approvalStatus || 'PENDING_APPROVAL'}</strong>.
              Only approved delivery partners are permitted to accept jobs and verify deliveries. Contact your regional Warehouse Manager or Administrator.
            </p>
          </div>
        </div>
      )}

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {errorMsg && !selectedJob && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Modern 7-Step Delivery Protocol Bar */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Automated 7-Step Last-Mile Delivery Protocol:</span>
          <p className="text-emerald-800/90 leading-relaxed">
            1. View Assignment &rarr; 2. Accept Delivery Job &rarr; 3. Check Pickup Godown &rarr; 4. Confirm Arrival at Godown &rarr; 5. Confirm Handover/Receipt from Manager &rarr; 6. Start &ldquo;Out for Delivery&rdquo; &rarr; 7. Enter Customer Doorstep OTP to confirm delivery.
          </p>
        </div>
      </div>

      {/* Deliveries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map((j) => {
          const ord = store.orders.find((o) => o.id === j.orderId || o.orderNumber === j.orderNumber);
          const isDelivered = j.status === 'DELIVERED' || ord?.isDeliveryVerified;
          const pickupFacility = j.godownName || (j.originAddress.includes('Godown') ? j.originAddress : `${j.originAddress} Local Godown`);

          return (
            <div key={j.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-mono font-bold text-xs text-slate-900">{j.jobCode}</span>
                <StatusBadge status={isDelivered ? 'DELIVERED' : j.status} size="sm" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-900 text-sm">{j.productSummary}</div>
                <p className="text-slate-500">
                  Order Ref: <strong className="font-mono text-slate-700">{j.orderNumber}</strong>
                </p>

                {/* Step 3: Show Pickup Godown Location */}
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>Pickup Godown Location:</span>
                  </div>
                  <div className="text-slate-800 font-semibold pl-5 text-xs">{pickupFacility}</div>
                </div>

                {/* Customer Destination */}
                <div className="pt-1 space-y-1 text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Customer Destination:</strong> {j.destinationAddress}</span>
                  </div>

                  {j.codAmount && j.codAmount > 0 ? (
                    <div className="text-amber-800 font-bold bg-amber-50 p-2 rounded border border-amber-200 flex items-center justify-between">
                      <span>Cash on Delivery (COD) Due:</span>
                      <span className="font-mono text-sm">৳{j.codAmount.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="text-emerald-800 font-semibold bg-emerald-50/60 p-2 rounded border border-emerald-100">
                      Prepaid Online Order · No cash collection needed
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons across all 7 steps */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-500">{j.assignedDate}</span>

                {/* Step 2: Accept Job */}
                {j.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleAcceptJob(j.id)}
                    disabled={!isApproved}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-200" />
                    <span>Accept Delivery Job</span>
                  </button>
                )}

                {/* Step 4: Confirm Arrival at Godown */}
                {j.status === 'ACCEPTED' && (
                  <button
                    onClick={() => handleConfirmArrival(j.id)}
                    className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Building2 className="w-4 h-4 text-blue-200" />
                    <span>Confirm Arrival at Godown</span>
                  </button>
                )}

                {/* Step 5: Confirm Product Received from Godown */}
                {j.status === 'ARRIVED_AT_GODOWN' && (
                  <button
                    onClick={() => handleConfirmProductReceived(j)}
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Confirm Product Received</span>
                  </button>
                )}

                {/* Step 6: Click Out for Delivery */}
                {(j.status === 'COLLECTED' || j.handoverConfirmed) && j.status !== 'OUT_FOR_DELIVERY' && !isDelivered && (
                  <button
                    onClick={() => handleStartOutForDelivery(j.id)}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Truck className="w-4 h-4 text-amber-100" />
                    <span>Start Out for Delivery</span>
                  </button>
                )}

                {/* Step 7: Verify Customer OTP */}
                {j.status === 'OUT_FOR_DELIVERY' && !isDelivered && (
                  <button
                    onClick={() => handleOpenOtpModal(j)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <KeyRound className="w-4 h-4 text-emerald-200" />
                    <span>Verify Delivery OTP</span>
                  </button>
                )}

                {/* Completed confirmation */}
                {isDelivered && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Delivery Confirmed via OTP</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* UPDATE 1: Delivery OTP Verification Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Verify Customer Delivery OTP</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Consignment: {selectedJob.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1 text-slate-700 border border-slate-100">
                <div className="font-bold text-slate-900">{selectedJob.destinationAddress}</div>
                <div className="text-slate-500">{selectedJob.productSummary}</div>
                {selectedJob.codAmount && selectedJob.codAmount > 0 ? (
                  <div className="font-bold text-amber-800 pt-1">
                    Collect Cash on Delivery: ৳{selectedJob.codAmount.toLocaleString()}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1.5">
                  Enter Customer's 4-Digit Delivery OTP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 4419"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 text-center text-lg font-mono tracking-widest bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-600 text-slate-900 font-bold"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>The recipient views this passcode on their private order screen.</span>
                </p>
              </div>

              {/* Demo Mode Helper */}
              {selectedOrder && (
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold block">Demo Mode Simulation:</span>
                    <span className="text-blue-700">Customer {selectedOrder.buyerName} holds code.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpInput(selectedOrder.deliveryOtp)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition-colors"
                  >
                    Simulate Customer Handing Code
                  </button>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Delivery Notes & Package Intactness (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Produce sacks handed in good condition, seals checked..."
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 resize-none text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || otpInput.length < 4}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Verifying OTP...' : 'Authenticate & Complete Delivery'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
