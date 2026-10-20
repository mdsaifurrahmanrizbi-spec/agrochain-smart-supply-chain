import React, { useState } from 'react';
import { store } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, Download, Truck, DollarSign, CheckCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const DeliveryReports: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('April');
  const [selectedYear, setSelectedYear] = useState('2026');

  const performanceData = [
    { week: 'Week 1', pickups: 14, deliveries: 22 },
    { week: 'Week 2', pickups: 18, deliveries: 28 },
    { week: 'Week 3', pickups: 21, deliveries: 34 },
    { week: 'Week 4', pickups: 16, deliveries: 31 },
  ];

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Count / Value\n' +
      `Assigned Pickups,69\n` +
      `Completed Pickups,69\n` +
      `Assigned Deliveries,115\n` +
      `Completed Deliveries,114\n` +
      `Failed Deliveries,1\n` +
      `COD Collected (BDT),142500\n` +
      `COD Deposited (BDT),138325\n` +
      `COD Pending Deposit (BDT),4175\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AgroChain_Logistics_Report_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Delivery Partner Operational Report</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monthly fulfillment metrics, pickup completions, and COD cash accounting.
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

      {/* 8 Specific Metrics as per prompt */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium">Assigned Pickups</span>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">69</div>
          <div className="text-emerald-700 text-[11px] font-semibold mt-0.5">Shibganj & Savar</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium">Completed Pickups</span>
          <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">69</div>
          <div className="text-slate-500 text-[11px] mt-0.5">100% completion</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium">Assigned Deliveries</span>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">115</div>
          <div className="text-slate-500 text-[11px] mt-0.5">Tejgaon & Banani</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium">Completed Deliveries</span>
          <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">114</div>
          <div className="text-slate-500 text-[11px] mt-0.5">99.1% success</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium">Failed Deliveries</span>
          <div className="text-xl font-bold text-rose-600 mt-1 tabular-nums">1</div>
          <div className="text-slate-500 text-[11px] mt-0.5">Customer rescheduled</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium">COD Collected</span>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">৳142,500</div>
          <div className="text-slate-500 text-[11px] mt-0.5">Total cash handled</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium">COD Deposited</span>
          <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">৳138,325</div>
          <div className="text-slate-500 text-[11px] mt-0.5">Verified at godown</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium">COD Pending Deposit</span>
          <div className="text-xl font-bold text-amber-700 mt-1 tabular-nums">৳4,175</div>
          <div className="text-amber-800 text-[11px] font-semibold mt-0.5">In possession</div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Weekly Jobs Breakdown ({selectedMonth} {selectedYear})
        </h3>
        <p className="text-xs text-slate-500 mb-4">Volume of pickups vs final customer deliveries</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="pickups" name="Farm Pickups" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deliveries" name="Customer Deliveries" fill="#047857" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
