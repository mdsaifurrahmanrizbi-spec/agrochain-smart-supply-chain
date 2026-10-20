import React, { useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Farm } from '../../types';
import { Building, Plus, MapPin, CheckCircle, Compass } from 'lucide-react';

export const FarmerFarms: React.FC = () => {
  const { user } = useAuth();
  const farmerId = user?.id || 'u-farmer-1';
  const [farms, setFarms] = useState<Farm[]>(store.farms.filter((f) => f.farmerId === farmerId));
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    division: 'Rajshahi',
    district: 'Bogura',
    upazila: 'Shibganj',
    sizeAcres: 10,
    soilType: 'Alluvial Loam',
    irrigationType: 'Deep Tube-well',
    gpsCoordinates: '24.9602° N, 89.3243° E',
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFarm = await agroApi.addFarm({
      ...formData,
      farmerId,
      farmerName: user?.name || 'Md. Rafiqul Islam',
      verified: true,
    });
    setFarms([...store.farms.filter((f) => f.farmerId === farmerId)]);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Registered Agricultural Farms</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your land plots, GPS coordinates, and soil specifications for batch traceability.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Farm Land</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map((farm) => (
          <div key={farm.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Verified Plot
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
                {farm.sizeAcres} Acres
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">{farm.name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{farm.upazila}, {farm.district}, {farm.division}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Soil Classification:</span>
                <span className="font-medium text-slate-800">{farm.soilType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Irrigation:</span>
                <span className="font-medium text-slate-800">{farm.irrigationType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GPS Coordinates:</span>
                <span className="font-mono text-slate-700 text-[11px]">{farm.gpsCoordinates}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Agricultural Farm</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Farm Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shibganj River Organic Field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Division</label>
                  <input
                    type="text"
                    required
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Upazila</label>
                  <input
                    type="text"
                    required
                    value={formData.upazila}
                    onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Plot Size (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.sizeAcres}
                    onChange={(e) => setFormData({ ...formData, sizeAcres: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Soil Type</label>
                  <input
                    type="text"
                    required
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">GPS Coordinates</label>
                <input
                  type="text"
                  required
                  value={formData.gpsCoordinates}
                  onChange={(e) => setFormData({ ...formData, gpsCoordinates: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Save Farm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
