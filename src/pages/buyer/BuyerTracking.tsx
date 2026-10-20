import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { store } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TrackingTimeline } from '../../components/common/TrackingTimeline';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Lock,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const BuyerTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const buyerId = user?.id || 'u-buyer-1';
  const myOrders = store.orders.filter((o) => o.buyerId === buyerId);

  // Match order by id, orderNumber, or default to first
  const order =
    store.orders.find((o) => o.id === id || o.orderNumber === id) ||
    myOrders[0] ||
    store.orders[0];

  const events = store.trackingEvents[order?.id] || [];

  // Check if current user is the owner of this order (or demo viewing customer panel)
  const isCorrectCustomer = user?.role === 'buyer' || user?.role === 'admin' || !user;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/buyer/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </Link>
        <span className="font-mono text-xs text-slate-500">
          Order Reference: <strong className="text-slate-900">{order.orderNumber}</strong>
        </span>
      </div>

      {/* UPDATE 1: Customer Delivery OTP Card */}
      {isCorrectCustomer && (
        <div className="bg-gradient-to-r from-emerald-900 to-[#064E3B] text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Doorstep Delivery Passcode</span>
              </div>
              <h2 className="text-lg font-bold">Your Delivery Confirmation OTP</h2>
              <p className="text-xs text-emerald-100/90 max-w-lg leading-relaxed">
                <strong className="text-white">Share this code only when receiving your product.</strong>{' '}
                When our delivery partner arrives at your address, inspect the sacks/crates and provide this 4-digit code.
                The partner enters it into their mobile terminal to confirm delivery.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center min-w-[180px] shrink-0">
              <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold block mb-1">
                {order.isDeliveryVerified ? 'Status: VERIFIED' : 'Active Passcode'}
              </span>

              {order.isDeliveryVerified ? (
                <div className="space-y-1">
                  <div className="font-mono text-2xl font-black text-emerald-300 tracking-widest">
                    {order.deliveryOtp}
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] text-emerald-200 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Delivered & Verified</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="font-mono text-3xl font-black text-white tracking-widest bg-emerald-950/60 py-1.5 px-3 rounded-lg border border-emerald-400/40">
                    {order.deliveryOtp}
                  </div>
                  <div className="text-[10px] text-emerald-200 mt-1">
                    {order.otpAttemptsRemaining} verification attempts remaining
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shipment Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">Consignment #{order.orderNumber}</h1>
              <StatusBadge status={order.orderStatus} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ordered on {order.createdAt} · Payment Mode:{' '}
              <strong className="text-slate-800">{order.paymentMethod}</strong> (
              <span className="text-emerald-700 font-semibold">{order.paymentStatus}</span>)
            </p>
          </div>

          <div className="text-xs text-slate-600 sm:text-right">
            <span className="text-[11px] text-slate-400 block">Delivery Destination</span>
            <strong className="text-slate-900">{order.buyerAddress}, {order.buyerCity}</strong>
          </div>
        </div>

        {/* Items List */}
        <div className="flex flex-wrap gap-2 text-xs">
          {order.items.map((it) => (
            <div
              key={it.productId}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200"
            >
              <Package className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-medium text-slate-800">{it.productName}</span>
              <span className="text-slate-500">
                ({it.quantity} {it.unit} · ৳{it.unitPrice * it.quantity})
              </span>
            </div>
          ))}
        </div>

        {/* UPDATE 4: Financial Summary with Automated Delivery Charges */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Produce Subtotal</span>
            <span className="font-bold text-slate-900 text-sm tabular-nums">৳{order.productSubtotal.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 block text-[11px]">
              Delivery Fee ({order.totalWeightKg || 35}kg)
            </span>
            <span className="font-bold text-emerald-800 text-sm tabular-nums">৳{order.deliveryFee.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Freight Zone</span>
            <span className="font-semibold text-slate-800">
              {order.buyerCity?.toLowerCase().includes('dhaka') ? 'Inside Dhaka (৳70 Base)' : 'Outside Dhaka (৳130 Base)'}
            </span>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
            <span className="text-emerald-700 block text-[11px] font-semibold">Grand Total Paid</span>
            <span className="font-bold text-emerald-900 text-sm tabular-nums">৳{order.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* The Reusable Tracking Timeline Component */}
      <TrackingTimeline events={events} orderNumber={order.orderNumber} />
    </div>
  );
};
