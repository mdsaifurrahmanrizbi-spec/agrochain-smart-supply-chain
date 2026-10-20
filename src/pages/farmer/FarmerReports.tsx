import React, { useState } from 'react';
import { store } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, Download, Calendar, TrendingUp, Percent, ShieldCheck } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const FarmerReports: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('April');
  const [selectedYear, setSelectedYear] = useState('2026');

  const monthlyReportData = [
    { crop: 'Chinigura Rice', volumeKg: 3200, gross: 464000, commission: 46400, net: 417600 },
    { crop: 'Diamant Potato', volumeKg: 8500, gross: 323000, commission: 32300, net: 290700 },
    { crop: 'Vine Tomatoes', volumeKg: 1800, gross: 99000, commission: 9900, net: 89100 },
    { crop: 'Deshi Onions', volumeKg: 2400, gross: 163200, commission: 16320, net: 146880 },
  ];

  const totalGross = monthlyReportData.reduce((sum, d) => sum + d.gross, 0);
  const totalCommission = monthlyReportData.reduce((sum, d) => sum + d.commission, 0);
  const totalNet = monthlyReportData.reduce((sum, d) => sum + d.net, 0);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Crop,Harvest Volume (kg),Gross Sales (BDT),AgroChain Commission 10% (BDT),Net Seller Payout (BDT)\n' +
      monthlyReportData.map((e) => `${e.crop},${e.volumeKg},${e.gross},${e.commission},${e.net}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AgroChain_Farmer_Earnings_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Farmer Sales, Net Earnings & Commission Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical farm yield analytics, automated 10% commission accounting, and net revenue distributions.
          </p>
        </div>

        {/* Month Selector & CSV Export */}
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

      {/* UPDATE 5: Financial Statement Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium">Harvest Volume Sold</span>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">15,900 kg</div>
          <div className="text-emerald-700 text-[11px] font-semibold mt-0.5">38 Farm Pickups</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium">Gross Crop Sales</span>
          <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">৳{totalGross.toLocaleString()}</div>
          <div className="text-slate-500 text-[11px] mt-0.5">Marketplace sales value</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium">Platform Commission (10%)</span>
          <div className="text-xl font-bold text-amber-700 mt-1 tabular-nums">-৳{totalCommission.toLocaleString()}</div>
          <div className="text-amber-800 text-[11px] font-medium mt-0.5">Automated 10% platform fee</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium">Net Seller Payout (90%)</span>
          <div className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">৳{totalNet.toLocaleString()}</div>
          <div className="text-emerald-700 text-[11px] font-semibold mt-0.5">Direct to farmer accounts</div>
        </div>
      </div>

      {/* Detailed Crop Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 flex items-center justify-between">
          <span>Monthly Financial Summary by Variety ({selectedMonth} {selectedYear})</span>
          <span className="text-[11px] font-normal text-slate-500">Excludes delivery freight charges</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Produce Variety</th>
                <th className="py-2.5 px-4">Volume (kg)</th>
                <th className="py-2.5 px-4">Gross Sales Value</th>
                <th className="py-2.5 px-4">AgroChain 10% Fee</th>
                <th className="py-2.5 px-4">Net Farmer Earnings</th>
                <th className="py-2.5 px-4 text-right">Avg Return / kg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyReportData.map((d) => (
                <tr key={d.crop} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{d.crop}</td>
                  <td className="py-3 px-4 font-mono">{d.volumeKg.toLocaleString()} kg</td>
                  <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">৳{d.gross.toLocaleString()}</td>
                  <td className="py-3 px-4 font-semibold text-amber-700 tabular-nums">-৳{d.commission.toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700 tabular-nums">৳{d.net.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono text-slate-700 text-right">৳{(d.net / d.volumeKg).toFixed(1)} / kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Net Revenue vs Commission by Crop ({selectedMonth} {selectedYear})
        </h3>
        <p className="text-xs text-slate-500 mb-4">Comparison of net seller payouts across harvested varieties</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyReportData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="crop" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(val) => `৳${val / 1000}k`} />
              <Tooltip
                formatter={(val: any) => [`৳${val.toLocaleString()}`, 'Amount']}
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="net" name="Net Seller Earnings (90%)" fill="#047857" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission" name="Platform Commission (10%)" fill="#D97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
