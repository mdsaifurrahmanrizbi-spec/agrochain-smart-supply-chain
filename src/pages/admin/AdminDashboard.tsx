import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { store } from '../../services/api';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Users,
  Sprout,
  ShoppingBag,
  Truck,
  ShieldCheck,
  FileCheck,
  CreditCard,
  Warehouse,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { user, isBackendConnected } = useAuth();
  const navigate = useNavigate();

  const totalUsers = store.users.length;
  const totalFarmers = store.users.filter((u) => u.role === 'farmer').length;
  const totalOrders = store.orders.length;
  const activeDeliveries = store.jobs.filter((j) => ['ASSIGNED', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(j.status)).length;
  const pendingApprovals = store.deliveryPartners.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length;
  const qualityChecksCount = store.qualityChecks.length;
  const pendingPayments = store.settlements.filter((s) => s.settlementStatus !== 'COMPLETED').length;
  const warehouseCount = store.warehouses.length;

  const monthlyOrders = [
    { month: 'Nov', orders: 120, revenue: 340000 },
    { month: 'Dec', orders: 180, revenue: 520000 },
    { month: 'Jan', orders: 240, revenue: 680000 },
    { month: 'Feb', orders: 310, revenue: 890000 },
    { month: 'Mar', orders: 420, revenue: 1240000 },
    { month: 'Apr', orders: 580, revenue: 1680000 },
  ];

  const orderStatusDistribution = [
    { name: 'Delivered', value: 48, color: '#047857' },
    { name: 'In Transit', value: 26, color: '#2563EB' },
    { name: 'Pending Pickup', value: 18, color: '#D97706' },
    { name: 'Processing', value: 8, color: '#9333EA' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Central Operations Command
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              System Administrator
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            AgroChain Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome, <strong>{user?.name || 'Dr. Harun-ur-Rashid'}</strong> · Supervising 6 supply chain hubs across Bangladesh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/partner-approvals')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Review Partner Approvals ({pendingApprovals})</span>
          </button>
          <button
            onClick={() => navigate('/admin/delivery-verifications')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            <span>Delivery Verifications</span>
          </button>
        </div>
      </div>

      {/* 8 Required Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <MetricCard
          title="Users"
          value={totalUsers}
          icon={Users}
          onClick={() => navigate('/admin/users')}
        />
        <MetricCard
          title="Farmers"
          value={totalFarmers}
          icon={Sprout}
          onClick={() => navigate('/admin/farmers')}
        />
        <MetricCard
          title="Orders"
          value={totalOrders}
          icon={ShoppingBag}
          onClick={() => navigate('/admin/orders')}
        />
        <MetricCard
          title="Active Logistics"
          value={activeDeliveries}
          icon={Truck}
          onClick={() => navigate('/admin/delivery-partners')}
        />
        <MetricCard
          title="Approvals"
          value={pendingApprovals}
          subtitle="Fleet review"
          icon={ShieldCheck}
          trend={{ value: 'Action req', isPositive: false }}
          onClick={() => navigate('/admin/partner-approvals')}
        />
        <MetricCard
          title="Quality Checks"
          value={qualityChecksCount}
          icon={FileCheck}
          onClick={() => navigate('/admin/quality-checks')}
        />
        <MetricCard
          title="Pending Payouts"
          value={pendingPayments}
          icon={CreditCard}
          onClick={() => navigate('/admin/seller-payments')}
        />
        <MetricCard
          title="Godowns"
          value={warehouseCount}
          icon={Warehouse}
          onClick={() => navigate('/admin/warehouses')}
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Orders Chart */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">National Orders & Revenue Growth</h2>
              <p className="text-xs text-slate-500">Gross monthly agricultural transaction throughput in BDT</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 tabular-nums">
              ৳1.68M this month
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyOrders} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(val) => `৳${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`৳${val.toLocaleString()}`, 'Throughput']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#047857" strokeWidth={2.5} fill="url(#adminRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Order Status Ratio</h3>
              <span className="text-[11px] text-slate-500">Active Cycle</span>
            </div>

            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {orderStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              {orderStatusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Partner Approvals & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Approvals Box */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Delivery Partner Approval Requests</h3>
              <p className="text-xs text-slate-500">Unapproved partners cannot accept pickup or delivery jobs</p>
            </div>
            <Link to="/admin/partner-approvals" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
              Manage All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {store.deliveryPartners.map((dp) => (
              <div key={dp.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{dp.name}</span>
                    <StatusBadge status={dp.approvalStatus} size="sm" />
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Area: {dp.preferredArea} · {dp.vehicleType} ({dp.vehicleRegNumber})
                  </div>
                </div>

                <Link
                  to="/admin/partner-approvals"
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Activities */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Supply Chain Audits</h3>
              <p className="text-xs text-slate-500">Timestamped multi-stakeholder actions</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 mt-2 text-xs space-y-2">
            <div className="py-2.5">
              <div className="flex justify-between font-semibold text-slate-900">
                <span>Delivery Verified (#AGRO-2026-0891)</span>
                <span className="font-mono text-slate-400 text-[11px]">Today 14:15</span>
              </div>
              <p className="text-slate-500 mt-0.5">Partner Kamal Hossain dropoff verified at Banani DOHS. Payout authorized.</p>
            </div>
            <div className="py-2.5">
              <div className="flex justify-between font-semibold text-slate-900">
                <span>Quality Check Passed (BOG-CHIN-202603)</span>
                <span className="font-mono text-slate-400 text-[11px]">Yesterday 11:15</span>
              </div>
              <p className="text-slate-500 mt-0.5">Moisture 11.2%, Grade A Premium certificate issued by Dr. Farzana Akter.</p>
            </div>
            <div className="py-2.5">
              <div className="flex justify-between font-semibold text-slate-900">
                <span>COD Deposit Audited (৳2,850)</span>
                <span className="font-mono text-slate-400 text-[11px]">09 Apr 11:00</span>
              </div>
              <p className="text-slate-500 mt-0.5">Physical cash verified and deposited at Tejgaon Urban Godown desk.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
