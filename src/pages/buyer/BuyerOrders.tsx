import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { store } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShoppingBag, Truck, Eye, ArrowRight } from 'lucide-react';

export const BuyerOrders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const buyerId = user?.id || 'u-buyer-1';
  const myOrders = store.orders.filter((o) => o.buyerId === buyerId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Your Order History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track consignments, review produce items, and check delivery verification.
          </p>
        </div>

        <Link
          to="/buyer/products"
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
        >
          <span>Order Fresh Harvest</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Order Items</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Logistics Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                  <td className="py-3 px-4">
                    {ord.items.map((i) => (
                      <div key={i.productId} className="font-medium text-slate-900">
                        {i.quantity} {i.unit} · {i.productName}
                      </div>
                    ))}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{ord.createdAt}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{ord.paymentMethod}</span>
                    <span className="text-[10px] block text-slate-500">{ord.paymentStatus}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">৳{ord.totalAmount.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={ord.orderStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate(`/buyer/tracking/${ord.id}`)}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 inline-flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track</span>
                    </button>
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
