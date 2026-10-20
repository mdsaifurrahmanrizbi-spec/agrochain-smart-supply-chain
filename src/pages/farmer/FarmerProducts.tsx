import React, { useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RICE_IMAGE, PRODUCE_IMAGE } from '../../services/mockData';
import { Package, Plus, Search, Check, MapPin, Tag } from 'lucide-react';

export const FarmerProducts: React.FC = () => {
  const { user } = useAuth();
  const farmerId = user?.id || 'u-farmer-1';
  const [products, setProducts] = useState(store.products);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
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
    imageUrl: RICE_IMAGE,
    isOrganic: true,
  });

  const myProducts = products.filter((p) => p.farmerId === farmerId);
  const displayed = myProducts.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.variety.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProd = await agroApi.createProduct({
      ...formData,
      batchId: `batch-2026-${Date.now().toString().slice(-3)}`,
      farmerId: user?.id || 'u-farmer-1',
      farmerName: user?.name || 'Md. Rafiqul Islam',
      qualityStatus: 'APPROVED',
      featured: true,
      rating: 4.8,
    });
    setProducts([...store.products]);
    setShowAddModal(false);
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">List Agricultural Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3.5 text-xs">
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
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
