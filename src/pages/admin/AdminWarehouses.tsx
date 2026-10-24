import React, { useEffect, useState } from 'react';
import { store, agroApi } from '../../services/api';
import type { WarehouseApplication, Warehouse } from '../../types';
import { Warehouse as WarehouseIcon, MapPin, ShieldCheck, CheckCircle, RefreshCw } from 'lucide-react';

export const AdminWarehouses: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([...store.warehouses]);
  const [applications, setApplications] = useState<WarehouseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const [apps] = await Promise.all([agroApi.getWarehouseApplications()]);
      setApplications(apps as WarehouseApplication[]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not load warehouse applications.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void refresh(); }, []);

  const approve = async (application: WarehouseApplication) => {
    if (!window.confirm(`Approve ${application.warehouseName} in ${application.upazila}, ${application.district} and activate the manager account?`)) return;
    setBusyId(application.id);
    setNotice('');
    try {
      await agroApi.approveWarehouseApplication(application as unknown as Record<string, any>);
      const newWarehouse: Warehouse = {
        id: `wh-${application.id}`,
        name: application.warehouseName,
        code: `WH-${application.district.slice(0, 3).toUpperCase()}-${application.id.slice(-5).toUpperCase()}`,
        type: application.warehouseType,
        location: `${application.address}, ${application.upazila}, ${application.district}`,
        managerName: application.managerName,
        managerId: application.managerId,
        capacityMetricTons: Number(application.capacityMetricTons),
        currentStockMetricTons: 0,
        temperatureControlled: application.temperatureControlled,
      };
      const updated = [...store.warehouses.filter((w) => w.id !== newWarehouse.id), newWarehouse];
      store.warehouses = updated;
      localStorage.setItem('agro_warehouses', JSON.stringify(updated));
      setWarehouses(updated);
      setNotice(`${application.warehouseName} approved; manager account activated.`);
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Warehouse approval failed.');
    } finally {
      setBusyId('');
    }
  };

  const pending = applications.filter((a) => a.applicationStatus === 'PENDING_APPROVAL');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Regional Warehouses & Sourcing Godowns</h1>
          <p className="text-xs text-slate-500 mt-1">Review warehouse applications and manage approved hubs across Bangladesh.</p>
        </div>
        <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>
      {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div>}

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-bold text-slate-900">Pending Warehouse Applications</h2><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">{pending.length} pending</span></div>
        {loading ? <p className="text-sm text-slate-500">Loading applications…</p> : pending.length === 0 ? <div className="rounded-xl border border-dashed p-5 text-sm text-slate-500">No pending warehouse applications.</div> :
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{pending.map((app) => <article key={app.id} className="rounded-xl border border-amber-200 bg-white p-5 space-y-3">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{app.warehouseName}</h3><p className="text-xs text-slate-500 mt-1">{app.warehouseType === 'CENTRAL' ? 'Main / Central Warehouse' : 'Regional Warehouse / Godown'}</p></div><span className="rounded bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-bold text-amber-800">PENDING APPROVAL</span></div>
            <div className="grid grid-cols-2 gap-3 text-xs"><div><span className="text-slate-500 block">Manager</span><strong>{app.managerName}</strong></div><div><span className="text-slate-500 block">Phone</span><strong>{app.managerPhone}</strong></div><div><span className="text-slate-500 block">Email</span><strong className="break-all">{app.managerEmail}</strong></div><div><span className="text-slate-500 block">Capacity</span><strong>{app.capacityMetricTons} metric tons</strong></div></div>
            <p className="text-xs text-slate-700 flex gap-2"><MapPin className="w-4 h-4 shrink-0 text-emerald-700" />{app.address}, {app.upazila}, {app.district}</p>
            {app.isMainWarehouse && <p className="text-xs font-semibold text-emerald-800">Requested as main warehouse</p>}
            <button disabled={busyId === app.id} onClick={() => void approve(app)} className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"><CheckCircle className="w-4 h-4" />{busyId === app.id ? 'Approving…' : 'Approve Warehouse & Activate Manager'}</button>
          </article>)}</div>}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-slate-900">Approved Warehouse Network</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {warehouses.map((wh) => <div key={wh.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between"><span className="font-mono font-bold text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">{wh.code}</span><span className="font-semibold text-slate-500">{wh.type.replace('_', ' ')}</span></div>
            <div><h3 className="font-bold text-slate-900 text-sm">{wh.name}</h3><p className="text-slate-500 mt-1">{wh.location}</p><p className="mt-2 text-slate-700">Manager: <strong>{wh.managerName}</strong></p></div>
            <div className="flex items-center gap-2 text-emerald-800"><ShieldCheck className="w-4 h-4" /> Approved operational facility</div>
            <div className="flex justify-between text-slate-500"><span>Capacity</span><strong>{wh.capacityMetricTons} MT</strong></div>
            <div className="flex justify-between text-slate-500"><span>Temperature control</span><strong>{wh.temperatureControlled ? 'Yes' : 'No'}</strong></div>
          </div>)}
        </div>
      </section>
    </div>
  );
};
