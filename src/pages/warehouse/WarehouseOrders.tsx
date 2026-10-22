import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agroApi, store } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Search, ShieldCheck, Banknote } from 'lucide-react';

export const WarehouseOrders: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [cashFilter, setCashFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');
  const [, setRevision] = useState(0);

  // Warehouse staff intentionally receive COD orders only. Online orders are not rendered here.
  const [orders, setOrders] = useState(store.orders.filter((order) => order.paymentMethod === 'COD'));
  const [settlements, setSettlements] = useState(store.settlements);
  const [payoutAccounts, setPayoutAccounts] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    Promise.all([agroApi.getOrders(), agroApi.getSettlements()]).then(([loadedOrders, loadedSettlements]) => {
      if (!mounted) return;
      setOrders(loadedOrders.filter((order) => order.paymentMethod === 'COD'));
      setSettlements(loadedSettlements);
    }).catch((error) => console.warn('Could not refresh warehouse COD orders and payouts.', error));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const farmerIds = [...new Set(orders.flatMap((order) => order.items.map((item) => item.farmerId)))];
    agroApi.getFarmerPayoutAccounts(farmerIds).then((accounts) => {
      setPayoutAccounts(Object.fromEntries(accounts.map((account) => [
        account.farmerId,
        [account.payoutMethod, account.payoutBankName, account.payoutAccountNumber].filter(Boolean).join(' · ') || 'Not provided',
      ])));
    }).catch((error) => console.warn('Could not load authorized farmer payout accounts.', error));
  }, [orders]);

  const handleFarmerPayout = async (orderId: string) => {
    const settlement = settlements.find((item) => item.orderId === orderId);
    if (!settlement) {
      window.alert('Farmer payout record is not available yet. Refresh orders after delivery confirmation.');
      return;
    }
    const reference = window.prompt('After you have actually transferred the money to the farmer, enter the bank/bKash/Nagad transaction reference:');
    if (reference === null) return;
    try {
      await agroApi.releaseSellerSettlementPayout(settlement.id, reference);
      setSettlements([...store.settlements]);
      setRevision((value) => value + 1);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not record farmer payout.');
    }
  };

  const filtered = orders.filter((order) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [
      order.id,
      order.orderNumber,
      order.buyerName,
      order.buyerPhone,
      order.buyerCity,
      ...order.items.flatMap((item) => [item.productName, item.farmerName]),
    ].some((value) => String(value || '').toLowerCase().includes(query));
    const record = store.codRecords.find((item) => item.orderId === order.id);
    const verified = record?.depositStatus === 'CASH_DEPOSIT_VERIFIED';
    const matchesCash = cashFilter === 'ALL' ||
      (cashFilter === 'VERIFIED' && verified) ||
      (cashFilter === 'PENDING' && !verified);
    return matchesSearch && matchesCash;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">COD Orders & Cash Audit</h1>
        <p className="mt-1 text-xs text-slate-500">Warehouse Manager access is limited to Cash on Delivery orders. Online payment orders are not available in this workspace.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <Search className="ml-1 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order ID, customer, farmer, product, phone..." className="w-full bg-transparent text-xs text-slate-800 focus:outline-none" />
        </div>
        <select value={cashFilter} onChange={(event) => setCashFilter(event.target.value as typeof cashFilter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
          <option value="ALL">All COD cash statuses</option>
          <option value="PENDING">Cash audit pending</option>
          <option value="VERIFIED">Cash verified</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product / Farmer</th>
                <th className="px-4 py-3">Order Amount</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">COD Cash</th>
                <th className="px-4 py-3">Customer Payment</th>
                <th className="px-4 py-3">Farmer Payout</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((order) => {
                const record = store.codRecords.find((item) => item.orderId === order.id);
                const verified = record?.depositStatus === 'CASH_DEPOSIT_VERIFIED';
                const delivered = order.isDeliveryVerified && order.orderStatus === 'DELIVERED';
                return (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900">{order.orderNumber}</div>
                      <div className="text-[10px] text-slate-500">{order.createdAt}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{order.buyerName}</div>
                      <div className="text-[10px] text-slate-500">{order.buyerPhone} · {order.buyerCity}</div>
                    </td>
                    <td className="px-4 py-3">
                      {order.items.map((item) => <div key={item.productId} className="mb-1"><div className="font-semibold">{item.productName} × {item.quantity} {item.unit}</div><div className="text-[10px] text-slate-500">Farmer: {item.farmerName}</div><div className="text-[10px] text-slate-600">Payout account: {payoutAccounts[item.farmerId] || 'Loading / not provided'}</div></div>)}
                    </td>
                    <td className="px-4 py-3 font-bold tabular-nums">৳{order.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.orderStatus} size="sm" />{delivered && <span className="mt-1 block text-[10px] font-semibold text-emerald-700">OTP confirmed</span>}</td>
                    <td className="px-4 py-3">
                      <span className={verified ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>{verified ? 'CASH VERIFIED' : record ? 'CASH PENDING' : 'AWAITING COLLECTION'}</span>
                      {record && <span className="mt-1 block text-[10px] text-slate-500">৳{record.amount.toLocaleString()}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.paymentStatus} size="sm" />
                      {order.paymentStatus === 'PAID' && <span className="mt-1 block text-[10px] font-semibold text-emerald-700">Collected at delivery</span>}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const settlement = settlements.find((item) => item.orderId === order.id);
                        const paid = settlement && ['PAID', 'COMPLETED'].includes(settlement.settlementStatus);
                        return <><StatusBadge status={settlement?.settlementStatus || 'PENDING'} size="sm" />
                          {settlement?.payoutReference && <span className="mt-1 block text-[10px] text-slate-500">Ref: {settlement.payoutReference}</span>}
                          {paid && <span className="mt-1 block text-[10px] font-semibold text-emerald-700">Farmer payout successful</span>}
                        </>;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!verified && delivered && record ? <button onClick={() => navigate('/warehouse/verifications')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 font-bold text-white"><ShieldCheck className="h-3.5 w-3.5" /> Audit cash</button> :
                        verified && delivered && !['PAID', 'COMPLETED'].includes(store.settlements.find((item) => item.orderId === order.id)?.settlementStatus || 'PENDING') ?
                          <button onClick={() => void handleFarmerPayout(order.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 font-bold text-white"><Banknote className="h-3.5 w-3.5" /> Farmer payout success</button> :
                          ['PAID', 'COMPLETED'].includes(store.settlements.find((item) => item.orderId === order.id)?.settlementStatus || '') ?
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700"><Banknote className="h-3.5 w-3.5" /> Paid</span> :
                            <span className="text-[10px] text-slate-400">After delivery</span>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">No COD orders match this search/filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
