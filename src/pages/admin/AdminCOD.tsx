import React, { useEffect, useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DollarSign, ShieldCheck, Check } from 'lucide-react';

export const AdminCOD: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState(store.codRecords);
  const [notice, setNotice] = useState<string | null>(null);
  
  useEffect(() => {
    agroApi.getCODRecords().then((loaded) => setRecords(loaded))
      .catch((error) => console.warn('Could not refresh COD ledger.', error));
  }, []);

  const totalCollected = records.reduce((s, r) => s + r.amount, 0);
  const pendingDeposit = records.filter((r) => r.depositStatus !== 'CASH_DEPOSIT_VERIFIED').reduce((s, r) => s + r.amount, 0);
  const verifiedDeposit = records.filter((r) => r.depositStatus === 'CASH_DEPOSIT_VERIFIED').reduce((s, r) => s + r.amount, 0);

  const handleAuditDeposit = async (codId: string) => {
    const adminName = user?.name || 'Dr. Harun-ur-Rashid (Admin)';
    await agroApi.verifyCODDeposit(codId, adminName);
    setRecords([...store.codRecords]);
    setNotice(`Cash deposit verified and reconciled with treasury.`);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Cash on Delivery (COD) Management & Audits</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor physical cash collections by delivery partners and verify bank/treasury deposits.
        </p>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase">Gross COD Collected</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">৳{totalCollected.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Platform customer cash transactions</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase">Pending Treasury Deposit</span>
          <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">৳{pendingDeposit.toLocaleString()}</div>
          <div className="text-[11px] text-amber-800 font-semibold mt-1">Awaiting physical deposit</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase">Reconciled Deposits</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">৳{verifiedDeposit.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-800 font-semibold mt-1">Verified by system administrator</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800">
          COD Cash Ledger
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">COD Record ID</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Delivery Partner</th>
                <th className="py-3 px-4">Cash Amount</th>
                <th className="py-3 px-4">Collected Time</th>
                <th className="py-3 px-4">Deposit Status</th>
                <th className="py-3 px-4 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.id}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-800">{r.orderNumber}</td>
                  <td className="py-3 px-4">{r.deliveryPartnerName}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">৳{r.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{r.collectedAt}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={r.depositStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {r.depositStatus !== 'CASH_DEPOSIT_VERIFIED' ? (
                      <button
                        onClick={() => handleAuditDeposit(r.id)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        Verify Cash Deposit
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-mono">
                        Audited by {r.verifiedByAdmin?.split(' ')[0] || 'Admin'}
                      </span>
                    )}
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
