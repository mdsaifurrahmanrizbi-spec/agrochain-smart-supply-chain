import React, { useEffect, useMemo, useState } from 'react';
import { agroApi, store } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CropBatch, Product } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Package, Search, Check, X, RefreshCw } from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(store.products);
  const [batches, setBatches] = useState<CropBatch[]>(store.batches);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    const [freshProducts, freshBatches] = await Promise.all([agroApi.getProducts(), agroApi.getBatches()]);
    setProducts([...freshProducts]);
    setBatches([...freshBatches]);
  };

  useEffect(() => {
    let active = true;
    refresh().catch((error) => {
      console.error('Could not load product approval queue:', error);
      if (active) setNotice('Could not refresh product listings from the server. Please retry.');
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.farmerName.toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  const getListingStatus = (product: Product) => {
    if (product.listingStatus) return product.listingStatus;
    const batch = batches.find((item) => item.id === product.batchId);
    return product.qualityStatus === 'APPROVED' && batch?.qualityStatus === 'APPROVED'
      ? 'APPROVED'
      : 'PENDING_APPROVAL';
  };

  const reviewProduct = async (product: Product, decision: 'APPROVED' | 'REJECTED') => {
    const batch = batches.find((item) => item.id === product.batchId);
    if (decision === 'APPROVED' && (!batch || batch.qualityStatus !== 'APPROVED' || product.qualityStatus !== 'APPROVED')) {
      setNotice('This product cannot be approved until its linked crop batch passes quality inspection.');
      return;
    }
    setBusyId(product.id);
    setNotice('');
    try {
      await agroApi.updateProduct(product.id, {
        listingStatus: decision,
        listingReviewedAt: new Date().toISOString(),
        listingReviewedBy: user?.name || 'Admin',
        listingReviewNotes: decision === 'APPROVED' ? 'Listing approved for marketplace publication.' : 'Listing rejected by Admin.',
      });
      await refresh();
      setNotice(decision === 'APPROVED'
        ? `${product.name} is approved and can appear in the Buyer Marketplace.`
        : `${product.name} was rejected and will remain hidden from buyers.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save the product review.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Product Listing Approval</h1>
          <p className="mt-1 text-xs text-slate-500">Approve a farmer listing only after its linked crop batch has passed quality inspection.</p>
        </div>
        <button type="button" onClick={() => void refresh().catch(() => setNotice('Refresh failed.'))} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {notice && <div role="status" aria-live="polite" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">{notice}</div>}

      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input type="text" placeholder="Search by commodity name or producer..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full text-xs bg-transparent focus:outline-hidden text-slate-800" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Farmer & Farm</th>
                <th className="py-3 px-4">Price / Stock</th>
                <th className="py-3 px-4">Crop Batch</th>
                <th className="py-3 px-4">Quality</th>
                <th className="py-3 px-4">Listing Status</th>
                <th className="py-3 px-4">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((product) => {
                const batch = batches.find((item) => item.id === product.batchId);
                const status = getListingStatus(product);
                const canApprove = Boolean(batch && batch.qualityStatus === 'APPROVED' && product.qualityStatus === 'APPROVED');
                return (
                  <tr key={product.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={product.imageUrl} alt="" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
                        <div><div className="font-bold text-slate-900">{product.name}</div><div className="text-[11px] text-slate-500">{product.category} · {product.variety}</div></div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><div className="font-semibold">{product.farmerName}</div><div className="text-[11px] text-slate-500">{product.farmLocation}</div></td>
                    <td className="py-3 px-4"><div className="font-bold">৳{product.pricePerUnit} / {product.unit}</div><div className="text-[11px] text-slate-500">{product.availableQuantity} {product.unit}</div></td>
                    <td className="py-3 px-4"><div className="font-mono text-[11px]">{batch?.batchCode || 'Unlinked batch'}</div><div className="text-[11px] text-slate-500">{batch?.cropName || 'Batch record missing'}</div></td>
                    <td className="py-3 px-4"><StatusBadge status={product.qualityStatus} size="sm" /></td>
                    <td className="py-3 px-4"><StatusBadge status={status} size="sm" /></td>
                    <td className="py-3 px-4">
                      {status === 'PENDING_APPROVAL' ? (
                        <div className="flex flex-col gap-1.5">
                          <button type="button" disabled={busyId === product.id || !canApprove} onClick={() => void reviewProduct(product, 'APPROVED')} className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Check className="h-3 w-3" /> Approve</button>
                          <button type="button" disabled={busyId === product.id} onClick={() => void reviewProduct(product, 'REJECTED')} className="inline-flex items-center justify-center gap-1 rounded-md border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 disabled:opacity-40"><X className="h-3 w-3" /> Reject</button>
                          {!canApprove && <span className="max-w-40 text-[10px] text-amber-700">Waiting for linked batch QC approval</span>}
                        </div>
                      ) : <span className="text-[11px] text-slate-500">{status === 'APPROVED' ? 'Published' : 'Rejected'}</span>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-500">No product listings found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
