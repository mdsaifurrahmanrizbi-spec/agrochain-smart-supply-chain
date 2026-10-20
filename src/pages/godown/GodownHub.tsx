import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { store, agroApi } from '../../services/api';
import { GodownShipment, LocalGodown, DeliveryPartner } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TrackingTimeline } from '../../components/common/TrackingTimeline';
import {
  Building2,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Check,
  XCircle,
  FileText,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Scale,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  BarChart3,
  Search,
  Filter,
  Plus,
} from 'lucide-react';

export const GodownHub: React.FC = () => {
  const { user } = useAuth();

  // Selected Godown state - defaults to Tejgaon Godown (or manager's assigned godown)
  const [godowns, setGodowns] = useState<LocalGodown[]>(store.godowns);
  const [selectedGodownId, setSelectedGodownId] = useState<string>(
    user?.godownId || store.godowns[0]?.id || 'godown-tejgaon'
  );

  const selectedGodown = godowns.find((g) => g.id === selectedGodownId) || godowns[0];

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    | 'DASHBOARD'
    | 'INCOMING'
    | 'PENDING_ACCEPTANCE'
    | 'ACCEPTED'
    | 'INVENTORY'
    | 'ASSIGNMENTS'
    | 'HANDOVER'
    | 'OUTGOING'
    | 'TRACKING'
    | 'REPORTS'
  >('DASHBOARD');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Shipments state
  const [shipments, setShipments] = useState<GodownShipment[]>(store.godownShipments);

  // Modals state
  const [selectedShipment, setSelectedShipment] = useState<GodownShipment | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showManualAssignModal, setShowManualAssignModal] = useState(false);

  // Acceptance form state
  const [verifyCondition, setVerifyCondition] = useState(true);
  const [verifyQuantity, setVerifyQuantity] = useState(true);
  const [verifyPackaging, setVerifyPackaging] = useState(true);
  const [acceptanceNotes, setAcceptanceNotes] = useState('');
  const [acceptingLoading, setAcceptingLoading] = useState(false);
  const [lastAssignmentResult, setLastAssignmentResult] = useState<{
    partner?: DeliveryPartner;
    success: boolean;
  } | null>(null);

  // Exception form state
  const [exceptionType, setExceptionType] = useState<'DAMAGED' | 'QUANTITY_MISMATCH'>('DAMAGED');
  const [exceptionNotes, setExceptionNotes] = useState('');

  // Manual partner assignment state
  const [manualPartnerId, setManualPartnerId] = useState('');

  // Filter shipments belonging to currently selected godown
  const godownShipments = shipments.filter(
    (s) => s.destinationGodownId === selectedGodownId || (selectedGodownId === 'ALL' && true)
  );

  // Metrics for 7 dashboard cards
  const incomingShipments = godownShipments.filter((s) =>
    ['GODOWN_TRANSFER_IN_TRANSIT', 'ARRIVED_LOCAL_GODOWN'].includes(s.transferStatus)
  );
  const pendingAcceptance = godownShipments.filter(
    (s) => s.transferStatus === 'ARRIVED_LOCAL_GODOWN'
  );
  const productsInGodown = godownShipments.filter((s) =>
    ['GODOWN_RECEIVED', 'DELIVERY_PARTNER_ASSIGNED', 'DELIVERY_ACCEPTED', 'DELIVERY_ASSIGNMENT_PENDING'].includes(
      s.transferStatus
    )
  );
  const assignedDeliveries = godownShipments.filter((s) =>
    ['DELIVERY_PARTNER_ASSIGNED', 'DELIVERY_ACCEPTED'].includes(s.transferStatus)
  );
  const awaitingPickup = godownShipments.filter(
    (s) => s.transferStatus === 'DELIVERY_ACCEPTED'
  );
  const outForDelivery = godownShipments.filter(
    (s) => s.transferStatus === 'OUT_FOR_DELIVERY'
  );
  const completedDeliveries = godownShipments.filter(
    (s) => s.transferStatus === 'DELIVERED'
  );

  // Refresh data helper
  const refreshData = () => {
    setShipments([...store.godownShipments]);
    setGodowns([...store.godowns]);
  };

  // Action: Mark shipment arrived at local godown (simulation helper)
  const handleMarkArrived = async (shipmentId: string) => {
    try {
      await agroApi.markArrivedAtLocalGodown(shipmentId);
      refreshData();
      setNotice('Shipment transfer carrier logged arrived at unloading bay.');
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    }
  };

  // Action: Accept product at Godown & trigger automatic area-based assignment
  const handleAcceptProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    setAcceptingLoading(true);
    setErrorMsg(null);

    try {
      const res = await agroApi.godownManagerAcceptProduct(
        selectedShipment.id,
        user?.id || 'u-godown-1',
        user?.name || selectedGodown.managerName
      );

      refreshData();
      setLastAssignmentResult({
        partner: res.assignedPartner,
        success: res.assignmentSuccess,
      });

      if (res.assignmentSuccess && res.assignedPartner) {
        setNotice(
          `Product accepted! Delivery partner ${res.assignedPartner.name} was automatically assigned for ${selectedShipment.customerArea}.`
        );
      } else {
        setNotice('Product accepted into inventory. Delivery assignment placed in pending queue.');
      }

      setTimeout(() => {
        setShowAcceptModal(false);
        setSelectedShipment(null);
        setAcceptingLoading(false);
        setLastAssignmentResult(null);
      }, 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept product');
      setAcceptingLoading(false);
    }
  };

  // Action: Report Exception
  const handleReportExceptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    try {
      await agroApi.reportGodownException(
        selectedShipment.id,
        exceptionType,
        exceptionNotes || 'Discrepancy observed upon arrival.',
        user?.name || selectedGodown.managerName
      );
      refreshData();
      setNotice(`Exception (${exceptionType}) recorded. Dispatch paused pending inspection.`);
      setShowExceptionModal(false);
      setSelectedShipment(null);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record exception');
    }
  };

  // Action: Godown Manager initiates handover
  const handleInitiateHandover = async (shipmentId: string) => {
    try {
      await agroApi.godownManagerInitiateHandover(
        shipmentId,
        user?.id || 'u-godown-1',
        user?.name || selectedGodown.managerName
      );
      refreshData();
      setNotice('Handover initiated. Assigned delivery partner can now confirm product receipt.');
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Handover failed');
    }
  };

  // Action: Delivery partner confirms receipt (two-sided handover simulation)
  const handleConfirmPartnerCollection = async (shipment: GodownShipment) => {
    try {
      await agroApi.deliveryPartnerConfirmReceipt(
        shipment.id,
        shipment.assignedPartnerId || 'dp-1'
      );
      refreshData();
      setNotice(
        `Two-sided handover completed! Delivery partner ${shipment.assignedPartnerName} confirmed product collection.`
      );
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Receipt confirmation failed');
    }
  };

  // Action: Delivery partner clicks OUT FOR DELIVERY
  const handleOutForDelivery = async (shipment: GodownShipment) => {
    try {
      await agroApi.deliveryPartnerOutForDelivery(
        shipment.id,
        shipment.assignedPartnerId || 'dp-1'
      );
      refreshData();
      setNotice(
        `Shipment status updated to OUT FOR DELIVERY! Customer has been notified.`
      );
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Out for delivery update failed');
    }
  };

  // Action: Manual assign delivery partner
  const handleManualAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !manualPartnerId) return;

    try {
      await agroApi.manualAssignDeliveryPartner(
        selectedShipment.id,
        manualPartnerId,
        user?.name || selectedGodown.managerName,
        'Godown Manager'
      );
      refreshData();
      setNotice('Delivery partner manually assigned from dispatch queue.');
      setShowManualAssignModal(false);
      setSelectedShipment(null);
      setManualPartnerId('');
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Manual assignment failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Godown Facility Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Local Godown Management System
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                selectedGodown.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {selectedGodown.status}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {selectedGodown.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {selectedGodown.address}
            </span>
            <span>· Manager: <strong>{selectedGodown.managerName}</strong></span>
            <span>· Helpline: <strong>{selectedGodown.contactNumber}</strong></span>
          </p>
        </div>

        {/* Facility Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <label className="text-xs font-bold text-slate-600 pl-1 whitespace-nowrap">
            Switch Local Godown:
          </label>
          <select
            value={selectedGodownId}
            onChange={(e) => setSelectedGodownId(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 text-slate-800"
          >
            {godowns.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.serviceAreas.slice(0, 2).join(', ')}...) {g.status !== 'ACTIVE' ? '· [INACTIVE]' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Alerts */}
      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2.5 shadow-2xs">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Logistics Workflow Alert:</span>
            <p className="text-rose-700 font-normal leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Inactive Godown Warning */}
      {selectedGodown.status !== 'ACTIVE' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Facility Inactive Status Notice:</span>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              This godown is currently marked <strong>INACTIVE</strong> (facility renovation or maintenance).
              In accordance with AgroChain rule: <em>"Do not assign shipments to an inactive godown."</em>
              Incoming consignments routed here are automatically placed in the <strong>MANUAL_ROUTING_REQUIRED</strong> queue for administrative review.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs (10 Sections matching user prompt) */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'DASHBOARD', label: 'Godown Dashboard', icon: Building2 },
            { id: 'INCOMING', label: `Incoming Shipments (${incomingShipments.length})`, icon: Truck },
            { id: 'PENDING_ACCEPTANCE', label: `Pending Acceptance (${pendingAcceptance.length})`, icon: Clock },
            { id: 'ACCEPTED', label: `Accepted Products (${productsInGodown.length})`, icon: CheckCircle2 },
            { id: 'INVENTORY', label: 'Godown Inventory', icon: Package },
            { id: 'ASSIGNMENTS', label: `Delivery Assignments (${assignedDeliveries.length})`, icon: UserCheck },
            { id: 'HANDOVER', label: `Product Handover (${awaitingPickup.length})`, icon: ShieldCheck },
            { id: 'OUTGOING', label: `Outgoing Deliveries (${outForDelivery.length})`, icon: ArrowRight },
            { id: 'TRACKING', label: 'Tracking History', icon: Layers },
            { id: 'REPORTS', label: 'Monthly Reports', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GODOWN DASHBOARD */}
      {/* ========================================================= */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* 7 Dashboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div
              onClick={() => setActiveTab('INCOMING')}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400 cursor-pointer transition-all"
            >
              <div className="text-[11px] font-bold text-slate-500 uppercase">Incoming Shipments</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{incomingShipments.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">From Gazipur Central</div>
            </div>

            <div
              onClick={() => setActiveTab('PENDING_ACCEPTANCE')}
              className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs hover:border-amber-400 cursor-pointer transition-all"
            >
              <div className="text-[11px] font-bold text-amber-700 uppercase">Pending Acceptance</div>
              <div className="text-xl font-bold text-amber-900 mt-1">{pendingAcceptance.length}</div>
              <div className="text-[10px] text-amber-700/80 mt-0.5">Arrived at dock</div>
            </div>

            <div
              onClick={() => setActiveTab('ACCEPTED')}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400 cursor-pointer transition-all"
            >
              <div className="text-[11px] font-bold text-slate-500 uppercase">Products in Godown</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{productsInGodown.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Storage bays</div>
            </div>

            <div
              onClick={() => setActiveTab('ASSIGNMENTS')}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400 cursor-pointer transition-all"
            >
              <div className="text-[11px] font-bold text-slate-500 uppercase">Assigned Deliveries</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{assignedDeliveries.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Area partners</div>
            </div>

            <div
              onClick={() => setActiveTab('HANDOVER')}
              className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
            >
              <div className="text-[11px] font-bold text-blue-700 uppercase">Awaiting Pickup</div>
              <div className="text-xl font-bold text-blue-900 mt-1">{awaitingPickup.length}</div>
              <div className="text-[10px] text-blue-700/80 mt-0.5">Handover queue</div>
            </div>

            <div
              onClick={() => setActiveTab('OUTGOING')}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400 cursor-pointer transition-all"
            >
              <div className="text-[11px] font-bold text-slate-500 uppercase">Out for Delivery</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{outForDelivery.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Doorstep route</div>
            </div>

            <div
              onClick={() => setActiveTab('REPORTS')}
              className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs hover:border-emerald-400 cursor-pointer transition-all"
            >
              <div className="text-[11px] font-bold text-emerald-800 uppercase">Completed</div>
              <div className="text-xl font-bold text-emerald-900 mt-1">{completedDeliveries.length}</div>
              <div className="text-[10px] text-emerald-700 mt-0.5">OTP Confirmed</div>
            </div>
          </div>

          {/* Service Area Coverage Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold">Automated Area-Based Routing Active for:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedGodown.serviceAreas.map((area) => (
                    <span
                      key={area}
                      className="px-2 py-0.5 bg-white text-emerald-800 rounded font-semibold text-[11px] border border-emerald-200"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] text-emerald-800 font-semibold block">Capacity Utilization:</span>
              <span className="font-mono font-bold text-emerald-950 text-sm">
                {selectedGodown.currentStockMetricTons} MT / {selectedGodown.capacityMetricTons} MT
              </span>
            </div>
          </div>

          {/* Quick Action Pending Acceptance Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Immediate Action Required: Arrived Consignments</h3>
                <p className="text-xs text-slate-500">
                  Products arrived at receiving bay must be physically verified and accepted by the manager.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('INCOMING')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>View All ({godownShipments.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Shipment ID</th>
                    <th className="py-3 px-4">Consignment</th>
                    <th className="py-3 px-4">Product / Commodity</th>
                    <th className="py-3 px-4">Weight & Quantity</th>
                    <th className="py-3 px-4">Customer Destination</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Physical Acceptance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {godownShipments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No active shipments currently routed to this local godown facility.
                      </td>
                    </tr>
                  ) : (
                    godownShipments.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.id.toUpperCase()}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{s.orderNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{s.productName}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800">{s.quantity} {s.unit}</span>
                          <span className="text-[11px] text-slate-500 block">({s.weightKg} kg net)</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-emerald-800 block">{s.customerArea}</span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[180px] block">
                            {s.customerAddress}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={s.transferStatus} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {s.transferStatus === 'GODOWN_TRANSFER_IN_TRANSIT' && (
                            <button
                              onClick={() => handleMarkArrived(s.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                            >
                              Log Arrived
                            </button>
                          )}

                          {s.transferStatus === 'ARRIVED_LOCAL_GODOWN' && (
                            <button
                              onClick={() => {
                                setSelectedShipment(s);
                                setShowAcceptModal(true);
                              }}
                              className="px-3 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-xs"
                            >
                              ACCEPT PRODUCT
                            </button>
                          )}

                          {s.transferStatus === 'DELIVERY_ACCEPTED' && (
                            <button
                              onClick={() => handleInitiateHandover(s.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200"
                            >
                              Initiate Handover
                            </button>
                          )}

                          {s.transferStatus === 'DELIVERY_PARTNER_COLLECTED' && (
                            <button
                              onClick={() => handleOutForDelivery(s)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-xs"
                            >
                              Out For Delivery
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedShipment(s);
                              setShowDetailsModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                            title="View Full Shipment Traceability"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: INCOMING SHIPMENTS TABLE (Matching user requirement) */}
      {/* ========================================================= */}
      {(activeTab === 'INCOMING' || activeTab === 'PENDING_ACCEPTANCE' || activeTab === 'ACCEPTED') && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {activeTab === 'PENDING_ACCEPTANCE'
                  ? 'Consignments Awaiting Physical Acceptance'
                  : activeTab === 'ACCEPTED'
                  ? 'Accepted Produce Stored in Godown'
                  : 'Incoming Produce Shipments'}
              </h3>
              <p className="text-xs text-slate-500">
                Local Godown Managers verify produce sacks, tamper seals, and physical intactness upon receiving from transit carrier.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search shipment, order, crop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Shipment ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Quantity / Weight</th>
                  <th className="py-3 px-4">Source Warehouse</th>
                  <th className="py-3 px-4">Destination Godown</th>
                  <th className="py-3 px-4">Customer Delivery Area</th>
                  <th className="py-3 px-4">Transfer Status</th>
                  <th className="py-3 px-4">Arrival Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {godownShipments
                  .filter((s) => {
                    if (activeTab === 'PENDING_ACCEPTANCE') {
                      return s.transferStatus === 'ARRIVED_LOCAL_GODOWN';
                    }
                    if (activeTab === 'ACCEPTED') {
                      return ['GODOWN_RECEIVED', 'DELIVERY_PARTNER_ASSIGNED', 'DELIVERY_ACCEPTED'].includes(
                        s.transferStatus
                      );
                    }
                    return true;
                  })
                  .filter(
                    (s) =>
                      s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.customerArea.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.id.toUpperCase()}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{s.orderNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{s.productName}</td>
                      <td className="py-3 px-4 font-medium">
                        {s.quantity} {s.unit} ({s.weightKg} kg)
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                        {s.sourceWarehouseName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{s.destinationGodownName}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-emerald-800">{s.customerArea}</span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={s.transferStatus} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {s.arrivalDate || s.dispatchDate || 'In Transit'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedShipment(s);
                            setShowDetailsModal(true);
                          }}
                          className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50"
                        >
                          View Details
                        </button>

                        {s.transferStatus === 'ARRIVED_LOCAL_GODOWN' && (
                          <button
                            onClick={() => {
                              setSelectedShipment(s);
                              setShowAcceptModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-xs"
                          >
                            Accept Product
                          </button>
                        )}

                        {s.transferStatus === 'GODOWN_TRANSFER_IN_TRANSIT' && (
                          <button
                            onClick={() => handleMarkArrived(s.id)}
                            className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded"
                          >
                            Log Arrived
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedShipment(s);
                            setExceptionType('DAMAGED');
                            setShowExceptionModal(true);
                          }}
                          className="px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 border border-amber-200 rounded"
                          title="Report Damage"
                        >
                          Damage
                        </button>

                        <button
                          onClick={() => {
                            setSelectedShipment(s);
                            setExceptionType('QUANTITY_MISMATCH');
                            setShowExceptionModal(true);
                          }}
                          className="px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded"
                          title="Report Quantity Mismatch"
                        >
                          Mismatch
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: GODOWN INVENTORY */}
      {/* ========================================================= */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Facility Capacity</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{selectedGodown.capacityMetricTons} MT</div>
              <p className="text-xs text-slate-500 mt-1">Temperature-stabilized regional buffer storage</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Current Stored Tonnage</span>
              <div className="text-2xl font-bold text-emerald-800 mt-1">{selectedGodown.currentStockMetricTons} MT</div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (selectedGodown.currentStockMetricTons / selectedGodown.capacityMetricTons) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Active Consignment Sacks</span>
              <div className="text-2xl font-bold text-blue-900 mt-1">{selectedGodown.itemCount || 48} Crates</div>
              <p className="text-xs text-slate-500 mt-1">Turnaround rate: 24h doorstep dispatch SLA</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Stock Breakdown in {selectedGodown.name}</h3>
            <div className="space-y-3 text-xs">
              {godownShipments
                .filter((s) => ['GODOWN_RECEIVED', 'DELIVERY_PARTNER_ASSIGNED', 'DELIVERY_ACCEPTED'].includes(s.transferStatus))
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{item.productName}</span>
                      <span className="text-slate-500 text-[11px] block">
                        Consignment: {item.orderNumber} · Customer Area: {item.customerArea}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-800">
                        {item.quantity} {item.unit} ({item.weightKg} kg)
                      </span>
                      <StatusBadge status={item.transferStatus} size="sm" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: DELIVERY ASSIGNMENTS MONITOR */}
      {/* ========================================================= */}
      {activeTab === 'ASSIGNMENTS' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Automatic Area-Based Assignment Protocol:</span>
              <p className="mt-0.5 text-emerald-800 leading-relaxed">
                Immediately after product acceptance, the dispatch engine evaluates approved partners serving the customer's delivery area with active capacity and balanced workloads.
                If no partner is available, shipments wait in the manual assignment queue below.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {godownShipments
              .filter((s) =>
                ['DELIVERY_PARTNER_ASSIGNED', 'DELIVERY_ACCEPTED', 'DELIVERY_ASSIGNMENT_PENDING'].includes(
                  s.transferStatus
                )
              )
              .map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-mono font-bold text-xs text-slate-900">{s.id.toUpperCase()}</span>
                    <StatusBadge status={s.transferStatus} size="sm" />
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="font-bold text-slate-900">{s.productName}</div>
                    <p className="text-slate-500">Order: {s.orderNumber}</p>
                    <p className="text-slate-700">
                      Destination: <strong>{s.customerAddress}</strong> ({s.customerArea})
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    {s.assignedPartnerName ? (
                      <div>
                        <span className="text-slate-500 text-[11px] block">Assigned Delivery Partner:</span>
                        <span className="font-bold text-slate-900 text-sm">{s.assignedPartnerName}</span>
                        <span className="text-emerald-700 font-semibold text-[11px] block mt-0.5">
                          Assigned: {s.assignedDate || 'Just now'}
                        </span>
                      </div>
                    ) : (
                      <div className="text-amber-800 flex items-center justify-between">
                        <span>Awaiting partner allocation</span>
                        <button
                          onClick={() => {
                            setSelectedShipment(s);
                            setShowManualAssignModal(true);
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold"
                        >
                          Manual Assign
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: PRODUCT HANDOVER (Two-sided Handover) */}
      {/* ========================================================= */}
      {activeTab === 'HANDOVER' && (
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Two-Sided Product Handover Protocol:</span>
              <p className="mt-0.5 text-purple-900/90 leading-relaxed">
                Step 1: Godown Manager initiates handover after checking partner identity.
                Step 2: Assigned delivery partner confirms receipt on their mobile dispatch view.
                Only when BOTH confirmations are completed is the shipment marked <strong>DELIVERY_PARTNER_COLLECTED</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {godownShipments
              .filter((s) => ['DELIVERY_ACCEPTED', 'DELIVERY_PARTNER_COLLECTED'].includes(s.transferStatus))
              .map((s) => {
                const partner = store.deliveryPartners.find((p) => p.id === s.assignedPartnerId);
                const isHandoverInitiated = !!s.handoverInitiatedAt;
                const isHandoverCompleted = !!s.handoverConfirmedAt;

                return (
                  <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="font-mono font-bold text-xs text-slate-900">{s.id.toUpperCase()}</span>
                        <p className="text-[11px] text-slate-500 font-mono">Ref: {s.orderNumber}</p>
                      </div>
                      <StatusBadge status={s.transferStatus} size="sm" />
                    </div>

                    <div className="text-xs space-y-2">
                      <div className="font-bold text-slate-900 text-sm">{s.productName}</div>
                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div>Quantity: <strong>{s.quantity} {s.unit}</strong></div>
                        <div>Weight: <strong>{s.weightKg} kg</strong></div>
                      </div>

                      {/* Assigned Partner Profile Card */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Assigned Delivery Partner:</span>
                        <div className="font-bold text-slate-900 text-sm">{s.assignedPartnerName || 'Unassigned'}</div>
                        <div className="text-slate-600 flex items-center justify-between text-[11px]">
                          <span>Partner ID: {partner?.id || s.assignedPartnerId}</span>
                          <span>Phone: <strong>{partner?.phone || '+880 1622-987654'}</strong></span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Vehicle: {partner?.vehicleType} ({partner?.vehicleRegNumber})
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600">
                        Customer Destination: <strong>{s.customerAddress}</strong>
                      </div>
                    </div>

                    {/* Two-Sided Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500">
                        {isHandoverCompleted ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Handover Completed ({s.handoverConfirmedAt})</span>
                          </span>
                        ) : isHandoverInitiated ? (
                          <span className="text-purple-700 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Awaiting Partner Confirmation</span>
                          </span>
                        ) : (
                          <span>Step 1: Check partner ID</span>
                        )}
                      </div>

                      <div className="space-x-1.5">
                        {!isHandoverInitiated && (
                          <button
                            onClick={() => handleInitiateHandover(s.id)}
                            className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-xs"
                          >
                            HAND OVER PRODUCT
                          </button>
                        )}

                        {isHandoverInitiated && !isHandoverCompleted && (
                          <button
                            onClick={() => handleConfirmPartnerCollection(s)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>CONFIRM PRODUCT RECEIVED</span>
                          </button>
                        )}

                        {isHandoverCompleted && s.transferStatus === 'DELIVERY_PARTNER_COLLECTED' && (
                          <button
                            onClick={() => handleOutForDelivery(s)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>OUT FOR DELIVERY</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: OUTGOING & COMPLETED DELIVERIES */}
      {/* ========================================================= */}
      {activeTab === 'OUTGOING' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Doorstep Deliveries Out on Route</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Shipment ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Delivery Address</th>
                  <th className="py-3 px-4">Assigned Partner</th>
                  <th className="py-3 px-4">Departed At</th>
                  <th className="py-3 px-4">OTP Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outForDelivery.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.id.toUpperCase()}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{s.customerName}</td>
                    <td className="py-3 px-4">{s.customerAddress}</td>
                    <td className="py-3 px-4 font-bold text-emerald-800">{s.assignedPartnerName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{s.outForDeliveryAt || 'On Route'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                        Awaiting Doorstep OTP
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          setSelectedShipment(s);
                          setShowDetailsModal(true);
                        }}
                        className="text-xs text-emerald-700 font-bold hover:underline"
                      >
                        Track Live
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: TRACKING HISTORY */}
      {/* ========================================================= */}
      {activeTab === 'TRACKING' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Select Consignment for Complete Traceability</h3>
            <select
              onChange={(e) => {
                const s = shipments.find((item) => item.id === e.target.value);
                if (s) setSelectedShipment(s);
              }}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800"
            >
              {godownShipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.orderNumber} - {s.productName} ({s.transferStatus})
                </option>
              ))}
            </select>
          </div>

          {selectedShipment ? (
            <TrackingTimeline
              events={store.trackingEvents[selectedShipment.orderId] || []}
              orderNumber={selectedShipment.orderNumber}
              currentStatus={selectedShipment.transferStatus}
              godownName={selectedShipment.destinationGodownName}
            />
          ) : (
            <TrackingTimeline
              events={store.trackingEvents[godownShipments[0]?.orderId] || []}
              orderNumber={godownShipments[0]?.orderNumber}
              currentStatus={godownShipments[0]?.transferStatus}
              godownName={selectedGodown.name}
            />
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: MONTHLY REPORTS */}
      {/* ========================================================= */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{selectedGodown.name} Monthly Dispatch Analytics</h3>
              <p className="text-xs text-slate-500">April 2026 Monthly Throughput, Intake, and SLA Fulfillment</p>
            </div>
            <div className="flex items-center gap-2">
              <select className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700">
                <option>April 2026</option>
                <option>March 2026</option>
                <option>February 2026</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Incoming Shipments</span>
              <div className="text-xl font-bold text-slate-900 mt-1">142</div>
              <span className="text-[10px] text-emerald-700">100% Transit Rate</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Accepted Shipments</span>
              <div className="text-xl font-bold text-slate-900 mt-1">138</div>
              <span className="text-[10px] text-emerald-700">97.2% Clean Intake</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Pending Acceptance</span>
              <div className="text-xl font-bold text-amber-800 mt-1">{pendingAcceptance.length}</div>
              <span className="text-[10px] text-amber-700">At receiving dock</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Dispatched to Partners</span>
              <div className="text-xl font-bold text-blue-900 mt-1">132</div>
              <span className="text-[10px] text-blue-700">Average 42m match</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Out for Delivery</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{outForDelivery.length}</div>
              <span className="text-[10px] text-slate-500">Active routes</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Completed Deliveries</span>
              <div className="text-xl font-bold text-emerald-900 mt-1">128</div>
              <span className="text-[10px] text-emerald-700">100% OTP Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ACCEPT PRODUCT & TRIGGER AUTO-ASSIGNMENT */}
      {/* ========================================================= */}
      {showAcceptModal && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Physical Godown Acceptance</h3>
                  <p className="text-[11px] text-slate-500">Shipment ID: {selectedShipment.id.toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAcceptModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAcceptProductSubmit} className="p-5 space-y-4">
              {/* Shipment Details Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Order Number:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedShipment.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Product / Commodity:</span>
                  <span className="font-bold text-slate-900">{selectedShipment.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity & Net Weight:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedShipment.quantity} {selectedShipment.unit} ({selectedShipment.weightKg} kg)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Source Warehouse:</span>
                  <span className="text-slate-700 truncate max-w-[220px]">{selectedShipment.sourceWarehouseName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Delivery Area:</span>
                  <span className="font-bold text-emerald-800">{selectedShipment.customerArea}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Address:</span>
                  <span className="text-slate-800 truncate max-w-[220px]">{selectedShipment.customerAddress}</span>
                </div>
              </div>

              {/* Physical Verification Checklist */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Physical Verification Checks:</span>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={verifyCondition}
                    onChange={(e) => setVerifyCondition(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Product condition intact with no transit decay or moisture leakage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={verifyQuantity}
                    onChange={(e) => setVerifyQuantity(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Bag / sack count matches consignment dispatch manifest ({selectedShipment.quantity} {selectedShipment.unit})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={verifyPackaging}
                    onChange={(e) => setVerifyPackaging(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Central warehouse tamper-evident security tags and batch QR codes intact</span>
                </label>
              </div>

              {/* Automatic Assignment Notice */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>Automatic Area-Based Assignment Trigger:</span>
                </span>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  Upon clicking Accept, AgroChain will automatically evaluate approved delivery partners serving{' '}
                  <strong>{selectedShipment.customerArea}</strong> and assign the nearest available partner with balanced workload.
                </p>
              </div>

              {lastAssignmentResult && (
                <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs text-emerald-900 space-y-1">
                  <span className="font-bold">Match Result:</span>
                  <p>
                    Assigned Partner: <strong>{lastAssignmentResult.partner?.name}</strong> (Rating: {lastAssignmentResult.partner?.rating}★, Vehicle: {lastAssignmentResult.partner?.vehicleType})
                  </p>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={acceptingLoading || !verifyCondition || !verifyQuantity || !verifyPackaging}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  {acceptingLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Accepting & Matching Partner...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>ACCEPT PRODUCT</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REPORT EXCEPTION (DAMAGE / MISMATCH) */}
      {/* ========================================================= */}
      {showExceptionModal && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
                <h3 className="text-sm font-bold text-slate-900">Report Intake Exception</h3>
              </div>
              <button
                onClick={() => setShowExceptionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReportExceptionSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Discrepancy Category:</label>
                <select
                  value={exceptionType}
                  onChange={(e) => setExceptionType(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="DAMAGED">Packaging / Produce Damaged in Transit</option>
                  <option value="QUANTITY_MISMATCH">Quantity / Weight Mismatch</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Details & Photographic Evidence Notes:</label>
                <textarea
                  rows={3}
                  value={exceptionNotes}
                  onChange={(e) => setExceptionNotes(e.target.value)}
                  placeholder="e.g. 2 sacks of tomatoes torn at loading dock; 5kg weight shortage observed."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                <strong>Rule Enforced:</strong> Automatic delivery partner assignment is paused immediately until this exception is cleared by Quality Inspection.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExceptionModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold"
                >
                  Submit Exception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MANUAL PARTNER ASSIGNMENT */}
      {/* ========================================================= */}
      {showManualAssignModal && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Manual Delivery Partner Allocation</h3>
              <button
                onClick={() => setShowManualAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAssign} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div>Consignment: <strong>{selectedShipment.orderNumber}</strong></div>
                <div>Customer Destination: <strong>{selectedShipment.customerAddress}</strong> ({selectedShipment.customerArea})</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Approved Delivery Partner:</label>
                <select
                  value={manualPartnerId}
                  onChange={(e) => setManualPartnerId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Choose Approved Partner --</option>
                  {store.deliveryPartners
                    .filter((p) => p.approvalStatus === 'APPROVED' && p.canDeliver)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · Areas: {p.assignedAreas.join(', ')} (Active Jobs: {p.activeJobsCount})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualAssignModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualPartnerId}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded font-bold"
                >
                  Assign Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VIEW DETAILS & LIVE TIMELINE */}
      {/* ========================================================= */}
      {showDetailsModal && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Shipment Traceability & Metadata</h3>
                <p className="text-xs text-slate-500 font-mono">Consignment: {selectedShipment.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><strong>Product:</strong> {selectedShipment.productName}</div>
                <div><strong>Weight & Quantity:</strong> {selectedShipment.quantity} {selectedShipment.unit} ({selectedShipment.weightKg} kg)</div>
                <div><strong>Source Facility:</strong> {selectedShipment.sourceWarehouseName}</div>
                <div><strong>Local Godown:</strong> {selectedShipment.destinationGodownName}</div>
                <div><strong>Recipient:</strong> {selectedShipment.customerName} ({selectedShipment.customerPhone})</div>
                <div><strong>Address:</strong> {selectedShipment.customerAddress}</div>
              </div>

              <TrackingTimeline
                events={store.trackingEvents[selectedShipment.orderId] || []}
                orderNumber={selectedShipment.orderNumber}
                currentStatus={selectedShipment.transferStatus}
                godownName={selectedShipment.destinationGodownName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
