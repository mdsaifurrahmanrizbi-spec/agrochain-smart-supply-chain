import React, { useEffect, useState } from 'react';
import { store, agroApi } from '../../services/api';
import { GodownShipment, LocalGodown } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Compass,
  Truck,
  ArrowRight,
  Check,
  Building2,
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
  Package,
} from 'lucide-react';

export const WarehouseTransfers: React.FC = () => {
  const [shipments, setShipments] = useState<GodownShipment[]>(store.godownShipments);
  const [godowns, setGodowns] = useState<LocalGodown[]>(store.godowns);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Manual rerouting state
  const [reroutingShipment, setReroutingShipment] = useState<GodownShipment | null>(null);
  const [targetGodownId, setTargetGodownId] = useState('');

  const refreshData = async () => {
    const [nextShipments, nextGodowns] = await Promise.all([agroApi.getGodownShipments(), agroApi.getGodowns()]);
    setShipments([...nextShipments]);
    setGodowns([...nextGodowns]);
  };

  useEffect(() => {
    let active = true;
    Promise.all([agroApi.getGodownShipments(), agroApi.getGodowns()])
      .then(([nextShipments, nextGodowns]) => {
        if (!active) return;
        setShipments([...nextShipments]);
        setGodowns([...nextGodowns]);
      })
      .catch((error: unknown) => { if (active) setErrorMsg(error instanceof Error ? error.message : 'Could not load transfer records.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleDispatch = async (shipmentId: string) => {
    setErrorMsg(null);
    try {
      await agroApi.dispatchToLocalGodown(shipmentId);
      await refreshData();
      setNotice('Shipment successfully dispatched to destination local godown!');
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Dispatch failed');
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const handleRerouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reroutingShipment || !targetGodownId) return;

    const targetGodown = godowns.find((g) => g.id === targetGodownId);
    if (!targetGodown) return;

    if (targetGodown.status !== 'ACTIVE') {
      setErrorMsg(`Cannot route to ${targetGodown.name} because it is INACTIVE.`);
      return;
    }

    try {
      await agroApi.updateGodownShipment({ ...reroutingShipment, destinationGodownId: targetGodown.id });
      await refreshData();
      setNotice(`Consignment re-routed to active facility: ${targetGodown.name}`);
      setReroutingShipment(null);
      setTargetGodownId('');
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Rerouting failed');
    }
  };

  const manualQueue = shipments.filter((s) => s.transferStatus === 'MANUAL_ROUTING_REQUIRED');
  const transferShipments = shipments.filter((s) => s.transferStatus !== 'MANUAL_ROUTING_REQUIRED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Origin Warehouse to Destination Godown Transfers</h1>
          <p className="text-xs text-slate-500 mt-1">
            Coordinate consignment preparation, automated regional godown routing, and dispatch to urban distribution facilities.
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Manual Routing Queue (Matching section 2 rule: Do not assign to inactive godowns) */}
      {loading ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading warehouse transfers…</div> : <>{manualQueue.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-300 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <h3 className="text-sm font-bold">Manual Routing Required Queue ({manualQueue.length})</h3>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            These shipments need manual routing because no active destination godown matched the customer address or the available facility is outside its service area. Review and route to an active godown below:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {manualQueue.map((s) => (
              <div key={s.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-mono font-bold text-slate-900">{s.id.toUpperCase()}</span>
                  <StatusBadge status={s.transferStatus} size="sm" />
                </div>
                <div className="font-bold text-slate-900">{s.productName} ({s.quantity} {s.unit})</div>
                <div className="text-slate-600">Customer Address: <strong>{s.customerAddress}</strong> ({s.customerArea})</div>
                <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px]">
                  <strong>Issue:</strong> {s.exceptionNotes || 'No active destination godown matched the customer address.'}
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setReroutingShipment(s);
                      setTargetGodownId('');
                    }}
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold"
                  >
                    Select Active Godown & Route
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Pipeline Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Regional Godown Transfers</h3>
            <p className="text-xs text-slate-500">
              Produce consignments received at the farm-origin warehouse and routed to customer-area godowns.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Shipment ID</th>
                <th className="py-3 px-4">Consignment</th>
                <th className="py-3 px-4">Commodity / Produce</th>
                <th className="py-3 px-4">Origin Warehouse</th>
                <th className="py-3 px-4">Destination Godown</th>
                <th className="py-3 px-4">Customer Zone</th>
                <th className="py-3 px-4">Transfer Status</th>
                <th className="py-3 px-4 text-right">Dispatch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transferShipments.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.id.toUpperCase()}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{s.orderNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {s.productName} ({s.weightKg} kg)
                  </td>
                  <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">{s.sourceWarehouseName}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-emerald-800">{s.destinationGodownName}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{s.customerArea}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={s.transferStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    {s.transferStatus === 'PENDING_DISPATCH' && (
                      <button
                        onClick={() => handleDispatch(s.id)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 inline-flex"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch to Godown</span>
                      </button>
                    )}

                    {s.transferStatus === 'GODOWN_TRANSFER_IN_TRANSIT' && (
                      <span className="text-[11px] text-blue-700 font-medium">Awaiting destination warehouse arrival confirmation</span>
                    )}

                    {['ARRIVED_LOCAL_GODOWN', 'GODOWN_RECEIVED', 'DELIVERY_PARTNER_ASSIGNED', 'DELIVERY_ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(
                      s.transferStatus
                    ) && (
                      <span className="text-[11px] text-slate-500 font-medium">Transferred to Local Facility</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {transferShipments.length === 0 && manualQueue.length === 0 && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No transfer records are assigned to this warehouse.</div>}
      {/* Re-route Modal */}
      {reroutingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Manual Facility Re-Routing</h3>
              <button onClick={() => setReroutingShipment(null)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleRerouteSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div>Consignment: <strong>{reroutingShipment.orderNumber}</strong></div>
                <div>Customer Address: <strong>{reroutingShipment.customerAddress}</strong></div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Active Destination Local Godown:</label>
                <select
                  value={targetGodownId}
                  onChange={(e) => setTargetGodownId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Choose Active Facility --</option>
                  {godowns
                    .filter((g) => g.status === 'ACTIVE')
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.address})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReroutingShipment(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetGodownId}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded font-bold"
                >
                  Confirm Re-Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}</>}
    </div>
  );
};
