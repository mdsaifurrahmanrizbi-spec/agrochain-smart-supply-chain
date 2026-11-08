import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Warehouse as WarehouseIcon, MapPin, Scale, Thermometer, AlertCircle } from 'lucide-react';
import { agroApi } from '../../services/api';
import type { Warehouse } from '../../types';

export const AdminWarehouses: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [repairCandidates, setRepairCandidates] = useState<Array<{ applicationId: string; managerId: string; managerName: string; email: string; facilityName: string; type: string; city: string; area: string; status: string; accountStatus: string }>>([]);
  const [repairLoading, setRepairLoading] = useState(false);
  const [repairRunning, setRepairRunning] = useState(false);
  const [repairError, setRepairError] = useState('');
  const [repairMessage, setRepairMessage] = useState('');
  const [godownLinkCandidates, setGodownLinkCandidates] = useState<Array<{ warehouseId: string; facilityName: string; code: string; managerId: string; managerName: string; city: string; area: string; existingMatches: Array<{ id: string; warehouseLinked: boolean }> }>>([]);
  const [godownLinkLoading, setGodownLinkLoading] = useState(false);
  const [godownLinkRunning, setGodownLinkRunning] = useState(false);
  const [godownLinkError, setGodownLinkError] = useState('');
  const [godownLinkMessage, setGodownLinkMessage] = useState('');
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationDraft, setLocationDraft] = useState({ area: '', city: '', address: '' });
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState('');


  useEffect(() => {
    let active = true;
    const loadRepairPreview = async () => {
      setRepairLoading(true);
      setRepairError('');
      try {
        const result = await agroApi.previewWarehouseFacilityRepair();
        if (active) setRepairCandidates(result.candidates);
      } catch (loadError) {
        if (active) setRepairError(loadError instanceof Error ? loadError.message : 'Could not load repair preview.');
      } finally {
        if (active) setRepairLoading(false);
      }
    };
    void loadRepairPreview();
    return () => { active = false; };
  }, [refreshVersion]);

  useEffect(() => {
    let active = true;
    const loadGodownLinkPreview = async () => {
      setGodownLinkLoading(true);
      setGodownLinkError('');
      try {
        const result = await agroApi.previewGodownLinkRepair();
        if (active) setGodownLinkCandidates(result.candidates);
      } catch (loadError) {
        if (active) setGodownLinkError(loadError instanceof Error ? loadError.message : 'Could not load operational godown-link preview.');
      } finally {
        if (active) setGodownLinkLoading(false);
      }
    };
    void loadGodownLinkPreview();
    return () => { active = false; };
  }, [refreshVersion]);

  useEffect(() => {
    let active = true;

    const loadWarehouses = async () => {
      const isInitialLoad = !hasLoadedRef.current;
      if (isInitialLoad) setLoading(true);
      else setRefreshing(true);
      setError('');
      try {
        // Always request authenticated backend records. Never render local
        // demo seed data as if it were the live warehouse network.
        const records = await agroApi.getWarehouses({ strict: true });
        if (active) setWarehouses(records);
      } catch (loadError) {
        if (active) {
          // Keep the last successful live list visible during a failed manual
          // refresh; only an initial-load failure should leave the list empty.
          if (isInitialLoad) setWarehouses([]);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load warehouse records.');
        }
      } finally {
        if (active) {
          hasLoadedRef.current = true;
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void loadWarehouses();
    return () => {
      active = false;
    };
  }, [refreshVersion]);

  const saveWarehouseLocation = async (warehouseId: string) => {
    setLocationSaving(true);
    setLocationError('');
    try {
      const updated = await agroApi.updateWarehouseLocation(warehouseId, locationDraft);
      setWarehouses(current => current.map(item => item.id === warehouseId ? updated : item));
      setEditingLocationId(null);
    } catch (saveError) {
      setLocationError(saveError instanceof Error ? saveError.message : 'Could not save warehouse location.');
    } finally {
      setLocationSaving(false);
    }
  };

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
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading || refreshing ? 'animate-spin' : ''} />
          {loading ? 'Loading...' : refreshing ? 'Refreshing...' : 'Refresh warehouses'}
        </button>
      </div>

      <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Missing Warehouse Facility Repair</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
              Preview finds APPROVED applications linked to ACTIVE Warehouse Manager accounts that do not yet have a facility record. Existing facilities are never duplicated.
            </p>
          </div>
          <button
            type="button"
            disabled={repairLoading || repairRunning || repairCandidates.length === 0}
            onClick={async () => {
              const confirmed = window.confirm(`Create ${repairCandidates.length} missing warehouse facility record(s) in the production database? This will write facility records and link them to their approved applications.`);
              if (!confirmed) return;
              setRepairRunning(true);
              setRepairError('');
              setRepairMessage('');
              try {
                const result = await agroApi.runWarehouseFacilityRepair();
                setRepairMessage(`Repair completed: ${result.created} facility record(s) created; ${result.skipped} already-existing or ineligible application(s) skipped.`);
                setRefreshVersion(version => version + 1);
              } catch (runError) {
                setRepairError(runError instanceof Error ? runError.message : 'Facility repair failed.');
              } finally {
                setRepairRunning(false);
              }
            }}
            className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {repairRunning ? 'Repairing...' : `Repair ${repairCandidates.length} missing facility(s)`}
          </button>
        </div>
        {repairLoading && <p className="text-xs text-slate-500">Checking approved applications...</p>}
        {!repairLoading && !repairError && <p className="text-xs font-semibold text-slate-700">{repairCandidates.length} eligible missing facility record(s) found.</p>}
        {repairCandidates.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-amber-200 bg-white">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-amber-100/70 text-slate-700"><tr><th className="px-3 py-2">Facility</th><th className="px-3 py-2">Manager</th><th className="px-3 py-2">Location</th><th className="px-3 py-2">Account</th></tr></thead>
              <tbody>{repairCandidates.map(candidate => (
                <tr key={candidate.applicationId} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-semibold text-slate-900">{candidate.facilityName}<div className="font-normal text-slate-500">{candidate.type.replaceAll('_', ' ')}</div></td>
                  <td className="px-3 py-2">{candidate.managerName}<div className="text-slate-500">{candidate.email}</div></td>
                  <td className="px-3 py-2">{[candidate.area, candidate.city].filter(Boolean).join(', ') || 'Not provided'}</td>
                  <td className="px-3 py-2"><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">{candidate.accountStatus}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {repairMessage && <p role="status" className="text-xs font-semibold text-emerald-800">{repairMessage}</p>}
        {repairError && <p role="alert" className="text-xs text-rose-700">{repairError}</p>}
        <p className="text-[11px] text-slate-500">No database changes occur during preview. Creating facilities requires clicking the repair button and confirming the browser prompt.</p>
      </section>

      <section className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Regional Warehouse → Operational Godown Link</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
              This checks whether each approved regional warehouse also has its matching Local Godown Operations record. Preview is read-only; repair links an existing manager godown where possible and creates only when none exists.
            </p>
          </div>
          <button
            type="button"
            disabled={godownLinkLoading || godownLinkRunning || godownLinkCandidates.length === 0}
            onClick={async () => {
              const confirmed = window.confirm(`Create or link ${godownLinkCandidates.length} operational godown record(s) for the listed regional warehouse facilities? This writes only the missing facility associations.`);
              if (!confirmed) return;
              setGodownLinkRunning(true);
              setGodownLinkError('');
              setGodownLinkMessage('');
              try {
                const result = await agroApi.runGodownLinkRepair();
                setGodownLinkMessage(`Link repair completed: ${result.created} created, ${result.linked} linked, ${result.skipped} skipped.`);
                setRefreshVersion(version => version + 1);
              } catch (runError) {
                setGodownLinkError(runError instanceof Error ? runError.message : 'Operational godown link repair failed.');
              } finally {
                setGodownLinkRunning(false);
              }
            }}
            className="rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {godownLinkRunning ? 'Linking...' : `Repair ${godownLinkCandidates.length} godown link(s)`}
          </button>
        </div>
        {godownLinkLoading && <p className="text-xs text-slate-500">Checking regional godown links...</p>}
        {!godownLinkLoading && !godownLinkError && <p className="text-xs font-semibold text-slate-700">{godownLinkCandidates.length} regional warehouse facility link(s) need attention.</p>}
        {godownLinkCandidates.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-sky-200 bg-white">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-sky-100/70 text-slate-700"><tr><th className="px-3 py-2">Regional facility</th><th className="px-3 py-2">Manager</th><th className="px-3 py-2">Location</th><th className="px-3 py-2">Existing godown match</th></tr></thead>
              <tbody>{godownLinkCandidates.map(candidate => (
                <tr key={candidate.warehouseId} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-semibold text-slate-900">{candidate.facilityName}<div className="font-normal text-slate-500">{candidate.code}</div></td>
                  <td className="px-3 py-2">{candidate.managerName}</td>
                  <td className="px-3 py-2">{[candidate.area, candidate.city].filter(Boolean).join(', ') || 'Not provided'}</td>
                  <td className="px-3 py-2">{candidate.existingMatches.length ? candidate.existingMatches.map(match => `${match.id}${match.warehouseLinked ? ' (linked)' : ' (manager match)'}`).join(', ') : 'No existing record'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {godownLinkMessage && <p role="status" className="text-xs font-semibold text-emerald-800">{godownLinkMessage}</p>}
        {godownLinkError && <p role="alert" className="text-xs text-rose-700">{godownLinkError}</p>}
        <p className="text-[11px] text-slate-500">No database changes occur during preview. Linking or creating records requires clicking Repair and confirming the browser prompt.</p>
      </section>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading live warehouse facilities...
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{warehouses.length > 0 ? 'Could not refresh warehouse records' : 'Could not load live warehouse records'}</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-xs">{warehouses.length > 0 ? 'The last successfully loaded live warehouse list is still displayed below.' : 'No demo or cached warehouse data is being displayed. Refresh after checking the backend connection and Admin session.'}</p>
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

      {!loading && warehouses.length > 0 && (
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
                  {editingLocationId === wh.id ? (
                    <div className="mt-3 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                      <label className="block text-[11px] font-semibold text-slate-700">Area / Upazila
                        <input value={locationDraft.area} onChange={event => setLocationDraft(current => ({ ...current, area: event.target.value }))} maxLength={120} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs" placeholder="e.g. Shibganj" />
                      </label>
                      <label className="block text-[11px] font-semibold text-slate-700">City / District
                        <input value={locationDraft.city} onChange={event => setLocationDraft(current => ({ ...current, city: event.target.value }))} maxLength={120} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs" placeholder="e.g. Bogura" />
                      </label>
                      <label className="block text-[11px] font-semibold text-slate-700">Full facility address
                        <input value={locationDraft.address} onChange={event => setLocationDraft(current => ({ ...current, address: event.target.value }))} maxLength={500} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs" placeholder="Full physical address" />
                      </label>
                      {locationError && <p role="alert" className="text-[11px] text-rose-700">{locationError}</p>}
                      <div className="flex gap-2">
                        <button type="button" disabled={locationSaving} onClick={() => void saveWarehouseLocation(wh.id)} className="rounded-md bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50">{locationSaving ? 'Saving...' : 'Save location'}</button>
                        <button type="button" disabled={locationSaving} onClick={() => { setEditingLocationId(null); setLocationError(''); }} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setEditingLocationId(wh.id); setLocationDraft({ area: wh.area || '', city: wh.city || '', address: wh.address || '' }); setLocationError(''); }} className="mt-2 text-[11px] font-semibold text-emerald-800 underline underline-offset-2">Edit facility location</button>
                  )}
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
