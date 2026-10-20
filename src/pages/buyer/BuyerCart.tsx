import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Scale,
  MapPin,
} from 'lucide-react';

export const BuyerCart: React.FC = () => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    deliveryZone,
    setDeliveryZone,
    deliveryFee,
    deliveryFeeDetails,
    totalWeightKg,
    total,
  } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 max-w-2xl mx-auto shadow-2xs">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-900">Your Agricultural Cart is Empty</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Explore single-origin grains, freshly picked vegetables, and seasonal orchard fruits directly from Bangladeshi growers.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
        >
          <span>Explore Agricultural Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Shopping Cart</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your farm-direct produce selections with automated logistics freight calculation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Items List */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{product.name}</h3>
                  <p className="text-xs text-slate-500">
                    Farm: <strong className="text-slate-700 font-medium">{product.farmName}</strong> ({product.farmLocation})
                  </p>
                  <p className="text-xs font-semibold text-slate-900 mt-1">
                    ৳{product.pricePerUnit} <span className="text-slate-500 font-normal">/ {product.unit}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6">
                {/* Quantity Controls */}
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="p-1.5 text-slate-600 hover:bg-slate-200 transition-colors"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="p-1.5 text-slate-600 hover:bg-slate-200 transition-colors"
                    title="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    ৳{(product.pricePerUnit * quantity).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => removeFromCart(product.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* UPDATE 4: Order Summary & Automated Delivery Charges */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-[11px] font-normal text-slate-500 font-mono">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </h2>

            {/* Delivery Destination Zone Selector */}
            <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Select Delivery Destination Zone:</span>
              </label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeliveryZone('INSIDE_DHAKA')}
                  className={`py-2 px-2.5 rounded-lg text-center font-bold text-[11px] border transition-all ${
                    deliveryZone === 'INSIDE_DHAKA'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Inside Dhaka
                  <span className="block text-[10px] font-normal opacity-90">Base ৳70</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryZone('OUTSIDE_DHAKA')}
                  className={`py-2 px-2.5 rounded-lg text-center font-bold text-[11px] border transition-all ${
                    deliveryZone === 'OUTSIDE_DHAKA'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Outside Dhaka
                  <span className="block text-[10px] font-normal opacity-90">Base ৳130</span>
                </button>
              </div>
            </div>

            {/* Weight and Freight Calculation Breakdown */}
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Produce Subtotal</span>
                <span className="font-bold text-slate-900 tabular-nums">৳{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="flex items-center gap-1 text-slate-500">
                  <Scale className="w-3 h-3 text-slate-400" />
                  <span>Total Shipment Weight:</span>
                </span>
                <span className="font-mono font-semibold text-slate-800">{totalWeightKg} kg</span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="block text-slate-700 font-medium">Delivery Charge</span>
                  <span className="text-[10px] text-slate-400">
                    Base ৳{deliveryFeeDetails.baseFee} {totalWeightKg > 0.5 ? `+ (৳10 × ${totalWeightKg}kg)` : '(<= 0.5kg)'}
                  </span>
                </div>
                <span className="font-bold text-emerald-800 tabular-nums">৳{deliveryFee}</span>
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-100 text-sm font-bold text-slate-900">
                <span>Customer Grand Total</span>
                <span className="text-emerald-700 tabular-nums text-base">৳{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Independent delivery fleet · Guaranteed farm-gate price</span>
            </div>

            <button
              onClick={() => navigate('/buyer/checkout')}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
