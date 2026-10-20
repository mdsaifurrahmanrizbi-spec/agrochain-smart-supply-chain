import React, { useState } from 'react';
import { store } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Warehouse, Search, Filter, ShieldCheck } from 'lucide-react';

export const WarehouseInventory: React.FC = () => {
  const [inventory, setInventory] = useState(store.inventory);
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');

  const filtered = inventory.filter((item) => {
    const matchesSearch = item.cropName.toLowerCase().includes(search.toLowerCase()) || item.batchCode.toLowerCase().includes(search.toLowerCase());
    const matchesWh = selectedWarehouse === 'All' || item.warehouseName.includes(selectedWarehouse);
    return matchesSearch && matchesWh;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Warehouse Inventory & Stock Control</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-godown stock allocation across Central Gazipur, Tejgaon, and Bogura hubs.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search crop or batch code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
          />
        </div>

        <select
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
          className="w-full sm:w-64 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
        >
          <option value="All">All Warehouses & Godowns</option>
          <option value="Central">Central Gazipur Agro-Logistics Center</option>
          <option value="Tejgaon">Tejgaon Urban Dispatch Godown</option>
          <option value="Bogura">North Bengal Cold Hub</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Warehouse Facility</th>
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4">Batch Code</th>
                <th className="py-3 px-4">Grower Name</th>
                <th className="py-3 px-4">Stock (kg)</th>
                <th className="py-3 px-4">Bay / Storage Zone</th>
                <th className="py-3 px-4">Arrival Date</th>
                <th className="py-3 px-4">Quality Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.warehouseName}</td>
                  <td className="py-3 px-4">{item.cropName}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.batchCode}</td>
                  <td className="py-3 px-4">{item.farmerName}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                    {item.quantityKg.toLocaleString()} kg
                  </td>
                  <td className="py-3 px-4 text-slate-600">{item.storageZone}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{item.arrivalDate}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={item.qualityStatus} size="sm" />
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
