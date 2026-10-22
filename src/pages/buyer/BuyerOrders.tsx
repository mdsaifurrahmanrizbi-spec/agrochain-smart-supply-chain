import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { agroApi, store } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Truck, ArrowRight, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const BuyerOrders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const buyerId = user?.id || 'u-buyer-1';
  const myOrders = store.orders.filter((o) => o.buyerId === buyerId);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; orderNumber: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');
  const [, setRefresh] = useState(0);

  const pickupStartedStatuses = ['PICKED_UP', 'IN_TRANSIT', 'IN_TRANSIT_CENTRAL', 'WAREHOUSE_RECEIVED', 'IN_WAREHOUSE', 'GODOWN_ASSIGNED', 'GODOWN_TRANSFER_IN_TRANSIT', 'ARRIVED_LOCAL_GODOWN', 'GODOWN_RECEIVED', 'ARRIVED_REGIONAL_GODOWN', 'DELIVERY_PARTNER_ASSIGNED', 'DELIVERY_ASSIGNMENT_PENDING', 'MANUAL_ROUTING_REQUIRED', 'DELIVERY_ACCEPTED', 'DELIVERY_PARTNER_COLLECTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
  const canCancelOrder = (order: (typeof myOrders)[number]) =>
    !pickupStartedStatuses.includes(String(order.orderStatus).toUpperCase()) &&
    !order.partnerCollectedAt && !order.handoverInitiatedAt && !order.outForDeliveryAt && !order.isDeliveryVerified;

  const confirmCancelOrder = async () => {
    if (!cancelTarget || cancelling) return;
    setCancelling(true); setCancelError(''); setCancelSuccess('');
    try {
      await agroApi.cancelOrder(cancelTarget.id);
      setCancelSuccess(`Order ${cancelTarget.orderNumber} cancelled successfully.`);
      setCancelTarget(null); setRefresh((value) => value + 1);
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : 'Could not cancel this order. Please try again.');
    } finally { setCancelling(false); }
  };

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
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button onClick={() => navigate(`/buyer/tracking/${ord.id}`)} className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 inline-flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" /> <span>Track</span>
                      </button>
                      {canCancelOrder(ord) ? (
                        <button onClick={() => { setCancelError(""); setCancelTarget({ id: ord.id, orderNumber: ord.orderNumber }); }} className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 inline-flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> <span>Cancel Order</span>
                        </button>
                      ) : ord.orderStatus === "CANCELLED" ? (
                        <span className="px-2.5 py-1 text-xs font-semibold text-slate-500 bg-slate-100 rounded border border-slate-200">Cancelled</span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-medium text-slate-500 bg-slate-50 rounded border border-slate-200">Cancel unavailable after pickup</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      {cancelSuccess && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> {cancelSuccess}</div>}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-order-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle className="h-6 w-6" /></div>
            <h2 id="cancel-order-title" className="text-lg font-bold text-slate-900 text-center">Cancel this order?</h2>
            <p className="mt-2 text-sm text-slate-600 text-center">Are you sure you want to cancel <strong>{cancelTarget.orderNumber}</strong>? You can cancel only before the order is picked up. Once pickup starts, cancellation is blocked.</p>
            {cancelError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{cancelError}</p>}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <button type="button" disabled={cancelling} onClick={() => { setCancelTarget(null); setCancelError(''); }} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Keep Order</button>
              <button type="button" disabled={cancelling} onClick={confirmCancelOrder} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{cancelling ? 'Cancelling…' : 'Yes, Cancel Order'}</button>
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500 flex items-start gap-2"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" /> Orders can be cancelled only before pickup. After pickup, the cancellation option is removed and the server blocks cancellation.</p>
      </div>
    </div>
  );
};
