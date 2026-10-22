import React, { useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CropBatch } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Layers, Plus, QrCode, Search, ShieldCheck } from 'lucide-react';

export const FarmerBatches: React.FC = () => {
  const { user } = useAuth();
  const farmerId = user?.id || 'u-farmer-1';
  const [batches, setBatches] = useState(store.batches);
  const [selectedBatchForQr, setSelectedBatchForQr] = useState<CropBatch | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    cropName: 'Chinigura Aromatic Rice',
    variety: 'BRRI Dhan-34',
    farmId: 'farm-1',
    farmName: 'Bogura Green Valley Agro Farm',
    sowingDate: '2025-11-20',
    harvestDate: '2026-04-12',
    estimatedQuantityKg: 5000,
    actualQuantityKg: 4850,
  });

  const myBatches = batches.filter((b) => b.farmerId === farmerId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newB = await agroApi.createBatch({
      ...formData,
      cropId: 'crop-1',
      farmerId: user?.id || 'u-farmer-1',
      farmerName: user?.name || 'Md. Rafiqul Islam',
      qualityStatus: 'PENDING',
    });
    setBatches([...store.batches]);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Crop Batches & Traceability Codes</h1>
          <p className="text-xs text-slate-500 mt-1">
            Every harvest batch receives a unique consignment code and cryptographic QR fingerprint.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register Harvest Batch</span>
        </button>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Batch Code</th>
                <th className="py-3 px-4">Crop & Variety</th>
                <th className="py-3 px-4">Origin Farm</th>
                <th className="py-3 px-4">Harvest Date</th>
                <th className="py-3 px-4">Actual Yield</th>
                <th className="py-3 px-4">Quality Status</th>
                <th className="py-3 px-4 text-right">QR Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myBatches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.batchCode}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{b.cropName}</div>
                    <div className="text-[11px] text-slate-500">{b.variety}</div>
                  </td>
                  <td className="py-3 px-4">{b.farmName}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{b.harvestDate}</td>
                  <td className="py-3 px-4 tabular-nums font-semibold text-slate-900">
                    {b.actualQuantityKg.toLocaleString()} kg
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={b.qualityStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedBatchForQr(b)}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 inline-flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View QR</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Modal */}
      {selectedBatchForQr && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Batch Traceability QR</span>
              <button onClick={() => setSelectedBatchForQr(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-40 h-40 mx-auto bg-white p-2 rounded-lg border border-slate-300 flex items-center justify-center mb-3">
                <img
                  className="w-full h-full object-contain"
                  alt={`Scannable QR code for batch ${selectedBatchForQr.batchCode}`}
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(`${window.location.origin}/?batch=${selectedBatchForQr.batchCode}`)}`}
                />
              </div>
              <p className="text-[10px] text-slate-500 mb-2">Scan with your phone camera to open AgroChain and identify this batch.</p>
              <div className="font-mono text-xs font-bold text-slate-900">{selectedBatchForQr.batchCode}</div>
              <div className="text-[11px] text-slate-500 mt-1">{selectedBatchForQr.cropName}</div>
            </div>

            <div className="text-[10px] text-slate-500 font-mono text-left bg-slate-100 p-2.5 rounded break-all">
              Ledger Hash: {selectedBatchForQr.blockchainHash}
            </div>

            <button
              onClick={() => setSelectedBatchForQr(null)}
              className="w-full py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold"
            >
              Close QR View
            </button>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Register New Crop Batch</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Crop Name</label>
                <input
                  type="text"
                  required
                  value={formData.cropName}
                  onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Variety</label>
                <input
                  type="text"
                  required
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Harvest Date</label>
                  <input
                    type="date"
                    required
                    value={formData.harvestDate}
                    onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Actual Yield (kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.actualQuantityKg}
                    onChange={(e) => setFormData({ ...formData, actualQuantityKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Generate Batch & QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
