import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, MapPin, CreditCard, ShieldCheck, Check } from 'lucide-react';

export const FarmerProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(user?.name || 'Md. Rafiqul Islam');
  const [phone, setPhone] = useState(user?.phone || '+880 1819-345678');
  const [location, setLocation] = useState(user?.location || 'Shibganj, Bogura');
  const [bKashNumber, setBKashNumber] = useState('01819345678');
  const [nidNumber, setNidNumber] = useState('19842691234567890');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, phone, location });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Farmer Profile & Payout Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your verified farmer identity and settlement mobile banking accounts.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Profile changes updated successfully.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-emerald-700 text-white font-bold text-xl flex items-center justify-center">
            {name.charAt(0)}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{name}</h2>
            <p className="text-xs text-slate-500">Registered Agricultural Producer · Bogura Division</p>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>National ID & Land Verification Passed</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Contact Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Primary Farm Hub Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">National ID (NID)</label>
              <input
                type="text"
                disabled
                value={nidNumber}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 mb-3">Mobile Banking Settlement Accounts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">bKash Merchant / Personal No.</label>
                <input
                  type="text"
                  required
                  value={bKashNumber}
                  onChange={(e) => setBKashNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Settlement Cadence</label>
                <input
                  type="text"
                  disabled
                  value="Automatic release on delivery verification"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors"
            >
              Update Profile Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
