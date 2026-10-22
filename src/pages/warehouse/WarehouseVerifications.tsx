import React, { useEffect, useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Check,
  AlertCircle,
  KeyRound,
  Lock,
  Clock,
} from 'lucide-react';

export const WarehouseVerifications: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState(store.orders);
  const [codRecords, setCodRecords] = useState(store.codRecords);
  const [notice, setNotice] = useState<string | null>(null);
  
  useEffect(() => {
    Promise.all([agroApi.getOrders(), agroApi.getCODRecords()]).then(([loadedOrders, loadedCod]) => {
      setOrders(loadedOrders.filter((order) => order.paymentMethod === 'COD'));
      setCodRecords(loadedCod);
    }).catch((error) => console.warn('Could not refresh warehouse COD verification data.', error));
  }, []);

  const otpVerifiedOrders = orders.filter((o) => o.isDeliveryVerified);
  const pendingCodDeposits = codRecords.filter(
    (c) => c.depositStatus !== 'CASH_DEPOSIT_VERIFIED'
  );

  const handleVerifyCod = async (codId: string) => {
    const officerName = user?.name || 'Anisul Haque (Warehouse Manager)';
    await agroApi.verifyCODDeposit(codId, officerName);
    setCodRecords([...store.codRecords]);
    setNotice(`Cash on delivery deposit of partner physically audited and marked verified in vault.`);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Delivery OTP & COD Cash Audit Desk</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor automated OTP delivery confirmations and audit physical COD currency deposits collected by delivery partners.
        </p>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Modern Protocol Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">AgroChain Delivery Confirmation Protocol:</span>
          <p className="text-emerald-800/90 leading-relaxed">
            Customer deliveries are automatically verified and confirmed upon delivery partner entry of the customer's secret OTP.
            Warehouse officers do not need to manually approve deliveries. For COD orders, warehouse managers audit physical cash handover from the delivery partner into the godown vault before final financial settlement.
          </p>
        </div>
      </div>

      {/* 1. Pending COD Cash Deposit Audits */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-700" />
              <span>COD Cash Deposits Pending Warehouse Audit ({pendingCodDeposits.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Audit cash collected by delivery partners and accept into the central warehouse safe.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Vault Audit Required
          </span>
        </div>

        {pendingCodDeposits.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">All collected COD cash has been audited and deposited.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Deposit ID</th>
                  <th className="py-2.5 px-3">Order Ref</th>
                  <th className="py-2.5 px-3">Delivery Partner</th>
                  <th className="py-2.5 px-3">Collected Amount</th>
                  <th className="py-2.5 px-3">Collection Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingCodDeposits.map((cod) => (
                  <tr key={cod.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{cod.id}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-emerald-800">{cod.orderNumber}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{cod.deliveryPartnerName}</td>
                    <td className="py-3 px-3 font-bold text-amber-900 text-sm tabular-nums">
                      ৳{cod.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{cod.collectedAt}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {cod.depositStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleVerifyCod(cod.id)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                      >
                        Accept into Vault
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Automated OTP Delivery Confirmations Log */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-700" />
              <span>Automated OTP Delivery Confirmations ({otpVerifiedOrders.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Deliveries automatically verified by customer OTP upon doorstep arrival.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Auto-Confirmed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Order Ref</th>
                <th className="py-2.5 px-3">Customer Destination</th>
                <th className="py-2.5 px-3">Produce Consignment</th>
                <th className="py-2.5 px-3">Delivery Partner</th>
                <th className="py-2.5 px-3">Verified Delivery OTP</th>
                <th className="py-2.5 px-3">Confirmed At</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {otpVerifiedOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{ord.buyerName}</div>
                    <div className="text-[11px] text-slate-500">{ord.buyerCity}</div>
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
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>DELIVERED (Auto)</span>
                    </span>
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
