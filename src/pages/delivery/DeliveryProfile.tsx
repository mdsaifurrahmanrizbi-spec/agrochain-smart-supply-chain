import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { store } from '../../services/api';
import { Truck, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react';

export const DeliveryProfile: React.FC = () => {
  const { user } = useAuth();
  const partner = store.deliveryPartners[0];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Delivery Partner Fleet Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Authorized fleet credentials, service area allocations, and vehicle registration.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-emerald-700 text-white font-bold text-xl flex items-center justify-center">
            {partner.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{partner.name}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {partner.approvalStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Approved Logistics Partner · Dhaka Fleet</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-slate-500 block mb-0.5">Phone Number</span>
            <span className="font-mono font-bold text-slate-900">{partner.phone}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Email</span>
            <span className="font-mono text-slate-900">{partner.email}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-slate-500 block mb-0.5">National ID (NID)</span>
            <span className="font-mono text-slate-900">{partner.nid}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Vehicle Type & Reg</span>
            <span className="font-bold text-slate-900">{partner.vehicleType} · {partner.vehicleRegNumber}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-2">
          <span className="font-bold text-slate-900 block">Assigned Operational Service Areas</span>
          <div className="flex flex-wrap gap-2">
            {partner.assignedAreas.map((area) => (
              <span key={area} className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200">
                {area}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center gap-4 text-emerald-800 font-semibold bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>Authorized for both Farm Product Pickup and Customer Doorstep Delivery.</span>
        </div>
      </div>
    </div>
  );
};
