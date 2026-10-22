import {
  User,
  Farm,
  Crop,
  CropBatch,
  Product,
  Order,
  DeliveryPartner,
  LogisticsJob,
  Warehouse,
  WarehouseInventoryItem,
  QualityCheck,
  SellerSettlement,
  CODRecord,
  TrackingEvent,
  LocalGodown,
  GodownShipment,
} from '../types';
import {
  DEMO_USERS,
  INITIAL_FARMS,
  INITIAL_CROPS,
  INITIAL_BATCHES,
  INITIAL_PRODUCTS,
  INITIAL_WAREHOUSES,
  INITIAL_INVENTORY,
  INITIAL_DELIVERY_PARTNERS,
  INITIAL_ORDERS,
  INITIAL_LOGISTICS_JOBS,
  INITIAL_QUALITY_CHECKS,
  INITIAL_COD_RECORDS,
  INITIAL_SETTLEMENTS,
  INITIAL_TRACKING_EVENTS,
  INITIAL_LOCAL_GODOWNS,
  INITIAL_GODOWN_SHIPMENTS,
} from './mockData';
import { selectDestinationLocalGodown, autoAssignDeliveryPartner } from '../utils/godownRouting';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://agrochain-api.onrender.com/api';

export type AdminAccount = Pick<User, 'id' | 'name' | 'email' | 'role' | 'status'> & {
  createdAt?: string;
  created_at?: string;
};

type BackendRecord<T> = {
  id: string;
  data: T;
  created_at: string;
  updated_at: string;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('agro_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getBackendRecords<T>(resource: string): Promise<T[]> {
  const response = await fetch(`${API_BASE_URL}/records/${resource}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${resource}: ${response.status}`);
  }

  const records: BackendRecord<T>[] = await response.json();
  return records.map((record) => ({ ...record.data, id: record.id }));
}

async function saveBackendRecord<T extends { id: string }>(
  resource: string,
  record: T
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/records/${resource}/${encodeURIComponent(record.id)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ data: record }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to save ${resource}: ${response.status}`);
  }
}


// In-memory state store with localStorage persistence for realistic interactions
class LocalStore {
  users: User[];
  farms: Farm[];
  crops: Crop[];
  batches: CropBatch[];
  products: Product[];
  warehouses: Warehouse[];
  inventory: WarehouseInventoryItem[];
  deliveryPartners: DeliveryPartner[];
  orders: Order[];
  jobs: LogisticsJob[];
  qualityChecks: QualityCheck[];
  codRecords: CODRecord[];
  settlements: SellerSettlement[];
  trackingEvents: Record<string, TrackingEvent[]>;
  godowns: LocalGodown[];
  godownShipments: GodownShipment[];
  isBackendConnected: boolean = false;

  constructor() {
    this.users = this.load('agro_users', DEMO_USERS);
    this.farms = this.load('agro_farms', INITIAL_FARMS);
    this.crops = this.load('agro_crops', INITIAL_CROPS);
    this.batches = this.load('agro_batches', INITIAL_BATCHES);
    this.products = this.load('agro_products', INITIAL_PRODUCTS);
    this.warehouses = this.load('agro_warehouses', INITIAL_WAREHOUSES);
    this.inventory = this.load('agro_inventory', INITIAL_INVENTORY);
    const savedPartners = this.load<DeliveryPartner[]>(
  'agro_delivery_partners',
  INITIAL_DELIVERY_PARTNERS
);

this.deliveryPartners = savedPartners.map((savedPartner) => {
  const initialPartner = INITIAL_DELIVERY_PARTNERS.find(
    (partner) => partner.id === savedPartner.id
  );

  return {
    ...savedPartner,
    warehouseId: savedPartner.warehouseId || initialPartner?.warehouseId,
  };
});

localStorage.setItem(
  'agro_delivery_partners',
  JSON.stringify(this.deliveryPartners)
);
    this.orders = this.load('agro_orders', INITIAL_ORDERS);
    this.jobs = this.load('agro_jobs', INITIAL_LOGISTICS_JOBS);
    this.qualityChecks = this.load('agro_quality_checks', INITIAL_QUALITY_CHECKS);
    this.codRecords = this.load('agro_cod_records', INITIAL_COD_RECORDS);
    this.settlements = this.load('agro_settlements', INITIAL_SETTLEMENTS);
    this.trackingEvents = this.load('agro_tracking_events', INITIAL_TRACKING_EVENTS);
    this.godowns = this.load('agro_local_godowns', INITIAL_LOCAL_GODOWNS);
    this.godownShipments = this.load('agro_godown_shipments', INITIAL_GODOWN_SHIPMENTS);
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private save(key: string, data: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  public resetAll() {
    localStorage.clear();
    this.users = DEMO_USERS;
    this.farms = INITIAL_FARMS;
    this.crops = INITIAL_CROPS;
    this.batches = INITIAL_BATCHES;
    this.products = INITIAL_PRODUCTS;
    this.warehouses = INITIAL_WAREHOUSES;
    this.inventory = INITIAL_INVENTORY;
    this.deliveryPartners = INITIAL_DELIVERY_PARTNERS;
    this.orders = INITIAL_ORDERS;
    this.jobs = INITIAL_LOGISTICS_JOBS;
    this.qualityChecks = INITIAL_QUALITY_CHECKS;
    this.codRecords = INITIAL_COD_RECORDS;
    this.settlements = INITIAL_SETTLEMENTS;
    this.trackingEvents = INITIAL_TRACKING_EVENTS;
    this.godowns = INITIAL_LOCAL_GODOWNS;
    this.godownShipments = INITIAL_GODOWN_SHIPMENTS;
  }
}

export const store = new LocalStore();

// REST API Service Layer matching Django REST Framework Endpoints
export const agroApi = {
  // Test connection to Django backend
  async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE_URL}/roles/`, { signal: controller.signal });
      clearTimeout(timeoutId);
      store.isBackendConnected = res.ok;
      return res.ok;
    } catch {
      store.isBackendConnected = false;
      return false;
    }
  },

  // Create a real account through the backend registration endpoint.
  async registerAccount(input: {
    name: string;
    email: string;
    password: string;
    role: 'farmer' | 'buyer' | 'delivery';
  }): Promise<{ message: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || `Registration failed (${res.status})`);
    }

    if (
      !data ||
      typeof data.message !== 'string' ||
      !data.user ||
      typeof data.user.id !== 'string' ||
      typeof data.user.role !== 'string'
    ) {
      throw new Error('The server returned an invalid registration response');
    }

    return data as { message: string; user: User };
  },

  // Create the first administrator using a one-time hosting secret.
  async bootstrapAdmin(input: {
    name: string;
    email: string;
    password: string;
    bootstrapToken: string;
  }): Promise<{ message: string }> {
    const { bootstrapToken, ...body } = input;
    const res = await fetch(`${API_BASE_URL}/admin/bootstrap/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Bootstrap-Token': bootstrapToken,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Admin setup failed (${res.status})`);
    if (typeof data.message !== 'string') throw new Error('The server returned an invalid setup response');
    return data as { message: string };
  },

  // Create an additional administrator; backend access is gated by ADMIN_ACCOUNT_CREATION_ENABLED.
  async createAdminAccount(input: { name: string; email: string; password: string; creationToken: string }): Promise<{ message: string }> {
    const { creationToken, ...body } = input;
    const res = await fetch(`${API_BASE_URL}/admin/create-account/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Bootstrap-Token': creationToken,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Admin account creation failed (${res.status})`);
    if (typeof data.message !== 'string') throw new Error('The server returned an invalid account creation response');
    return data as { message: string };
  },

  // Temporary recovery endpoint; the backend must have ADMIN_RECOVERY_ENABLED=true.
  async recoverAdminPassword(input: { email: string; password: string; recoveryToken: string }): Promise<{ message: string }> {
    const { recoveryToken, ...body } = input;
    const res = await fetch(`${API_BASE_URL}/admin/recover-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Bootstrap-Token': recoveryToken,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Admin password recovery failed (${res.status})`);
    if (typeof data.message !== 'string') throw new Error('The server returned an invalid recovery response');
    return data as { message: string };
  },

  async getAdminUsers(): Promise<AdminAccount[]> {
    const res = await fetch(`${API_BASE_URL}/admin/users/`, { headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Could not load accounts (${res.status})`);
    if (!Array.isArray(data)) throw new Error('The server returned an invalid account list');
    return data as AdminAccount[];
  },

  async createStaffAccount(input: { name: string; email: string; password: string; role: 'warehouse' | 'inspector' }): Promise<AdminAccount> {
    const res = await fetch(`${API_BASE_URL}/admin/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Could not create staff account (${res.status})`);
    return data as AdminAccount;
  },

  async updateAccountStatus(id: string, status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'): Promise<AdminAccount> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(id)}/status/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Could not update account (${res.status})`);
    return data as AdminAccount;
  },

  async requestPasswordReset(email: string, role: User['role']): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/password-reset/request/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Password reset request failed (${res.status})`);
    if (typeof data.message !== 'string') throw new Error('The server returned an invalid password reset response');
    return data as { message: string };
  },

  async confirmPasswordReset(token: string, password: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/password-reset/confirm/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Password reset failed (${res.status})`);
    if (typeof data.message !== 'string') throw new Error('The server returned an invalid password reset response');
    return data as { message: string };
  },

  // Authenticate only against the backend; never silently fall back to a mock user.
  async login(email: string, password: string, role: User['role']): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || `Login failed (${res.status})`);
    }

    if (typeof data.token !== 'string' || !data.user) {
      throw new Error('The server returned an invalid login response');
    }

    return data as { token: string; user: User };
  },

  // Verify the saved session against the backend.
  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('agro_auth_token');
    if (!token) throw new Error('No saved authentication token');
    const res = await fetch(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Session verification failed (${res.status})`);
    }
    if (!data || typeof data.id !== "string" || typeof data.role !== "string") {
      throw new Error('The server returned an invalid user response');
    }
    return data as User;
  },

  // GET /api/farms/
  
async getFarms(farmerId?: string): Promise<Farm[]> {
  try {
    const farms = await getBackendRecords<Farm>('farms');
    store.farms = farms;
    localStorage.setItem('agro_farms', JSON.stringify(farms));

    if (farmerId) {
      return farms.filter((f) => f.farmerId === farmerId);
    }

    return farms;
  } catch (error) {
    console.error('Could not load farms from PostgreSQL:', error);

    if (farmerId) {
      return store.farms.filter((f) => f.farmerId === farmerId);
    }

    return store.farms;
  }
},


  
async addFarm(farm: Omit<Farm, 'id'>): Promise<Farm> {
  const newFarm: Farm = {
    ...farm,
    id: `farm-${Date.now()}`,
  };

  await saveBackendRecord('farms', newFarm);

  store.farms.unshift(newFarm);
  localStorage.setItem('agro_farms', JSON.stringify(store.farms));

  return newFarm;
},


  // GET /api/crops/
  
async getCrops(): Promise<Crop[]> {
  try {
    let crops = await getBackendRecords<Crop>('crops');

    if (crops.length === 0 && store.crops.length > 0) {
      for (const crop of store.crops) {
        await saveBackendRecord('crops', crop);
      }

      crops = await getBackendRecords<Crop>('crops');
    }

    store.crops = crops;
    localStorage.setItem('agro_crops', JSON.stringify(crops));

    return crops;
  } catch (error) {
    console.error('Could not load crops from PostgreSQL:', error);
    return store.crops;
  }
},

  // GET /api/batches/
  
async getBatches(farmerId?: string): Promise<CropBatch[]> {
  try {
    const batches = await getBackendRecords<CropBatch>('batches');
    store.batches = batches;
    localStorage.setItem('agro_batches', JSON.stringify(batches));

    if (farmerId) {
      return batches.filter((b) => b.farmerId === farmerId);
    }

    return batches;
  } catch (error) {
    console.error('Could not load batches from PostgreSQL:', error);

    if (farmerId) {
      return store.batches.filter((b) => b.farmerId === farmerId);
    }

    return store.batches;
  }
},


  
async createBatch(batch: Omit<CropBatch, 'id' | 'batchCode' | 'blockchainHash'>): Promise<CropBatch> {
  const code = `BOG-${batch.cropName.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  const newBatch: CropBatch = {
    ...batch,
    id: `batch-${Date.now()}`,
    batchCode: code,
    blockchainHash: `0x${Array.from(
      { length: 64 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join('')}`,
    qrCodeUrl: `https://agrochain.gov.bd/verify/batch/${code}`,
  };

  await saveBackendRecord('batches', newBatch);

  store.batches.unshift(newBatch);
  localStorage.setItem('agro_batches', JSON.stringify(store.batches));

  return newBatch;
},


  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const products = await getBackendRecords<Product>('products');
      store.products = products;
      localStorage.setItem('agro_products', JSON.stringify(products));
      return products;
    } catch (error) {
      console.error('Could not load products from PostgreSQL:', error);
      return store.products;
    }
  },

  async getProduct(id: string): Promise<Product | undefined> {
    return store.products.find((p) => p.id === id);
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
    };
    await saveBackendRecord('products', newProduct);
    store.products.unshift(newProduct);
    localStorage.setItem('agro_products', JSON.stringify(store.products));
    return newProduct;
  },

  // Orders
  async getOrders(userId?: string, role?: string): Promise<Order[]> {
    try {
      const backendOrders = await getBackendRecords<Order>('orders');
      if (backendOrders.length > 0) {
        store.orders = backendOrders;
        localStorage.setItem('agro_orders', JSON.stringify(backendOrders));
      }
    } catch (error) {
      console.warn('Could not refresh orders from backend; using cached orders.', error);
    }
    if (role === 'buyer' && userId) {
      return store.orders.filter((o) => o.buyerId === userId);
    }
    if (role === 'farmer' && userId) {
      return store.orders.filter((o) => o.items.some((item) => item.farmerId === userId));
    }
    return store.orders;
  },

  async getOrder(id: string): Promise<Order | undefined> {
    return store.orders.find((o) => o.id === id || o.orderNumber === id);
  },

  async createRupantorPayCheckout(orderId: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/payment/rupantorpay/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ orderId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || typeof data.paymentUrl !== 'string') {
      throw new Error(data.message || 'Could not start RupantorPay checkout');
    }
    return data.paymentUrl;
  },

  async verifyRupantorPayPayment(orderId: string, transactionId: string): Promise<{ status: string; orderId: string; transactionId: string }> {
    const response = await fetch(`${API_BASE_URL}/payment/rupantorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ orderId, transactionId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Payment could not be verified');

    if (data.status === 'PAID') {
      const order = store.orders.find((item) => item.id === orderId || item.orderNumber === orderId);
      if (order) {
        order.paymentStatus = 'PAID';
        order.paymentGateway = 'RUPANTORPAY';
        order.transactionId = data.transactionId || transactionId;
        order.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
        localStorage.setItem('agro_orders', JSON.stringify(store.orders));
      }
    }
    return data;
  },

  async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'isDeliveryVerified' | 'orderStatus'>): Promise<Order> {
    const orderNumber = `AGRO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      orderStatus: 'CONFIRMED',
      isDeliveryVerified: false,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    await saveBackendRecord('orders', newOrder);
    store.orders.unshift(newOrder);
    localStorage.setItem('agro_orders', JSON.stringify(store.orders));

    // Initialize tracking timeline for this order
    const initialTimeline: TrackingEvent[] = [
      {
        id: `trk-${Date.now()}-1`,
        orderId: newOrder.id,
        title: 'ORDER CONFIRMED',
        description: `Order successfully placed for ৳${newOrder.totalAmount.toLocaleString()} via ${newOrder.paymentMethod}.`,
        location: newOrder.buyerCity,
        timestamp: newOrder.createdAt,
        actorRole: 'Customer',
        actorName: newOrder.buyerName,
        status: 'COMPLETED',
      },
    ];
    await saveBackendRecord('trackingEvents', initialTimeline[0]);
    store.trackingEvents[newOrder.id] = initialTimeline;
    localStorage.setItem('agro_tracking_events', JSON.stringify(store.trackingEvents));

    // Auto-create pickup job for an approved delivery partner in the zone
    // Assign only an approved partner who supports farm pickup
const partner = store.deliveryPartners.find(
  (p) => p.approvalStatus === 'APPROVED' && p.canPickup
);

if (!partner) {
  console.warn(
    `No approved pickup partner available for order ${newOrder.orderNumber}. Pickup job was not created.`
  );
  return newOrder;
}

const pickupJob: LogisticsJob = {
      id: `job-${Date.now()}`,
      jobCode: `JOB-PKP-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      partnerId: partner.id,
      partnerName: partner.name,
      type: 'PICKUP',
      productSummary: newOrder.items.map((i) => `${i.quantity} ${i.unit} ${i.productName}`).join(', '),
      originAddress: 'Bogura Green Valley Agro Farm, Shibganj',
      destinationAddress: 'Central Dhaka Agro-Logistics Center, Gazipur',
      assignedDate: newOrder.createdAt,
      status: 'ASSIGNED',
      codAmount: 0,
      updatedAt: newOrder.createdAt,
    };
    await saveBackendRecord('jobs', pickupJob);
    store.jobs.unshift(pickupJob);
    localStorage.setItem('agro_jobs', JSON.stringify(store.jobs));

    return newOrder;
  },

  // Tracking Timeline
  async getTrackingEvents(orderId: string): Promise<TrackingEvent[]> {
    return store.trackingEvents[orderId] || [];
  },

  // Logistics Jobs
  async getLogisticsJobs(partnerId?: string): Promise<LogisticsJob[]> {
    try {
      const backendJobs = await getBackendRecords<LogisticsJob>('jobs');

      if (backendJobs.length > 0) {
        store.jobs = backendJobs;
        localStorage.setItem('agro_jobs', JSON.stringify(backendJobs));
      }
    } catch (error) {
      console.warn('Could not load jobs from backend; using local data.', error);
    }

    if (partnerId) {
      return store.jobs.filter((j) => j.partnerId === partnerId);
    }

    return store.jobs;
  },

  async updateJobStatus(jobId: string, status: LogisticsJob['status'], notes?: string): Promise<LogisticsJob> {
    const job = store.jobs.find((j) => j.id === jobId);
    if (!job) throw new Error('Job not found');

    const order = store.orders.find((o) => o.id === job.orderId);
    const events = store.trackingEvents[job.orderId] || [];
    const shipment = store.godownShipments.find((s) => s.orderId === job.orderId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Rule: Delivery Partner must be APPROVED to accept jobs
    const partner = store.deliveryPartners.find((p) => p.id === job.partnerId);
    if (status === 'ACCEPTED' && partner && partner.approvalStatus !== 'APPROVED') {
      throw new Error(`Partner is not approved (Status: ${partner.approvalStatus}). Only approved partners may accept assignments.`);
    }

    // UPDATE 3 Rule: Quality Control must happen BEFORE pickup completion!
    if (job.type === 'PICKUP' && status === 'PICKED_UP') {
      if (order && order.qualityStatus && order.qualityStatus !== 'APPROVED') {
        throw new Error(
          `Cannot complete farm pickup. Quality inspection status is ${order.qualityStatus}. QC must be APPROVED at the farm before collection.`
        );
      }
    }

    job.status = status;
    job.updatedAt = now;
    if (notes) job.proofNotes = notes;

    if (job.type === 'PICKUP') {
      if (status === 'ACCEPTED') {
        if (order) order.orderStatus = 'PICKUP_ASSIGNED';
        events.unshift({
          id: `trk-${Date.now()}`,
          orderId: job.orderId,
          title: 'PICKUP PARTNER ASSIGNED',
          description: `Delivery Partner ${job.partnerName} accepted pickup from farmer origin.`,
          location: job.originAddress,
          timestamp: now,
          actorRole: 'Pickup Partner',
          actorName: job.partnerName,
          status: 'COMPLETED',
        });
      } else if (status === 'PICKED_UP') {
        if (order) order.orderStatus = 'PICKED_UP';
        events.unshift({
          id: `trk-${Date.now()}`,
          orderId: job.orderId,
          title: 'PRODUCT PICKED UP FROM FARM',
          description: `Collected from farm location after Quality Control clearance. Produce sealed and weighed.`,
          location: job.originAddress,
          timestamp: now,
          actorRole: 'Pickup Partner',
          actorName: job.partnerName,
          status: 'COMPLETED',
        });
      } else if (status === 'WAREHOUSE_HANDOVER') {
        if (order) order.orderStatus = 'IN_WAREHOUSE';
        events.unshift({
          id: `trk-${Date.now()}`,
          orderId: job.orderId,
          title: 'RECEIVED AT WAREHOUSE',
          description: `Consignment intake completed at warehouse. Weight & seals verified.`,
          location: job.destinationAddress,
          timestamp: now,
          actorRole: 'Warehouse Officer',
          actorName: 'Anisul Haque',
          status: 'COMPLETED',
        });
      }
    } else if (job.type === 'DELIVERY') {
      const shipment = store.godownShipments.find((s) => s.orderId === job.orderId);

      if (status === 'ACCEPTED') {
        if (order) {
          order.orderStatus = 'DELIVERY_ACCEPTED';
          order.deliveryAssignmentStatus = 'ACCEPTED';
        }
        if (shipment) {
          shipment.transferStatus = 'DELIVERY_ACCEPTED';
          shipment.partnerAcceptedDate = now;
        }
        events.unshift({
          id: `trk-${Date.now()}-acc`,
          orderId: job.orderId,
          title: 'Delivery Assignment Accepted',
          description: `Delivery partner ${job.partnerName} accepted the order assignment and is heading to ${job.godownName || job.originAddress} for collection.`,
          location: job.godownName || job.originAddress,
          timestamp: now,
          actorRole: 'Delivery Partner',
          actorName: job.partnerName,
          status: 'COMPLETED',
        });
      } else if (status === 'ARRIVED_AT_GODOWN') {
        events.unshift({
          id: `trk-${Date.now()}-agw`,
          orderId: job.orderId,
          title: 'Delivery Partner Arrived at Local Godown',
          description: `Delivery partner ${job.partnerName} has arrived at ${job.godownName || 'the local godown'} loading bay to inspect packaging and receive produce.`,
          location: job.godownName || job.originAddress,
          timestamp: now,
          actorRole: 'Delivery Partner',
          actorName: job.partnerName,
          status: 'COMPLETED',
        });
      } else if (status === 'COLLECTED') {
        job.handoverConfirmed = true;
        if (shipment) {
          shipment.transferStatus = 'DELIVERY_PARTNER_COLLECTED';
          shipment.handoverConfirmedAt = now;
        }
        if (order) {
          order.orderStatus = 'DELIVERY_PARTNER_COLLECTED';
          order.partnerCollectedAt = now;
        }
        events.unshift({
          id: `trk-${Date.now()}-col`,
          orderId: job.orderId,
          title: 'Collected by Delivery Partner',
          description: `Consignment physically collected from ${job.godownName || 'local godown'} by ${job.partnerName}. Godown handover verification confirmed.`,
          location: job.godownName || job.originAddress,
          timestamp: now,
          actorRole: 'Delivery Partner',
          actorName: job.partnerName,
          status: 'COMPLETED',
        });
      } else if (status === 'OUT_FOR_DELIVERY') {
        if (!job.handoverConfirmed && shipment?.transferStatus !== 'DELIVERY_PARTNER_COLLECTED') {
          throw new Error('Cannot mark out for delivery before product collection and handover from the local godown is confirmed.');
        }
        if (order) {
          order.orderStatus = 'OUT_FOR_DELIVERY';
          order.outForDeliveryAt = now;
        }
        if (shipment) {
          shipment.transferStatus = 'OUT_FOR_DELIVERY';
          shipment.outForDeliveryAt = now;
        }
        events.unshift({
          id: `trk-${Date.now()}-ofd`,
          orderId: job.orderId,
          title: 'Out for Delivery',
          description: `Shipment is on the way to customer address with ${job.partnerName}. Customer has received a unique 4-digit delivery OTP.`,
          location: job.destinationAddress,
          timestamp: now,
          actorRole: 'Delivery Partner',
          actorName: job.partnerName,
          status: 'IN_PROGRESS',
        });
      } else if (status === 'DELIVERED') {
        if (!order?.isDeliveryVerified) {
          throw new Error('Direct manual delivery confirmation is disabled. Doorstep deliveries must be verified using the customer OTP code.');
        }
        if (order) {
          order.orderStatus = 'DELIVERED';
          order.deliveryConfirmedAt = now;
        }
        if (shipment) {
          shipment.transferStatus = 'DELIVERED';
          shipment.deliveredAt = now;
        }
      }
    }

    localStorage.setItem('agro_jobs', JSON.stringify(store.jobs));
    localStorage.setItem('agro_orders', JSON.stringify(store.orders));
    localStorage.setItem('agro_godown_shipments', JSON.stringify(store.godownShipments));
    localStorage.setItem('agro_tracking_events', JSON.stringify(store.trackingEvents));

    await saveBackendRecord('jobs', job);
    if (order) await saveBackendRecord('orders', order);
    if (shipment) await saveBackendRecord('godownShipments', shipment);
    for (const event of events) {
      await saveBackendRecord('trackingEvents', event);
    }

    return job;
  },

  // Server-authoritative OTP delivery confirmation. COD customer payment becomes
  // PAID immediately at delivery; farmer payout remains pending until separately paid.
  async verifyDeliveryOtp(
    orderId: string,
    otpInput: string,
    partnerId: string,
    notes?: string
  ): Promise<{ success: boolean; message: string; order: Order }> {
    const order = store.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) throw new Error('Order consignment not found');
    if (order.deliveryPartnerId && order.deliveryPartnerId !== partnerId) {
      throw new Error('This order is not assigned to your delivery account');
    }

    const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(order.id)}/confirm-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ otp: otpInput.trim(), notes }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (typeof data.attemptsRemaining === 'number') {
        order.otpAttemptsRemaining = data.attemptsRemaining;
        localStorage.setItem('agro_orders', JSON.stringify(store.orders));
      }
      throw new Error(data.message || 'Could not confirm delivery');
    }

    const now = data.order?.deliveryConfirmedAt || new Date().toISOString().replace('T', ' ').substring(0, 16);
    Object.assign(order, data.order);
    if (data.codRecord) {
      const index = store.codRecords.findIndex((item) => item.id === data.codRecord.id);
      if (index >= 0) store.codRecords[index] = data.codRecord;
      else store.codRecords.unshift(data.codRecord);
      localStorage.setItem('agro_cod_records', JSON.stringify(store.codRecords));
    }
    if (data.settlement) {
      const index = store.settlements.findIndex((item) => item.id === data.settlement.id);
      if (index >= 0) store.settlements[index] = data.settlement;
      else store.settlements.unshift(data.settlement);
      localStorage.setItem('agro_settlements', JSON.stringify(store.settlements));
    }

    const deliveryJob = store.jobs.find((job) => job.orderId === order.id && job.type === 'DELIVERY');
    if (deliveryJob) {
      deliveryJob.status = 'DELIVERED';
      deliveryJob.deliveryOtpSubmitted = otpInput.trim();
      deliveryJob.proofNotes = notes || 'Handed directly to recipient after OTP match.';
      deliveryJob.updatedAt = now;
      await saveBackendRecord('jobs', deliveryJob);
    }

    const events = store.trackingEvents[order.id] || [];
    events.unshift(
      {
        id: `trk-${Date.now()}-del`,
        orderId: order.id,
        title: 'DELIVERED SUCCESSFULLY',
        description: 'Product handed over to customer. Delivery automatically confirmed via recipient OTP verification.',
        location: order.buyerAddress,
        timestamp: now,
        actorRole: 'Delivery Partner',
        actorName: order.deliveryPartnerName || 'Delivery Partner',
        status: 'COMPLETED',
      },
      {
        id: `trk-${Date.now()}-otp`,
        orderId: order.id,
        title: 'CUSTOMER OTP VERIFIED',
        description: 'Customer delivery OTP was verified by the server.',
        location: order.buyerCity,
        timestamp: now,
        actorRole: 'Automated Security System',
        actorName: 'AgroChain Core Engine',
        status: 'COMPLETED',
      }
    );
    if (order.paymentMethod === 'COD') {
      events.unshift({
        id: `trk-${Date.now()}-codpaid`,
        orderId: order.id,
        title: 'COD CUSTOMER PAYMENT CONFIRMED',
        description: 'Cash was collected from the customer at delivery; customer payment is now PAID. Farmer payout remains pending.',
        location: order.buyerCity,
        timestamp: now,
        actorRole: 'Automated Payment System',
        actorName: 'AgroChain Core Engine',
        status: 'COMPLETED',
      });
    }
    store.trackingEvents[order.id] = events;
    for (const event of events.slice(0, order.paymentMethod === 'COD' ? 3 : 2)) {
      await saveBackendRecord('trackingEvents', event);
    }

    localStorage.setItem('agro_orders', JSON.stringify(store.orders));
    localStorage.setItem('agro_jobs', JSON.stringify(store.jobs));
    localStorage.setItem('agro_tracking_events', JSON.stringify(store.trackingEvents));
    return {
      success: true,
      message: order.paymentMethod === 'COD'
        ? 'Delivery confirmed. Customer COD payment is PAID; farmer payout is still pending.'
        : 'Delivery confirmed. Customer online payment remains verified; farmer payout is still pending.',
      order,
    };
  },

  // UPDATE 2: Delivery Partner Approvals (Admin & Warehouse Manager)
  async getDeliveryPartners(): Promise<DeliveryPartner[]> {
    return store.deliveryPartners;
  },

  async updatePartnerApproval(
    partnerId: string,
    status: DeliveryPartner['approvalStatus'],
    approverName: string = 'Authorized Officer',
    approverRole: 'ADMIN' | 'WAREHOUSE_MANAGER' = 'ADMIN',
    notes?: string
  ): Promise<DeliveryPartner> {
    const partner = store.deliveryPartners.find((p) => p.id === partnerId);
    if (!partner) throw new Error('Partner not found');

    const now = new Date().toISOString().substring(0, 10);
    partner.approvalStatus = status;
    partner.approvedBy = `${approverName} (${approverRole === 'ADMIN' ? 'Admin' : 'Warehouse Manager'})`;
    partner.approvalDate = now;
    partner.approverRole = approverRole;
    if (notes) {
      partner.approvalNotes = notes;
    }

    localStorage.setItem('agro_delivery_partners', JSON.stringify(store.deliveryPartners));
    return partner;
  },

  async requestPartnerInfo(
    partnerId: string,
    requestedInfo: string,
    approverName: string = 'Authorized Officer',
    approverRole: 'ADMIN' | 'WAREHOUSE_MANAGER' = 'WAREHOUSE_MANAGER'
  ): Promise<DeliveryPartner> {
    const partner = store.deliveryPartners.find((p) => p.id === partnerId);
    if (!partner) throw new Error('Partner not found');

    const now = new Date().toISOString().substring(0, 10);
    partner.requestedInfoNotes = requestedInfo;
    partner.approvalNotes = `Info Requested by ${approverName} (${approverRole}): ${requestedInfo}`;
    partner.approvalDate = now;

    localStorage.setItem('agro_delivery_partners', JSON.stringify(store.deliveryPartners));
    return partner;
  },

  async registerDeliveryPartner(data: Omit<DeliveryPartner, 'id' | 'approvalStatus' | 'rating' | 'activeJobsCount' | 'completedJobsTotal' | 'codCollectedToday' | 'codPendingDeposit'>): Promise<DeliveryPartner> {
    const newPartner: DeliveryPartner = {
      ...data,
      id: `dp-${Date.now()}`,
      approvalStatus: 'PENDING_APPROVAL',
      rating: 5.0,
      activeJobsCount: 0,
      completedJobsTotal: 0,
      codCollectedToday: 0,
      codPendingDeposit: 0,
    };
    store.deliveryPartners.unshift(newPartner);
    localStorage.setItem('agro_delivery_partners', JSON.stringify(store.deliveryPartners));
    return newPartner;
  },

  // UPDATE 3: Quality Checks at Pickup Location
  
async getQualityChecks(): Promise<QualityCheck[]> {
  try {
    const backendChecks = await getBackendRecords<QualityCheck>('qualityChecks');

    if (backendChecks.length > 0) {
      store.qualityChecks = backendChecks;
      localStorage.setItem(
        'agro_quality_checks',
        JSON.stringify(store.qualityChecks)
      );
    } else {
      // First-time migration: preserve existing local QC records
      for (const qc of store.qualityChecks) {
        await saveBackendRecord('qualityChecks', qc);
      }
    }
  } catch (error) {
    console.error('Failed to sync quality checks:', error);
    // Keep local records available if backend is unavailable
  }

  return store.qualityChecks;
},


  async saveQualityCheckDetails(
    id: string,
    update: Partial<QualityCheck>
  ): Promise<QualityCheck> {
    const qc = store.qualityChecks.find((item) => item.id === id);
    if (!qc) throw new Error('Inspection not found');

    const { status: _ignoredStatus, ...details } = update;
    const updatedQc = { ...qc, ...details, status: qc.status };

    await saveBackendRecord('qualityChecks', updatedQc);

    Object.assign(qc, updatedQc);
    localStorage.setItem(
      'agro_quality_checks',
      JSON.stringify(store.qualityChecks)
    );

    return qc;
  },
  async updateQualityCheck(id: string, update: Partial<QualityCheck>): Promise<QualityCheck> {
    const qc = store.qualityChecks.find((q) => q.id === id);
    if (!qc) throw new Error('Inspection not found');
    Object.assign(qc, update);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Sync with corresponding order and crop batch
    const order = store.orders.find((o) => o.qualityCheckId === qc.id || o.id === qc.orderId);
    if (order && update.status) {
      order.qualityStatus = update.status;
      if (update.status === 'APPROVED') {
        order.orderStatus = 'QC_APPROVED';
      }

      
const events =
  store.trackingEvents[order.id] ??
  (store.trackingEvents[order.id] = []);
      if (update.status === 'APPROVED') {
        events.unshift({
          id: `trk-${Date.now()}-qc`,
          orderId: order.id,
          title: 'FARM QUALITY CHECK APPROVED',
          description: `Agronomist ${qc.inspectorName} verified produce at farm gate (${update.grade || qc.grade}, Moisture: ${update.moistureContentPercent || qc.moistureContentPercent}%). Farm pickup unlocked.`,
          location: qc.farmLocation || 'Farm Origin Gate',
          timestamp: now,
          actorRole: 'Quality Inspector',
          actorName: qc.inspectorName,
          status: 'COMPLETED',
        });
      } else if (update.status === 'REJECTED') {
        events.unshift({
          id: `trk-${Date.now()}-qcfail`,
          orderId: order.id,
          title: 'FARM QUALITY CHECK REJECTED',
          description: `Inspection failed quality standards: ${update.remarks || qc.remarks}. Farm pickup BLOCKED. Seller notified for batch replacement.`,
          location: qc.farmLocation || 'Farm Origin Gate',
          timestamp: now,
          actorRole: 'Quality Inspector',
          actorName: qc.inspectorName,
          status: 'COMPLETED',
        });
      } else if (update.status === 'RECHECK_REQUIRED') {
        events.unshift({
          id: `trk-${Date.now()}-qcrecheck`,
          orderId: order.id,
          title: 'FARM QUALITY RECHECK REQUIRED',
          description: `Consignment placed on hold at farm. Secondary moisture evaluation requested. Pickup paused.`,
          location: qc.farmLocation || 'Farm Origin Gate',
          timestamp: now,
          actorRole: 'Quality Inspector',
          actorName: qc.inspectorName,
          status: 'IN_PROGRESS',
        });
      }
      localStorage.setItem('agro_orders', JSON.stringify(store.orders));
      localStorage.setItem('agro_tracking_events', JSON.stringify(store.trackingEvents));
    }

    
localStorage.setItem(
  'agro_quality_checks',
  JSON.stringify(store.qualityChecks)
);

await saveBackendRecord('qualityChecks', qc);

if (order && update.status) {
  await saveBackendRecord('orders', order);

  const latestEvent = store.trackingEvents[order.id]?.[0];
  if (latestEvent) {
    await saveBackendRecord('trackingEvents', latestEvent);
  }
}

return qc;

  },

  // Warehouses & Inventory
  async getWarehouses(): Promise<Warehouse[]> {
    return store.warehouses;
  },

  async getInventory(): Promise<WarehouseInventoryItem[]> {
    return store.inventory;
  },

  // COD & Settlements
  async getCODRecords(): Promise<CODRecord[]> {
    return store.codRecords;
  },

  async verifyCODDeposit(codId: string, adminName: string): Promise<CODRecord> {
    const record = store.codRecords.find((c) => c.id === codId);
    if (!record) throw new Error('COD record not found');
    record.depositStatus = 'CASH_DEPOSIT_VERIFIED';
    record.verifiedByAdmin = adminName;
    record.depositDate = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Customer COD payment was already marked PAID at delivery OTP confirmation.
    // Warehouse cash verification is a prerequisite for the separate farmer payout.
    await saveBackendRecord('codRecords', record);
    localStorage.setItem('agro_cod_records', JSON.stringify(store.codRecords));
    return record;
  },

  async getSettlements(farmerId?: string): Promise<SellerSettlement[]> {
    try {
      const backendSettlements = await getBackendRecords<SellerSettlement>('settlements');
      store.settlements = backendSettlements;
      localStorage.setItem('agro_settlements', JSON.stringify(backendSettlements));
    } catch (error) {
      console.warn('Could not refresh settlements from backend; using cached settlements.', error);
    }
    if (farmerId) {
      return store.settlements.filter((s) => s.farmerId === farmerId);
    }
    return store.settlements;
  },

  async verifyDeliveryAndAuthorizeSettlement(orderId: string, adminName: string): Promise<void> {
    const order = store.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    order.isDeliveryVerified = true;
    order.orderStatus = 'DELIVERED';

    // Persist delivery verification on the server because payout authorization
    // re-checks delivery state against the authoritative backend order record.
    await saveBackendRecord('orders', order);
    localStorage.setItem('agro_orders', JSON.stringify(store.orders));

    // Delivery confirmation is not a farmer payout. Keep the settlement pending
    // until an authorized admin records an actual transfer and its reference.
  },

  async releaseSellerSettlementPayout(settlementId: string, payoutReference: string): Promise<SellerSettlement> {
    const stl = store.settlements.find((s) => s.id === settlementId);
    if (!stl) throw new Error('Settlement not found');
    if (!payoutReference.trim()) throw new Error('Enter the real bank/MFS transfer reference before confirming payout');

    const order = store.orders.find((o) => o.id === stl.orderId || o.orderNumber === stl.orderNumber);
    if (!order) throw new Error('Related order not found');
    if (!order.isDeliveryVerified || order.orderStatus !== 'DELIVERED') {
      throw new Error('Farmer payout can only be confirmed after customer delivery is verified');
    }
    if (order.paymentMethod === 'COD') {
      const cashAudited = store.codRecords.some(
        (record) => record.orderId === order.id && record.depositStatus === 'CASH_DEPOSIT_VERIFIED'
      );
      if (!cashAudited) throw new Error('COD cash must be verified by the warehouse before farmer payout');
    }
    if (stl.settlementStatus === 'PAID' || stl.settlementStatus === 'COMPLETED') {
      throw new Error('This farmer payout is already marked successful');
    }

    stl.settlementStatus = 'PAID';
    stl.payoutDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    stl.payoutReference = payoutReference.trim();
    await saveBackendRecord('settlements', stl);
    localStorage.setItem('agro_settlements', JSON.stringify(store.settlements));
    return stl;
  },

  // ==========================================
  // LOCAL GODOWN & ADVANCED LOGISTICS SYSTEM
  // ==========================================

  async getGodowns(): Promise<LocalGodown[]> {
    return store.godowns;
  },

  async getGodown(id: string): Promise<LocalGodown | undefined> {
    return store.godowns.find((g) => g.id === id || g.code === id);
  },

  async updateGodown(id: string, updates: Partial<LocalGodown>): Promise<LocalGodown> {
    const godown = store.godowns.find((g) => g.id === id || g.code === id);
    if (!godown) throw new Error('Godown not found');
    Object.assign(godown, updates);
    localStorage.setItem('agro_local_godowns', JSON.stringify(store.godowns));
    return godown;
  },

  async getGodownShipments(godownId?: string, status?: string): Promise<GodownShipment[]> {
    let list = store.godownShipments;

    try {
      const backendList = await getBackendRecords<GodownShipment>('godownShipments');
      if (backendList.length > 0) {
        store.godownShipments = backendList;
        localStorage.setItem('agro_godown_shipments', JSON.stringify(backendList));
        list = backendList;
      }
    } catch (error) {
      console.warn('Could not load godown shipments from backend; using local data.', error);
    }

    if (godownId) {
      list = list.filter((s) => s.destinationGodownId === godownId);
    }
    if (status && status !== 'ALL') {
      list = list.filter((s) => s.transferStatus === status);
    }
    return list;
  },

  async getGodownShipment(id: string): Promise<GodownShipment | undefined> {
    try {
      const backendList = await getBackendRecords<GodownShipment>('godownShipments');
      if (backendList.length > 0) {
        store.godownShipments = backendList;
        localStorage.setItem('agro_godown_shipments', JSON.stringify(backendList));
      }
    } catch (error) {
      console.warn('Could not load shipment from backend; using local data.', error);
    }

    return store.godownShipments.find(
      (s) => s.id === id || s.orderId === id || s.orderNumber === id
    );
  },

  // 1. Central Warehouse Receiving & Destination Godown Selection
  async centralWarehouseReceive(jobIdOrOrderId: string, staffName: string = 'Anisul Haque'): Promise<{ order: Order; shipment?: GodownShipment }> {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const order = store.orders.find((o) => o.id === jobIdOrOrderId || o.orderNumber === jobIdOrOrderId || o.items.some(() => false));
    const job = store.jobs.find((j) => j.id === jobIdOrOrderId || j.orderId === order?.id);
    
    const targetOrder = order || store.orders.find((o) => o.id === job?.orderId);
    if (!targetOrder) throw new Error('Order consignment not found');

    if (job) {
      job.status = 'WAREHOUSE_HANDOVER';
      job.updatedAt = now;
    }

    // Step 4 & 5: System identifies customer delivery location & selects destination local godown
    const routing = selectDestinationLocalGodown(targetOrder.buyerAddress, targetOrder.buyerCity, store.godowns);
    
const events =
  store.trackingEvents[targetOrder.id] ??
  (store.trackingEvents[targetOrder.id] = []);

    let shipment = store.godownShipments.find((s) => s.orderId === targetOrder.id);

    if (routing.requiresManualRouting || !routing.godown) {
      targetOrder.orderStatus = 'MANUAL_ROUTING_REQUIRED';
      
      if (!shipment) {
        shipment = {
          id: `shp-${Date.now()}`,
          orderId: targetOrder.id,
          orderNumber: targetOrder.orderNumber,
          productName: targetOrder.items.map((i) => `${i.quantity} ${i.unit} ${i.productName}`).join(', '),
          quantity: targetOrder.items.reduce((s, i) => s + i.quantity, 0),
          unit: targetOrder.items[0]?.unit || 'kg',
          weightKg: targetOrder.totalWeightKg || 25,
          sourceWarehouseId: targetOrder.warehouseId || 'wh-central',
          sourceWarehouseName: targetOrder.warehouseName || 'Central Dhaka Agro-Logistics Center, Gazipur',
          destinationGodownId: routing.godown?.id || 'unassigned',
          destinationGodownName: routing.godown?.name || 'Unassigned - Manual Review Required',
          customerArea: targetOrder.buyerCity,
          customerAddress: targetOrder.buyerAddress,
          customerName: targetOrder.buyerName,
          customerPhone: targetOrder.buyerPhone,
          productCondition: 'EXCELLENT',
          transferStatus: 'MANUAL_ROUTING_REQUIRED',
          exceptionNotes: routing.reason || 'No active local godown covers this service area.',
        };
        store.godownShipments.unshift(shipment);
      } else {
        shipment.transferStatus = 'MANUAL_ROUTING_REQUIRED';
        shipment.exceptionNotes = routing.reason;
      }

      events.unshift({
        id: `trk-${Date.now()}-mr`,
        orderId: targetOrder.id,
        title: 'MANUAL ROUTING REQUIRED',
        description: `Shipment intake completed at Central Warehouse. ${routing.reason}`,
        location: 'Central Dhaka Agro-Logistics Center, Gazipur',
        timestamp: now,
        actorRole: 'Warehouse Officer',
        actorName: staffName,
        status: 'IN_PROGRESS',
      });
    } else {
      targetOrder.orderStatus = 'WAREHOUSE_RECEIVED';
      targetOrder.destinationGodownId = routing.godown.id;
      targetOrder.destinationGodownName = routing.godown.name;

      if (!shipment) {
        shipment = {
          id: `shp-${Date.now()}`,
          orderId: targetOrder.id,
          orderNumber: targetOrder.orderNumber,
          productName: targetOrder.items.map((i) => `${i.quantity} ${i.unit} ${i.productName}`).join(', '),
          quantity: targetOrder.items.reduce((s, i) => s + i.quantity, 0),
          unit: targetOrder.items[0]?.unit || 'kg',
          weightKg: targetOrder.totalWeightKg || 25,
          sourceWarehouseId: targetOrder.warehouseId || 'wh-central',
          sourceWarehouseName: targetOrder.warehouseName || 'Central Dhaka Agro-Logistics Center, Gazipur',
          destinationGodownId: routing.godown.id,
          destinationGodownName: routing.godown.name,
          customerArea: routing.godown.serviceAreas[0] || 'Dhaka North',
          customerAddress: targetOrder.buyerAddress,
          customerName: targetOrder.buyerName,
          customerPhone: targetOrder.buyerPhone,
          productCondition: 'EXCELLENT',
          transferStatus: 'PENDING_DISPATCH',
        };
        store.godownShipments.unshift(shipment);
      } else {
        shipment.destinationGodownId = routing.godown.id;
        shipment.destinationGodownName = routing.godown.name;
        shipment.transferStatus = 'PENDING_DISPATCH';
      }

      events.unshift({
        id: `trk-${Date.now()}-cwh`,
        orderId: targetOrder.id,
        title: 'RECEIVED AT CENTRAL WAREHOUSE',
        description: `Consignment intake completed at Central Warehouse. Weight & seals verified. Destination assigned to ${routing.godown.name}.`,
        location: 'Central Dhaka Agro-Logistics Center, Gazipur',
        timestamp: now,
        actorRole: 'Warehouse Officer',
        actorName: staffName,
        status: 'COMPLETED',
      });
    }

    localStorage.setItem('agro_orders', JSON.stringify(store.orders));
    localStorage.setItem('agro_jobs', JSON.stringify(store.jobs));
    localStorage.setItem('agro_godown_shipments', JSON.stringify(store.godownShipments));
    localStorage.setItem('agro_tracking_events', JSON.stringify(store.trackingEvents));

    await saveBackendRecord('orders', targetOrder);
    if (shipment) await saveBackendRecord('godownShipments', shipment);
    for (const event of events) {
      await saveBackendRecord('trackingEvents', event);
    }

    return { order: targetOrder, shipment };
  },

  
  // 2. Dispatch to Local Godown
  async dispatchToLocalGodown(
    shipmentIdOrOrderId: string,
    carrier: string = 'AgroChain Carrier Truck #14'
  ): Promise<GodownShipment> {
    const shipment = store.godownShipments.find(
      (s) =>
        s.id === shipmentIdOrOrderId ||
        s.orderId === shipmentIdOrOrderId
    );

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    // Block manual-routing cases and unresolved receiving issues.
    if (
      shipment.transferStatus === 'MANUAL_ROUTING_REQUIRED' ||
      shipment.transferStatus === 'ISSUE_REPORTED'
    ) {
      throw new Error(
        'Dispatch blocked. Resolve the routing or receiving issue first.'
      );
    }

    // A valid destination is mandatory.
    if (
      !shipment.destinationGodownId ||
      shipment.destinationGodownId === 'unassigned'
    ) {
      throw new Error(
        'Dispatch blocked. No destination godown has been assigned.'
      );
    }

    // Match using either godown ID or code.
    const destinationGodown = store.godowns.find(
      (g) =>
        g.id === shipment.destinationGodownId ||
        g.code === shipment.destinationGodownId
    );

    if (!destinationGodown) {
      throw new Error(
        'Dispatch blocked. Destination godown does not exist.'
      );
    }

    if (destinationGodown.status !== 'ACTIVE') {
      throw new Error(
        `Dispatch blocked. Godown "${destinationGodown.name}" is inactive.`
      );
    }

    // Prevent duplicate dispatch.
    if (
      shipment.transferStatus === 'GODOWN_TRANSFER_IN_TRANSIT' ||
      shipment.transferStatus === 'ARRIVED_LOCAL_GODOWN'
    ) {
      throw new Error(
        'Shipment has already been dispatched or has arrived at the local godown.'
      );
    }

    const order = store.orders.find(
      (o) => o.id === shipment.orderId
    );

    const now = new Date()
      .toISOString()
      .replace('T', ' ')
      .substring(0, 16);

    shipment.transferStatus = 'GODOWN_TRANSFER_IN_TRANSIT';
    shipment.dispatchDate = now;
    shipment.transferCarrier = carrier;

    if (order) {
      order.orderStatus = 'GODOWN_TRANSFER_IN_TRANSIT';
      order.destinationGodownId = destinationGodown.id;
      order.destinationGodownName = destinationGodown.name;
    }

    const events =
      store.trackingEvents[shipment.orderId] || [];

    events.unshift(
      {
        id: `trk-${Date.now()}-dsp`,
        orderId: shipment.orderId,
        title: 'DISPATCHED TO LOCAL GODOWN',
        description:
          `Produce dispatched to ${destinationGodown.name} via ${carrier}.`,
        location:
          shipment.sourceWarehouseName ||
          'Central Dhaka Agro-Logistics Center, Gazipur',
        timestamp: now,
        actorRole: 'Warehouse Logistics',
        actorName: 'Anisul Haque',
        status: 'COMPLETED',
      },
      {
        id: `trk-${Date.now()}-trf`,
        orderId: shipment.orderId,
        title: 'IN TRANSIT TO LOCAL GODOWN',
        description:
          `Shipment is travelling to ${destinationGodown.name}.`,
        location: 'Gazipur to Local Godown',
        timestamp: now,
        actorRole: 'Fleet Carrier',
        actorName: carrier,
        status: 'IN_PROGRESS',
      }
    );

    store.trackingEvents[shipment.orderId] = events;

    localStorage.setItem(
      'agro_orders',
      JSON.stringify(store.orders)
    );
    localStorage.setItem(
      'agro_godown_shipments',
      JSON.stringify(store.godownShipments)
    );
    localStorage.setItem(
      'agro_tracking_events',
      JSON.stringify(store.trackingEvents)
    );

    await saveBackendRecord('godownShipments', shipment);
    if (order) await saveBackendRecord('orders', order);
    for (const event of events) {
      await saveBackendRecord('trackingEvents', event);
    }

    return shipment;
  },

  // 3. Mark Arrived at Local Godown
  async markArrivedAtLocalGodown(shipmentId: string): Promise<GodownShipment> {
    const shipment = store.godownShipments.find((s) => s.id === shipmentId || s.orderId === shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const order = store.orders.find((o) => o.id === shipment.orderId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    shipment.transferStatus = 'ARRIVED_LOCAL_GODOWN';
    shipment.arrivalDate = now;

    if (order) {
      order.orderStatus = 'ARRIVED_LOCAL_GODOWN';
    }

    const events = store.trackingEvents[shipment.orderId] || [];
    events.unshift({
      id: `trk-${Date.now()}-arr`,
      orderId: shipment.orderId,
      title: 'ARRIVED AT LOCAL GODOWN',
      description: `Transport vehicle arrived at ${shipment.destinationGodownName} unloading dock. Awaiting physical acceptance by Godown Manager.`,
      location: shipment.destinationGodownName,
      timestamp: now,
      actorRole: 'Logistics Fleet',
      actorName: shipment.transferCarrier || 'AgroChain Carrier',
      status: 'COMPLETED',
    });

    localStorage.setItem('agro_orders', JSON.stringify(store.orders));
    localStorage.setItem('agro_godown_shipments', JSON.stringify(store.godownShipments));
    localStorage.setItem('agro_tracking_events', JSON.stringify(store.trackingEvents));

    return shipment;
  },

  // 4. Local Godown Manager Accepts Product & Triggers Automatic Delivery Partner Assignment
  async godownManagerAcceptProduct(
    shipmentId: string,
    managerId: string = 'u-godown-1',
    managerName: string = 'Sabbir Ahmed'
  ): Promise<{ shipment: GodownShipment; assignedPartner?: DeliveryPartner; assignmentSuccess: boolean }> {
    const shipment = store.godownShipments.find((s) => s.id === shipmentId || s.orderId === shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const order = store.orders.find((o) => o.id === shipment.orderId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Update shipment acceptance
    shipment.transferStatus = 'GODOWN_RECEIVED';
    shipment.acceptedDate = now;
    shipment.acceptedByManagerId = managerId;
    shipment.acceptedByManagerName = managerName;

    // Update godown inventory
    const godown = store.godowns.find((g) => g.id === shipment.destinationGodownId);
    if (godown) {
      godown.itemCount = (godown.itemCount || 0) + 1;
      godown.currentStockMetricTons = Number(((godown.currentStockMetricTons || 0) + (shipment.weightKg / 1000)).toFixed(2));
      localStorage.setItem('agro_local_godowns', JSON.stringify(store.godowns));
    }

    if (order) {
      order.orderStatus = 'GODOWN_RECEIVED';
      order.godownReceivedAt = now;
      order.godownId = shipment.destinationGodownId;
      order.godownName = shipment.destinationGodownName;
    }

    const events = store.trackingEvents[shipment.orderId] || [];
    events.unshift({
      id: `trk-${Date.now()}-gac`,
      orderId: shipment.orderId,
      title: 'Received at Local Godown',
      description: `Your product has been received and accepted at the local distribution godown (${shipment.destinationGodownName}) by Godown Manager ${managerName}. Physical condition, quantity, and seals verified.`,
      location: shipment.destinationGodownName,
      timestamp: now,
      actorRole: 'Godown Manager',
      actorName: managerName,
      status: 'COMPLETED',
    });

    // CRITICAL STEP: Automatic Area-Based Delivery Partner Assignment
    const areaQuery = shipment.customerArea || (order?.buyerAddress || '');
    const assignResult = autoAssignDeliveryPartner(areaQuery, shipment.customerAddress, store.deliveryPartners);

    let assignedPartner: DeliveryPartner | undefined = undefined;

    if (assignResult.isSuccess && assignResult.partner) {
      assignedPartner = assignResult.partner;
      assignedPartner.activeJobsCount = (assignedPartner.activeJobsCount || 0) + 1;

      shipment.transferStatus = 'DELIVERY_PARTNER_ASSIGNED';
      shipment.assignedPartnerId = assignedPartner.id;
      shipment.assignedPartnerName = assignedPartner.name;
      shipment.assignedDate = now;

      if (order) {
        order.orderStatus = 'DELIVERY_PARTNER_ASSIGNED';
        order.deliveryPartnerId = assignedPartner.id;
        order.deliveryPartnerName = assignedPartner.name;
        order.deliveryAssignmentStatus = 'ASSIGNED';
      }

      // Create / activate delivery job for the delivery partner
      let deliveryJob = store.jobs.find((j) => j.orderId === shipment.orderId && j.type === 'DELIVERY');
      if (!deliveryJob) {
        deliveryJob = {
          id: `job-del-${Date.now()}`,
          jobCode: `JOB-DEL-${Math.floor(1000 + Math.random() * 9000)}`,
          orderId: shipment.orderId,
          orderNumber: shipment.orderNumber,
          partnerId: assignedPartner.id,
          partnerName: assignedPartner.name,
          type: 'DELIVERY',
          productSummary: shipment.productName,
          originAddress: `${shipment.destinationGodownName}, ${godown?.address || 'Local Hub'}`,
          destinationAddress: shipment.customerAddress,
          godownId: shipment.destinationGodownId,
          godownName: shipment.destinationGodownName,
          assignedDate: now,
          status: 'ASSIGNED',
          codAmount: order?.paymentMethod === 'COD' ? order.totalAmount : 0,
          updatedAt: now,
        };
        store.jobs.unshift(deliveryJob);
      } else {
        deliveryJob.partnerId = assignedPartner.id;
        deliveryJob.partnerName = assignedPartner.name;
        deliveryJob.godownId = shipment.destinationGodownId;
        deliveryJob.godownName = shipment.destinationGodownName;
        deliveryJob.status = 'ASSIGNED';
        deliveryJob.updatedAt = now;
      }

      events.unshift({
        id: `trk-${Date.now()}-dpa`,
        orderId: shipment.orderId,
        title: 'Delivery Partner Assigned',
        description: `A delivery partner (${assignedPartner.name}) has been automatically assigned for your local delivery based on service area proximity.`,
        location: shipment.destinationGodownName,
        timestamp: now,
        actorRole: 'Automated Dispatcher',
        actorName: 'AgroChain Area-Matching Engine',
        status: 'COMPLETED',
      });
    } else {
      // No partner found -> place in assignment pending queue
      shipment.transferStatus = 'DELIVERY_ASSIGNMENT_PENDING';
      if (order) {
        order.orderStatus = 'DELIVERY_ASSIGNMENT_PENDING';
        order.deliveryAssignmentStatus = 'PENDING';
      }

      events.unshift({
        id: `trk-${Date.now()}-dpp`,
        orderId: shipment.orderId,
        title: 'Delivery Assignment Pending',
        description: `Shipment accepted at ${shipment.destinationGodownName}. Area delivery partner dispatch queue is pending manual allocation.`,
        location: shipment.destinationGodownName,
        timestamp: now,
        actorRole: 'System Dispatcher',
        actorName: 'AgroChain Logistics Queue',
        status: 'IN_PROGRESS',
      });
    }

    localStorage.setItem('agro_orders', JSON.stringify(store.orders));
    localStorage.setItem('agro_godown_shipments', JSON.stringify(store.godownShipments));
    localStorage.setItem('agro_jobs', JSON.stringify(store.jobs));
    localStorage.setItem('agro_delivery_partners', JSON.stringify(store.deliveryPartners));
    localStorage.setItem('agro_tracking_events', JSON.stringify(store.trackingEvents));

    await saveBackendRecord('godownShipments', shipment);
    if (order) await saveBackendRecord('orders', order);
    if (godown) await saveBackendRecord('godowns', godown);
    if (assignedPartner) await saveBackendRecord('deliveryPartners', assignedPartner);
    const deliveryJob = store.jobs.find((j) => j.orderId === shipment.orderId && j.type === 'DELIVERY');
    if (deliveryJob) await saveBackendRecord('jobs', deliveryJob);
    for (const event of events) {
      await saveBackendRecord('trackingEvents', event);
    }

    return {
      shipment,
      assignedPartner,
      assignmentSuccess: assignResult.isSuccess,
    };
  },

  // 5. Delivery Partner Accepts Delivery Job
  async deliveryPartnerAcceptAssignment(jobIdOrShipmentId: string, partnerId: string): Promise<LogisticsJob> {
    const job = store.jobs.find((j) => j.id === jobIdOrShipmentId || j.orderId === jobIdOrShipmentId);
    if (!job) throw new Error('Delivery job not found');

    const partner = store.deliveryPartners.find((p) => p.id === partnerId);
    if (partner && partner.approvalStatus !== 'APPROVED') {
      throw new Error(`Partner status is ${partner.approvalStatus}. Only APPROVED partners may accept delivery jobs.`);
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    job.status = 'ACCEPTED';
    job.updatedAt = now;

    const shipment = store.godownShipments.find((s) => s.orderId === job.orderId);
    if (shipment) {
      shipment.transferStatus = 'DELIVERY_ACCEPTED';
      shipment.partnerAcceptedDate = now;
    }

    const order = store.orders.find((o) => o.id === job.orderId);
    if (order) {
      order.orderStatus = 'DELIVERY_ACCEPTED';
      order.deliveryAssignmentStatus = 'ACCEPTED';
    }

    const events = store.trackingEvents[job.orderId] || [];
    events.unshift({
      id: `trk-${Date.now()}-daa`,
      orderId: job.orderId,
      title: 'Delivery Assignment Accepted',
      description: `The assigned delivery partner (${job.partnerName}) has accepted your delivery request and is proceeding to the local godown for product pickup.`,
      location: job.godownName || job.originAddress,
      timestamp: now,
      actorRole: 'Delivery Partner',
      actorName: job.partnerName,
      status: 'COMPLETED',
    });

    localStorage.setItem('agro_jobs', JSON.stringify(store.jobs));
    localStorage.setItem('agro_orders', JSON.stringify(store.orders));
    localStorage.setItem('agro_godown_shipments', JSON.stringify(store.godownShipments));
    localStorage.setItem('agro_tracking_events', JSON.stringify(store.trackingEvents));

    await saveBackendRecord('jobs', job);
    if (order) await saveBackendRecord('orders', order);
    if (shipment) await saveBackendRecord('godownShipments', shipment);
    for (const event of events) {
      await saveBackendRecord('trackingEvents', event);
    }

    return job;
  },

  // 6. Delivery Partner Declines Delivery Job
  async deliveryPartnerDeclineAssignment(jobIdOrShipmentId: string, partnerId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const job = store.jobs.find((j) => j.id === jobIdOrShipmentId || j.orderId === jobIdOrShipmentId);
    if (!job) throw new Error('Delivery job not found');

    const partner = store.deliveryPartners.find((p) => p.id === partnerId);
    if (partner) {
      partner.activeJobsCount = Math.max(0, (partner.activeJobsCount || 1) - 1);
    }

    job.status = 'DECLINED';
    job.proofNotes = `Declined by partner: ${reason || 'Capacity conflict'}`;

    const shipment = store.godownShipments.find((s) => s.orderId === job.orderId);
    const order = store.orders.find((o) => o.id === job.orderId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Auto-search another partner excluding current partner
    const otherPartners = store.deliveryPartners.filter((p) => p.id !== partnerId);
    const retry = autoAssignDeliveryPartner(shipment?.customerArea || '', shipment?.customerAddress || '', otherPartners);

    if (retry.isSuccess && retry.partner) {
      const newPartner = retry.partner;
      newPartner.activeJobsCount = (newPartner.activeJobsCount || 0) + 1;

      job.partnerId = newPartner.id;
      job.partnerName = newPartner.name;
      job.status = 'ASSIGNED';
      job.updatedAt = now;

      if (shipment) {
        shipment.assignedPartnerId = newPartner.id;
        shipment.assignedPartnerName = newPartner.name;
        shipment.transferStatus = 'DELIVERY_PARTNER_ASSIGNED';
      }

      if (order) {
        order.deliveryPartnerId = newPartner.id;
        order.deliveryPartnerName = newPartner.name;
        order.orderStatus = 'DELIVERY_PARTNER_ASSIGNED';
      }
    } else {
      if (shipment) shipment.transferStatus = 'DELIVERY_ASSIGNMENT_PENDING';
      if (order) {
        order.orderStatus = 'DELIVERY_ASSIGNMENT_PENDING';
        order.deliveryAssignmentStatus = 'PENDING';
      }
    }

    localStorage.setItem('agro_jobs', JSON.stringify(store.jobs));
    localStorage.setItem('agro_orders', JSON.stringify(store.orders));
    localStorage.setItem('agro_godown_shipments', JSON.stringify(store.godownShipments));
    localStorage.setItem('agro_delivery_partners', JSON.stringify(store.deliveryPartners));

    return { success: true, message: 'Assignment declined and returned to dispatch pool.' };
  },

  // 7. Two-Sided Product Handover: Step 1 (Godown Manager Initiates Handover)
  async godownManagerInitiateHandover(
    shipmentId: string,
    managerId: string = 'u-godown-1',
    managerName: string = 'Sabbir Ahmed'
  ): Promise<GodownShipment> {
    const shipment = store.godownShipments.find((s) => s.id === shipmentId || s.orderId === shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    shipment.handoverInitiatedAt = now;
    shipment.handoverManagerId = managerId;

    const order = store.orders.find((o) => o.id === shipment.orderId);
    if (order) {
      order.handoverInitiatedAt = now;
    }

    localStorage.setItem('agro_godown_shipments', JSON.stringify(store.godownShipments));
    localStorage.setItem('agro_orders', JSON.stringify(store.orders));
    return shipment;
  },

  // 8. Two-Sided Product Handover: Step 2 (Delivery Partner Confirms Receipt)
  async deliveryPartnerConfirmReceipt(shipmentIdOrJobId: string, partnerId: string): Promise<GodownShipment> {
    const shipment = store.godownShipments.find((s) => s.id === shipmentIdOrJobId || s.orderId === shipmentIdOrJobId);
    if (!shipment) throw new Error('Shipment not found');

    if (shipment.assignedPartnerId && shipment.assignedPartnerId !== partnerId) {
      throw new Error('Only the specifically assigned delivery partner can confirm collection of this shipment.');
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    shipment.handoverConfirmedAt = now;
    shipment.transferStatus = 'DELIVERY_PARTNER_COLLECTED';

    const job = store.jobs.find((j) => j.orderId === shipment.orderId && j.type === 'DELIVERY');
    if (job) {
      job.status = 'COLLECTED';
      job.handoverConfirmed = true;
      job.updatedAt = now;
    }

    const order = store.orders.find((o) => o.id === shipment.orderId);
    if (order) {
      order.orderStatus = 'DELIVERY_PARTNER_COLLECTED';
      order.partnerCollectedAt = now;
    }

    const events = store.trackingEvents[shipment.orderId] || [];
    events.unshift({
      id: `trk-${Date.now()}-col`,
      orderId: shipment.orderId,
      title: 'Collected by Delivery Partner',
      description: `Your product has been physically collected from ${shipment.destinationGodownName} by delivery partner ${shipment.assignedPartnerName}. Handover verified by Godown Manager.`,
      location: shipment.destinationGodownName,
      timestamp: now,
      actorRole: 'Delivery Partner',
      actorName: shipment.assignedPartnerName || 'Assigned Partner',
      status: 'COMPLETED',
    });

    localStorage.setItem('agro_godown_shipments', JSON.stringify(store.godownShipments));
    localStorage.setItem('agro_jobs', JSON.stringify(store.jobs));
    localStorage.setItem('agro_orders', JSON.stringify(store.orders));
    localStorage.setItem('agro_tracking_events', JSON.stringify(store.trackingEvents));

        await saveBackendRecord('godownShipments', shipment);
    if (job) await saveBackendRecord('jobs', job);
    if (order) await saveBackendRecord('orders', order);
    for (const event of events) {
      await saveBackendRecord('trackingEvents', event);
    }

    return shipment;
  },

  // 9. Delivery Partner Clicks "OUT FOR DELIVERY"
  async deliveryPartnerOutForDelivery(jobIdOrShipmentId: string, partnerId: string): Promise<LogisticsJob> {
    const job = store.jobs.find((j) => j.id === jobIdOrShipmentId || j.orderId === jobIdOrShipmentId);
    if (!job) throw new Error('Delivery job not found');

    const shipment = store.godownShipments.find((s) => s.orderId === job.orderId);
    if (shipment && shipment.transferStatus !== 'DELIVERY_PARTNER_COLLECTED' && job.status !== 'COLLECTED') {
      throw new Error('Cannot mark out for delivery before product collection has been confirmed from the local godown.');
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    job.status = 'OUT_FOR_DELIVERY';
    job.updatedAt = now;

    if (shipment) {
      shipment.transferStatus = 'OUT_FOR_DELIVERY';
      shipment.outForDeliveryAt = now;
    }

    const order = store.orders.find((o) => o.id === job.orderId);
    if (order) {
      order.orderStatus = 'OUT_FOR_DELIVERY';
      order.outForDeliveryAt = now;
    }

    const events = store.trackingEvents[job.orderId] || [];
    events.unshift({
      id: `trk-${Date.now()}-ofd`,
      orderId: job.orderId,
      title: 'Out for Delivery',
      description: `Your delivery partner (${job.partnerName}) has left ${job.godownName || 'the local godown'} and is on the way to your delivery address.`,
      location: `En route from ${job.godownName || 'Local Godown'} to ${job.destinationAddress}`,
      timestamp: now,
      actorRole: 'Delivery Partner',
      actorName: job.partnerName,
      status: 'IN_PROGRESS',
    });

    localStorage.setItem('agro_jobs', JSON.stringify(store.jobs));
    localStorage.setItem('agro_godown_shipments', JSON.stringify(store.godownShipments));
    localStorage.setItem('agro_orders', JSON.stringify(store.orders));
    localStorage.setItem('agro_tracking_events', JSON.stringify(store.trackingEvents));

    await saveBackendRecord('jobs', job);
    if (order) await saveBackendRecord('orders', order);
    if (shipment) await saveBackendRecord('godownShipments', shipment);
    for (const event of events) {
      await saveBackendRecord('trackingEvents', event);
    }

    return job;
  },

  // 10. Manual Partner Assignment from Queue
  async manualAssignDeliveryPartner(
    shipmentId: string,
    partnerId: string,
    staffName: string = 'Staff Admin',
    staffRole: string = 'Godown Manager'
  ): Promise<GodownShipment> {
    const shipment = store.godownShipments.find((s) => s.id === shipmentId || s.orderId === shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const partner = store.deliveryPartners.find((p) => p.id === partnerId);
    if (!partner) throw new Error('Partner not found');
    if (partner.approvalStatus !== 'APPROVED') {
      throw new Error(`Partner is not approved (Status: ${partner.approvalStatus}).`);
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    partner.activeJobsCount = (partner.activeJobsCount || 0) + 1;

    shipment.assignedPartnerId = partner.id;
    shipment.assignedPartnerName = partner.name;
    shipment.transferStatus = 'DELIVERY_PARTNER_ASSIGNED';
    shipment.assignedDate = now;

    const order = store.orders.find((o) => o.id === shipment.orderId);
    if (order) {
      order.orderStatus = 'DELIVERY_PARTNER_ASSIGNED';
      order.deliveryPartnerId = partner.id;
      order.deliveryPartnerName = partner.name;
      order.deliveryAssignmentStatus = 'ASSIGNED';
    }

    let deliveryJob = store.jobs.find((j) => j.orderId === shipment.orderId && j.type === 'DELIVERY');
    if (!deliveryJob) {
      deliveryJob = {
        id: `job-del-${Date.now()}`,
        jobCode: `JOB-DEL-${Math.floor(1000 + Math.random() * 9000)}`,
        orderId: shipment.orderId,
        orderNumber: shipment.orderNumber,
        partnerId: partner.id,
        partnerName: partner.name,
        type: 'DELIVERY',
        productSummary: shipment.productName,
        originAddress: `${shipment.destinationGodownName}`,
        destinationAddress: shipment.customerAddress,
        godownId: shipment.destinationGodownId,
        godownName: shipment.destinationGodownName,
        assignedDate: now,
        status: 'ASSIGNED',
        codAmount: order?.paymentMethod === 'COD' ? order.totalAmount : 0,
        updatedAt: now,
      };
      store.jobs.unshift(deliveryJob);
    } else {
      deliveryJob.partnerId = partner.id;
      deliveryJob.partnerName = partner.name;
      deliveryJob.status = 'ASSIGNED';
      deliveryJob.updatedAt = now;
    }

    const events = store.trackingEvents[shipment.orderId] || [];
    events.unshift({
      id: `trk-${Date.now()}-man`,
      orderId: shipment.orderId,
      title: 'Delivery Partner Assigned (Manual)',
      description: `Delivery partner ${partner.name} manually assigned by ${staffName} (${staffRole}).`,
      location: shipment.destinationGodownName,
      timestamp: now,
      actorRole: staffRole,
      actorName: staffName,
      status: 'COMPLETED',
    });

    localStorage.setItem('agro_godown_shipments', JSON.stringify(store.godownShipments));
    localStorage.setItem('agro_orders', JSON.stringify(store.orders));
    localStorage.setItem('agro_jobs', JSON.stringify(store.jobs));
    localStorage.setItem('agro_delivery_partners', JSON.stringify(store.deliveryPartners));
    localStorage.setItem('agro_tracking_events', JSON.stringify(store.trackingEvents));

    return shipment;
  },

  // 11. Report Exception at Godown
  async reportGodownException(
    shipmentId: string,
    exceptionType: 'DAMAGED' | 'QUANTITY_MISMATCH',
    notes: string,
    staffName: string = 'Sabbir Ahmed'
  ): Promise<GodownShipment> {
    const shipment = store.godownShipments.find((s) => s.id === shipmentId || s.orderId === shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    shipment.transferStatus = 'ISSUE_REPORTED';
    shipment.exceptionType = exceptionType;
    shipment.exceptionNotes = notes;

    const order = store.orders.find((o) => o.id === shipment.orderId);
    if (order) {
      order.orderStatus = 'GODOWN_RECEIVING_ISSUE';
    }

    const events = store.trackingEvents[shipment.orderId] || [];
    events.unshift({
      id: `trk-${Date.now()}-exc`,
      orderId: shipment.orderId,
      title: 'Godown Receiving Issue Reported',
      description: `Discrepancy reported during godown intake: ${exceptionType === 'DAMAGED' ? 'Damaged Packaging / Produce' : 'Quantity Mismatch'}. Details: ${notes}. Dispatch paused pending quality resolution.`,
      location: shipment.destinationGodownName,
      timestamp: now,
      actorRole: 'Godown Manager',
      actorName: staffName,
      status: 'IN_PROGRESS',
    });

    localStorage.setItem('agro_godown_shipments', JSON.stringify(store.godownShipments));
    localStorage.setItem('agro_orders', JSON.stringify(store.orders));
    localStorage.setItem('agro_tracking_events', JSON.stringify(store.trackingEvents));

    
    await saveBackendRecord('godownShipments', shipment);
    if (order) await saveBackendRecord('orders', order);
    for (const event of events) {
      await saveBackendRecord('trackingEvents', event);
    }

    return shipment;
  },
};



