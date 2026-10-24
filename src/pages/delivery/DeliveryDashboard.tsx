import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { store, agroApi } from '../../services/api';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LogisticsJob, Order } from '../../types';
import {
  Truck,
  Sprout,
  ShoppingBag,
  DollarSign,
  CheckCircle,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  XCircle,
  Check,
  X,
  FileCheck,
  Building2,
} from 'lucide-react';

export const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const partnerId = user?.id === 'u-delivery-1' ? 'dp-1' : 'dp-1';

  const [jobs, setJobs] = useState(store.jobs.filter((j) => j.partnerId === partnerId));
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // OTP Modal state
  const [selectedJob, setSelectedJob] = useState<LogisticsJob | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpNotes, setOtpNotes] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  const partner = store.deliveryPartners.find((p) => p.id === partnerId) || store.deliveryPartners[0];
  const isApproved = partner.approvalStatus === 'APPROVED';

  const todayPickups = jobs.filter((j) => j.type === 'PICKUP');
  const todayDeliveries = jobs.filter((j) => j.type === 'DELIVERY');
  const completedJobs = jobs.filter((j) => ['DELIVERED', 'WAREHOUSE_HANDOVER', 'VERIFIED'].includes(j.status));

  const totalCodCollected = store.codRecords
    .filter((c) => c.deliveryPartnerId === partnerId)
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingDeposit = store.codRecords
    .filter((c) => c.deliveryPartnerId === partnerId && c.depositStatus !== 'CASH_DEPOSIT_VERIFIED')
    .reduce((sum, c) => sum + c.amount, 0);

  const handleUpdateStatus = async (jobId: string, status: any) => {
    setErrorMsg(null);
    try {
      await agroApi.updateJobStatus(jobId, status);
      setJobs([...store.jobs.filter((j) => j.partnerId === partnerId)]);
      setNotice(`Job status updated to ${status}.`);
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to update job status.');
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };


  const openOtpModal = (job: LogisticsJob, order?: Order) => {
    const ord = order || store.orders.find((o) => o.id === job.orderId || o.orderNumber === job.orderNumber);
    setSelectedJob(job);
    setSelectedOrder(ord || null);
    setOtpInput('');
    setOtpNotes('');
    setOtpError(null);
    setOtpSuccess(null);
  };

  const closeOtpModal = () => {
    setSelectedJob(null);
    setSelectedOrder(null);
    setOtpInput('');
    setOtpNotes('');
    setOtpError(null);
    setOtpSuccess(null);
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedJob) return;
    if (!otpInput.trim()) {
      setOtpError('Please enter the customer 4-digit OTP.');
      return;
    }

    setOtpSubmitting(true);
    setOtpError(null);

    try {
      const result = await agroApi.verifyDeliveryOtp(
        selectedOrder.id,
        otpInput.trim(),
        partnerId,
        otpNotes || 'Handed directly to recipient after customer OTP verification.'
      );

      setOtpSuccess(result.message);
      setJobs([...store.jobs.filter((j) => j.partnerId === partnerId)]);

      setTimeout(() => {
        closeOtpModal();
        setNotice('Delivery successfully confirmed and recorded via Customer OTP verification!');
        setTimeout(() => setNotice(null), 4000);
      }, 1500);
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification failed. Please re-check code.');
    } finally {
      setOtpSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Independent Fleet Logistics Hub
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                isApproved
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {partner.approvalStatus}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {partner.name} · Fleet Logistics Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Assigned Operational Areas: <strong>{partner.assignedAreas.join(', ')}</strong>
            </span>
            <span>· Vehicle: <strong>{partner.vehicleType} ({partner.vehicleRegNumber})</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/delivery/active-jobs')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Truck className="w-4 h-4" />
            <span>Active Dispatch Workspace</span>
          </button>
        </div>
      </div>

      {/* Success Notice */}
      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2.5 shadow-2xs">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Workflow Rule Encountered:</span>
            <p className="text-rose-700 font-normal leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Account Status Notice if not approved */}
      {!isApproved && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Partner Account Status: {partner.approvalStatus}</span>
            <p className="mt-0.5 text-amber-800">
              Only approved delivery partners can accept and fulfill assignments. An Administrator or Warehouse Manager must approve your registration.
            </p>
          </div>
        </div>
      )}

      {/* 4 Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Farm Pickups"
          value={todayPickups.length}
          subtitle="Direct grower collection"
          icon={Sprout}
          onClick={() => navigate('/delivery/pickups')}
        />
        <MetricCard
          title="Today's Doorstep Deliveries"
          value={todayDeliveries.length}
          subtitle="Customer OTP fulfillment"
          icon={ShoppingBag}
          onClick={() => navigate('/delivery/deliveries')}
        />
        <MetricCard
          title="Completed This Month"
          value={partner.completedJobsTotal || completedJobs.length}
          subtitle="99.2% on-time SLA"
          icon={CheckCircle}
          trend={{ value: 'Top 5% Partner', isPositive: true }}
          onClick={() => navigate('/delivery/history')}
        />
        <MetricCard
          title="COD Cash Collected"
          value={`৳${totalCodCollected.toLocaleString()}`}
          subtitle={`৳${pendingDeposit.toLocaleString()} pending godown deposit`}
          icon={DollarSign}
          trend={{ value: pendingDeposit === 0 ? 'Settled' : 'Deposit Required', isPositive: pendingDeposit === 0 }}
          onClick={() => navigate('/delivery/cod')}
        />
      </div>

      {/* Assigned Jobs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Assigned Logistics Assignments</h3>
            <p className="text-xs text-slate-500">
              Approved partners perform BOTH farm pickup (post-QC clearance) and customer doorstep delivery (with OTP).
            </p>
          </div>
          <Link to="/delivery/active-jobs" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
            Open Interactive Dispatch View
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Operation Type</th>
                <th className="py-3 px-4">Agricultural Product</th>
                <th className="py-3 px-4">Route Location</th>
                <th className="py-3 px-4">Quality / Security</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => {
                const ord = store.orders.find((o) => o.id === job.orderId || o.orderNumber === job.orderNumber);
                const qcStatus = ord?.qualityStatus || 'PENDING';
                const isQcApproved = qcStatus === 'APPROVED';
                const isQcRejected = qcStatus === 'REJECTED';
                const isDelivered = job.status === 'DELIVERED' || ord?.isDeliveryVerified;

                return (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{job.jobCode}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                          job.type === 'PICKUP'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {job.type === 'PICKUP' ? <Sprout className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                        <span>{job.type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{job.productSummary}</td>
                    <td className="py-3 px-4">
                      {job.type === 'DELIVERY' && (
                        <div className="text-[11px] font-bold text-blue-800 flex items-center gap-1 mb-0.5">
                          <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>Pickup Godown: {job.godownName || job.originAddress}</span>
                        </div>
                      )}
                      <div className="text-slate-800 font-medium truncate max-w-[200px]">From: {job.originAddress}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">To: {job.destinationAddress}</div>
                    </td>
                    <td className="py-3 px-4">
                      {job.type === 'PICKUP' ? (
                        <div className="flex items-center gap-1 text-[11px]">
                          <ShieldCheck className={`w-3.5 h-3.5 ${isQcApproved ? 'text-emerald-600' : isQcRejected ? 'text-rose-600' : 'text-amber-600'}`} />
                          <span className="text-slate-600">Farm QC:</span>
                          <StatusBadge status={qcStatus} size="sm" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                          <span>OTP Secured</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={isDelivered ? 'DELIVERED' : job.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Farm Pickup Workflow */}
                      {job.type === 'PICKUP' && job.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleUpdateStatus(job.id, 'ACCEPTED')}
                          disabled={!isApproved}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 rounded border border-emerald-200"
                        >
                          Accept
                        </button>
                      )}

                      {job.type === 'PICKUP' && (job.status === 'ACCEPTED' || job.status === 'QC_PENDING') && (
                        <>
                          {isQcApproved ? (
                            <button
                              onClick={() => handleUpdateStatus(job.id, 'PICKED_UP')}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-xs"
                            >
                              Confirm Farm Pickup
                            </button>
                          ) : isQcRejected ? (
                            <span className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded">
                              Blocked (Farm QC Rejected)
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <span className="px-2 py-0.5 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded">
                                QC Pending (On Hold)
                              </span>

                            </div>
                          )}
                        </>
                      )}

                      {job.type === 'PICKUP' && job.status === 'PICKED_UP' && (
                        <button
                          onClick={() => handleUpdateStatus(job.id, 'WAREHOUSE_HANDOVER')}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded"
                        >
                          Warehouse Handover
                        </button>
                      )}

                      {/* Customer Delivery Workflow with Godown & OTP */}
                      {job.type === 'DELIVERY' && job.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleUpdateStatus(job.id, 'ACCEPTED')}
                          disabled={!isApproved}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 rounded border border-emerald-200"
                        >
                          Accept
                        </button>
                      )}

                      {job.type === 'DELIVERY' && job.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateStatus(job.id, 'ARRIVED_AT_GODOWN')}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded shadow-xs inline-flex items-center gap-1"
                        >
                          <Building2 className="w-3 h-3 text-blue-200" />
                          <span>Arrived at Godown</span>
                        </button>
                      )}

                      {job.type === 'DELIVERY' && job.status === 'ARRIVED_AT_GODOWN' && (
                        <button
                          onClick={async () => {
                            try {
                              await agroApi.deliveryPartnerConfirmReceipt(ord?.id || job.orderId, partnerId);
                              setJobs([...store.jobs.filter((j) => j.partnerId === partnerId)]);
                              setNotice('Product collection confirmed from godown!');
                              setTimeout(() => setNotice(null), 3000);
                            } catch (err: any) {
                              setErrorMsg(err.message || 'Collection failed');
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded shadow-xs"
                        >
                          Confirm Produce Receipt
                        </button>
                      )}

                      {job.type === 'DELIVERY' && (job.status === 'COLLECTED' || job.handoverConfirmed) && job.status !== 'OUT_FOR_DELIVERY' && !isDelivered && (
                        <button
                          onClick={() => handleUpdateStatus(job.id, 'OUT_FOR_DELIVERY')}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded shadow-xs inline-flex items-center gap-1"
                        >
                          <Truck className="w-3 h-3 text-amber-100" />
                          <span>Start Out for Delivery</span>
                        </button>
                      )}

                      {job.type === 'DELIVERY' && job.status === 'OUT_FOR_DELIVERY' && !isDelivered && (
                        <button
                          onClick={() => openOtpModal(job, ord)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-xs inline-flex items-center gap-1"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Verify Delivery OTP</span>
                        </button>
                      )}

                      {/* Completed indicator */}
                      {(isDelivered || ['WAREHOUSE_HANDOVER', 'VERIFIED'].includes(job.status)) && (
                        <span className="text-[11px] text-emerald-700 font-semibold inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Completed</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {selectedJob && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Doorstep Delivery OTP Verification</h3>
                  <p className="text-[11px] text-slate-500">Order Ref: {selectedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={closeOtpModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="p-5 space-y-4">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-950 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Customer Recipient:</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.buyerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Destination:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[220px]">{selectedOrder.buyerAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Method:</span>
                  <span className="font-bold text-emerald-800">{selectedOrder.paymentMethod}</span>
                </div>
                {selectedOrder.paymentMethod === 'COD' && (
                  <div className="flex justify-between pt-1 border-t border-emerald-200 text-amber-900 font-bold">
                    <span>Cash on Delivery Due:</span>
                    <span>৳{selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {otpSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{otpSuccess}</span>
                </div>
              )}

              {otpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 4-Digit Customer OTP Code:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 4419"
                  autoFocus
                  className="w-full text-center tracking-widest text-2xl font-mono font-bold py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  Ask the customer for the verification code displayed on their live order tracking screen.
                </p>
                {/* Demo Helper Hint */}
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setOtpInput(selectedOrder.deliveryOtp)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium underline"
                  >
                    Auto-fill customer OTP for testing (Code: {selectedOrder.deliveryOtp})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Handover Notes / Proof (Optional):
                </label>
                <input
                  type="text"
                  value={otpNotes}
                  onChange={(e) => setOtpNotes(e.target.value)}
                  placeholder="e.g. Handed to customer at apartment door"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeOtpModal}
                  disabled={otpSubmitting}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpSubmitting || !otpInput.trim()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  {otpSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm Delivery</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
