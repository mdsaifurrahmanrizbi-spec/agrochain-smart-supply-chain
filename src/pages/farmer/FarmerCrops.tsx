import React from 'react';
import { store } from '../../services/api';
import { Sprout, Calendar, Tag } from 'lucide-react';

export const FarmerCrops: React.FC = () => {
  const crops = store.crops;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Crop Varieties & Agronomy Guide</h1>
        <p className="text-xs text-slate-500 mt-1">
          Supported agricultural crop varieties adapted for Bangladesh soil divisions (BRRI and BARI certified).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {crops.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {c.category}
              </span>
              <span className="text-xs font-semibold text-slate-500">{c.season} Season</span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Official Variety: <strong className="text-slate-800">{c.variety}</strong>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Growing Cycle</span>
              </span>
              <span className="font-bold text-slate-800 tabular-nums">{c.growingPeriodDays} Days</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
