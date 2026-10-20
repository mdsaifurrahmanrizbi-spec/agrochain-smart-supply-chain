import React, { useState } from 'react';
import { store } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  CreditCard,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  Clock,
  Percent,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';

export const FarmerPayments: React.FC = () => {
  const { user } = useAuth();
  const farmerId = user?.id || 'u-farmer-1';
  const settlements = store.settlements.filter((s) => s.farmerId === farmerId);

  // Totals
  const totalGrossSales = settlements.reduce(
    (sum, s) => sum + (s.productSalesValue || (s.amount ? s.amount * 1.1 : 0)),
    0
  );
  const totalCommission = settlements.reduce(
    (sum, s) => sum + (s.commissionDeducted || Math.round((s.productSalesValue || (s.amount ? s.amount * 1.1 : 0)) * 0.1)),
    0
  );
  const totalNetEarnings = settlements.reduce(
    (sum, s) => sum + (s.netPayout || s.amount || 0),
    0
  );

  const completedPayouts = settlements
    .filter((s) => s.settlementStatus === 'PAID' || s.settlementStatus === 'COMPLETED')
    .reduce((sum, s) => sum + (s.netPayout || s.amount || 0), 0);

  const pendingPayouts = settlements
    .filter((s) => s.settlementStatus !== 'PAID' && s.settlementStatus !== 'COMPLETED')
    .reduce((sum, s) => sum + (s.netPayout || s.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Seller Payments & Commission Ledger</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review transparent financial settlements, automated 10% platform commission deductions, and direct mobile banking payouts.
        </p>
      </div>

      {/* UPDATE 5: Transparent Commission & Fee Policy Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">AgroChain 10% Platform Commission Policy:</span>
          <p className="text-emerald-800/90 leading-relaxed">
            AgroChain charges an automated <strong>10% platform commission</strong> on product sales value.
            <strong> Formula:</strong> Commission = Product Sales Value × 10% · Seller Net Earnings = Product Sales Value - Commission.
            <strong> Delivery charges are paid by the customer and belong entirely to logistics partners</strong> — they are strictly excluded
            from your seller sales value and commission calculations.
          </p>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
            Gross Produce Sales
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            ৳{totalGrossSales.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total farm harvest sold</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
            Platform Commission (10%)
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
            ৳{totalCommission.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-800 font-medium mt-1">10% marketplace fee deducted</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
            Net Disbursed to Farmer
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            ৳{completedPayouts.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Paid to bKash 01819-345678</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
            Pending / In Settlement
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1 tabular-nums">
            ৳{pendingPayouts.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">In settlement cycle or awaiting COD deposit</div>
        </div>
      </div>

      {/* Settlement Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Settlement Ledger & Payout Breakdown</h2>
            <p className="text-xs text-slate-500">
              Each row displays Gross Sales, 10% AgroChain Commission, and your Net Payout.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {settlements.length} settlement records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Settlement ID</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Products Delivered</th>
                <th className="py-3 px-4">Gross Sales Value</th>
                <th className="py-3 px-4">Commission (10%)</th>
                <th className="py-3 px-4">Net Seller Payout</th>
                <th className="py-3 px-4">Delivery Fee (Excluded)</th>
                <th className="py-3 px-4">Disbursement Method</th>
                <th className="py-3 px-4">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settlements.map((s) => {
                const gross = s.productSalesValue || (s.amount ? s.amount * 1.1 : 0);
                const comm = s.commissionDeducted || Math.round(gross * 0.1);
                const net = s.netPayout || s.amount || 0;
                const dFee = s.deliveryFee || 420;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.id}</td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-semibold">{s.orderNumber}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate">{s.productSummary}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                      ৳{gross.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-amber-700 tabular-nums">
                      -৳{comm.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700 tabular-nums text-sm">
                      ৳{net.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500 tabular-nums">
                      <div>৳{dFee}</div>
                      <span className="text-[10px] text-slate-400">Logistics</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{s.paymentMethod}</span>
                      {s.payoutDate && (
                        <span className="block text-[10px] text-slate-400 font-mono">{s.payoutDate}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={s.settlementStatus} size="sm" />
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
