
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, MapPin, Check, Plus, Pencil, Trash2, Star, X } from 'lucide-react';

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

export const BuyerProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(user?.name || 'Tasnim Rahman');
  const [phone, setPhone] = useState(user?.phone || '+880 1755-432109');
  const [location, setLocation] = useState(user?.location || 'Banani DOHS, Dhaka');

  const storageKey = `agrochain_delivery_addresses_${user?.id || user?.email || 'buyer'}`;

  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');

  const emptyForm = {
    label: 'Home',
    recipient: name,
    phone,
    address: '',
    area: '',
    district: 'Dhaka',
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);

      if (raw) {
        const parsed = JSON.parse(raw) as DeliveryAddress[];
        setAddresses(parsed);
      } else {
        const initialAddress: DeliveryAddress[] = [
          {
            id: 'address-default',
            label: 'Home',
            recipient: user?.name || '',
            phone: user?.phone || '',
            address: user?.location && !['Bangladesh', 'Dhaka, Bangladesh'].includes(user.location) ? user.location : '',
            area: '',
            district: 'Dhaka',
            isDefault: true,
          },
        ];
        setAddresses(initialAddress);
        localStorage.setItem(storageKey, JSON.stringify(initialAddress));
      }
    } catch (error) {
      console.error('Could not load saved delivery addresses:', error);
      setAddresses([]);
    }
  }, [storageKey, user?.name, user?.phone, user?.location]);

  const persistAddresses = (next: DeliveryAddress[]) => {
    setAddresses(next);

    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice('Delivery addresses saved successfully.');
    } catch (error) {
      console.error('Could not save delivery addresses:', error);
      setNotice('Could not save addresses in this browser.');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, phone, location });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  const startAdd = () => {
    setEditingId(null);
    setForm({
      label: 'Home',
      recipient: name,
      phone,
      address: '',
      area: '',
      district: 'Dhaka',
    });
    setShowForm(true);
    setNotice('');
  };

  const startEdit = (item: DeliveryAddress) => {
    setEditingId(item.id);
    setForm({
      label: item.label,
      recipient: item.recipient,
      phone: item.phone,
      address: item.address,
      area: item.area,
      district: item.district,
    });
    setShowForm(true);
    setNotice('');
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();

    const isNew = editingId === null;
    const id = editingId || `address-${Date.now()}`;

    const nextAddress: DeliveryAddress = {
      id,
      ...form,
      isDefault: isNew ? addresses.length === 0 : Boolean(
        addresses.find((item) => item.id === editingId)?.isDefault
      ),
    };

    let next: DeliveryAddress[];

    if (editingId) {
      next = addresses.map((item) => item.id === editingId ? nextAddress : item);
    } else {
      next = [...addresses, nextAddress];
    }

    if (next.length === 1) {
      next = next.map((item) => ({ ...item, isDefault: true }));
    }

    persistAddresses(next);
    setShowForm(false);
    setEditingId(null);
  };

  const setDefaultAddress = (id: string) => {
    const next = addresses.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));

    persistAddresses(next);
  };

  const deleteAddress = (id: string) => {
    const target = addresses.find((item) => item.id === id);
    if (!target) return;

    if (!window.confirm(`Delete the ${target.label} address?`)) return;

    let next = addresses.filter((item) => item.id !== id);

    if (target.isDefault && next.length > 0) {
      next = next.map((item, index) => ({
        ...item,
        isDefault: index === 0,
      }));
    }

    persistAddresses(next);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Buyer Profile & Delivery Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your customer profile and multiple delivery addresses.
        </p>
      </div>

      {(saved || notice) && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{notice || 'Profile changes saved successfully.'}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-700" />
          Personal Information
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Mobile Phone
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'tasnim.buyer@gmail.com'}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Primary Residence & Delivery Area
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              My Delivery Addresses
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add separate home, office, or family addresses.
            </p>
          </div>

          <button
            type="button"
            onClick={startAdd}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Address
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-sm text-slate-500">
            No saved addresses. Add your first delivery address.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((item) => (
              <div key={item.id} className={`border rounded-xl p-4 space-y-3 ${item.isDefault ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{item.label}</h3>
                      {item.isDefault && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{item.recipient}</p>
                    <p className="text-xs text-slate-600">{item.phone}</p>
                  </div>
                  <MapPin className="w-5 h-5 text-emerald-700 shrink-0" />
                </div>

                <p className="text-xs text-slate-700">
                  {item.address}, {item.area}, {item.district}
                </p>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {!item.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefaultAddress(item.id)}
                      className="px-2.5 py-1.5 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-1"
                    >
                      <Star className="w-3 h-3" /> Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="px-2.5 py-1.5 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAddress(item.id)}
                    className="px-2.5 py-1.5 border border-red-200 text-red-700 rounded-md text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              {editingId ? 'Edit Delivery Address' : 'Add Delivery Address'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1 text-slate-500 hover:text-slate-900"
              aria-label="Close address form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Address Label</label>
              <select
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option>Home</option>
                <option>Office</option>
                <option>Family</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Recipient Name</label>
              <input
                required
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">District</label>
              <select
                required
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value, area: '' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option>Dhaka</option>
                <option>Bogura</option>
                <option>Rajshahi</option>
                <option>Gazipur</option>
                <option>Narayanganj</option>
                <option>Chattogram</option>
                <option>Khulna</option>
                <option>Sylhet</option>
                <option>Rangpur</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Area / Upazila</label>
              <input
                required
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="e.g. Tejgaon, Banani, Shibganj"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Full Street Address</label>
              <textarea
                required
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="House, road, block, landmark"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold"
              >
                {editingId ? 'Update Address' : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      )}

      <p className="text-[11px] text-slate-500">
        Note: Saved addresses currently stay in this browser. Checkout and backend order integration must be connected separately.
      </p>
    </div>
  );
};
