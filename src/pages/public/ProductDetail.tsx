import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { store } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Calendar,
  Layers,
  QrCode,
  Check,
  ShoppingCart,
  Truck,
  Sprout,
  Award,
} from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [showQrModal, setShowQrModal] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  const product = store.products.find((p) => p.id === id) || store.products[0];
  const batch = store.batches.find((b) => b.id === product.batchId) || store.batches[0];
  const farm = store.farms.find((f) => f.id === batch.farmId) || store.farms[0];
  const qc = store.qualityChecks.find((q) => q.batchId === batch.id) || store.qualityChecks[0];

  const handleAdd = () => {
    addToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Agricultural Marketplace</span>
          </button>

          <span className="text-xs font-mono text-slate-500">
            Batch Code: <strong className="text-slate-800">{batch.batchCode}</strong>
          </span>
        </div>

        {/* Success toast */}
        {addedNotice && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Added {quantity} {product.unit} to your shopping cart.</span>
            </div>
            <Link to="/buyer/cart" className="text-emerald-900 underline font-bold">
              View Cart & Checkout
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Visual Media & QR Proof */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-80 object-cover"
              />
            </div>

            {/* Batch QR Code Verification Box */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Crop Batch QR Certificate</h4>
                  <p className="text-[11px] text-slate-500">Cryptographically verifiable on supply chain ledger</p>
                </div>
              </div>

              <button
                onClick={() => setShowQrModal(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Inspect QR
              </button>
            </div>

            {/* Farm Verification Box */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">Farm Origin Profile</span>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                  Verified Producer
                </span>
              </div>
              <div className="space-y-1.5 text-slate-600">
                <p>Farm Name: <strong className="text-slate-900">{farm.name}</strong></p>
                <p>Location: <strong className="text-slate-900">{farm.upazila}, {farm.district}, {farm.division}</strong></p>
                <p>Soil Type: <strong className="text-slate-900">{farm.soilType}</strong></p>
                <p>GPS Coordinates: <span className="font-mono text-slate-700">{farm.gpsCoordinates || '24.9602° N, 89.3243° E'}</span></p>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Specs & Add to Cart */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={product.qualityStatus} />
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-500 font-medium">{product.category}</span>
                  {product.isOrganic && (
                    <>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-emerald-700 font-semibold">Certified Organic</span>
                    </>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Variety: <strong className="text-slate-800">{product.variety}</strong> · Grown by <strong className="text-slate-800">{product.farmerName}</strong>
                </p>
              </div>

              {/* Price Callout */}
              <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Farm-Direct Price
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    ৳{product.pricePerUnit}
                    <span className="text-sm font-normal text-slate-600"> / {product.unit}</span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="text-slate-500">Available Fresh Stock</div>
                  <div className="text-base font-bold text-slate-800 tabular-nums">
                    {product.availableQuantity} {product.unit}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Product Details & Harvest Quality
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Quality Lab Results Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between">
                  <span>Official Agronomy Quality Inspection</span>
                  <Award className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="divide-y divide-slate-100 p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">QC Certification Code:</span>
                    <span className="font-mono font-bold text-slate-800">{qc.certificateNumber || 'QC-CERT-2026-9912'}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Quality Classification:</span>
                    <strong className="text-emerald-700">{qc.grade}</strong>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Moisture Content:</span>
                    <span className="font-mono text-slate-800">{qc.moistureContentPercent}%</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Pesticide Residue:</span>
                    <span className="font-mono text-slate-800">{qc.pesticideResiduePpm} ppm (Safe Threshold &lt;0.05)</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Inspector Remarks:</span>
                    <span className="text-slate-700 italic">{qc.remarks}</span>
                  </div>
                </div>
              </div>

              {/* Purchase Actions */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 font-bold text-slate-900 text-sm tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.availableQuantity, quantity + 1))}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold text-sm"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="text-xs text-slate-500">Subtotal</div>
                    <div className="text-lg font-bold text-slate-900 tabular-nums">
                      ৳{(product.pricePerUnit * quantity).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleAdd}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Shopping Cart</span>
                  </button>

                  <button
                    onClick={() => {
                      addToCart(product, quantity);
                      navigate('/buyer/checkout');
                    }}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Inspection Modal */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Crop Batch Ledger Certificate</h3>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                <div className="w-32 h-32 mx-auto bg-white p-3 rounded-lg border border-slate-300 shadow-xs flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-emerald-950" />
                </div>
                <div className="text-xs font-mono font-bold text-slate-900">{batch.batchCode}</div>
                <p className="text-[11px] text-slate-500">
                  Scan to verify harvest timestamp, grower GPS location, and agronomist moisture certificates.
                </p>
              </div>

              <div className="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-lg font-mono">
                <div className="text-[10px] uppercase text-slate-400">Blockchain Hash</div>
                <div className="truncate text-emerald-800">{batch.blockchainHash}</div>
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold"
              >
                Close Certificate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
