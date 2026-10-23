import React, { useEffect, useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { QualityCheck } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

type InspectorAccount = { id: string; name: string; email?: string; role: string; status?: string };

export const AdminQualityChecks: React.FC = () => {
  const { user } = useAuth();
  const [checks, setChecks] = useState(store.qualityChecks);
  const [orders, setOrders] = useState(store.orders);
  const [inspectors, setInspectors] = useState<InspectorAccount[]>([]);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<QualityCheck | null>(null);
  const [form, setForm] = useState({ inspectorId: '', grade: 'Grade A - Premium' as QualityCheck['grade'], moisture: '', pesticide: '', foreignMatter: '', remarks: '', decision: 'APPROVED' as QualityCheck['status'] });

  const refresh = async () => {
    try {
      const [freshChecks, freshOrders] = await Promise.all([agroApi.getQualityChecks(), agroApi.getOrders()]);
      setChecks([...freshChecks]);
      setOrders([...freshOrders]);
      setLoadError('');
    } catch (error) {
      console.error('Could not refresh QC audit data:', error);
      setLoadError('Could not refresh QC records from the server. Displayed data may be cached.');
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([agroApi.getQualityChecks(), agroApi.getOrders(), agroApi.getAdminUsers()])
      .then(([freshChecks, freshOrders, accounts]) => {
        if (!active) return;
        setChecks([...freshChecks]);
        setOrders([...freshOrders]);
        setInspectors((accounts as InspectorAccount[]).filter((account) => account.role === 'inspector' && account.status !== 'SUSPENDED'));
      })
      .catch((error) => {
        console.error('Could not load QC audit data:', error);
        if (active) setLoadError('Could not load QC records or inspector accounts. Refresh and try again.');
      });
    return () => { active = false; };
  }, []);

  const openInspection = (check: QualityCheck) => {
    setSelected(check);
    setForm({
      inspectorId: check.inspectorId || '',
      grade: check.grade && check.grade !== 'Not graded' ? check.grade : 'Grade A - Premium',
      moisture: check.status === 'PENDING' ? '' : String(check.moistureContentPercent ?? ''),
      pesticide: check.status === 'PENDING' ? '' : String(check.pesticideResiduePpm ?? ''),
      foreignMatter: check.status === 'PENDING' ? '' : String(check.foreignMatterPercent ?? ''),
      remarks: check.status === 'PENDING' ? '' : (check.remarks || ''),
      decision: check.status === 'PENDING' ? 'APPROVED' : check.status,
    });
    setNotice('');
  };

  const assignInspector = async (check: QualityCheck, inspectorId: string) => {
    const inspector = inspectors.find((item) => item.id === inspectorId);
    if (!inspector) return;
    setBusy(true); setNotice('');
    try {
      await agroApi.saveQualityCheckDetails(check.id, { inspectorId: inspector.id, inspectorName: inspector.name });
      await refresh();
      setNotice(`Inspector assigned to ${check.id}: ${inspector.name}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not assign inspector.');
    } finally { setBusy(false); }
  };

  const submitInspection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    if (!form.inspectorId) { setNotice('Assign an inspector before saving an inspection.'); return; }
    const moisture = Number(form.moisture);
    const pesticide = Number(form.pesticide);
    const foreignMatter = Number(form.foreignMatter);
    if (form.moisture.trim() === '' || form.pesticide.trim() === '' || form.foreignMatter.trim() === '' ||
        !Number.isFinite(moisture) || !Number.isFinite(pesticide) || !Number.isFinite(foreignMatter) ||
        moisture < 0 || pesticide < 0 || foreignMatter < 0) {
      setNotice('Enter valid, measured values for moisture, pesticide residue and foreign matter.');
      return;
    }
    if (!form.remarks.trim()) { setNotice('Add inspection remarks before submitting the decision.'); return; }
    setBusy(true); setNotice('');
    try {
      const inspector = inspectors.find((item) => item.id === form.inspectorId);
      const certificateNumber = form.decision === 'APPROVED'
        ? (selected.certificateNumber || `QC-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
        : undefined;
      await agroApi.updateQualityCheck(selected.id, {
        inspectorId: form.inspectorId,
        inspectorName: inspector?.name || selected.inspectorName,
        grade: form.grade,
        moistureContentPercent: moisture,
        pesticideResiduePpm: pesticide,
        foreignMatterPercent: foreignMatter,
        inspectionLocation: 'FARM',
        remarks: form.remarks.trim(),
        status: form.decision,
        certificateNumber,
        inspectionDate: new Date().toISOString().slice(0, 10),
      });
      await refresh();
      setSelected(null);
      setNotice(`${selected.id} saved as ${form.decision}. ${form.decision === 'APPROVED' ? 'Pickup may proceed.' : form.decision === 'REJECTED' ? 'Pickup remains blocked.' : 'Pickup remains on hold.'}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save the inspection. No decision was confirmed.');
    } finally { setBusy(false); }
  };

  const pendingCount = checks.filter((check) => check.status === 'PENDING').length;
  const confirmedWithoutQc = orders.filter((order) =>
    order.orderStatus === 'CONFIRMED' && !order.qualityCheckId &&
    !checks.some((check) => check.orderId === order.id || check.orderId === order.orderNumber)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Platform Quality Control Audits</h1>
          <p className="mt-1 text-xs text-slate-500">Inspect and record real measurements before farm pickup can proceed.</p>
        </div>
        <button type="button" onClick={() => void refresh()} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Refresh QC</button>
      </div>

      {loadError && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{loadError}</div>}
      {notice && <div role="status" aria-live="polite" className={`rounded-lg border px-4 py-3 text-sm ${notice.toLowerCase().includes('could not') || notice.startsWith('Enter') || notice.startsWith('Assign') || notice.startsWith('Add') ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{notice}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">QC records</p><p className="mt-1 text-2xl font-bold text-slate-900">{checks.length}</p></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs text-amber-800">Awaiting inspection</p><p className="mt-1 text-2xl font-bold text-amber-900">{pendingCount}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Confirmed orders missing QC</p><p className="mt-1 text-2xl font-bold text-slate-900">{confirmedWithoutQc.length}</p></div>
      </div>

      {confirmedWithoutQc.length > 0 && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-sm font-bold text-amber-900">Confirmed orders missing an inspection record</h2>
        <p className="mt-1 text-xs text-amber-800">These orders need a QC record. No inspection result is created automatically.</p>
        <ul className="mt-3 space-y-2">{confirmedWithoutQc.map((order) => <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs"><span className="font-mono font-semibold text-slate-800">{order.orderNumber}</span><span className="text-slate-600">{order.items.map((item) => item.productName).join(', ')}</span><span className="text-slate-500">{order.buyerCity || order.buyerAddress}</span></li>)}</ul>
      </section>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto"><table className="w-full text-left text-xs text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr>
            <th className="px-4 py-3">QC Code</th><th className="px-4 py-3">Related Order ID</th><th className="px-4 py-3">Commodity</th><th className="px-4 py-3">Harvest Batch Code</th><th className="px-4 py-3">Origin Farmer</th><th className="px-4 py-3">Inspector / Assign</th><th className="px-4 py-3">Moisture %</th><th className="px-4 py-3">Pesticide Residue</th><th className="px-4 py-3">Classification</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">{checks.map((c) => {
            const linkedOrder = orders.find((order) => order.id === c.orderId || order.orderNumber === c.orderId);
            return <tr key={c.id} className="transition-colors hover:bg-slate-50/80">
              <td className="px-4 py-3 font-mono font-bold text-slate-900">{c.id}</td>
              <td className="px-4 py-3 font-mono font-semibold text-blue-700">{linkedOrder?.orderNumber || c.orderId || 'Not linked'}</td>
              <td className="px-4 py-3 font-bold text-slate-900">{c.cropName}</td>
              <td className="px-4 py-3 font-mono font-semibold text-emerald-800">{c.batchCode || 'Not assigned'}</td>
              <td className="px-4 py-3">{c.farmerName || 'Not available'}{c.farmLocation ? ` (${c.farmLocation})` : ''}</td>
              <td className="min-w-52 px-4 py-3">
                <div className="mb-2 font-medium text-slate-800">{c.inspectorName || 'Not assigned'}</div>
                <select aria-label={`Assign inspector for ${c.id}`} value={c.inspectorId || ''} disabled={busy} onChange={(e) => void assignInspector(c, e.target.value)} className="w-full rounded border border-slate-300 bg-white px-2 py-1.5">
                  <option value="">Assign inspector…</option>{inspectors.map((inspector) => <option key={inspector.id} value={inspector.id}>{inspector.name}{inspector.email ? ` — ${inspector.email}` : ''}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 font-mono tabular-nums">{c.status === 'PENDING' ? 'Not measured' : `${c.moistureContentPercent}%`}</td>
              <td className="px-4 py-3 font-mono tabular-nums">{c.status === 'PENDING' ? 'Not measured' : `${c.pesticideResiduePpm} ppm`}</td>
              <td className="px-4 py-3">{c.status === 'PENDING' ? 'Not graded' : c.grade}</td>
              <td className="px-4 py-3"><StatusBadge status={c.status} size="sm" /></td>
              <td className="px-4 py-3"><button type="button" onClick={() => openInspection(c)} className="whitespace-nowrap rounded-lg bg-emerald-700 px-3 py-2 font-semibold text-white hover:bg-emerald-800">{c.status === 'PENDING' ? 'Inspect / Decide' : 'View / Update'}</button></td>
            </tr>;
          })}
          {checks.length === 0 && <tr><td colSpan={11} className="px-4 py-10 text-center text-slate-500">No quality checks found.</td></tr>}</tbody>
        </table></div>
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="qc-inspection-title" className="my-8 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="qc-inspection-title" className="text-lg font-bold text-slate-900">QC Inspection — {selected.id}</h2><p className="mt-1 text-xs text-slate-500">{selected.cropName} · {selected.farmerName} · {selected.farmLocation}</p></div><button type="button" onClick={() => setSelected(null)} className="rounded-lg border px-3 py-1.5 text-sm">Close</button></div>
          <form onSubmit={submitInspection} className="space-y-4">
            <div><label className="mb-1 block font-semibold text-slate-700">Assigned inspector</label><select required value={form.inspectorId} onChange={(e) => setForm({ ...form, inspectorId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">Choose an active inspector</option>{inspectors.map((inspector) => <option key={inspector.id} value={inspector.id}>{inspector.name}{inspector.email ? ` — ${inspector.email}` : ''}</option>)}</select>{inspectors.length === 0 && <p className="mt-1 text-xs text-amber-700">No inspector accounts found. Create/activate an inspector account first.</p>}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block font-semibold text-slate-700">Grade classification</label><select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value as QualityCheck['grade'] })} className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="Grade A - Premium">Grade A — Premium</option><option value="Grade B - Standard">Grade B — Standard</option><option value="Grade C - Commercial">Grade C — Commercial</option></select></div>
              <div><label className="mb-1 block font-semibold text-slate-700">Moisture (%)</label><input required type="number" min="0" max="100" step="0.01" value={form.moisture} onChange={(e) => setForm({ ...form, moisture: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Enter measured value" /></div>
              <div><label className="mb-1 block font-semibold text-slate-700">Pesticide residue (ppm)</label><input required type="number" min="0" step="0.001" value={form.pesticide} onChange={(e) => setForm({ ...form, pesticide: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Enter measured value" /></div>
              <div><label className="mb-1 block font-semibold text-slate-700">Foreign matter / impurities (%)</label><input required type="number" min="0" max="100" step="0.01" value={form.foreignMatter} onChange={(e) => setForm({ ...form, foreignMatter: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Enter measured value" /></div>
            </div>
            <div><label className="mb-1 block font-semibold text-slate-700">Inspection remarks</label><textarea required rows={3} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Record actual inspection findings…" /></div>
            <div><label className="mb-1 block font-semibold text-slate-700">Decision</label><select value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value as QualityCheck['status'] })} className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="APPROVED">Approve — unlock pickup</option><option value="RECHECK_REQUIRED">Recheck required — keep on hold</option><option value="REJECTED">Reject — block pickup</option></select></div>
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Only submit values measured during the real inspection. Pending, recheck-required and rejected records must not unlock pickup.</p>
            <div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={busy} onClick={() => setSelected(null)} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700">Cancel</button><button type="submit" disabled={busy || inspectors.length === 0} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Saving…' : 'Save inspection decision'}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
};
