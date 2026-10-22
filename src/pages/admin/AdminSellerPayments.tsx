import React, { useState } from 'react';
import { store, agroApi } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Check,
  DollarSign,
  Percent,
  AlertCircle,
  PauseCircle,
  Send,
} from 'lucide-react';

export const AdminSellerPayments: React.FC = () => {
  const [settlements, setSettlements] = useState(store.settlements);
  const [notice, setNotice] = useState<string | null>(null);

  const totalGross = settlements.reduce(
    (sum, s) => sum + (s.productSalesValue || (s.amount ? s.amount * 1.1 : 0)),
    0
  );
  const totalCommission = settlements.reduce(
    (sum, s) => sum + (s.commissionDeducted || Math.round((s.productSalesValue || (s.amount ? s.amount * 1.1 : 0)) * 0.1)),
    0
  );
  const totalNetPayouts = settlements.reduce(
    (sum, s) => sum + (s.netPayout || s.amount || 0),
    0
  );

  const handleDisburse = async (id: string) => {
    const payoutReference = window.prompt(
      'After you have actually transferred the money, enter the bank/bKash/Nagad transaction reference to record the payout:'
    );
    if (payoutReference === null) return;

    try {
      await agroApi.releaseSellerSettlementPayout(id, payoutReference);
      setSettlements([...store.settlements]);
      setNotice(`Farmer payout recorded with transfer reference ${payoutReference.trim()}.`);
      setTimeout(() => setNotice(null), 4000);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not record farmer payout.');
      setTimeout(() => setNotice(null), 5000);
    }
  };

  const handleUpdateStatus = (id: string, status: any, reason?: string) => {
    const stl = store.settlements.find((s) => s.id === id);
    if (stl) {
      stl.settlementStatus = status;
      if (reason) stl.holdReason = reason;
      if (status === 'PAID') stl.payoutDate = new Date().toISOString().substring(0, 10);
      localStorage.setItem('agro_settlements', JSON.stringify(store.settlements));
      setSettlements([...store.settlements]);
      setNotice(`Settlement ${id} status set to: ${status}`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Seller Settlements & 10% Platform Commission</h1>
        <p className="text-xs text-slate-500 mt-1">
          Confirm farmer payouts only after delivery verification and, for COD, warehouse cash audit. Transfer funds manually first, then record the real transaction reference.
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
          <span className="font-bold">AgroChain 10% Platform Commission Architecture:</span>
          <p className="text-emerald-800/90 leading-relaxed">
            Platform Commission is calculated at strictly 10% of the <strong>Product Sales Value</strong>.
            Delivery charges are paid by the customer directly to the logistics pool and are strictly excluded from seller payouts.
            Settlement statuses: <strong>PENDING</strong> (awaiting COD deposit), <strong>PROCESSING</strong> (in payout batch), <strong>PAID</strong>, or <strong>ON_HOLD</strong>.
          </p>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
            Total Gross Product Sales
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            ৳{totalGross.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Aggregated marketplace sales value</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
            AgroChain 10% Revenue
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
            ৳{totalCommission.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-800 font-medium mt-1">Retained platform commission</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
            Total Net Farmer Payouts
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            ৳{totalNetPayouts.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Gross sales minus 10% commission</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Settlement ID</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Farmer / Producer</th>
                <th className="py-3 px-4">Gross Sales Value</th>
                <th className="py-3 px-4">10% Commission</th>
                <th className="py-3 px-4">Net Seller Payout</th>
                <th className="py-3 px-4">Delivery Fee (Logistics)</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status / Transfer Ref</th>
                <th className="py-3 px-4 text-right">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settlements.map((s) => {
                const gross = s.productSalesValue || (s.amount ? s.amount * 1.1 : 0);
                const comm = s.commissionDeducted || Math.round(gross * 0.1);
                const net = s.netPayout || s.amount || 0;
                const dFee = s.deliveryFee || 420;
                const isPaid = s.settlementStatus === 'PAID' || s.settlementStatus === 'COMPLETED';

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.id}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-800">{s.orderNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{s.farmerName}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">৳{gross.toLocaleString()}</td>
                    <td className="py-3 px-4 font-semibold text-amber-700 tabular-nums">-৳{comm.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700 tabular-nums text-sm">৳{net.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-500 tabular-nums">
                      <div>৳{dFee}</div>
                      <span className="text-[10px] text-slate-400">Logistics pool</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{s.paymentMethod}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={s.settlementStatus} size="sm" />
                      {s.payoutReference && <span className="block mt-1 text-[10px] text-slate-500 font-mono">Ref: {s.payoutReference}</span>}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      {!isPaid ? (
                        <>
                          <button
                            onClick={() => handleDisburse(s.id)}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                          >
                            Record successful payout
                          </button>
                          {s.settlementStatus !== 'ON_HOLD' && (
                            <button
                              onClick={() => handleUpdateStatus(s.id, 'ON_HOLD', 'Audit check pending')}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 text-xs"
                            >
                              Hold
                            </button>
                          )}
                          {s.settlementStatus === 'ON_HOLD' && (
                            <button
                              onClick={() => handleUpdateStatus(s.id, 'PROCESSING')}
                              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 text-xs"
                            >
                              Resume
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid {s.payoutDate || 'Completed'}</span>
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
    </div>
  );
};
