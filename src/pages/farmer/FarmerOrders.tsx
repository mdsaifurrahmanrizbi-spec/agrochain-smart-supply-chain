import React, { useState } from 'react';
import { store } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShoppingBag, Eye, Truck, MapPin, ShieldCheck, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FarmerOrders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const farmerId = user?.id || 'u-farmer-1';
  const myOrders = store.orders.filter((o) =>
    o.items.some((item) => item.farmerId === farmerId)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Customer Orders & Earnings Breakdown</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor incoming customer orders, farm pickup logistics, and net earnings after the automated 10% platform commission.
        </p>
      </div>

      {/* 10% Commission Guidance */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>10% Platform Commission:</strong> Deducted exclusively from product sales value. Customer delivery fees go 100% to logistics.
          </span>
        </div>
        <span className="font-bold text-emerald-800 shrink-0 hidden sm:inline">
          Seller Net = Gross Sales - 10%
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Items Ordered</th>
                <th className="py-3 px-4">Buyer Destination</th>
                <th className="py-3 px-4">Gross Sales</th>
                <th className="py-3 px-4">Commission (10%)</th>
                <th className="py-3 px-4">Seller Net Earnings</th>
                <th className="py-3 px-4">Farm QC</th>
                <th className="py-3 px-4">Logistics Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myOrders.map((ord) => {
                const gross = ord.productSubtotal;
                const comm = ord.platformCommission || Math.round(gross * 0.1);
                const net = ord.sellerNetEarnings || gross - comm;

                return (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                    <td className="py-3 px-4">
                      {ord.items.map((i) => (
                        <div key={i.productId} className="font-medium text-slate-900">
                          {i.quantity} {i.unit} · {i.productName}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{ord.buyerName}</div>
                      <div className="text-[11px] text-slate-500">{ord.buyerCity}</div>
                    </td>
                    <td className="py-3 px-4 font-bold tabular-nums text-slate-900">
                      ৳{gross.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold tabular-nums text-amber-700">
                      -৳{comm.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold tabular-nums text-emerald-700 text-sm">
                      ৳{net.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={ord.qualityStatus || 'PENDING'} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={ord.orderStatus} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate('/farmer/tracking')}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 inline-flex items-center gap-1 shadow-2xs transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track</span>
                      </button>
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
