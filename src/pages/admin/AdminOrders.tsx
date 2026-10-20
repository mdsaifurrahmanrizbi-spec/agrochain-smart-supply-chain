import React, { useState } from 'react';
import { store } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShoppingBag, Search, Eye, Truck, KeyRound, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminOrders: React.FC = () => {
  const [orders] = useState(store.orders);
  const [search, setSearch] = useState('');

  const filtered = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      o.buyerCity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">National Orders, Freight & Commission Ledger</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor consignments with automated delivery fees, 10% seller commissions, and customer OTP delivery verifications.
        </p>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Filter by consignment order number, customer name, or district..."
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
                <th className="py-3 px-4">Produce Subtotal</th>
                <th className="py-3 px-4">Delivery Fee</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Commission (10%)</th>
                <th className="py-3 px-4">Seller Net</th>
                <th className="py-3 px-4">Payment & OTP</th>
                <th className="py-3 px-4">Logistics Status</th>
                <th className="py-3 px-4 text-right">OTP Verification</th>
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
                      <span className="font-medium text-slate-800">{ord.paymentMethod}</span>
                      <span className="text-[10px] font-mono text-slate-500 block">
                        OTP: <strong className="text-slate-800">{ord.deliveryOtp}</strong>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={ord.orderStatus} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ord.isDeliveryVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <KeyRound className="w-3 h-3 text-emerald-600" />
                          <span>OTP Confirmed</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Pending OTP</span>
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
