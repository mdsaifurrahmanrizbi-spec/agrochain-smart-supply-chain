import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { store } from '../../services/api';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Package,
  Layers,
  ShoppingBag,
  CreditCard,
  Plus,
  Truck,
  ArrowRight,
  TrendingUp,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const FarmerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const farmerId = user?.id || 'u-farmer-1';
  const myProducts = store.products.filter((p) => p.farmerId === farmerId);
  const myBatches = store.batches.filter((b) => b.farmerId === farmerId);
  const myOrders = store.orders.filter((o) =>
    o.items.some((item) => item.farmerId === farmerId)
  );

  const totalEarnings = store.settlements
    .filter((s) => s.farmerId === farmerId && (s.settlementStatus === 'PAID' || s.settlementStatus === 'COMPLETED'))
    .reduce((acc, curr) => acc + (curr.netPayout || curr.amount || 0), 0);

  const pendingPayouts = store.settlements
    .filter((s) => s.farmerId === farmerId && s.settlementStatus !== 'PAID' && s.settlementStatus !== 'COMPLETED')
    .reduce((acc, curr) => acc + (curr.netPayout || curr.amount || 0), 0);

  const salesData = [
    { month: 'Nov', revenue: 18500 },
    { month: 'Dec', revenue: 24000 },
    { month: 'Jan', revenue: 31200 },
    { month: 'Feb', revenue: 42800 },
    { month: 'Mar', revenue: 58400 },
    { month: 'Apr', revenue: 76200 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Farmer & Producer Portal
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            Welcome back, {user?.name || 'Md. Rafiqul Islam'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Farm Location: Shibganj & Sariakandi, Bogura · Connected to Central Gazipur Godown</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/farmer/products')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>List Product</span>
          </button>
          <button
            onClick={() => navigate('/farmer/batches')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span>New Crop Batch</span>
          </button>
        </div>
      </div>

      {/* 4 Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Products Listed"
          value={myProducts.length}
          subtitle="4 active for sale in marketplace"
          icon={Package}
          trend={{ value: '+2 this month', isPositive: true }}
          onClick={() => navigate('/farmer/products')}
        />
        <MetricCard
          title="Active Crop Batches"
          value={myBatches.length}
          subtitle="All batches assigned ledger QR"
          icon={Layers}
          onClick={() => navigate('/farmer/batches')}
        />
        <MetricCard
          title="Customer Orders"
          value={myOrders.length}
          subtitle="Latest from Banani DOHS, Dhaka"
          icon={ShoppingBag}
          trend={{ value: '100% fulfill rate', isPositive: true }}
          onClick={() => navigate('/farmer/orders')}
        />
        <MetricCard
          title="Total Settled Earnings"
          value={`৳${(totalEarnings || 68450).toLocaleString()}`}
          subtitle={`৳${pendingPayouts.toLocaleString()} pending verified delivery`}
          icon={CreditCard}
          trend={{ value: 'Direct bKash Payout', isPositive: true }}
          onClick={() => navigate('/farmer/payments')}
        />
      </div>

      {/* Sales Chart & Product Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Farmer Sales Revenue (BDT)</h2>
              <p className="text-xs text-slate-500">Monthly direct sales through AgroChain network</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 tabular-nums">
              +38% vs prev season
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="farmerRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(val) => `৳${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`৳${val.toLocaleString()}`, 'Sales']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#047857" strokeWidth={2.5} fillOpacity={1} fill="url(#farmerRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pickup & Traceability Status Card */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Live Logistics Pickup</h3>
              <Truck className="w-4 h-4 text-emerald-700" />
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Shipment #AGRO-2026-0891</span>
                  <StatusBadge status="DELIVERED" size="sm" />
                </div>
                <p className="text-slate-600 mt-1">25kg Chinigura Rice + 10kg Tomatoes</p>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Pickup Partner: <strong>Rafiq Chowdhury</strong></span>
                  <span className="text-emerald-700 font-semibold">Collected at Farm</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Shipment #AGRO-2026-0894</span>
                  <StatusBadge status="PICKUP_ASSIGNED" size="sm" />
                </div>
                <p className="text-slate-600 mt-1">15kg Chinigura Rice</p>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Assigned Partner: <strong>Kamal Hossain</strong></span>
                  <span className="text-blue-700 font-semibold">Collection Today</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/farmer/tracking"
            className="mt-4 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold text-center border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Track All Field Shipments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Customer Orders</h3>
            <p className="text-xs text-slate-500">Orders placed by customers for your harvested crops</p>
          </div>
          <Link to="/farmer/orders" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
            View All Orders
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Products</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myOrders.slice(0, 5).map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                  <td className="py-3 px-4">
                    {ord.items.map((i) => `${i.quantity}${i.unit} ${i.productName}`).join(', ')}
                  </td>
                  <td className="py-3 px-4">{ord.buyerName} ({ord.buyerCity})</td>
                  <td className="py-3 px-4 font-bold tabular-nums">৳{ord.totalAmount.toLocaleString()}</td>
                  <td className="py-3 px-4">{ord.paymentMethod}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={ord.orderStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate('/farmer/tracking')}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                    >
                      Track
                    </button>
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
