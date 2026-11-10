import React, { useEffect, useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CropBatch, Product } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Package, Plus, Search, Check, MapPin, Tag } from 'lucide-react';


const compressProductImage = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  const bitmap = await createImageBitmap(file);
  const maxDimension = 1200;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not process this image. Please try another file.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob: Blob | null = null;
  for (const quality of [0.82, 0.72, 0.62, 0.52]) {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size <= 650 * 1024) break;
  }
  if (!blob || blob.size > 650 * 1024) throw new Error('Image is too large after compression. Please choose a smaller image.');

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read the selected image.'));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(blob);
  });
};

export const FarmerProducts: React.FC = () => {
  const { user } = useAuth();
  const farmerId = user?.id || 'u-farmer-1';
  const [products, setProducts] = useState(store.products);
  const [batches, setBatches] = useState<CropBatch[]>(store.batches.filter((batch) => batch.farmerId === farmerId));
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [imageError, setImageError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    batchId: '',
    category: 'Grains & Cereals',
    cropType: 'Paddy Rice',
    variety: '',
    farmName: 'Bogura Green Valley Agro Farm',
    farmLocation: 'Shibganj, Bogura',
    description: '',
    pricePerUnit: 120,
    unit: 'kg' as const,
    availableQuantity: 500,
    harvestDate: '2026-04-10',
    imageUrl: '',
    isOrganic: true,
  });

  useEffect(() => {
    let active = true;
    Promise.all([agroApi.getProducts(), agroApi.getBatches(farmerId)]).then(([freshProducts, freshBatches]) => {
      if (!active) return;
      setProducts([...freshProducts]);
      setBatches([...freshBatches]);
    }).catch((error) => console.error('Could not refresh farmer product data:', error));
    return () => { active = false; };
  }, [farmerId]);

  const selectedBatch = batches.find((batch) => batch.id === formData.batchId);
  const myProducts = products.filter((p) => p.farmerId === farmerId);
  const displayed = myProducts.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.variety.toLowerCase().includes(search.toLowerCase())
  );

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');
    try {
      const imageUrl = await compressProductImage(file);
      setFormData((current) => ({ ...current, imageUrl }));
    } catch (error) {
      setFormData((current) => ({ ...current, imageUrl: '' }));
      setImageError(error instanceof Error ? error.message : 'Could not process the selected image.');
      e.target.value = '';
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) {
      setImageError('Select one of your registered crop batches before submitting this listing.');
      return;
    }
    if (!formData.imageUrl) {
      setImageError('Please upload a product image before publishing.');
      return;
    }
    setIsPublishing(true);
    setImageError('');
    try {
      await agroApi.createProduct({
      ...formData,
      batchId: selectedBatch.id,
      cropType: selectedBatch.cropName,
      variety: selectedBatch.variety,
      farmName: selectedBatch.farmName,
      harvestDate: selectedBatch.harvestDate,
      farmerId: user?.id || 'u-farmer-1',
      farmerName: user?.name || 'Farmer',
      qualityStatus: selectedBatch.qualityStatus,
      listingStatus: 'PENDING_APPROVAL',
      featured: false,
      rating: undefined,
      });
      setProducts([...store.products]);
      setShowAddModal(false);
      setFormData((current) => ({ ...current, batchId: '', name: '', variety: '', description: '', imageUrl: '' }));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Could not publish this product. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Agricultural Product Listings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage live agricultural listings available for buyers in Bangladesh.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product Listing</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Filter your products by name or variety..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-hidden text-slate-800"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Variety</th>
                <th className="py-3 px-4">Price / Unit</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Harvest Date</th>
                <th className="py-3 px-4">Quality Status</th>
                <th className="py-3 px-4">Listing Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.farmName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{p.category}</td>
                  <td className="py-3 px-4 font-medium">{p.variety}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">৳{p.pricePerUnit} / {p.unit}</td>
                  <td className="py-3 px-4 tabular-nums font-semibold">{p.availableQuantity} {p.unit}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{p.harvestDate}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={p.qualityStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={p.listingStatus || (p.qualityStatus === 'APPROVED' ? 'APPROVED' : 'PENDING_APPROVAL')} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">List Agricultural Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Crop Batch</label>
                <select
                  required
                  value={formData.batchId}
                  onChange={(e) => {
                    const batch = batches.find((item) => item.id === e.target.value);
                    setFormData((current) => ({ ...current, batchId: e.target.value, cropType: batch?.cropName || current.cropType, variety: batch?.variety || current.variety, harvestDate: batch?.harvestDate || current.harvestDate }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                >
                  <option value="">Select a registered crop batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>{batch.batchCode} — {batch.cropName} ({batch.variety}) · {batch.qualityStatus}</option>
                  ))}
                </select>
                {batches.length === 0 && <p className="mt-1 text-amber-700">Create a Crop Batch first. A product must be linked to a real batch.</p>}
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Export Grade BARI Onion-1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                  >
                    <option value="Grains & Cereals">Grains & Cereals</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Spices">Spices</option>
                    <option value="Cash Crops">Cash Crops</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Variety</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BARI Piaz-1"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Price in Taka (৳)</label>
                  <input
                    type="number"
                    required
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData({ ...formData, pricePerUnit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                  >
                    <option value="kg">kg</option>
                    <option value="maund">maund (40kg)</option>
                    <option value="ton">ton</option>
                    <option value="crate">crate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={formData.availableQuantity}
                    onChange={(e) => setFormData({ ...formData, availableQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Product Image <span className="text-rose-600">*</span></label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg file:mr-3 file:px-3 file:py-1 file:border-0 file:rounded-md file:bg-emerald-100 file:text-emerald-800 file:font-semibold"
                />
                <p className="text-[10px] text-slate-500 mt-1">Upload a clear photo of this exact product. JPG, PNG or WebP; optimized before saving.</p>
                {formData.imageUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={formData.imageUrl} alt="Product image preview" className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                    <span className="text-[11px] text-emerald-700 font-semibold">Image ready to publish</span>
                  </div>
                )}
                {imageError && <p role="alert" className="text-[11px] text-rose-600 mt-2">{imageError}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe crop quality, soil, harvest technique..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setImageError(''); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing || !formData.imageUrl}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-xs"
                >
                  {isPublishing ? 'Publishing…' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
