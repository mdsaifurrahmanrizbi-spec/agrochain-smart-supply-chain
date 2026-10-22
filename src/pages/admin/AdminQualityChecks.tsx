import React, { useEffect, useState } from 'react';
import { store, agroApi } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';

export const AdminQualityChecks: React.FC = () => {
  const [checks, setChecks] = useState(store.qualityChecks);
  const [orders, setOrders] = useState(store.orders);
  const [loadError, setLoadError] = useState('');

  const refresh = async () => {
    try {
      const [freshChecks, freshOrders] = await Promise.all([
        agroApi.getQualityChecks(),
        agroApi.getOrders(),
      ]);
      setChecks([...freshChecks]);
      setOrders([...freshOrders]);
      setLoadError('');
    } catch (error) {
      console.error('Could not refresh QC audit data:', error);
      setLoadError('Could not refresh QC records from the server. Displayed data may be cached.');
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([agroApi.getQualityChecks(), agroApi.getOrders()])
      .then(([freshChecks, freshOrders]) => {
        if (!active) return;
        setChecks([...freshChecks]);
        setOrders([...freshOrders]);
        setLoadError('');
      })
      .catch((error) => {
        console.error('Could not refresh QC audit data:', error);
        if (active) setLoadError('Could not refresh QC records from the server. Displayed data may be cached.');
      });
    return () => { active = false; };
  }, []);

  const pendingCount = checks.filter((check) => check.status === 'PENDING').length;
  const linkedOrders = new Set(checks.map((check) => check.orderId).filter(Boolean));
  const confirmedWithoutQc = orders.filter((order) =>
    order.orderStatus === 'CONFIRMED' &&
    !order.qualityCheckId &&
    !checks.some((check) => check.orderId === order.id || check.orderId === order.orderNumber)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Platform Quality Control Audits</h1>
          <p className="text-xs text-slate-500 mt-1">
            Confirmed orders require a real inspection before farm pickup can proceed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh QC
        </button>
      </div>

      {loadError && (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">QC records</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{checks.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-800">Awaiting inspection</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Confirmed orders missing QC</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{confirmedWithoutQc.length}</p>
        </div>
      </div>

      {confirmedWithoutQc.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-bold text-amber-900">Confirmed orders missing an inspection record</h2>
          <p className="mt-1 text-xs text-amber-800">
            These orders need a QC record. No inspection result is being fabricated automatically.
          </p>
          <ul className="mt-3 space-y-2">
            {confirmedWithoutQc.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs">
                <span className="font-mono font-semibold text-slate-800">{order.orderNumber}</span>
                <span className="text-slate-600">{order.items.map((item) => item.productName).join(', ')}</span>
                <span className="text-slate-500">{order.buyerCity || order.buyerAddress}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">QC Code</th>
                <th className="py-3 px-4">Related Order ID</th>
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4">Harvest Batch Code</th>
                <th className="py-3 px-4">Origin Farmer</th>
                <th className="py-3 px-4">Agronomist Inspector</th>
                <th className="py-3 px-4">Moisture %</th>
                <th className="py-3 px-4">Pesticide Residue</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {checks.map((c) => {
                const pending = c.status === 'PENDING';
                const linkedOrder = orders.find((order) =>
                  order.id === c.orderId || order.orderNumber === c.orderId
                );
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.id}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                      {linkedOrder?.orderNumber || c.orderId || 'Not linked'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.cropName}</td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-semibold">{c.batchCode || 'Not assigned'}</td>
                    <td className="py-3 px-4">{c.farmerName || 'Not available'}{c.farmLocation ? ` (${c.farmLocation})` : ''}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{c.inspectorName || 'Not assigned'}</td>
                    <td className="py-3 px-4 font-mono tabular-nums">{pending ? 'Not measured' : `${c.moistureContentPercent}%`}</td>
                    <td className="py-3 px-4 font-mono tabular-nums">{pending ? 'Not measured' : `${c.pesticideResiduePpm} ppm`}</td>
                    <td className="py-3 px-4">{pending ? 'Not graded' : c.grade}</td>
                    <td className="py-3 px-4"><StatusBadge status={c.status} size="sm" /></td>
                  </tr>
                );
              })}
              {checks.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-500">No quality checks found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
