import React, { useState } from 'react';
import { Download, BarChart3, TrendingUp, DollarSign, Truck, Warehouse, Percent, ShieldCheck } from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AdminReports: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('April');
  const [selectedYear, setSelectedYear] = useState('2026');

  const areaPerformanceData = [
    { area: 'Tejgaon', deliveries: 142, gross: 412000, commission: 41200, netPayout: 370800 },
    { area: 'Gulshan & Banani', deliveries: 198, gross: 586000, commission: 58600, netPayout: 527400 },
    { area: 'Dhanmondi', deliveries: 112, gross: 320000, commission: 32000, netPayout: 288000 },
    { area: 'Uttara', deliveries: 88, gross: 245000, commission: 24500, netPayout: 220500 },
    { area: 'Bogura Hub', deliveries: 65, gross: 180000, commission: 18000, netPayout: 162000 },
  ];

  const totalGross = areaPerformanceData.reduce((sum, d) => sum + d.gross, 0);
  const totalCommission = areaPerformanceData.reduce((sum, d) => sum + d.commission, 0);
  const totalNet = areaPerformanceData.reduce((sum, d) => sum + d.netPayout, 0);
  const totalDeliveries = areaPerformanceData.reduce((sum, d) => sum + d.deliveries, 0);

  const handleExportCSV = () => {
    const csv =
      'data:text/csv;charset=utf-8,Service Area,Completed Deliveries,Gross Sales (BDT),10% Platform Commission (BDT),Net Farmer Payout (BDT)\n' +
      areaPerformanceData.map((d) => `${d.area},${d.deliveries},${d.gross},${d.commission},${d.netPayout}`).join('\n');
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AgroChain_Admin_Financial_Report_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">National Platform Analytics & Commission Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end supply chain volume, 10% platform revenue, delivery density, and farmer settlement distributions.
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

      {/* UPDATE 5: Key Financial Figures */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium">Gross Product Sales</span>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">৳{totalGross.toLocaleString()}</div>
          <div className="text-emerald-700 text-[11px] font-semibold mt-0.5">{totalDeliveries} verified deliveries</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium">AgroChain 10% Commission</span>
          <div className="text-xl font-bold text-amber-700 mt-1 tabular-nums">৳{totalCommission.toLocaleString()}</div>
          <div className="text-amber-800 text-[11px] font-medium mt-0.5">Automated platform revenue</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium">Net Farmer Payouts</span>
          <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">৳{totalNet.toLocaleString()}</div>
          <div className="text-emerald-700 text-[11px] font-semibold mt-0.5">90% of product sales value</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium">Logistics Freight Pool</span>
          <div className="text-xl font-bold text-blue-700 mt-1 tabular-nums">৳142,500</div>
          <div className="text-blue-700 text-[11px] mt-0.5">Excluded from seller commission</div>
        </div>
      </div>

      {/* Territory Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 flex items-center justify-between">
          <span>Regional Hub Financial Breakdown ({selectedMonth} {selectedYear})</span>
          <span className="text-[11px] font-normal text-slate-500">Includes 10% Commission Audit</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Service Corridor</th>
                <th className="py-2.5 px-4">Completed Deliveries</th>
                <th className="py-2.5 px-4">Gross Sales Value</th>
                <th className="py-2.5 px-4">10% Platform Revenue</th>
                <th className="py-2.5 px-4">Net Seller Disbursements</th>
                <th className="py-2.5 px-4 text-right">Avg Order Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {areaPerformanceData.map((d) => (
                <tr key={d.area} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{d.area}</td>
                  <td className="py-3 px-4 font-mono">{d.deliveries} dropoffs</td>
                  <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">৳{d.gross.toLocaleString()}</td>
                  <td className="py-3 px-4 font-semibold text-amber-700 tabular-nums">৳{d.commission.toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700 tabular-nums">৳{d.netPayout.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono text-slate-700 text-right">৳{Math.round(d.gross / d.deliveries).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Area-Wise Gross Sales vs Net Farmer Disbursements ({selectedMonth} {selectedYear})
        </h3>
        <p className="text-xs text-slate-500 mb-4">Volume and disbursement distributions across major regional hubs</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={areaPerformanceData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="area" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(val) => `৳${val / 1000}k`} />
              <Tooltip
                formatter={(val: any) => [`৳${val.toLocaleString()}`, 'Amount']}
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="gross" name="Gross Product Sales" fill="#047857" radius={[4, 4, 0, 0]} />
              <Bar dataKey="netPayout" name="Net Farmer Earnings (90%)" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission" name="Platform Commission (10%)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
