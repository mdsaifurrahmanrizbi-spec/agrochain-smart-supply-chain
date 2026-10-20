import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Check, Send } from 'lucide-react';

export const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    hub: 'Dhaka',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const hubs = [
    {
      name: 'Central Dhaka Agro-Logistics Center',
      address: 'Joydebpur Road, Gazipur Industrial Belt, Dhaka',
      phone: '+880 1733-112233',
      type: 'Central Storage & Quality Lab',
    },
    {
      name: 'Tejgaon Urban Dispatch Godown',
      address: 'Plot 42, Block B, Tejgaon Industrial Area, Dhaka',
      phone: '+880 1622-987654',
      type: 'Last-Mile Sorting & COD Desk',
    },
    {
      name: 'North Bengal Sourcing & Cold Hub',
      address: 'Banani Bypass Road, Shibganj Crossing, Bogura',
      phone: '+880 1819-345678',
      type: 'Grain Silo & Vegetable Cold Storage',
    },
    {
      name: 'Barendra Fruit & Seed Hub',
      address: 'Rajshahi Highway, Charghat Upazila, Rajshahi',
      phone: '+880 1912-789012',
      type: 'Orchard Produce & Certification Desk',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Operational Hubs
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
            Regional Centers & Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Reach out to our logistics managers, warehouse officers, and farmer onboarding specialists.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Hub Directory */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Network Facilities in Bangladesh
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hubs.map((hub, i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                    {hub.type}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{hub.name}</h3>
                  <div className="flex items-start gap-2 text-slate-600 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{hub.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{hub.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Message Form */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-1">Send an Inquiry</h2>
              <p className="text-xs text-slate-500 mb-4">
                Inquire about farmer onboarding, delivery partner registration, or bulk procurement.
              </p>

              {submitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Your message has been sent to the AgroChain Central Coordination Desk in Dhaka.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Md. Saifur Rahman"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                      <input
                        type="text"
                        required
                        placeholder="+880 17XX-XXXXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Closest Division</label>
                      <select
                        value={formData.hub}
                        onChange={(e) => setFormData({ ...formData, hub: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                      >
                        <option value="Dhaka">Dhaka Division</option>
                        <option value="Rajshahi">Rajshahi Division</option>
                        <option value="Rangpur">Rangpur Division</option>
                        <option value="Chattogram">Chattogram Division</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="name@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Inquiry Details</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Describe your inquiry or requested partnership..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to Regional Desk</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
