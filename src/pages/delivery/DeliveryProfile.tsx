import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { agroApi } from '../../services/api';
import type { DeliveryPartner } from '../../types';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export const DeliveryProfile: React.FC = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    agroApi.getDeliveryPartners().then((partners) => {
      const own = partners.find((item) =>
        item.id === user?.id || (item as DeliveryPartner & { userId?: string }).userId === user?.id ||
        item.email?.toLowerCase() === user?.email?.toLowerCase()
      );
      if (active) setPartner(own || null);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, user?.email]);

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading your partner profile…</div>;
  if (!partner) return <div className="max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><AlertTriangle className="mb-2 h-5 w-5" />No delivery-partner profile is linked to this signed-in account. Please contact support; another partner's profile will not be shown.</div>;

  return <div className="max-w-2xl space-y-6">
    <div><h1 className="text-xl font-bold text-slate-900">Delivery Partner Fleet Profile</h1><p className="mt-1 text-xs text-slate-500">Your own registered service and vehicle details.</p></div>
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 text-xs shadow-2xs">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-xl font-bold text-white">{partner.name.charAt(0)}</div>
        <div><div className="flex items-center gap-2"><h2 className="text-base font-bold text-slate-900">{partner.name}</h2><span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold">{partner.approvalStatus}</span></div><p className="mt-0.5 text-xs text-slate-500">{partner.email}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-4"><div><span className="mb-0.5 block text-slate-500">Phone Number</span><span className="font-mono font-bold text-slate-900">{partner.phone}</span></div><div><span className="mb-0.5 block text-slate-500">Service District</span><span className="font-bold text-slate-900">{(partner as DeliveryPartner & { district?: string }).district || '—'}</span></div></div>
      <div className="grid grid-cols-2 gap-4"><div><span className="mb-0.5 block text-slate-500">NID</span><span className="font-mono text-slate-900">{partner.nid}</span></div><div><span className="mb-0.5 block text-slate-500">Vehicle</span><span className="font-bold text-slate-900">{partner.vehicleType} · {partner.vehicleRegNumber}</span></div></div>
      <div className="border-t border-slate-100 pt-3"><span className="mb-2 block font-bold text-slate-900">Operational Service Areas</span><div className="flex flex-wrap gap-2">{(partner.assignedAreas || []).map((area) => <span key={area} className="rounded border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">{area}</span>)}</div></div>
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 font-semibold text-emerald-800"><ShieldCheck className="h-5 w-5 shrink-0" /><span>{partner.canPickup ? 'Farm Product Pickup enabled' : 'Farm Product Pickup disabled'} · {partner.canDeliver ? 'Customer Doorstep Delivery enabled' : 'Customer Doorstep Delivery disabled'}</span></div>
    </div>
  </div>;
};
