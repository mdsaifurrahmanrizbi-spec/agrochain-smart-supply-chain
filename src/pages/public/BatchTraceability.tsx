import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { agroApi, store } from '../../services/api';
import { CropBatch, Product } from '../../types';
import { ShieldCheck, Package, ArrowLeft, ShoppingBag } from 'lucide-react';

export const BatchTraceability: React.FC = () => {
  const { batchCode = '' } = useParams<{ batchCode: string }>();
  const [batch, setBatch] = useState<CropBatch | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    setBatch(null);
    setProducts([]);

    const loadTraceability = async () => {
      try {
        const result = await agroApi.getBatchByCode(batchCode);
        if (!active) return;
        setBatch(result);
        if (result) {
          try {
            const linkedProducts = await agroApi.getProductsForBatch(result.id);
            if (active) setProducts(linkedProducts);
          } catch (error) {
            console.error('Could not load products linked to batch:', error);
          }
        }
      } catch (error) {
        console.error('Could not load batch traceability record:', error);
        if (active) setLoadError('We could not connect to the traceability service. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadTraceability();
    return () => { active = false; };
  }, [batchCode]);

  const farm = batch ? store.farms.find((item) => item.id === batch.farmId) : undefined;

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Package className="mx-auto mb-4 h-10 w-10 animate-pulse text-emerald-700" />
          <h1 className="text-xl font-bold text-slate-900">Loading batch details…</h1>
          <p className="mt-2 text-sm text-slate-600">Checking the latest saved traceability and product records.</p>
        </div>
      </main>
    );
  }

  if (loadError || !batch) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Package className="mx-auto mb-4 h-10 w-10 text-slate-400" />
          <h1 className="text-xl font-bold text-slate-900">{loadError ? 'Traceability service unavailable' : 'Batch not found'}</h1>
          <p className="mt-2 break-words text-sm text-slate-600">
            {loadError || `We could not find batch ${batchCode} in the saved traceability records.`}
          </p>
          <Link to="/" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"><ArrowLeft className="h-4 w-4" /> Back to AgroChain</Link>
        </div>
      </main>
    );
  }

  const rows = [
    ['Batch ID', batch.batchCode],
    ['Crop / Variety', [batch.cropName, batch.variety].filter(Boolean).join(' · ')],
    ['Farmer', batch.farmerName],
    ['Farm', batch.farmName],
    ['Location', farm ? [farm.upazila, farm.district, farm.division].filter(Boolean).join(', ') : 'Not provided'],
    ['Harvest date', batch.harvestDate || 'Not provided'],
    ['Recorded quantity', batch.actualQuantityKg.toLocaleString() + ' kg'],
    ['Quality status', batch.qualityStatus.replaceAll('_', ' ')],
  ];

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700"><ArrowLeft className="h-4 w-4" /> AgroChain home</Link>

        {products.length > 0 ? (
          <section className="mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
            <div className="bg-emerald-800 px-6 py-5 text-white sm:px-8">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><ShoppingBag className="h-5 w-5" /> Product linked to this QR batch</div>
              <h1 className="mt-2 break-words text-2xl font-extrabold sm:text-3xl">{products[0].name}</h1>
              <p className="mt-1 text-sm text-emerald-100">{products[0].category} · {products[0].variety}</p>
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-[220px_1fr] sm:p-7">
              <img src={products[0].imageUrl} alt={products[0].name} className="h-52 w-full rounded-xl bg-slate-100 object-cover" />
              <div className="flex flex-col">
                <div className="text-2xl font-extrabold text-slate-900">৳{products[0].pricePerUnit.toLocaleString()} <span className="text-sm font-medium text-slate-500">/ {products[0].unit}</span></div>
                <p className="mt-2 text-sm text-slate-600">{products[0].description || 'Product listing linked to this harvested batch.'}</p>
                <div className="mt-3 text-sm text-slate-700">Available quantity: <strong>{products[0].availableQuantity.toLocaleString()} {products[0].unit}</strong></div>
                <div className="mt-1 text-sm text-slate-700">Farmer: <strong>{products[0].farmerName}</strong></div>
                <div className="mt-auto pt-5">
                  <Link to={`/products/${encodeURIComponent(products[0].id)}`} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">View product details <ArrowLeft className="h-4 w-4 rotate-180" /></Link>
                </div>
              </div>
            </div>
            {products.length > 1 && (
              <div className="border-t border-slate-100 px-6 py-3 text-sm text-slate-600">
                {products.length - 1} more product listing(s) are linked to this batch.
                {products.slice(1).map((product) => (
                  <Link key={product.id} to={`/products/${encodeURIComponent(product.id)}`} className="ml-2 font-semibold text-emerald-700 underline">{product.name}</Link>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-bold text-amber-900">No marketplace product linked yet</h2>
            <p className="mt-1 text-sm text-amber-800">This QR code identifies a saved harvest batch. A product listing will appear here once a marketplace product is created and linked to this batch.</p>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-800 px-6 py-6 text-white sm:px-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><ShieldCheck className="h-5 w-5" /> AgroChain · Batch Traceability</div>
            <h2 className="mt-2 break-words text-xl font-extrabold sm:text-2xl">{batch.cropName}</h2>
            <p className="mt-2 font-mono text-sm text-slate-200">{batch.batchCode}</p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                <div className="mt-2 break-words text-sm font-bold text-slate-900">{value}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500">Product and batch details are loaded from saved AgroChain records.</div>
        </section>
      </div>
    </main>
  );
};
