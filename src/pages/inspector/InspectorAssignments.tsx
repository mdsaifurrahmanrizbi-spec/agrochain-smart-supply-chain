import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agroApi, store } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ClipboardList, ArrowRight, MapPin, Calendar } from 'lucide-react';

export const InspectorAssignments: React.FC = () => {
  const navigate = useNavigate();
  const [checks, setChecks] = useState(store.qualityChecks);

  useEffect(() => {
    let active = true;
    agroApi.getQualityChecks().then((freshChecks) => {
      if (active) setChecks([...freshChecks]);
    }).catch((error) => {
      console.error('Could not load inspector assignments:', error);
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Assigned Inspection Tasks</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review batches scheduled for moisture, pesticide residue, and seed intactness testing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {checks.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-mono font-bold text-xs text-slate-900">{c.id}</span>
              <StatusBadge status={c.status} size="sm" />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 text-sm">{c.cropName}</div>
              <p className="text-slate-500">Batch Code: <strong className="font-mono text-slate-800">{c.batchCode}</strong></p>
              <p className="text-slate-600">Farmer: <strong className="text-slate-900">{c.farmerName}</strong> ({c.farmLocation})</p>

              <div className="pt-2 flex items-center justify-between text-slate-500 text-[11px]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Location: {c.inspectionLocation}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.inspectionDate}</span>
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">{c.grade}</span>
              <button
                onClick={() => navigate('/inspector/inspections')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1"
              >
                <span>Audit Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
