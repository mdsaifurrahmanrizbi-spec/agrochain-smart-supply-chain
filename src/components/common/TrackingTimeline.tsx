import React, { useState } from 'react';
import { TrackingEvent, OrderStatus } from '../../types';
import {
  CheckCircle2,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  Truck,
  Building,
  Package,
  KeyRound,
  Check,
  AlertTriangle,
  XCircle,
  FileText,
  Layers,
  ArrowRight,
} from 'lucide-react';

const normalizeDisplayText = (value: string) =>
  value
    .replace(/Ã Â§Â³/g, '৳')
    .replace(/à§³/g, '৳')
    .replace(/Ã—/g, '×')
    .replace(/â€”/g, '—')
    .replace(/Â·/g, '·');

interface TrackingTimelineProps {
  events: TrackingEvent[];
  orderNumber?: string;
  currentStatus?: OrderStatus | string;
  godownName?: string;
}

// Complete 18 Standard Logistics Milestones in sequence
export const STANDARD_18_MILESTONES = [
  { step: 1, key: 'ORDER_CONFIRMED', label: 'Order Confirmed', icon: FileText },
  { step: 2, key: 'SELLER_PREPARING', label: 'Seller Preparing Product', icon: Package },
  { step: 3, key: 'PICKUP_ASSIGNED', label: 'Pickup Partner Assigned', icon: Truck },
  { step: 4, key: 'QC_SCHEDULED', label: 'Quality Inspection Scheduled', icon: Clock },
  { step: 5, key: 'QC_APPROVED', label: 'Quality Check Passed (Farm QC)', icon: ShieldCheck },
  { step: 6, key: 'PICKED_UP', label: 'Product Picked Up (Farm)', icon: CheckCircle2 },
  { step: 7, key: 'IN_TRANSIT_CENTRAL', label: 'In Transit to Central Warehouse', icon: Truck },
  { step: 8, key: 'WAREHOUSE_RECEIVED', label: 'Received at Central Warehouse', icon: Building },
  { step: 9, key: 'GODOWN_DISPATCHED', label: 'Dispatched to Local Godown', icon: Package },
  { step: 10, key: 'IN_TRANSIT_GODOWN', label: 'In Transit to Local Godown', icon: Truck },
  { step: 11, key: 'ARRIVED_LOCAL_GODOWN', label: 'Arrived at Local Godown', icon: Building },
  { step: 12, key: 'GODOWN_RECEIVED', label: 'Accepted by Godown Manager', icon: CheckCircle2 },
  { step: 13, key: 'DELIVERY_PARTNER_ASSIGNED', label: 'Delivery Partner Assigned', icon: User },
  { step: 14, key: 'DELIVERY_ACCEPTED', label: 'Delivery Assignment Accepted', icon: Check },
  { step: 15, key: 'DELIVERY_PARTNER_COLLECTED', label: 'Collected by Delivery Partner', icon: Package },
  { step: 16, key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { step: 17, key: 'OTP_VERIFIED', label: 'Customer OTP Verified', icon: KeyRound },
  { step: 18, key: 'DELIVERED', label: 'Delivered Successfully', icon: CheckCircle2 },
];

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  events = [],
  orderNumber,
  currentStatus,
  godownName,
}) => {
  const [activeTab, setActiveTab] = useState<'LOG' | 'MAP'>('LOG');

  // Determine which standard milestones have been reached based on recorded events and current status
  const determineStepStatus = (stepKey: string, stepNumber: number) => {
    // Check if recorded events contain a matching title or keyword
    const hasEvent = events.some((e) => {
      const titleLower = e.title.toLowerCase();
      switch (stepKey) {
        case 'ORDER_CONFIRMED':
          return titleLower.includes('order confirmed') || titleLower.includes('order placed');
        case 'SELLER_PREPARING':
          return titleLower.includes('preparing') || titleLower.includes('packaging');
        case 'PICKUP_ASSIGNED':
          return titleLower.includes('pickup partner assigned');
        case 'QC_SCHEDULED':
          return titleLower.includes('quality') || titleLower.includes('qc');
        case 'QC_APPROVED':
          return titleLower.includes('quality check approved') || titleLower.includes('quality check passed');
        case 'PICKED_UP':
          return titleLower.includes('picked up') || titleLower.includes('collected from farm');
        case 'IN_TRANSIT_CENTRAL':
          return titleLower.includes('transit') && titleLower.includes('warehouse');
        case 'WAREHOUSE_RECEIVED':
          return titleLower.includes('received at warehouse') || titleLower.includes('received at central warehouse');
        case 'GODOWN_DISPATCHED':
          return titleLower.includes('dispatched to local godown');
        case 'IN_TRANSIT_GODOWN':
          return titleLower.includes('in transit to local godown');
        case 'ARRIVED_LOCAL_GODOWN':
          return titleLower.includes('arrived at local godown');
        case 'GODOWN_RECEIVED':
          return titleLower.includes('received at local godown') || titleLower.includes('accepted');
        case 'DELIVERY_PARTNER_ASSIGNED':
          return titleLower.includes('delivery partner assigned');
        case 'DELIVERY_ACCEPTED':
          return titleLower.includes('delivery assignment accepted');
        case 'DELIVERY_PARTNER_COLLECTED':
          return titleLower.includes('collected by delivery partner') || titleLower.includes('handover');
        case 'OUT_FOR_DELIVERY':
          return titleLower.includes('out for delivery');
        case 'OTP_VERIFIED':
          return titleLower.includes('otp verified') || titleLower.includes('customer otp');
        case 'DELIVERED':
          return titleLower.includes('delivered successfully') || titleLower.includes('delivered');
        default:
          return false;
      }
    });

    if (hasEvent) return 'COMPLETED';

    // If currentStatus matches this step
    const normalizedStatus = (currentStatus || '').toUpperCase();
    if (
      (stepKey === 'DELIVERED' && normalizedStatus === 'DELIVERED') ||
      (stepKey === 'OUT_FOR_DELIVERY' && normalizedStatus === 'OUT_FOR_DELIVERY') ||
      (stepKey === 'DELIVERY_PARTNER_COLLECTED' && normalizedStatus === 'DELIVERY_PARTNER_COLLECTED') ||
      (stepKey === 'DELIVERY_ACCEPTED' && normalizedStatus === 'DELIVERY_ACCEPTED') ||
      (stepKey === 'DELIVERY_PARTNER_ASSIGNED' && normalizedStatus === 'DELIVERY_PARTNER_ASSIGNED') ||
      (stepKey === 'GODOWN_RECEIVED' && normalizedStatus === 'GODOWN_RECEIVED') ||
      (stepKey === 'ARRIVED_LOCAL_GODOWN' && normalizedStatus === 'ARRIVED_LOCAL_GODOWN') ||
      (stepKey === 'GODOWN_DISPATCHED' && normalizedStatus === 'GODOWN_TRANSFER_IN_TRANSIT') ||
      (stepKey === 'WAREHOUSE_RECEIVED' && normalizedStatus === 'WAREHOUSE_RECEIVED')
    ) {
      return 'CURRENT';
    }

    return 'UPCOMING';
  };

  const isException =
    currentStatus === 'QC_REJECTED' ||
    currentStatus === 'MANUAL_ROUTING_REQUIRED' ||
    currentStatus === 'GODOWN_RECEIVING_ISSUE' ||
    currentStatus === 'DELIVERY_ASSIGNMENT_PENDING' ||
    currentStatus === 'TRANSFER_DELAYED';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">AgroChain 18-Step Traceability Journey</h3>
            {godownName && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                Hub: {godownName}
              </span>
            )}
          </div>
          {orderNumber && (
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Consignment Ref: <strong className="text-slate-800">{orderNumber}</strong>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Tab toggle */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('LOG')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'LOG'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recorded Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('MAP')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'MAP'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              18-Step Pipeline
            </button>
          </div>
        </div>
      </div>

      {/* Exception Banner if active */}
      {isException && (
        <div className="p-3.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Consignment Notice:</strong> Active stage requires operational review (Status: <strong>{currentStatus}</strong>).
          </span>
        </div>
      )}

      {/* Tab 1: Chronological Recorded Events Log */}
      {activeTab === 'LOG' && (
        <div className="p-6">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700">No Tracking Milestones Logged</h4>
              <p className="text-xs text-slate-500 mt-1">
                Tracking milestones will automatically populate as produce travels across hubs.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {events.map((event, idx) => {
                const isLatest = idx === 0;
                const isCompleted = event.status === 'COMPLETED';
                const isInProgress = event.status === 'IN_PROGRESS';

                let iconBg = 'bg-slate-200 text-slate-600';
                let borderRing = '';

                if (isCompleted) {
                  iconBg = 'bg-emerald-600 text-white';
                } else if (isInProgress) {
                  iconBg = 'bg-blue-600 text-white animate-pulse';
                  borderRing = 'ring-4 ring-blue-100';
                }

                return (
                  <div key={event.id || idx} className="relative group">
                    {/* Node Dot / Icon */}
                    <div
                      className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-xs transition-transform ${iconBg} ${borderRing}`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isInProgress ? (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      ) : (
                        <Clock className="w-3 h-3 text-slate-500" />
                      )}
                    </div>

                    {/* Event Card */}
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        isLatest
                          ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                          : 'bg-white border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                            {event.title}
                          </span>
                          {isLatest && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-700 text-white shadow-2xs">
                              Current Milestone
                            </span>
                          )}
                        </div>
                        <time className="text-xs font-mono text-slate-500 tabular-nums">
                          {event.timestamp}
                        </time>
                      </div>

                      <p className="mt-1.5 text-xs text-slate-700 leading-relaxed font-normal">
                        {normalizeDisplayText(event.description)}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[260px] font-medium text-slate-700">{event.location}</span>
                          </div>
                        )}
                        {event.actorName && (
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>
                              {event.actorRole}: <strong className="text-slate-800">{event.actorName}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Full 18-Step Logistics Supply-Chain Pipeline */}
      {activeTab === 'MAP' && (
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            AgroChain enforces end-to-end physical verification at every stage: farm gate inspection, central intake, regional godown transfer, local godown acceptance, partner handover, and customer OTP doorstep verification.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {STANDARD_18_MILESTONES.map((m) => {
              const state = determineStepStatus(m.key, m.step);
              const isCompleted = state === 'COMPLETED';
              const isCurrent = state === 'CURRENT';
              const Icon = m.icon;

              return (
                <div
                  key={m.step}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                    isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : isCurrent
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200 text-blue-950'
                      : 'bg-slate-50/60 border-slate-200 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : m.step}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Stage {m.step}
                      </span>
                      {isCompleted && (
                        <span className="text-[10px] font-bold text-emerald-700">Verified</span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-blue-700">In Progress</span>
                      )}
                    </div>
                    <div
                      className={`text-xs font-bold mt-0.5 truncate ${
                        isCompleted
                          ? 'text-emerald-900'
                          : isCurrent
                          ? 'text-blue-900'
                          : 'text-slate-500'
                      }`}
                    >
                      {m.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
