import React, { useEffect, useState } from 'react';
import { RefreshCw, Warehouse as WarehouseIcon, MapPin, Scale, Thermometer, AlertCircle } from 'lucide-react';
import { agroApi } from '../../services/api';
import type { Warehouse } from '../../types';

export const AdminWarehouses: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;

    const loadWarehouses = async () => {
      setLoading(true);
      setError('');
      try {
        // Always request the authenticated backend records. Never render the
        // local demo seed as if it were the live warehouse network.
        const records = await agroApi.getWarehouses({ strict: true });
        if (active) setWarehouses(records);
      } catch (loadError) {
        if (active) {
          setWarehouses([]);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load warehouse records.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadWarehouses();
    return () => {
      active = false;
    };
  }, [refreshVersion]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Regional Warehouses & Sourcing Godowns</h1>
          <p className="text-xs text-slate-500 mt-1">
            Live warehouse facilities registered across Dhaka, Gazipur, and North Bengal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshVersion((version) => version + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh warehouses'}
        </button>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading live warehouse facilities...
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Could not load live warehouse records</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-xs">No demo or cached warehouse data is being displayed. Refresh after checking the backend connection and Admin session.</p>
          </div>
        </div>
      )}

      {!loading && !error && warehouses.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <WarehouseIcon size={30} className="mx-auto text-slate-400" />
          <h2 className="mt-3 text-sm font-semibold text-slate-900">No warehouse facilities found</h2>
          <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500">
            The backend returned no warehouse records for this account. Approved registration requests are not shown here unless their facility record has been created and saved.
          </p>
        </div>
      )}

      {!loading && !error && warehouses.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {warehouses.map((wh) => {
            const capacity = Number(wh.capacityMetricTons) || 0;
            const stock = Number(wh.currentStockMetricTons) || 0;
            const occupancy = capacity > 0 ? Math.min(100, Math.max(0, (stock / capacity) * 100)) : 0;
            const managerLinked = Boolean(wh.managerId);

            return (
              <div key={wh.id} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-xs shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                    {wh.code || 'NO CODE'}
                  </span>
                  <span className="font-semibold text-slate-500">{String(wh.type || 'WAREHOUSE').replaceAll('_', ' ')}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{wh.name}</h3>
                  <p className="mt-1 flex items-start gap-1.5 text-slate-500">
                    <MapPin size={13} className="mt-0.5 shrink-0" />
                    {wh.location || 'Location not provided'}
                  </p>
                  <div className="mt-2 text-slate-700">
                    Supervisor: <strong className="text-slate-900">{wh.managerName || 'Not assigned'}</strong>
                  </div>
                  <div className="mt-2">
                    <span className={managerLinked ? 'rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700' : 'rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700'}>
                      {managerLinked ? 'Manager account linked' : 'Manager account not linked'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-slate-500"><Scale size={13} /> Occupancy</span>
                    <span className="font-bold tabular-nums text-slate-900">
                      {stock.toFixed(1)} / {capacity.toFixed(1)} MT ({Math.round(occupancy)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${occupancy}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5"><Thermometer size={13} /> Climate system</span>
                  <span className="font-bold text-emerald-700">
                    {wh.temperatureControlled ? 'Active cold storage' : 'Standard ventilation'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
