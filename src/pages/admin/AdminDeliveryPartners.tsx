import React, { useState } from 'react';
import { store, agroApi } from '../../services/api';
import type { DeliveryPartner } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Truck, MapPin, ShieldCheck, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDeliveryPartners: React.FC = () => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([
    ...store.deliveryPartners,
  ]);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    nid: '',
    address: '',
    preferredArea: '',
    assignedAreas: '',
    warehouseId: store.warehouses[0]?.id || '',
    vehicleType: 'Pickup Van' as DeliveryPartner['vehicleType'],
    vehicleRegNumber: '',
    canPickup: true,
    canDeliver: true,
  });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotice('');

    try {
      const selectedWarehouse = store.warehouses.find(
        (warehouse) => warehouse.id === form.warehouseId
      );

      if (!selectedWarehouse) {
        setNotice('Please select a valid warehouse.');
        return;
      }

      if (!form.canPickup && !form.canDeliver) {
        setNotice('Select pickup or delivery service.');
        return;
      }

      const assignedAreas = [
        ...new Set(
          form.assignedAreas
            .split(',')
            .map((area) => area.trim())
            .filter(Boolean)
        ),
      ];

      if (assignedAreas.length === 0) {
        setNotice('Enter at least one service area.');
        return;
      }

      const newPartner = await agroApi.registerDeliveryPartner({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        nid: form.nid.trim(),
        address: form.address.trim(),
        preferredArea: form.preferredArea.trim() || assignedAreas[0],
        assignedAreas,
        warehouseId: selectedWarehouse.id,
        vehicleType: form.vehicleType,
        vehicleRegNumber: form.vehicleRegNumber.trim(),
        canPickup: form.canPickup,
        canDeliver: form.canDeliver,
      });

      setPartners([...store.deliveryPartners]);
      setShowForm(false);
      setNotice(`${newPartner.name} registered. Approval pending.`);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Registration failed.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          {showForm ? 'Cancel' : '+ Add Logistics Partner'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2"
        >
          <h2 className="text-base font-bold text-slate-900 md:col-span-2">
            Register Logistics Partner
          </h2>

          <input required placeholder="Partner full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border p-2 text-sm" />

          <input required placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="rounded-lg border p-2 text-sm" />

          <input type="email" required placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-lg border p-2 text-sm" />

          <input required placeholder="NID number"
            value={form.nid}
            onChange={(e) => setForm({ ...form, nid: e.target.value })}
            className="rounded-lg border p-2 text-sm" />

          <input required placeholder="Full address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="rounded-lg border p-2 text-sm" />

          <select required value={form.warehouseId}
            onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
            className="rounded-lg border bg-white p-2 text-sm">
            {store.warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.code})
              </option>
            ))}
          </select>

          <input required placeholder="Service areas, comma-separated"
            value={form.assignedAreas}
            onChange={(e) => setForm({ ...form, assignedAreas: e.target.value })}
            className="rounded-lg border p-2 text-sm md:col-span-2" />

          <input placeholder="Preferred service area"
            value={form.preferredArea}
            onChange={(e) => setForm({ ...form, preferredArea: e.target.value })}
            className="rounded-lg border p-2 text-sm" />

          <select value={form.vehicleType}
            onChange={(e) => setForm({
              ...form,
              vehicleType: e.target.value as DeliveryPartner['vehicleType']
            })}
            className="rounded-lg border bg-white p-2 text-sm">
            <option value="Motorcycle">Motorcycle</option>
            <option value="Pickup Van">Pickup Van</option>
            <option value="Cargo Auto">Cargo Auto</option>
            <option value="Mini Truck">Mini Truck</option>
          </select>

          <input required placeholder="Vehicle registration number"
            value={form.vehicleRegNumber}
            onChange={(e) => setForm({ ...form, vehicleRegNumber: e.target.value })}
            className="rounded-lg border p-2 text-sm md:col-span-2" />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.canPickup}
              onChange={(e) => setForm({ ...form, canPickup: e.target.checked })} />
            Farm pickup service
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.canDeliver}
              onChange={(e) => setForm({ ...form, canDeliver: e.target.checked })} />
            Customer delivery service
          </label>

          <p className="text-xs text-amber-700 md:col-span-2">
            New partners remain pending until approved.
          </p>

          <button type="submit"
            className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 md:col-span-2">
            Register Partner
          </button>
        </form>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AgroChain Delivery Fleet Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered logistics partners handling both farm pickups and customer doorstep dropoffs.
          </p>
        </div>

        <Link
          to="/admin/partner-approvals"
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          Review Approvals & Coverage
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {partners.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                  <div className="text-[11px] text-slate-500">{p.phone}</div>
                </div>
              </div>
              <StatusBadge status={p.approvalStatus} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="text-slate-400 block mb-0.5">Vehicle Spec</span>
                <span className="font-bold text-slate-800">{p.vehicleType}</span>
                <span className="font-mono text-[11px] text-slate-500 block">{p.vehicleRegNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Completed Jobs Total</span>
                <span className="font-bold text-slate-800 text-sm tabular-nums">{p.completedJobsTotal} Jobs</span>
                <span className="text-emerald-700 font-semibold block text-[11px]">Rating: ★ {p.rating || 5.0}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-slate-500 block">Assigned Service Areas:</span>
              <div className="flex flex-wrap gap-1.5">
                {p.assignedAreas.map((area) => (
                  <span key={area} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-semibold">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
