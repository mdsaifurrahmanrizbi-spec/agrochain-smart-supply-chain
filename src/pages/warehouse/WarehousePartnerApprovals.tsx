
import React, { useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { DeliveryPartner } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShieldCheck,
  Check,
  UserCheck,
  HelpCircle,
  PauseCircle,
} from 'lucide-react';

export const WarehousePartnerApprovals: React.FC = () => {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isAuthorizedManager =
    user?.role === 'warehouse' && user.isWarehouseManager === true;

  const canManagePartner = (partner: DeliveryPartner) => {
    if (isAdmin) return true;

    return Boolean(
      isAuthorizedManager &&
        partner.warehouseId &&
        (user?.managedWarehouseIds ?? []).includes(partner.warehouseId)
    );
  };

  const [partners, setPartners] = useState<DeliveryPartner[]>(() =>
    store.deliveryPartners.filter(canManagePartner)
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [infoModalPartner, setInfoModalPartner] =
    useState<DeliveryPartner | null>(null);
  const [infoText, setInfoText] = useState('');
  const [suspendModalPartner, setSuspendModalPartner] =
    useState<DeliveryPartner | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const managerName = user?.name || 'Unknown User';
  const approverRole = isAdmin ? 'ADMIN' : 'WAREHOUSE_MANAGER';

  const refreshPartners = () => {
    setPartners(store.deliveryPartners.filter(canManagePartner));
  };

  const showNotice = (message: string) => {
    setNotice(message);
  };

  const getAuthorizedPartner = (partnerId: string) => {
    const partner = store.deliveryPartners.find(
      (item) => item.id === partnerId
    );

    if (!partner) {
      showNotice('Partner not found.');
      return null;
    }

    if (!canManagePartner(partner)) {
      showNotice('You are not authorized to manage this partner.');
      return null;
    }

    return partner;
  };

  const handleApprove = async (partnerId: string) => {
    const partner = getAuthorizedPartner(partnerId);
    if (!partner) return;

    try {
      await agroApi.updatePartnerApproval(
        partnerId,
        'APPROVED',
        managerName,
        approverRole,
        'Approved after required identity and vehicle checks.'
      );

      refreshPartners();
      showNotice(`${partner.name} approved successfully.`);
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : 'Approval failed.'
      );
    }
  };

  const handleReject = async (partnerId: string) => {
    const partner = getAuthorizedPartner(partnerId);
    if (!partner) return;

    try {
      await agroApi.updatePartnerApproval(
        partnerId,
        'REJECTED',
        managerName,
        approverRole,
        'Application rejected due to incomplete credentials or compliance concerns.'
      );

      refreshPartners();
      showNotice(`${partner.name}'s registration was rejected.`);
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : 'Rejection failed.'
      );
    }
  };

  const handleSubmitRequestInfo = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!infoModalPartner) return;

    const partner = getAuthorizedPartner(infoModalPartner.id);
    if (!partner) {
      setInfoModalPartner(null);
      return;
    }

    if (!infoText.trim()) {
      showNotice('Enter the information you need from the partner.');
      return;
    }

    try {
      await agroApi.requestPartnerInfo(
        partner.id,
        infoText.trim(),
        managerName,
        approverRole
      );

      refreshPartners();
      showNotice(`Information request sent to ${partner.name}.`);
      setInfoModalPartner(null);
      setInfoText('');
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : 'Could not send the information request.'
      );
    }
  };

  const handleSubmitSuspend = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!suspendModalPartner) return;

    const partner = getAuthorizedPartner(suspendModalPartner.id);
    if (!partner) {
      setSuspendModalPartner(null);
      return;
    }

    if (!suspendReason.trim()) {
      showNotice('Enter a reason for suspension.');
      return;
    }

    try {
      await agroApi.updatePartnerApproval(
        partner.id,
        'SUSPENDED',
        managerName,
        approverRole,
        suspendReason.trim()
      );

      refreshPartners();
      showNotice(`${partner.name}'s account was suspended.`);
      setSuspendModalPartner(null);
      setSuspendReason('');
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : 'Suspension failed.'
      );
    }
  };

  const handleReactivate = async (partnerId: string) => {
    const partner = getAuthorizedPartner(partnerId);
    if (!partner) return;

    try {
      await agroApi.updatePartnerApproval(
        partnerId,
        'APPROVED',
        managerName,
        approverRole,
        'Partner reactivated after review.'
      );

      refreshPartners();
      showNotice(`${partner.name} reactivated.`);
    } catch (error) {
      showNotice(
        error instanceof Error ? error.message : 'Reactivation failed.'
      );
    }
  };

  if (!isAdmin && !isAuthorizedManager) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        <h1 className="font-bold">Access denied</h1>
        <p className="mt-1">
          Only Admin or an authorized Warehouse Manager can access partner
          approvals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Delivery Partner Approvals Desk
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Review registrations, request documents, and manage partner
            compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 p-2 text-xs">
          <UserCheck className="h-4 w-4 text-emerald-700" />
          <span className="text-slate-600">
            Signed in: <strong>{managerName}</strong>
          </span>
          <span className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {isAdmin ? 'ADMIN' : 'MANAGER'}
          </span>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"
        >
          <Check className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="ml-auto font-bold"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        <div>
          <strong>Partner access policy</strong>
          <p className="mt-1 leading-relaxed">
            Admin can manage all partners. Warehouse Managers can manage
            partners assigned to their configured warehouses only. New
            registrations must be reviewed before accepting jobs.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">NID</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Service Areas</th>
                <th className="px-4 py-3">Services</th>
                <th className="px-4 py-3">Status / Audit</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {partners.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {p.preferredArea}
                    </div>
                    {p.requestedInfoNotes && (
                      <div className="mt-1 inline-block rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800">
                        Info requested: {p.requestedInfoNotes}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 font-mono text-[11px]">
                    <div>{p.phone}</div>
                    <div className="text-slate-400">{p.email}</div>
                  </td>

                  <td className="px-4 py-3 font-mono">{p.nid}</td>

                  <td className="px-4 py-3">
                    <div className="font-medium">{p.vehicleType}</div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {p.vehicleRegNumber}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.assignedAreas.map((area) => (
                        <span
                          key={area}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                    {p.warehouseId && (
                      <div className="mt-1 text-[10px] text-slate-500">
                        Warehouse: {p.warehouseId}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-[11px]">
                    {p.canPickup && (
                      <span className="block font-semibold text-emerald-700">
                        ✓ Farm pickup
                      </span>
                    )}
                    {p.canDeliver && (
                      <span className="block font-semibold text-blue-700">
                        ✓ Customer delivery
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={p.approvalStatus} size="sm" />
                    {p.approvedBy && (
                      <div className="mt-1 text-[10px] text-slate-500">
                        By: <strong>{p.approvedBy}</strong>
                      </div>
                    )}
                    {p.approvalDate && (
                      <div className="font-mono text-[10px] text-slate-400">
                        {p.approvalDate}
                      </div>
                    )}
                  </td>

                  <td className="space-x-1.5 whitespace-nowrap px-4 py-3 text-right">
                    {p.approvalStatus === 'PENDING_APPROVAL' && (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleApprove(p.id)}
                          className="rounded bg-emerald-700 px-2.5 py-1 font-semibold text-white hover:bg-emerald-800"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setInfoModalPartner(p)}
                          className="rounded border border-slate-200 bg-slate-100 px-2 py-1 font-medium text-slate-700 hover:bg-slate-200"
                        >
                          Request Info
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleReject(p.id)}
                          className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {p.approvalStatus === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => setSuspendModalPartner(p)}
                        className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-800 hover:bg-amber-100"
                      >
                        Suspend
                      </button>
                    )}

                    {(p.approvalStatus === 'SUSPENDED' ||
                      p.approvalStatus === 'REJECTED') && (
                      <button
                        type="button"
                        onClick={() => void handleReactivate(p.id)}
                        className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {partners.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <p className="font-semibold text-slate-700">
                      No partners available for this account.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Check warehouse assignments and partner warehouse IDs.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {infoModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <HelpCircle className="h-4 w-4 text-emerald-700" />
                Request Additional Information
              </h2>
              <button
                type="button"
                onClick={() => setInfoModalPartner(null)}
                className="font-bold text-slate-400 hover:text-slate-700"
                aria-label="Close information request"
              >
                ×
              </button>
            </div>

            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              Partner: <strong>{infoModalPartner.name}</strong>
              <br />
              Phone: {infoModalPartner.phone}
            </p>

            <form onSubmit={handleSubmitRequestInfo} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Required documents or clarification
                <textarea
                  required
                  rows={4}
                  value={infoText}
                  onChange={(e) => setInfoText(e.target.value)}
                  placeholder="Describe the missing information or documents..."
                  className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                />
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInfoModalPartner(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {suspendModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-rose-700">
                <PauseCircle className="h-4 w-4" />
                Suspend Delivery Partner
              </h2>
              <button
                type="button"
                onClick={() => setSuspendModalPartner(null)}
                className="font-bold text-slate-400 hover:text-slate-700"
                aria-label="Close suspension dialog"
              >
                ×
              </button>
            </div>

            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Suspending <strong>{suspendModalPartner.name}</strong> should
              prevent new jobs until the account is reactivated.
            </p>

            <form onSubmit={handleSubmitSuspend} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Reason for suspension
                <textarea
                  required
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter the reason for suspension..."
                  className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                />
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuspendModalPartner(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800"
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
