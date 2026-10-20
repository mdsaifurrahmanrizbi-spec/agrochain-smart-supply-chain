import React, { useState } from 'react';
import { store } from '../../services/api';
import { Download, BarChart3, Warehouse, Truck, Package } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const WarehouseReports: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('April');
  const [selectedYear, setSelectedYear] = useState('2026');

  const throughputData = [
    { facility: 'Central Gazipur', intakeMt: 420, dispatchMt: 390 },
    { facility: 'Tejgaon Urban', intakeMt: 180, dispatchMt: 175 },
    { facility: 'Bogura Cold Hub', intakeMt: 680, dispatchMt: 590 },
  ];

  const handleExportCSV = () => {
    const csv =
      'data:text/csv;charset=utf-8,Facility,Intake Volume (MT),Dispatch Volume (MT)\n' +
      throughputData.map((d) => `${d.facility},${d.intakeMt},${d.dispatchMt}`).join('\n');
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AgroChain_Warehouse_Report_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Warehouse Throughput & Inventory Report</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monthly inbound field produce receipts, outbound customer dispatches, and cold room capacity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden font-medium"
          >
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
            <option value="April">April</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden font-medium"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium">Monthly Inbound Intake</span>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">1,280 MT</div>
          <div className="text-emerald-700 text-[11px] font-semibold mt-0.5">3 regional godowns</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium">Monthly Outbound Dispatch</span>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">1,155 MT</div>
          <div className="text-slate-500 text-[11px] mt-0.5">Customer & retail fulfillment</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium">Inter-Godown Freight</span>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">48 Transits</div>
          <div className="text-emerald-700 text-[11px] font-semibold mt-0.5">100% on schedule</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium">Storage Shrinkage Rate</span>
          <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">0.32%</div>
          <div className="text-emerald-700 text-[11px] font-semibold mt-0.5">Cold storage efficiency</div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Intake vs Dispatch by Regional Hub ({selectedMonth} {selectedYear})
        </h3>
        <p className="text-xs text-slate-500 mb-4">Throughput comparisons across Bangladesh facilities</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={throughputData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="facility" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val} MT`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="intakeMt" name="Inbound Intake (MT)" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="dispatchMt" name="Outbound Dispatch (MT)" fill="#047857" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
