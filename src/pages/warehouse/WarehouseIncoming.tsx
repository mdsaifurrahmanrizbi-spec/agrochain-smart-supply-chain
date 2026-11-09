import React, { useEffect, useState } from 'react';
import { store, agroApi } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Truck, CheckCircle2, ShieldCheck, Scale, Check, AlertTriangle, PackageCheck } from 'lucide-react';
import type { Warehouse, GodownShipment } from '../../types';

export const WarehouseIncoming: React.FC = () => {
  const [jobs, setJobs] = useState(store.jobs.filter((j) => j.type === 'PICKUP'));
  const [warehouseFacility, setWarehouseFacility] = useState<Warehouse | null>(null);
  const [shipments, setShipments] = useState<GodownShipment[]>(store.godownShipments);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.all([agroApi.getLogisticsJobs(), agroApi.getOrders(), agroApi.getWarehouses({ strict: true }), agroApi.getGodownShipments()])
      .then(([records, orderRecords, facilities, shipmentRecords]) => {
        if (active) {
          // Keep the shared API store in sync with the authoritative backend records.
          // Intake actions resolve the selected job from store.jobs.
          store.jobs = records;
          store.orders = orderRecords;
          store.godownShipments = shipmentRecords;
          localStorage.setItem('agro_jobs', JSON.stringify(records));
          localStorage.setItem('agro_orders', JSON.stringify(orderRecords));
          localStorage.setItem('agro_godown_shipments', JSON.stringify(shipmentRecords));
          setJobs(records.filter((job) => job.type === 'PICKUP'));
          setWarehouseFacility(facilities[0] || null);
          setShipments(shipmentRecords);
        }
      })
      .catch((error: unknown) => { if (active) setErrorMsg(error instanceof Error ? error.message : 'Could not load incoming jobs.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receivingJobId, setReceivingJobId] = useState<string | null>(null);

  const handleConfirmIntake = async (jobId: string) => {
    if (receivingJobId) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setReceivingJobId(jobId);
    try {
      const res = await agroApi.centralWarehouseReceive(jobId);
      setJobs([...store.jobs.filter((j) => j.type === 'PICKUP')]);
      setShipments([...store.godownShipments]);
      if (res.order.destinationGodownName) {
        setSuccessMsg(
          `Intake verified! Status updated to WAREHOUSE_RECEIVED. Destination automatically routed to: ${res.order.destinationGodownName}.`
        );
      } else {
        setSuccessMsg(`Shipment intake completed. Placed in review queue.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Intake failed.');
    } finally {
      setReceivingJobId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Incoming Produce Receiving Bay</h1>
        <p className="text-xs text-slate-500 mt-1">
          Verify product quantity, packaging intactness, and bag seals upon delivery from farm pickup partners.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* UPDATE 3 Warehouse Intake Rule */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <PackageCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Warehouse Receiving Protocol:</span>
          <p className="text-emerald-800/90 leading-relaxed">
            Full Quality Control is performed at the <strong>seller/farm pickup location</strong> prior to dispatch.
            Warehouse employees verify produce quantity, packaging integrity, and tamper-evident seals upon receiving.
            No secondary full QC inspection is required at the warehouse unless packaging damage or an exception is reported.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading incoming consignments…</div> : jobs.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No incoming pickup jobs are assigned to this warehouse.</div> : <>{jobs.map((job) => {
          const ord = store.orders.find((o) => o.id === job.orderId || o.orderNumber === job.orderNumber);
          const isReceived = shipments.some((shipment) => shipment.orderId === job.orderId);
          const awaitingIntake = ['PICKED_UP', 'WAREHOUSE_HANDOVER'].includes(job.status) && !isReceived;

          return (
            <div key={job.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-mono font-bold text-xs text-slate-900">{job.jobCode}</span>
                <StatusBadge status={job.status} size="sm" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-900 text-sm">{job.productSummary}</div>
                <p className="text-slate-500">
                  Consignment: <strong className="font-mono text-slate-700">{job.orderNumber}</strong>
                </p>
                <p className="text-slate-600">
                  Pickup Partner: <strong className="text-slate-900">{job.partnerName}</strong>
                </p>

                {/* Farm QC Status Indicator */}
                <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Farm-Gate Quality Clearance:</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {ord?.qualityStatus || 'APPROVED'} (Certified at Farm)
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 space-y-1">
                  <div><strong>Farm Origin:</strong> {job.originAddress}</div>
                  <div><strong>Origin Warehouse:</strong> {warehouseFacility?.name || 'Assigned warehouse facility not resolved'}</div>
                  <div><strong>Receiving Location:</strong> {warehouseFacility?.location || warehouseFacility?.address || 'Confirm facility location with Admin'}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">{job.assignedDate}</span>

                {awaitingIntake ? (
                  <button
                    onClick={() => handleConfirmIntake(job.id)}
                    disabled={receivingJobId === job.id}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>{receivingJobId === job.id ? 'Verifying intake…' : `Verify Weight & Receive at ${warehouseFacility?.name || 'Assigned Warehouse'}`}</span>
                  </button>
                ) : isReceived ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Warehouse intake verified</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Awaiting delivery to warehouse</span>
                )}
              </div>
            </div>
          );
        })}</>}
      </div>
    </div>
  );
};
