export type UserRole = 'admin' | 'farmer' | 'buyer' | 'delivery' | 'warehouse' | 'inspector';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  location: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  isWarehouseManager?: boolean;
  managedWarehouseIds?: string[];
  isGodownManager?: boolean;
  godownId?: string;
  createdAt: string;
  payoutMethod?: 'bKash' | 'Nagad' | 'Bank Transfer';
  payoutAccountNumber?: string;
  payoutBankName?: string;
}

export interface Farm {
  id: string;
  farmerId: string;
  farmerName: string;
  name: string;
  division: string;
  district: string;
  upazila: string;
  sizeAcres: number;
  soilType: string;
  irrigationType: string;
  gpsCoordinates?: string;
  verified: boolean;
}

export interface Crop {
  id: string;
  name: string;
  category: 'Grains & Cereals' | 'Vegetables' | 'Fruits' | 'Spices' | 'Cash Crops';
  variety: string;
  growingPeriodDays: number;
  season: 'Rabi' | 'Kharif-1' | 'Kharif-2' | 'All Season';
}

export interface CropBatch {
  id: string;
  batchCode: string;
  cropId: string;
  cropName: string;
  variety: string;
  farmId: string;
  farmName: string;
  farmerId: string;
  farmerName: string;
  sowingDate: string;
  harvestDate: string;
  estimatedQuantityKg: number;
  actualQuantityKg: number;
  qualityStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECHECK_REQUIRED';
  blockchainHash?: string;
  qrCodeUrl?: string;
}

export interface Product {
  id: string;
  batchId: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  farmLocation: string;
  name: string;
  category: string;
  cropType: string;
  variety: string;
  description: string;
  pricePerUnit: number;
  unit: 'kg' | 'maund' | 'ton' | 'piece' | 'crate';
  availableQuantity: number;
  harvestDate: string;
  imageUrl: string;
  qualityStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECHECK_REQUIRED';
  isOrganic?: boolean;
  featured?: boolean;
  rating?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'SELLER_PREPARING'
  | 'PICKUP_ASSIGNED'
  | 'QC_SCHEDULED'
  | 'QC_APPROVED'
  | 'QC_REJECTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT_CENTRAL'
  | 'WAREHOUSE_RECEIVED'
  | 'IN_WAREHOUSE'
  | 'GODOWN_ASSIGNED'
  | 'GODOWN_TRANSFER_IN_TRANSIT'
  | 'ARRIVED_LOCAL_GODOWN'
  | 'GODOWN_RECEIVED'
  | 'DELIVERY_PARTNER_ASSIGNED'
  | 'DELIVERY_ASSIGNMENT_PENDING'
  | 'MANUAL_ROUTING_REQUIRED'
  | 'DELIVERY_ACCEPTED'
  | 'DELIVERY_PARTNER_COLLECTED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'GODOWN_RECEIVING_ISSUE'
  | 'TRANSFER_DELAYED'
  | 'IN_TRANSIT'
  | 'ARRIVED_REGIONAL_GODOWN';

export interface OrderItem {
  productId: string;
  productName: string;
  farmerId: string;
  farmerName: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  subtotal: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerCity: string;
  buyerArea?: string;
  items: OrderItem[];
  productSubtotal: number;
  deliveryFee: number;
  totalWeightKg: number;
  totalAmount: number; // productSubtotal + deliveryFee
  platformCommission: number; // 10% of productSubtotal
  sellerNetEarnings: number; // productSubtotal - platformCommission
  paymentMethod: 'ONLINE' | 'COD';
  paymentGateway?: 'RUPANTORPAY';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  transactionId?: string;
  gatewayTransactionId?: string;
  paymentCurrency?: string;
  paymentVerifiedAt?: string;
  orderStatus: OrderStatus;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  pickupPartnerId?: string;
  pickupPartnerName?: string;
  warehouseId?: string;
  warehouseName?: string;
  godownId?: string;
  godownName?: string;
  destinationGodownId?: string;
  destinationGodownName?: string;
  godownReceivedAt?: string;
  handoverInitiatedAt?: string;
  partnerCollectedAt?: string;
  outForDeliveryAt?: string;
  deliveryAssignmentStatus?: 'PENDING' | 'ASSIGNED' | 'ACCEPTED' | 'DECLINED' | 'MANUAL_REQUIRED';
  deliveryOtp: string; // Secret 4-digit code provided to customer
  otpExpiresAt?: string;
  otpAttemptsRemaining: number;
  isDeliveryVerified: boolean; // Confirmed upon OTP verification
  deliveryConfirmedAt?: string;
  qualityCheckId?: string;
  qualityStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECHECK_REQUIRED';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface LocalGodown {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  serviceAreas: string[];
  managerId: string;
  managerName: string;
  managerPhone: string;
  contactNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
  capacityMetricTons: number;
  currentStockMetricTons: number;
  itemCount: number;
}

export interface GodownShipment {
  id: string; // e.g. "SHP-101"
  orderId: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  unit: string;
  weightKg: number;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationGodownId: string;
  destinationGodownName: string;
  customerArea: string;
  customerAddress: string;
  customerName: string;
  customerPhone: string;
  productCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';
  transferStatus:
    | 'PENDING_DISPATCH'
    | 'GODOWN_TRANSFER_IN_TRANSIT'
    | 'ARRIVED_LOCAL_GODOWN'
    | 'GODOWN_RECEIVED'
    | 'DELIVERY_PARTNER_ASSIGNED'
    | 'DELIVERY_ASSIGNMENT_PENDING'
    | 'MANUAL_ROUTING_REQUIRED'
    | 'DELIVERY_ACCEPTED'
    | 'DELIVERY_PARTNER_COLLECTED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'ISSUE_REPORTED';
  dispatchDate?: string;
  arrivalDate?: string;
  acceptedDate?: string;
  acceptedByManagerId?: string;
  acceptedByManagerName?: string;
  assignedPartnerId?: string;
  assignedPartnerName?: string;
  assignedDate?: string;
  partnerAcceptedDate?: string;
  handoverInitiatedAt?: string;
  handoverManagerId?: string;
  handoverConfirmedAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  exceptionType?: 'DAMAGED' | 'QUANTITY_MISMATCH' | 'NONE';
  exceptionNotes?: string;
  transferCarrier?: string;
}

export interface TrackingEvent {
  id: string;
  orderId: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  actorRole: string;
  actorName: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  email: string;
  nid: string;
  address: string;
  preferredArea: string;
  assignedAreas: string[];
    warehouseId?: string;
  vehicleType: 'Motorcycle' | 'Pickup Van' | 'Cargo Auto' | 'Mini Truck';
  vehicleRegNumber: string;
  canPickup: boolean;
  canDeliver: boolean;
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  approvedBy?: string;
  approvalDate?: string;
  approvalNotes?: string;
  approverRole?: 'ADMIN' | 'WAREHOUSE_MANAGER';
  requestedInfoNotes?: string;
  rating: number;
  activeJobsCount: number;
  completedJobsTotal: number;
  codCollectedToday: number;
  codPendingDeposit: number;
}

export interface LogisticsJob {
  id: string;
  jobCode: string;
  orderId: string;
  orderNumber: string;
  partnerId: string;
  partnerName: string;
  type: 'PICKUP' | 'DELIVERY';
  productSummary: string;
  originAddress: string;
  destinationAddress: string;
  godownId?: string;
  godownName?: string;
  assignedDate: string;
  status: 
    | 'ASSIGNED'
    | 'ACCEPTED'
    | 'DECLINED'
    | 'REJECTED'
    | 'QC_PENDING'
    | 'EN_ROUTE'
    | 'PICKED_UP'
    | 'WAREHOUSE_HANDOVER'
    | 'ARRIVED_AT_GODOWN'
    | 'COLLECTED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'FAILED';
  handoverConfirmed?: boolean;
  codAmount?: number;
  proofNotes?: string;
  deliveryOtpSubmitted?: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  type: 'CENTRAL' | 'REGIONAL_GODOWN';
  location: string;
  managerName: string;
  managerId: string;
  capacityMetricTons: number;
  currentStockMetricTons: number;
  temperatureControlled: boolean;
}

export interface WarehouseInventoryItem {
  id: string;
  warehouseId: string;
  warehouseName: string;
  cropName: string;
  category: string;
  batchCode: string;
  farmerName: string;
  quantityKg: number;
  storageZone: string;
  qualityStatus: 'APPROVED' | 'PENDING';
  arrivalDate: string;
}

export interface QualityCheck {
  id: string;
  orderId?: string;
  batchId: string;
  batchCode: string;
  cropName: string;
  farmerName: string;
  farmLocation: string;
  inspectorId: string;
  inspectorName: string;
  inspectionDate: string;
  inspectionLocation: 'FARM' | 'WAREHOUSE';
  grade: 'Not graded' | 'Grade A - Premium' | 'Grade B - Standard' | 'Grade C - Commercial';
  moistureContentPercent: number;
  pesticideResiduePpm: number;
  foreignMatterPercent: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECHECK_REQUIRED';
  certificateNumber?: string;
  remarks: string;
}

export interface SellerSettlement {
  id: string;
  orderId: string;
  orderNumber: string;
  farmerId: string;
  farmerName: string;
  productSalesValue: number; // Gross product sales value
  commissionDeducted: number; // 10% platform commission
  netPayout: number; // productSalesValue - commissionDeducted
  amount?: number; // legacy alias for netPayout
  deliveryFee: number; // for reference (paid by customer, excluded from commission)
  productSummary: string;
  deliveryDate: string;
  deliveryConfirmedAt?: string;
  paymentMethod: 'bKash' | 'Nagad' | 'Bank Transfer';
  settlementStatus: 'PENDING' | 'PROCESSING' | 'PAID' | 'ON_HOLD' | 'COMPLETED';
  payoutDate?: string;
  payoutReference?: string;
  holdReason?: string;
}

export interface CODRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  deliveryPartnerId: string;
  deliveryPartnerName: string;
  amount: number;
  collectedAt: string;
  depositStatus: 'CASH_COLLECTED' | 'CASH_DEPOSIT_PENDING' | 'CASH_DEPOSIT_VERIFIED';
  verifiedByAdmin?: string;
  depositDate?: string;
}
