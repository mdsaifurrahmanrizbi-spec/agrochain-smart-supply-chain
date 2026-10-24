import React, { useEffect, useState } from 'react';
import { store, agroApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TrackingTimeline } from '../../components/common/TrackingTimeline';
import { Truck, Package, Clock, MapPin, CheckCircle } from 'lucide-react';

export const FarmerTracking: React.FC = () => {
  const { user } = useAuth();
  const farmerId = user?.id || 'u-farmer-1';

  const myOrders = store.orders.filter((o) =>
    o.items.some((item) => item.farmerId === farmerId)
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>(myOrders[0]?.id || 'ord-1001');

  const selectedOrder = store.orders.find((o) => o.id === selectedOrderId);
  const [events, setEvents] = useState(store.trackingEvents[selectedOrderId] || []);

  useEffect(() => {
    let active = true;
    if (selectedOrderId) {
      agroApi.getTrackingEvents(selectedOrderId)
        .then((freshEvents) => { if (active) setEvents(freshEvents); })
        .catch((error) => console.error('Could not load farmer tracking history:', error));
    }
    return () => { active = false; };
  }, [selectedOrderId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Crop Consignment & Logistics Tracking</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor your produce through every stage: Farm Pickup → Quality Check → Central Godown → Customer Doorstep.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Orders Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Consignments
          </h3>

          <div className="space-y-2">
            {myOrders.map((ord) => {
              const isSelected = ord.id === selectedOrderId;
              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrderId(ord.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-xs text-slate-900">{ord.orderNumber}</span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {ord.orderStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1">
                    {ord.items.map((i) => `${i.quantity}${i.unit} ${i.productName}`).join(', ')}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Dest: {ord.buyerCity}</span>
                    <span className="tabular-nums font-bold text-slate-800">৳{ord.totalAmount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Vertical Timeline View */}
        <div className="lg:col-span-8">
          <TrackingTimeline
            events={events}
            orderNumber={selectedOrder?.orderNumber}
          />
        </div>
      </div>
    </div>
  );
};
