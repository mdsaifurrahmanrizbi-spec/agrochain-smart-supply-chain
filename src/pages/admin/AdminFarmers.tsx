import React from 'react';
import { store } from '../../services/api';
import { Sprout, MapPin, Building, ShieldCheck } from 'lucide-react';

export const AdminFarmers: React.FC = () => {
  const farmers = store.users.filter((u) => u.role === 'farmer');
  const farms = store.farms;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Registered Agricultural Farmers & Producers</h1>
        <p className="text-xs text-slate-500 mt-1">
          Registered growers across Rajshahi, Bogura, Rangpur, and Dinajpur divisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {farmers.map((farmer) => {
          const farmerFarms = farms.filter((f) => f.farmerId === farmer.id);
          const farmerBatches = store.batches.filter((b) => b.farmerId === farmer.id);

          return (
            <div key={farmer.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center">
                    {farmer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{farmer.name}</h3>
                    <div className="text-[11px] text-slate-500">{farmer.phone}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Verified Producer
                </span>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Region: <strong className="text-slate-900">{farmer.location}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Registered Farms: <strong className="text-slate-900">{farmerFarms.length} plots</strong></span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Active Crop Batches:</span>
                <span className="font-bold text-emerald-800">{farmerBatches.length} Batches</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
