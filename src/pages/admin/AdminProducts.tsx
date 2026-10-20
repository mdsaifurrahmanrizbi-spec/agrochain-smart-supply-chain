import React, { useState } from 'react';
import { store } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Package, Search, Filter } from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const [products] = useState(store.products);
  const [search, setSearch] = useState('');

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.farmerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Platform Product Listings Registry</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review agricultural commodities listed for public consumer sale across Bangladesh.
        </p>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by commodity name or producer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-hidden text-slate-800"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Origin Farmer & Farm</th>
                <th className="py-3 px-4">Price / Unit</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4">Harvest Date</th>
                <th className="py-3 px-4">Quality Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.variety}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{p.category}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{p.farmerName}</div>
                    <div className="text-[11px] text-slate-500">{p.farmLocation}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">৳{p.pricePerUnit} / {p.unit}</td>
                  <td className="py-3 px-4 tabular-nums font-semibold">{p.availableQuantity} {p.unit}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{p.harvestDate}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={p.qualityStatus} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
