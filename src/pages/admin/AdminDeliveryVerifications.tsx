import React, { useState } from 'react';
import { store } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  CheckCircle2,
  ShieldCheck,
  Check,
  KeyRound,
  Lock,
  Clock,
  Truck,
  Sparkles,
} from 'lucide-react';

export const AdminDeliveryVerifications: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState(store.orders);

  const otpVerifiedOrders = orders.filter((o) => o.isDeliveryVerified);
  const pendingOtpOrders = orders.filter((o) => !o.isDeliveryVerified);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">OTP Delivery Confirmations Audit Log</h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time cryptographic audit trail of doorstep deliveries verified automatically via customer OTP passcodes.
        </p>
      </div>

      {/* UPDATE 1 Architecture Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Automated OTP Delivery Confirmation Paradigm:</span>
          <p className="text-emerald-800/90 leading-relaxed">
            In accordance with AgroChain security protocols, <strong>no additional administrator approval is required</strong> after
            the delivery partner enters and validates the customer's unique delivery OTP at the destination doorstep.
            Once validated, the consignment is automatically confirmed as <strong>DELIVERED</strong>. Below is the immutable audit log
            verifying timestamps, partner IDs, and security records.
          </p>
        </div>
      </div>

      {/* Verified Deliveries Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-700" />
              <span>OTP-Confirmed Doorstep Deliveries ({otpVerifiedOrders.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Deliveries confirmed automatically via recipient passcode match with zero administrator bottlenecks.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            Auto-Confirmed via OTP
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Order Ref</th>
                <th className="py-2.5 px-3">Customer (Recipient)</th>
                <th className="py-2.5 px-3">Produce Consignment</th>
                <th className="py-2.5 px-3">Delivery Partner</th>
                <th className="py-2.5 px-3">Delivery OTP</th>
                <th className="py-2.5 px-3">Confirmation Time</th>
                <th className="py-2.5 px-3 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {otpVerifiedOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{ord.buyerName}</div>
                    <div className="text-[11px] text-slate-500">{ord.buyerCity} ({ord.buyerAddress})</div>
                  </td>
                  <td className="py-3 px-3">
                    {ord.items.map((i) => `${i.quantity}${i.unit} ${i.productName}`).join(', ')}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {ord.deliveryPartnerName || 'Kamal Hossain'}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                      {ord.deliveryOtp}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">
                    {ord.deliveryConfirmedAt || ord.updatedAt}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>OTP Confirmed</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-Transit Queue */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Pending Delivery OTP Passcode Verification ({pendingOtpOrders.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Shipments currently in transit or out for delivery. Customer has received their secret OTP code.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Awaiting Doorstep Handover
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Order Ref</th>
                <th className="py-2.5 px-3">Customer Destination</th>
                <th className="py-2.5 px-3">Assigned Partner</th>
                <th className="py-2.5 px-3">Current Logistics Stage</th>
                <th className="py-2.5 px-3">Security Passcode Status</th>
                <th className="py-2.5 px-3 text-right">Action Needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingOtpOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{ord.buyerName}</div>
                    <div className="text-[11px] text-slate-500">{ord.buyerCity}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {ord.deliveryPartnerName || ord.pickupPartnerName || 'Assigned Logistics Fleet'}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={ord.orderStatus} size="sm" />
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Issued to Customer ({ord.otpAttemptsRemaining} attempts left)</span>
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500 italic text-[11px]">
                    Delivery partner will enter OTP at doorstep
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
