import React, { useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DeliveryPartner } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShieldCheck, Truck, MapPin, Check, X, AlertTriangle, HelpCircle, PauseCircle } from 'lucide-react';

export const AdminPartnerApprovals: React.FC = () => {
  const { user } = useAuth();
  const [partners, setPartners] = useState(store.deliveryPartners);
  const [notice, setNotice] = useState<string | null>(null);

  const [infoModalPartner, setInfoModalPartner] = useState<DeliveryPartner | null>(null);
  const [infoText, setInfoText] = useState('');
  const [suspendModalPartner, setSuspendModalPartner] = useState<DeliveryPartner | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const adminName = user?.name || 'Dr. Harun-ur-Rashid (System Admin)';

  const handleUpdateStatus = async (
    partnerId: string,
    status: DeliveryPartner['approvalStatus'],
    notes?: string
  ) => {
    await agroApi.updatePartnerApproval(
      partnerId,
      status,
      adminName,
      'ADMIN',
      notes || `Administrative status update to: ${status}`
    );
    setPartners([...store.deliveryPartners]);
    setNotice(`Partner status updated to: ${status}`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleSubmitRequestInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoModalPartner) return;
    await agroApi.requestPartnerInfo(infoModalPartner.id, infoText, adminName, 'ADMIN');
    setPartners([...store.deliveryPartners]);
    setNotice(`Information request dispatched to ${infoModalPartner.name}.`);
    setInfoModalPartner(null);
    setInfoText('');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleSubmitSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendModalPartner) return;
    await agroApi.updatePartnerApproval(
      suspendModalPartner.id,
      'SUSPENDED',
      adminName,
      'ADMIN',
      suspendReason || 'Administrative fleet compliance hold'
    );
    setPartners([...store.deliveryPartners]);
    setNotice(`Partner account suspended.`);
    setSuspendModalPartner(null);
    setSuspendReason('');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Delivery Fleet Approvals & Working Areas</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review delivery partner registrations, national ID credentials, and monitor approvals performed by both Administrators and Warehouse Managers.
        </p>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Rules Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Dual-Authority Fleet Governance Rule:</span>
          <p className="text-emerald-800/90 leading-relaxed">
            Both <strong>System Administrators</strong> and authorized <strong>Warehouse Managers</strong> can evaluate,
            approve, request details, and suspend delivery partners. Below, view the complete audit trail showing which authority
            approved each partner, their vehicle specifications, and assigned territorial boundaries.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Partner Name</th>
                <th className="py-3 px-4">Phone / Email</th>
                <th className="py-3 px-4">National ID (NID)</th>
                <th className="py-3 px-4">Vehicle Specs</th>
                <th className="py-3 px-4">Authorized Service Areas</th>
                <th className="py-3 px-4">Capabilities</th>
                <th className="py-3 px-4">Approval Status & Officer</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partners.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{p.preferredArea}</div>
                    {p.requestedInfoNotes && (
                      <div className="mt-1 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 rounded px-1.5 py-0.5 inline-block">
                        Info Req: {p.requestedInfoNotes}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div>{p.phone}</div>
                    <div className="text-slate-400">{p.email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{p.nid}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{p.vehicleType}</div>
                    <div className="font-mono text-[11px] text-slate-500">{p.vehicleRegNumber}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {p.assignedAreas.map((area) => (
                        <span key={area} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {area}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[11px]">
                    <span className="text-emerald-700 font-semibold block">{p.canPickup ? '✓ Farm Pickup' : ''}</span>
                    <span className="text-blue-700 font-semibold block">{p.canDeliver ? '✓ Customer Delivery' : ''}</span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={p.approvalStatus} size="sm" />
                    {p.approvedBy && (
                      <div className="text-[10px] text-slate-600 mt-1 font-mono">
                        <span className="text-slate-400">By: </span>
                        <strong className="text-slate-800">{p.approvedBy}</strong>
                        {p.approverRole === 'WAREHOUSE_MANAGER' && (
                          <span className="ml-1 text-[9px] px-1 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200">
                            WH Manager
                          </span>
                        )}
                      </div>
                    )}
                    {p.approvalDate && (
                      <div className="text-[10px] text-slate-400 font-mono">{p.approvalDate}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    {p.approvalStatus === 'PENDING_APPROVAL' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(p.id, 'APPROVED')}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setInfoModalPartner(p)}
                          className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200"
                        >
                          Request Info
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(p.id, 'REJECTED')}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {p.approvalStatus === 'APPROVED' && (
                      <button
                        onClick={() => setSuspendModalPartner(p)}
                        className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200"
                      >
                        Suspend
                      </button>
                    )}

                    {p.approvalStatus === 'SUSPENDED' && (
                      <button
                        onClick={() => handleUpdateStatus(p.id, 'APPROVED')}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                      >
                        Reactivate
                      </button>
                    )}

                    {p.approvalStatus === 'REJECTED' && (
                      <button
                        onClick={() => handleUpdateStatus(p.id, 'APPROVED')}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200"
                      >
                        Re-evaluate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Info Modal */}
      {infoModalPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-700" />
                <span>Admin Request for Partner Information</span>
              </h3>
              <button
                onClick={() => setInfoModalPartner(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequestInfo} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg text-slate-700">
                <div>Partner: <strong className="text-slate-900">{infoModalPartner.name}</strong></div>
                <div className="text-[11px] text-slate-500 mt-0.5">NID: {infoModalPartner.nid}</div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Required Information / Clarification
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify missing documents or clarifications required from the delivery partner..."
                  value={infoText}
                  onChange={(e) => setInfoText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInfoModalPartner(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendModalPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2">
                <PauseCircle className="w-4 h-4 text-rose-600" />
                <span>Suspend Delivery Partner</span>
              </h3>
              <button
                onClick={() => setSuspendModalPartner(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSuspend} className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                <div>Suspending: <strong>{suspendModalPartner.name}</strong></div>
                <div className="text-[11px] mt-0.5">
                  This will block the partner from all active logistics jobs until reactivated.
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Reason for Suspension
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Audit failure / repeated late delivery / unverified COD deposit..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuspendModalPartner(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Confirm Suspension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
