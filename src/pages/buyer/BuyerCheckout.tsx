import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { agroApi } from '../../services/api';
import { calculateDeliveryFee, generateDeliveryOtp } from '../../utils/deliveryFee';
import {
  Truck,
  CreditCard,
  DollarSign,
  ArrowRight,
  Scale,
  MapPin,
  KeyRound,
  CheckCircle,
} from 'lucide-react';

type DeliveryAddress = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  address: string;
  area: string;
  district: string;
  isDefault: boolean;
};

export const BuyerCheckout: React.FC = () => {
  const {
    items,
    subtotal,
    deliveryZone,
    setDeliveryZone,
    totalWeightKg,
    clearCart,
  } = useCart();

  const { user } = useAuth();
  const navigate = useNavigate();

  const storageKey =
    `agrochain_delivery_addresses_${user?.id || user?.email || 'buyer'}`;

  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');

  const [address, setAddress] = useState({
    name: user?.name || 'Tasnim Rahman',
    phone: user?.phone || '+880 1755-432109',
    street: 'House 14, Road 7, Banani DOHS',
    area: 'Banani',
    city: 'Dhaka',
    division: 'Dhaka',
    notes: '',
  });

  const [zone, setZone] = useState<'INSIDE_DHAKA' | 'OUTSIDE_DHAKA'>(deliveryZone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load addresses saved in Buyer Profile.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);

      if (!raw) {
        setSavedAddresses([]);
        setSelectedAddressId('');
        return;
      }

      const parsed = JSON.parse(raw) as DeliveryAddress[];

      if (!Array.isArray(parsed)) {
        setSavedAddresses([]);
        return;
      }

      setSavedAddresses(parsed);

      const defaultAddress = parsed.find((item) => item.isDefault) || parsed[0];

      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        applySavedAddress(defaultAddress);
      }
    } catch (err) {
      console.error('Could not load saved addresses:', err);
      setSavedAddresses([]);
    }
    // Load again if the signed-in buyer changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const applySavedAddress = (item: DeliveryAddress) => {
    const isDhaka = item.district.trim().toLowerCase() === 'dhaka';
    const newZone = isDhaka ? 'INSIDE_DHAKA' : 'OUTSIDE_DHAKA';

    setAddress((previous) => ({
      ...previous,
      name: item.recipient,
      phone: item.phone,
      street: item.address,
      area: item.area,
      city: item.district,
      division: item.district,
    }));

    setZone(newZone);
    setDeliveryZone(newZone);
  };

  const handleSavedAddressChange = (id: string) => {
    setSelectedAddressId(id);

    const selected = savedAddresses.find((item) => item.id === id);

    if (selected) {
      applySavedAddress(selected);
      setError('');
    }
  };

  const handleZoneChange = (newZone: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA') => {
    setZone(newZone);
    setDeliveryZone(newZone);

    setAddress((previous) => ({
      ...previous,
      city: newZone === 'INSIDE_DHAKA' ? 'Dhaka' : previous.city,
      division: newZone === 'INSIDE_DHAKA' ? 'Dhaka' : previous.division,
    }));
  };

  const isDhaka = zone === 'INSIDE_DHAKA';
  const feeCalculation = calculateDeliveryFee(
    isDhaka ? 'Dhaka' : 'Outside',
    totalWeightKg
  );

  const deliveryFee = feeCalculation.totalDeliveryFee;
  const grandTotal = subtotal + deliveryFee;

  const platformCommission = Math.round(subtotal * 0.1);
  const sellerNetEarnings = subtotal - platformCommission;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (!address.name.trim() || !address.phone.trim() ||
        !address.street.trim() || !address.area.trim() ||
        !address.city.trim()) {
      setError('Please complete all required delivery address fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderItems = items.map((it) => ({
        productId: it.product.id,
        productName: it.product.name,
        farmerId: it.product.farmerId,
        farmerName: it.product.farmerName,
        unitPrice: it.product.pricePerUnit,
        quantity: it.quantity,
        unit: it.product.unit,
        subtotal: it.product.pricePerUnit * it.quantity,
        imageUrl: it.product.imageUrl,
      }));

      const deliveryOtp = generateDeliveryOtp();

      const created = await agroApi.createOrder({
        buyerId: user?.id || 'u-buyer-1',
        buyerName: address.name,
        buyerPhone: address.phone,
        buyerAddress: `${address.street}, ${address.area}, ${address.city}`,
        buyerArea: address.area,
        buyerCity: address.city,
        items: orderItems,
        productSubtotal: subtotal,
        deliveryFee,
        totalWeightKg,
        totalAmount: grandTotal,
        platformCommission,
        sellerNetEarnings,
        paymentMethod,
        paymentStatus: 'PENDING',
        deliveryOtp,
        otpAttemptsRemaining: 3,
        qualityStatus: 'PENDING',
        notes: address.notes,
      });

      if (paymentMethod === 'ONLINE') {
        const paymentUrl = await agroApi.createRupantorPayCheckout(created.id);
        window.location.assign(paymentUrl);
        return;
      }

      clearCart();
      navigate(`/buyer/tracking/${created.id}`);
    } catch (err) {
      console.error('Could not place order:', err);
      setError('Order could not be placed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Secure Order Checkout</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select a saved address or enter a new delivery destination.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              1. Delivery Destination Address
            </h2>

            {savedAddresses.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="savedAddress" className="block text-slate-700 font-bold">
                  Choose a saved address
                </label>

                <select
                  id="savedAddress"
                  value={selectedAddressId}
                  onChange={(e) => handleSavedAddressChange(e.target.value)}
                  className="w-full px-3 py-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                >
                  {savedAddresses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}{item.isDefault ? ' (Default)' : ''} — {item.area}, {item.district}
                    </option>
                  ))}
                  <option value="">Enter a different address manually</option>
                </select>

                <p className="text-[11px] text-slate-500">
                  Addresses are loaded from Buyer Profile saved in this browser.
                </p>
              </div>
            )}

            {savedAddresses.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                No saved addresses found. You can enter your delivery address below, or add one in Buyer Profile.
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <label className="block text-slate-700 font-bold">Delivery Zone</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleZoneChange('INSIDE_DHAKA')}
                  className={`py-2 px-3 rounded-lg font-bold border ${
                    zone === 'INSIDE_DHAKA'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Inside Dhaka
                  <span className="block text-[10px] font-normal">Base Charge: ৳70</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleZoneChange('OUTSIDE_DHAKA')}
                  className={`py-2 px-3 rounded-lg font-bold border ${
                    zone === 'OUTSIDE_DHAKA'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Outside Dhaka
                  <span className="block text-[10px] font-normal">Base Charge: ৳130</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Recipient Name</label>
                <input
                  required
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">House, Road & Building</label>
              <textarea
                required
                rows={2}
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Area / Upazila</label>
                <input
                  required
                  value={address.area}
                  onChange={(e) => setAddress({ ...address, area: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">City / District</label>
                <input
                  required
                  value={address.city}
                  onChange={(e) => {
                    const city = e.target.value;
                    setAddress({ ...address, city, division: city });

                    if (city.trim().toLowerCase() === 'dhaka') {
                      setZone('INSIDE_DHAKA');
                      setDeliveryZone('INSIDE_DHAKA');
                    } else if (city.trim().length > 2) {
                      setZone('OUTSIDE_DHAKA');
                      setDeliveryZone('OUTSIDE_DHAKA');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Delivery Notes (Optional)</label>
              <textarea
                rows={2}
                value={address.notes}
                onChange={(e) => setAddress({ ...address, notes: e.target.value })}
                placeholder="Landmark or delivery instructions"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg resize-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              2. Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 ${
                paymentMethod === 'COD' ? 'bg-emerald-50 border-emerald-500' : 'border-slate-200'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    Cash on Delivery (COD)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pay cash upon receipt and OTP verification.
                  </p>
                </div>
              </label>

              <label className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 ${
                paymentMethod === 'ONLINE' ? 'bg-emerald-50 border-emerald-500' : 'border-slate-200'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                  className="mt-1"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    Online (bKash / Nagad)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Online payment option. Confirm payment integration before accepting real payments.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              3. Payment & Freight Breakdown
            </h2>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between gap-3 text-slate-700">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{item.product.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {item.quantity} {item.product.unit} × ৳{item.product.pricePerUnit}
                    </div>
                  </div>
                  <span className="font-bold shrink-0">
                    ৳{(item.product.pricePerUnit * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3 text-slate-600">
              <div className="flex justify-between">
                <span>Product Subtotal</span>
                <span className="font-bold text-slate-900">৳{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5" />
                  Shipment Weight
                </span>
                <span className="font-mono font-semibold">{totalWeightKg} kg</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <div className="flex justify-between font-medium text-slate-800">
                  <span>Freight Charge</span>
                  <span className="font-bold text-emerald-800">৳{deliveryFee}</span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Base fee ({isDhaka ? 'Inside Dhaka' : 'Outside Dhaka'})</span>
                  <span>৳{feeCalculation.baseFee}</span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Weight surcharge</span>
                  <span>৳{feeCalculation.weightFee}</span>
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-100 text-sm font-bold text-slate-900">
                <span>Grand Total</span>
                <span className="text-emerald-700 text-base">৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
              <div className="font-bold text-[11px] flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-700" />
                OTP Delivery Confirmation
              </div>
              <p className="text-[10px] leading-relaxed">
                A unique 4-digit delivery OTP is generated for the order. Share it with the delivery partner at handover.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Processing Order...' : 'Confirm Order & Generate Delivery OTP'}</span>
              {loading ? <CheckCircle className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

