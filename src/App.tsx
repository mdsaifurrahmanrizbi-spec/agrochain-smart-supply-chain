import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import { PublicLayout } from './components/layouts/PublicLayout';
import { DashboardLayout } from './components/layouts/DashboardLayout';

// Public Pages
import { Home } from './pages/public/Home';
import { Products } from './pages/public/Products';
import { ProductDetail } from './pages/public/ProductDetail';
import { BatchTraceability } from './pages/public/BatchTraceability';
import { About } from './pages/public/About';
import { HowItWorks } from './pages/public/HowItWorks';
import { Contact } from './pages/public/Contact';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { PasswordReset } from './pages/PasswordReset';

// Farmer Pages
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { FarmerFarms } from './pages/farmer/FarmerFarms';
import { FarmerCrops } from './pages/farmer/FarmerCrops';
import { FarmerProducts } from './pages/farmer/FarmerProducts';
import { FarmerBatches } from './pages/farmer/FarmerBatches';
import { FarmerOrders } from './pages/farmer/FarmerOrders';
import { FarmerTracking } from './pages/farmer/FarmerTracking';
import { FarmerPayments } from './pages/farmer/FarmerPayments';
import { FarmerReports } from './pages/farmer/FarmerReports';
import { FarmerProfile } from './pages/farmer/FarmerProfile';

// Buyer Pages
import { BuyerDashboard } from './pages/buyer/BuyerDashboard';
import { BuyerCart } from './pages/buyer/BuyerCart';
import { BuyerCheckout } from './pages/buyer/BuyerCheckout';
import { BuyerOrders } from './pages/buyer/BuyerOrders';
import { BuyerTracking } from './pages/buyer/BuyerTracking';
import { BuyerPaymentResult } from './pages/buyer/BuyerPaymentResult';
import { BuyerProfile } from './pages/buyer/BuyerProfile';

// Delivery Pages
import { DeliveryDashboard } from './pages/delivery/DeliveryDashboard';
import { DeliveryPickups } from './pages/delivery/DeliveryPickups';
import { DeliveryDeliveries } from './pages/delivery/DeliveryDeliveries';
import { DeliveryActiveJobs } from './pages/delivery/DeliveryActiveJobs';
import { DeliveryHistory } from './pages/delivery/DeliveryHistory';
import { DeliveryCOD } from './pages/delivery/DeliveryCOD';
import { DeliveryReports } from './pages/delivery/DeliveryReports';
import { DeliveryProfile } from './pages/delivery/DeliveryProfile';

// Warehouse & Godown Pages
import { WarehouseDashboard } from './pages/warehouse/WarehouseDashboard';
import { WarehouseIncoming } from './pages/warehouse/WarehouseIncoming';
import { WarehouseOrders } from './pages/warehouse/WarehouseOrders';
import { WarehouseInventory } from './pages/warehouse/WarehouseInventory';
import { WarehouseTransfers } from './pages/warehouse/WarehouseTransfers';
import { WarehouseDispatch } from './pages/warehouse/WarehouseDispatch';
import { WarehouseVerifications } from './pages/warehouse/WarehouseVerifications';
import { WarehousePartnerApprovals } from './pages/warehouse/WarehousePartnerApprovals';
import { WarehouseReports } from './pages/warehouse/WarehouseReports';
import { GodownHub } from './pages/godown/GodownHub';

// Inspector Pages
import { InspectorDashboard } from './pages/inspector/InspectorDashboard';
import { InspectorAssignments } from './pages/inspector/InspectorAssignments';
import { InspectorWorkspace } from './pages/inspector/InspectorWorkspace';
import { InspectorHistory } from './pages/inspector/InspectorHistory';

// Admin Pages
import { AdminSetup } from './pages/admin/AdminSetup';
import { AdminRecovery } from './pages/admin/AdminRecovery';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminFarmers } from './pages/admin/AdminFarmers';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminDeliveryPartners } from './pages/admin/AdminDeliveryPartners';
import { AdminPartnerApprovals } from './pages/admin/AdminPartnerApprovals';
import { AdminWarehouses } from './pages/admin/AdminWarehouses';
import { AdminQualityChecks } from './pages/admin/AdminQualityChecks';
import { AdminDeliveryVerifications } from './pages/admin/AdminDeliveryVerifications';
import { AdminCOD } from './pages/admin/AdminCOD';
import { AdminSellerPayments } from './pages/admin/AdminSellerPayments';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminSettings } from './pages/admin/AdminSettings';

function HomeRoute() {
  const [searchParams] = useSearchParams();
  const batchCode = searchParams.get('batch');
  return batchCode
    ? <Navigate to={`/traceability/${encodeURIComponent(batchCode)}`} replace />
    : <Home />;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes with PublicLayout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/traceability/:batchCode" element={<BatchTraceability />} />
              <Route path="/about" element={<About />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/password-reset" element={<PasswordReset />} />
              <Route path="/warehouse-portal" element={<Navigate to="/warehouse-portal/login" replace />} />
              <Route path="/warehouse-portal/login" element={<Login />} />
              <Route path="/admin-portal" element={<Navigate to="/admin-portal/login" replace />} />
              <Route path="/admin-portal/login" element={<Login />} />
              <Route path="/admin-portal/reset-password" element={<PasswordReset />} />
              <Route path="/admin-portal/setup" element={<AdminSetup />} />
              <Route path="/admin-portal/recover" element={<AdminRecovery />} />
            </Route>

            {/* Farmer Portal with DashboardLayout */}
            <Route path="/farmer" element={<DashboardLayout />}>
              <Route path="dashboard" element={<FarmerDashboard />} />
              <Route path="farms" element={<FarmerFarms />} />
              <Route path="crops" element={<FarmerCrops />} />
              <Route path="products" element={<FarmerProducts />} />
              <Route path="batches" element={<FarmerBatches />} />
              <Route path="orders" element={<FarmerOrders />} />
              <Route path="tracking" element={<FarmerTracking />} />
              <Route path="payments" element={<FarmerPayments />} />
              <Route path="reports" element={<FarmerReports />} />
              <Route path="profile" element={<FarmerProfile />} />
            </Route>

            {/* Buyer Portal with DashboardLayout */}
            <Route path="/buyer" element={<DashboardLayout />}>
              <Route path="dashboard" element={<BuyerDashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="cart" element={<BuyerCart />} />
              <Route path="checkout" element={<BuyerCheckout />} />
              <Route path="orders" element={<BuyerOrders />} />
              <Route path="orders/:id" element={<BuyerTracking />} />
              <Route path="tracking" element={<BuyerTracking />} />
              <Route path="tracking/:id" element={<BuyerTracking />} />
              <Route path="payment-result" element={<BuyerPaymentResult />} />
              <Route path="profile" element={<BuyerProfile />} />
            </Route>

            {/* Delivery Partner Portal with DashboardLayout */}
            <Route path="/delivery" element={<DashboardLayout />}>
              <Route path="dashboard" element={<DeliveryDashboard />} />
              <Route path="pickups" element={<DeliveryPickups />} />
              <Route path="deliveries" element={<DeliveryDeliveries />} />
              <Route path="active-jobs" element={<DeliveryActiveJobs />} />
              <Route path="history" element={<DeliveryHistory />} />
              <Route path="cod" element={<DeliveryCOD />} />
              <Route path="reports" element={<DeliveryReports />} />
              <Route path="profile" element={<DeliveryProfile />} />
            </Route>

            {/* Warehouse Employee & Godown Portal with DashboardLayout */}
            <Route path="/warehouse" element={<DashboardLayout />}>
              <Route path="dashboard" element={<WarehouseDashboard />} />
              <Route path="incoming" element={<WarehouseIncoming />} />
              <Route path="orders" element={<WarehouseOrders />} />
              <Route path="inventory" element={<WarehouseInventory />} />
              <Route path="transfers" element={<WarehouseTransfers />} />
              <Route path="dispatch" element={<WarehouseDispatch />} />
              <Route path="partner-approvals" element={<WarehousePartnerApprovals />} />
              <Route path="verifications" element={<WarehouseVerifications />} />
              <Route path="godown" element={<GodownHub />} />
              <Route path="godown/:id" element={<GodownHub />} />
              <Route path="reports" element={<WarehouseReports />} />
            </Route>

            {/* Dedicated Local Godown Manager Portal Route */}
            <Route path="/godown" element={<DashboardLayout />}>
              <Route index element={<GodownHub />} />
              <Route path=":id" element={<GodownHub />} />
            </Route>

            {/* Quality Inspector Portal with DashboardLayout */}
            <Route path="/inspector" element={<DashboardLayout />}>
              <Route path="dashboard" element={<InspectorDashboard />} />
              <Route path="assignments" element={<InspectorAssignments />} />
              <Route path="inspections" element={<InspectorWorkspace />} />
              <Route path="history" element={<InspectorHistory />} />
            </Route>

            {/* Admin Portal with DashboardLayout */}
            <Route path="/admin" element={<DashboardLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="farmers" element={<AdminFarmers />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="delivery-partners" element={<AdminDeliveryPartners />} />
              <Route path="partner-approvals" element={<AdminPartnerApprovals />} />
              <Route path="service-areas" element={<AdminPartnerApprovals />} />
              <Route path="warehouses" element={<AdminWarehouses />} />
              <Route path="quality-checks" element={<AdminQualityChecks />} />
              <Route path="logistics" element={<AdminDeliveryPartners />} />
              <Route path="delivery-verifications" element={<AdminDeliveryVerifications />} />
              <Route path="cod" element={<AdminCOD />} />
              <Route path="seller-payments" element={<AdminSellerPayments />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
