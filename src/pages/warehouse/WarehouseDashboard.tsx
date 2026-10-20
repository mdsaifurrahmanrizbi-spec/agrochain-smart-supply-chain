import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Warehouse,
  Truck,
  Package,
  CheckCircle,
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Building2,
} from 'lucide-react';

export const WarehouseDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const inventory = store.inventory;
  const warehouses = store.warehouses;
  const centralWh = warehouses.find((w) => w.type === 'CENTRAL') || warehouses[0];

  const totalStockKg = inventory.reduce((sum, item) => sum + item.quantityKg, 0);
  const pendingIntake = store.jobs.filter((j) => j.type === 'PICKUP' && j.status === 'PICKED_UP').length;
  const pendingDispatch = store.jobs.filter((j) => j.type === 'DELIVERY' && j.status === 'ASSIGNED').length;
  const pendingPartnerApprovals = store.deliveryPartners.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length;
  const activeGodownsCount = store.godowns.filter((g) => g.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
            <span>Warehouse & Godown Control Desk</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
              Manager Privileges Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            {centralWh.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervised by <strong>{user?.name || centralWh.managerName}</strong> · Joydebpur, Gazipur · Cold Storage Active
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/warehouse/godown')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Building2 className="w-4 h-4 text-emerald-100" />
            <span>Local Godown Hub ({activeGodownsCount})</span>
          </button>
          <button
            onClick={() => navigate('/warehouse/partner-approvals')}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Partner Approvals ({pendingPartnerApprovals})</span>
          </button>
          <button
            onClick={() => navigate('/warehouse/incoming')}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Truck className="w-4 h-4" />
            <span>Receive Shipments</span>
          </button>
          <button
            onClick={() => navigate('/warehouse/transfers')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Compass className="w-4 h-4 text-slate-600" />
            <span>Godown Transfer</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Stock in Storage"
          value={`${(totalStockKg / 1000).toFixed(1)} MT`}
          subtitle="Grains, potatoes & fresh produce"
          icon={Warehouse}
          onClick={() => navigate('/warehouse/inventory')}
        />
        <MetricCard
          title="Incoming Farm Intake"
          value={pendingIntake || 2}
          subtitle="Sacks en route from pickup fleet"
          icon={Truck}
          onClick={() => navigate('/warehouse/incoming')}
        />
        <MetricCard
          title="Pending Last-Mile Dispatches"
          value={pendingDispatch || 3}
          subtitle="Ready for local delivery partner"
          icon={Package}
          onClick={() => navigate('/warehouse/dispatch')}
        />
        <MetricCard
          title="Delivery Verifications"
          value="1 Pending"
          subtitle="Awaiting supervisor audit"
          icon={CheckCircle}
          trend={{ value: 'Authorize Payout', isPositive: true }}
          onClick={() => navigate('/warehouse/verifications')}
        />
      </div>

      {/* Regional Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.map((wh) => (
          <div key={wh.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-mono font-bold text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                {wh.code}
              </span>
              <span className="text-slate-500">{wh.type.replace('_', ' ')}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{wh.name}</h3>
            <p className="text-slate-500">{wh.location}</p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-700">
              <span>Capacity Utilized:</span>
              <strong className="tabular-nums font-bold text-slate-900">
                {wh.currentStockMetricTons} / {wh.capacityMetricTons} MT
              </strong>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${(wh.currentStockMetricTons / wh.capacityMetricTons) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Current Stored Inventory Snapshot */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Storage Zone Inventory Breakdown</h3>
          <Link to="/warehouse/inventory" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
            View All Stock
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Warehouse Facility</th>
                <th className="py-3 px-4">Crop & Variety</th>
                <th className="py-3 px-4">Batch Code</th>
                <th className="py-3 px-4">Storage Zone</th>
                <th className="py-3 px-4">Quantity (kg)</th>
                <th className="py-3 px-4">Quality Clearance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">{inv.warehouseName}</td>
                  <td className="py-3 px-4">{inv.cropName}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{inv.batchCode}</td>
                  <td className="py-3 px-4 text-slate-600">{inv.storageZone}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">{inv.quantityKg.toLocaleString()} kg</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={inv.qualityStatus} size="sm" />
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
