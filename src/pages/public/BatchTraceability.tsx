import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { store } from '../../services/api';
import { ShieldCheck, Sprout, CalendarDays, Package, MapPin, ArrowLeft } from 'lucide-react';

export const BatchTraceability: React.FC = () => {
  const { batchCode = '' } = useParams<{ batchCode: string }>();
  const batch = store.batches.find((item) => item.batchCode.toLowerCase() === batchCode.toLowerCase());
  const farm = batch ? store.farms.find((item) => item.id === batch.farmId) : undefined;

  if (!batch) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Package className="mx-auto mb-4 h-10 w-10 text-slate-400" />
          <h1 className="text-xl font-bold text-slate-900">Batch not found</h1>
          <p className="mt-2 text-sm text-slate-600">We could not find batch {batchCode} in the currently available traceability records.</p>
          <Link to="/" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"><ArrowLeft className="h-4 w-4" /> Back to AgroChain</Link>
        </div>
      </main>
    );
  }

  const rows = [
    ['Batch ID', batch.batchCode],
    ['Product / Crop', batch.cropName],
    ['Variety', batch.variety],
    ['Farmer', batch.farmerName],
    ['Farm', batch.farmName],
    ['Location', farm ? [farm.upazila, farm.district, farm.division].filter(Boolean).join(', ') : 'Not provided'],
    ['Sowing date', batch.sowingDate || 'Not provided'],
    ['Harvest date', batch.harvestDate || 'Not provided'],
    ['Recorded quantity', batch.actualQuantityKg.toLocaleString() + ' kg'],
    ['Quality status', batch.qualityStatus.replaceAll('_', ' ')],
  ];

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700"><ArrowLeft className="h-4 w-4" /> AgroChain home</Link>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-emerald-800 px-6 py-7 text-white sm:px-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><ShieldCheck className="h-5 w-5" /> AgroChain · Batch Traceability</div>
            <h1 className="mt-3 break-words text-2xl font-extrabold sm:text-3xl">{batch.cropName}</h1>
            <p className="mt-2 font-mono text-sm text-emerald-100">{batch.batchCode}</p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                <div className="mt-2 break-words text-sm font-bold text-slate-900">{value}</div>
              </div>
            ))}
          </div>
          {batch.blockchainHash && (
            <div className="mx-5 mb-5 rounded-xl border border-slate-200 p-4 sm:mx-8 sm:mb-8">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><ShieldCheck className="h-4 w-4 text-emerald-700" /> Ledger fingerprint</div>
              <p className="mt-2 break-all font-mono text-xs text-slate-600">{batch.blockchainHash}</p>
            </div>
          )}
          <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500">Details shown are from the traceability record available to this AgroChain demo.</div>
        </section>
      </div>
    </main>
  );
};
