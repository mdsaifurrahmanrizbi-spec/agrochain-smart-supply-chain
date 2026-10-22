import React, { useEffect, useState } from 'react';
import { agroApi, store } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminOrders: React.FC = () => {
  const [orders] = useState(store.orders);
  const [payoutAccounts, setPayoutAccounts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    const farmerIds = [...new Set(orders.flatMap((order) => order.items.map((item) => item.farmerId)))];
    agroApi.getFarmerPayoutAccounts(farmerIds).then((accounts) => {
      setPayoutAccounts(Object.fromEntries(accounts.map((account) => [
        account.farmerId,
        [account.payoutMethod, account.payoutBankName, account.payoutAccountNumber].filter(Boolean).join(' · ') || 'Not provided',
      ])));
    }).catch((error) => console.warn('Could not load authorized farmer payout accounts.', error));
  }, [orders]);
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'COD' | 'ONLINE' | 'PENDING' | 'PAID'>('ALL');
  const [view, setView] = useState<'ACTIVE' | 'SUCCESSFUL'>('ACTIVE');

  const filtered = orders.filter((o) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [
      o.id, o.orderNumber, o.buyerName, o.buyerPhone, o.buyerCity,
      ...o.items.flatMap((item) => [item.productName, item.farmerName, item.farmerId]),
    ].some((value) => String(value || '').toLowerCase().includes(query));
    const matchesPayment = paymentFilter === 'ALL' ||
      (paymentFilter === 'COD' && o.paymentMethod === 'COD') ||
      (paymentFilter === 'ONLINE' && o.paymentMethod === 'ONLINE') ||
      (paymentFilter === 'PENDING' && o.paymentStatus === 'PENDING') ||
      (paymentFilter === 'PAID' && o.paymentStatus === 'PAID');
    const settlements = store.settlements.filter((settlement) => settlement.orderId === o.id || settlement.orderNumber === o.orderNumber);
    const successful = settlements.length > 0 && settlements.every((settlement) => ['PAID', 'COMPLETED'].includes(settlement.settlementStatus));
    return matchesSearch && matchesPayment && (view === 'SUCCESSFUL' ? successful : !successful);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">National Orders, Freight & Commission Ledger</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor consignments with automated delivery fees, 10% seller commissions, and customer OTP delivery verifications.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="bg-white p-1 rounded-xl border border-slate-200 flex gap-1">
          <button onClick={() => setView('ACTIVE')} className={`px-3 py-2 rounded-lg text-xs font-bold ${view === 'ACTIVE' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Active Orders</button>
          <button onClick={() => setView('SUCCESSFUL')} className={`px-3 py-2 rounded-lg text-xs font-bold ${view === 'SUCCESSFUL' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Successful Orders</button>
        </div>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as typeof paymentFilter)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700">
          <option value="ALL">All payment methods/statuses</option><option value="COD">COD</option><option value="ONLINE">RupantorPay Online</option><option value="PENDING">Payment Pending / Unpaid</option><option value="PAID">Customer Payment Paid</option>
        </select>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search order ID, customer, farmer, product, phone, or district..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-hidden text-slate-800"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer & City</th>
                <th className="py-3 px-4">Product / Farmer</th>
                <th className="py-3 px-4">Produce Subtotal</th>
                <th className="py-3 px-4">Delivery Fee</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Commission (10%)</th>
                <th className="py-3 px-4">Seller Net</th>
                <th className="py-3 px-4">Payment Method / Status</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4 text-right">Payout Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((ord) => {
                const isDhaka = ord.buyerCity.toLowerCase().includes('dhaka');
                const gross = ord.productSubtotal;
                const comm = ord.platformCommission || Math.round(gross * 0.1);
                const net = ord.sellerNetEarnings || gross - comm;

                return (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div>{ord.orderNumber}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{ord.createdAt}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{ord.buyerName}</div>
                      <div className="text-[11px] text-slate-500">
                        {ord.buyerCity} · {isDhaka ? 'Dhaka Hub' : 'Regional'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {ord.items.map((item) => <div key={`${ord.id}-${item.productId}`} className="mb-1"><div className="font-semibold text-slate-900">{item.productName} × {item.quantity} {item.unit}</div><div className="text-[10px] text-slate-500">Farmer: {item.farmerName}</div><div className="text-[10px] text-slate-600">Payout account: {payoutAccounts[item.farmerId] || 'Loading / not provided'}</div></div>)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                      ৳{gross.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-700 tabular-nums">
                      <span className="font-semibold text-emerald-800">৳{ord.deliveryFee}</span>
                      <span className="block text-[10px] text-slate-400">{ord.totalWeightKg || 35}kg</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 tabular-nums text-sm">
                      ৳{ord.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-amber-700 tabular-nums">
                      ৳{comm.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700 tabular-nums">
                      ৳{net.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{ord.paymentMethod === 'ONLINE' ? 'RupantorPay Online' : 'Cash on Delivery'}</span>
                      <span className={`block mt-1 text-[10px] font-bold ${ord.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>{ord.paymentStatus === 'PAID' ? 'Customer payment: PAID' : 'Customer payment: UNPAID'}</span>
                      {ord.transactionId && <span className="block text-[10px] font-mono text-slate-500">Txn: {ord.transactionId}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={ord.orderStatus} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ord.isDeliveryVerified && ord.orderStatus === 'DELIVERED' ? (
                        <Link to="/admin/seller-payments" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> Manage farmer payout
                        </Link>
                      ) : <span className="text-slate-400 text-[11px]">Available after delivery</span>}
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
