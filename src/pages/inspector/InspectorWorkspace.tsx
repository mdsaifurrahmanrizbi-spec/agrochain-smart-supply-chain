import React, { useEffect, useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { QualityCheck } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShieldCheck,
  Award,
  FileCheck,
  Check,
  AlertTriangle,
  XCircle,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';

export const InspectorWorkspace: React.FC = () => {
  const { user } = useAuth();
  const [checks, setChecks] = useState(store.qualityChecks);
  const [selectedCheckId, setSelectedCheckId] = useState<string>(checks[1]?.id || checks[0]?.id);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    agroApi.getQualityChecks()
      .then((loadedChecks) => {
        if (!active) return;
        setChecks(loadedChecks);
        if (loadedChecks.length > 0) {
          setSelectedCheckId((currentId) =>
            loadedChecks.some((check) => check.id === currentId)
              ? currentId
              : loadedChecks[0].id
          );
        }
      })
      .catch((error) => {
        console.error('Failed to load inspector quality checks:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  const selected = checks.find((c) => c.id === selectedCheckId) || checks[0];

  const [form, setForm] = useState({
    grade: selected?.grade || ('Grade A - Premium' as const),
    moisture: selected?.moistureContentPercent ?? 11.2,
    pesticide: selected?.pesticideResiduePpm ?? 0.02,
    foreignMatter: selected?.foreignMatterPercent ?? 0.3,
    location: selected?.inspectionLocation || ('FARM' as const),
    remarks: selected?.remarks || 'Grain moisture passed laboratory standard. Produce certified for farm pickup.',
  });

  useEffect(() => {
    if (!selected) return;
    setForm({
      grade: selected.grade || 'Grade A - Premium',
      moisture: selected.moistureContentPercent ?? 11.2,
      pesticide: selected.pesticideResiduePpm ?? 0.02,
      foreignMatter: selected.foreignMatterPercent ?? 0.3,
      location: selected.inspectionLocation || 'FARM',
      remarks: selected.remarks || '',
    });
  }, [selectedCheckId, checks]);

  const handleUpdateDecision = async (decision: QualityCheck['status']) => {
    const certNumber =
      decision === 'APPROVED'
        ? `QC-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`
        : undefined;

    setNotice(null);

    try {
      await agroApi.updateQualityCheck(selected.id, {
        status: decision,
        grade: form.grade,
        moistureContentPercent: form.moisture,
        pesticideResiduePpm: form.pesticide,
        foreignMatterPercent: form.foreignMatter,
        inspectionLocation: 'FARM',
        remarks: form.remarks,
        certificateNumber: certNumber,
        inspectionDate: new Date().toISOString().substring(0, 10),
      });

      setChecks([...store.qualityChecks]);
      setNotice(
        `Inspection saved. Status set to: ${decision}. ${
          decision === 'APPROVED'
            ? 'Farm pickup is now UNLOCKED for logistics partner.'
            : decision === 'REJECTED'
            ? 'Farm pickup is BLOCKED. Seller notified.'
            : 'Consignment placed ON HOLD.'
        }`
      );
      setTimeout(() => setNotice(null), 4000);
    } catch (error) {
      console.error('Failed to save quality inspection:', error);
      setNotice(
        `Failed to save inspection: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Farm Origin Quality Control Workspace</h1>
        <p className="text-xs text-slate-500 mt-1">
          Perform primary quality evaluations directly at the grower's farm before product pickup authorization.
        </p>
      </div>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3 border rounded-lg text-sm font-semibold flex items-center gap-2 ${
            notice.startsWith('Failed')
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* UPDATE 3 Farm Inspection Protocol Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Primary QC at Seller/Farm Location:</span>
          <p className="text-emerald-800/90 leading-relaxed">
            Quality Control must occur <strong>BEFORE</strong> pickup completion.
            When you mark <strong>APPROVED</strong>, the assigned pickup partner is authorized to load the produce.
            If marked <strong>REJECTED</strong>, the pickup is blocked immediately and the farmer is notified.
            If <strong>RECHECK_REQUIRED</strong>, the consignment is placed on hold for re-testing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Consignment Selector */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pending Farm Inspections ({checks.length})
          </h3>

          <div className="space-y-2">
            {checks.map((c) => {
              const isSelected = c.id === selectedCheckId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCheckId(c.id);
                    setForm({
                      grade: c.grade,
                      moisture: c.moistureContentPercent,
                      pesticide: c.pesticideResiduePpm,
                      foreignMatter: c.foreignMatterPercent,
                      location: 'FARM',
                      remarks: c.remarks,
                    });
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-slate-900">{c.batchCode}</span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">{c.cropName}</div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{c.farmerName} · {c.farmLocation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Inspection Form */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                  Field Inspection Station
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {selected.cropName} — Batch {selected.batchCode}
                </h2>
                <p className="text-slate-500 mt-0.5">
                  Farm: <strong>{selected.farmLocation}</strong> · Grower: {selected.farmerName}
                </p>
              </div>

              <div className="text-right">
                <StatusBadge status={selected.status} />
                {selected.certificateNumber && (
                  <span className="block text-[10px] font-mono text-emerald-700 font-bold mt-1">
                    {selected.certificateNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Test Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Quality Grade Classification
                </label>
                <select
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-medium"
                >
                  <option value="Grade A - Premium">Grade A - Premium Export Standard</option>
                  <option value="Grade B - Standard">Grade B - Standard Consumer Quality</option>
                  <option value="Grade C - Commercial">Grade C - Commercial / Processing</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Moisture Content (% Target: 10 - 13%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.moisture}
                  onChange={(e) => setForm({ ...form, moisture: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Pesticide Residue (ppm Max: 0.05)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.pesticide}
                  onChange={(e) => setForm({ ...form, pesticide: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Foreign Matter / Impurities (% Max: 1.0%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.foreignMatter}
                  onChange={(e) => setForm({ ...form, foreignMatter: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Field Agronomist Remarks & Certification Notes
              </label>
              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden resize-none"
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  if (!selected) return;
                  setNotice(null);
                  try {
                    await agroApi.saveQualityCheckDetails(selected.id, {
                      grade: form.grade,
                      moistureContentPercent: form.moisture,
                      pesticideResiduePpm: form.pesticide,
                      foreignMatterPercent: form.foreignMatter,
                      inspectionLocation: 'FARM',
                      remarks: form.remarks,
                      inspectionDate: selected.inspectionDate ||
                        new Date().toISOString().substring(0, 10),
                    });
                    setChecks([...store.qualityChecks]);
                    setNotice('Inspection details saved. Workflow status unchanged.');
                  } catch (error) {
                    console.error('Failed to save inspection details:', error);
                    setNotice(
                      `Failed to save details: ${
                        error instanceof Error ? error.message : 'Unknown error'
                      }`
                    );
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
              >
                Save Inspection Details
              </button>
            </div>

            {notice && (
              <div
                role="status"
                aria-live="polite"
                className={`mt-3 p-3 rounded-lg border text-sm font-semibold ${
                  notice.startsWith('Failed')
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {notice}
              </div>
            )}

            {/* Decision Buttons with Workflow Logic */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-slate-500 text-[11px]">
                Auditor: <strong>{user?.name || 'Dr. Farzana Akter'}</strong> · Location: Farm Origin Gate
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateDecision('RECHECK_REQUIRED')}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold border border-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Request Recheck (Keep on Hold)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateDecision('REJECTED')}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold border border-rose-300 transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject (Block Pickup)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateDecision('APPROVED')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve & Unlock Pickup</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};






