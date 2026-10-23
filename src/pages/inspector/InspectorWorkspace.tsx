import React, { useEffect, useMemo, useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { QualityCheck } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const InspectorWorkspace: React.FC = () => {
  const { user } = useAuth();
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ grade: 'Grade A - Premium' as QualityCheck['grade'], moisture: '', pesticide: '', foreignMatter: '', remarks: '', decision: 'APPROVED' as QualityCheck['status'] });

  const refresh = async () => {
    setLoading(true);
    try {
      const all = await agroApi.getQualityChecks();
      const assigned = all.filter((check) => check.inspectorId === user?.id || (!!user?.name && check.inspectorName === user.name));
      setChecks(assigned);
      setSelectedId((current) => assigned.some((check) => check.id === current) ? current : (assigned[0]?.id || ''));
      setNotice('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not load assigned inspections.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, [user?.id, user?.name]);

  const selected = useMemo(() => checks.find((check) => check.id === selectedId), [checks, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      grade: selected.grade && selected.grade !== 'Not graded' ? selected.grade : 'Grade A - Premium',
      moisture: selected.status === 'PENDING' ? '' : String(selected.moistureContentPercent ?? ''),
      pesticide: selected.status === 'PENDING' ? '' : String(selected.pesticideResiduePpm ?? ''),
      foreignMatter: selected.status === 'PENDING' ? '' : String(selected.foreignMatterPercent ?? ''),
      remarks: selected.status === 'PENDING' ? '' : (selected.remarks || ''),
      decision: selected.status === 'PENDING' ? 'APPROVED' : selected.status,
    });
  }, [selectedId, checks]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !user) return;
    if (selected.inspectorId !== user.id && selected.inspectorName !== user.name) {
      setNotice('Permission denied: this inspection is not assigned to your account.');
      return;
    }
    const moisture = Number(form.moisture), pesticide = Number(form.pesticide), foreignMatter = Number(form.foreignMatter);
    if ([form.moisture, form.pesticide, form.foreignMatter].some((value) => !value.trim()) ||
        ![moisture, pesticide, foreignMatter].every(Number.isFinite) ||
        moisture < 0 || moisture > 100 || pesticide < 0 || foreignMatter < 0 || foreignMatter > 100 ||
        !form.remarks.trim()) {
      setNotice('Enter actual measured values (within valid ranges) and inspection remarks before submitting.');
      return;
    }
    setBusy(true); setNotice('');
    try {
      await agroApi.updateQualityCheck(selected.id, {
        inspectorId: user.id,
        inspectorName: user.name,
        grade: form.grade,
        moistureContentPercent: moisture,
        pesticideResiduePpm: pesticide,
        foreignMatterPercent: foreignMatter,
        inspectionLocation: selected.inspectionLocation || 'FARM',
        remarks: form.remarks.trim(),
        status: form.decision,
        certificateNumber: form.decision === 'APPROVED' ? (selected.certificateNumber || `QC-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
        inspectionDate: new Date().toISOString().slice(0, 10),
      });
      await refresh();
      setNotice(`Inspection saved: ${form.decision}. ${form.decision === 'APPROVED' ? 'Pickup eligibility can now be checked by logistics.' : 'Pickup must remain blocked.'}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save inspection. The server did not confirm the decision.');
    } finally { setBusy(false); }
  };

  return <div className="space-y-6">
    <div className="flex items-start justify-between gap-3"><div><h1 className="text-xl font-bold text-slate-900">Assigned QC Inspections</h1><p className="mt-1 text-xs text-slate-500">Only inspections assigned to your account are shown. Record actual measurements before making a decision.</p></div><button type="button" onClick={() => void refresh()} className="rounded-lg border px-3 py-2 text-xs font-semibold">Refresh</button></div>
    {notice && <div role="status" aria-live="polite" className={`rounded-lg border p-3 text-sm ${notice.toLowerCase().includes('could not') || notice.toLowerCase().includes('denied') || notice.startsWith('Enter') ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{notice}</div>}
    {loading ? <p className="rounded-xl border bg-white p-8 text-sm text-slate-500">Loading assigned inspections…</p> : checks.length === 0 ? <div className="rounded-xl border border-dashed bg-white p-8 text-center"><h2 className="font-bold text-slate-800">No inspections assigned</h2><p className="mt-2 text-sm text-slate-500">Ask an administrator to assign a pending QC record to your inspector account.</p></div> : <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <div className="space-y-2"><h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Your queue ({checks.length})</h2>{checks.map((check) => <button type="button" key={check.id} onClick={() => setSelectedId(check.id)} className={`w-full rounded-xl border p-4 text-left ${selectedId === check.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}><div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-bold">{check.id}</span><StatusBadge status={check.status} size="sm" /></div><p className="mt-2 text-sm font-semibold">{check.cropName}</p><p className="mt-1 text-xs text-slate-500">{check.farmerName} · {check.batchCode}</p><p className="mt-1 text-xs text-slate-500">{check.farmLocation}</p></button>)}</div>
      {selected && <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-4"><div><h2 className="font-bold text-slate-900">Inspection form</h2><p className="mt-1 text-xs text-slate-500">{selected.id} · {selected.cropName} · {selected.farmerName}</p><p className="mt-1 text-xs text-slate-500">Assigned to: {selected.inspectorName}</p></div><StatusBadge status={selected.status} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">Grade<select value={form.grade} onChange={(e) => setForm({...form, grade:e.target.value as QualityCheck['grade']})} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="Grade A - Premium">Grade A — Premium</option><option value="Grade B - Standard">Grade B — Standard</option><option value="Grade C - Commercial">Grade C — Commercial</option></select></label>
          <label className="text-xs font-semibold text-slate-700">Moisture (%)<input required type="number" min="0" max="100" step="0.01" value={form.moisture} onChange={(e) => setForm({...form, moisture:e.target.value})} placeholder="Actual measured value" className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
          <label className="text-xs font-semibold text-slate-700">Pesticide residue (ppm)<input required type="number" min="0" step="0.001" value={form.pesticide} onChange={(e) => setForm({...form, pesticide:e.target.value})} placeholder="Actual measured value" className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
          <label className="text-xs font-semibold text-slate-700">Foreign matter (%)<input required type="number" min="0" max="100" step="0.01" value={form.foreignMatter} onChange={(e) => setForm({...form, foreignMatter:e.target.value})} placeholder="Actual measured value" className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
        </div>
        <label className="block text-xs font-semibold text-slate-700">Inspection remarks<textarea required rows={3} value={form.remarks} onChange={(e) => setForm({...form, remarks:e.target.value})} placeholder="Write observed findings; do not use placeholder results." className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
        <label className="block text-xs font-semibold text-slate-700">Decision<select value={form.decision} onChange={(e) => setForm({...form, decision:e.target.value as QualityCheck['status']})} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="APPROVED">Approve — eligible for pickup</option><option value="RECHECK_REQUIRED">Recheck required — hold pickup</option><option value="REJECTED">Reject — block pickup</option></select></label>
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Use measurements from the actual inspection. Pending, rejected and recheck-required records must not be picked up.</p>
        <div className="flex justify-end"><button disabled={busy} type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save inspection decision'}</button></div>
      </form>}
    </div>}
  </div>;
};
