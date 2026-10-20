import React from 'react';
import { store } from '../../services/api';
import { Warehouse, MapPin, Scale, Thermometer } from 'lucide-react';

export const AdminWarehouses: React.FC = () => {
  const warehouses = store.warehouses;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Regional Warehouses & Sourcing Godowns</h1>
        <p className="text-xs text-slate-500 mt-1">
          Network infrastructure across Dhaka, Gazipur, and North Bengal with temperature and capacity telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {warehouses.map((wh) => (
          <div key={wh.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-mono font-bold text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {wh.code}
              </span>
              <span className="font-semibold text-slate-500">{wh.type.replace('_', ' ')}</span>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-sm">{wh.name}</h3>
              <p className="text-slate-500 mt-0.5">{wh.location}</p>
              <div className="mt-2 text-slate-700">
                Supervisor: <strong className="text-slate-900">{wh.managerName}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500">Occupancy</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {wh.currentStockMetricTons} / {wh.capacityMetricTons} MT ({Math.round((wh.currentStockMetricTons / wh.capacityMetricTons) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${(wh.currentStockMetricTons / wh.capacityMetricTons) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Climate System:</span>
              <span className="font-bold text-emerald-700">
                {wh.temperatureControlled ? 'Active Cold Storage' : 'Standard Ventilation'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
