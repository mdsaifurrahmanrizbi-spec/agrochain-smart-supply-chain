import React from 'react';
import { store } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DollarSign, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export const DeliveryCOD: React.FC = () => {
  const { user } = useAuth();
  const partnerId = user?.id === 'u-delivery-1' ? 'dp-1' : 'dp-1';
  const codRecords = store.codRecords.filter((c) => c.deliveryPartnerId === partnerId);

  const totalCollected = codRecords.reduce((sum, c) => sum + c.amount, 0);
  const pendingDeposit = codRecords
    .filter((c) => c.depositStatus !== 'CASH_DEPOSIT_VERIFIED')
    .reduce((sum, c) => sum + c.amount, 0);
  const verifiedDeposit = codRecords
    .filter((c) => c.depositStatus === 'CASH_DEPOSIT_VERIFIED')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Cash on Delivery (COD) Collections</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor cash collected from buyers and verified cash deposits at the regional godown desk.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">COD Reconciliation Rule:</span>
          <p className="text-amber-800/90 mt-0.5 leading-relaxed">
            All cash collected during customer doorstep dropoffs must be physically deposited at the Tejgaon or Central
            Gazipur Godown desk. The supervisor verifies the cash receipt before the system marks the deposit verified and unlocks seller payout.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium uppercase">Total Cash Collected</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            ৳{totalCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">From all delivered COD consignments</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium uppercase">Pending Godown Deposit</div>
          <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
            ৳{pendingDeposit.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-800 font-semibold mt-1">Hand over at Tejgaon desk today</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium uppercase">Verified & Audited</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            ৳{verifiedDeposit.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold mt-1">Reconciled with administration</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800">
          Cash Collection & Deposit Audit Ledger
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">COD Record ID</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Cash Amount (BDT)</th>
                <th className="py-3 px-4">Doorstep Collected At</th>
                <th className="py-3 px-4">Godown Verified By</th>
                <th className="py-3 px-4">Deposit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.id}</td>
                  <td className="py-3 px-4 font-mono text-emerald-800 font-semibold">{r.orderNumber}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">৳{r.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{r.collectedAt}</td>
                  <td className="py-3 px-4">{r.verifiedByAdmin || 'Pending Deposit'}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={r.depositStatus} size="sm" />
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
