import React, { useState } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { DemoRoleSwitcher } from '../common/DemoRoleSwitcher';
import {
  LayoutDashboard,
  Sprout,
  Package,
  Layers,
  ShoppingBag,
  Truck,
  CreditCard,
  BarChart3,
  User,
  Settings,
  Bell,
  LogOut,
  Warehouse,
  CheckCircle,
  FileCheck,
  ShieldCheck,
  Users,
  Compass,
  Building,
  DollarSign,
  ChevronRight,
  Menu,
  X,
  MapPin,
  ClipboardList,
  History,
  QrCode,
  ExternalLink,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, role, logout, authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Generate role-specific navigation links
  const getNavLinks = () => {
    switch (role) {
      case 'farmer':
        return [
          { label: 'Dashboard', path: '/farmer/dashboard', icon: LayoutDashboard },
          { label: 'My Farms', path: '/farmer/farms', icon: Building },
          { label: 'Crops & Varieties', path: '/farmer/crops', icon: Sprout },
          { label: 'Product Listings', path: '/farmer/products', icon: Package },
          { label: 'Crop Batches & QR', path: '/farmer/batches', icon: QrCode },
          { label: 'Customer Orders', path: '/farmer/orders', icon: ShoppingBag },
          { label: 'Pickup Tracking', path: '/farmer/tracking', icon: Truck },
          { label: 'Seller Payments', path: '/farmer/payments', icon: CreditCard },
          { label: 'Sales Reports', path: '/farmer/reports', icon: BarChart3 },
          { label: 'Farmer Profile', path: '/farmer/profile', icon: User },
        ];
      case 'buyer':
        return [
          { label: 'Overview', path: '/buyer/dashboard', icon: LayoutDashboard },
          { label: 'Browse Marketplace', path: '/buyer/products', icon: Package },
          { label: 'Shopping Cart', path: '/buyer/cart', icon: ShoppingBag },
          { label: 'My Orders', path: '/buyer/orders', icon: ClipboardList },
          { label: 'Track Shipment', path: '/buyer/tracking/ord-1001', icon: Truck },
          { label: 'Buyer Profile', path: '/buyer/profile', icon: User },
        ];
      case 'delivery':
        return [
          { label: 'Dashboard', path: '/delivery/dashboard', icon: LayoutDashboard },
          { label: 'Assigned Pickups', path: '/delivery/pickups', icon: Sprout },
          { label: 'Assigned Deliveries', path: '/delivery/deliveries', icon: ShoppingBag },
          { label: 'Active Jobs Hub', path: '/delivery/active-jobs', icon: Truck },
          { label: 'Job History', path: '/delivery/history', icon: History },
          { label: 'COD Cash Collection', path: '/delivery/cod', icon: DollarSign },
          { label: 'Monthly Reports', path: '/delivery/reports', icon: BarChart3 },
          { label: 'Partner Profile', path: '/delivery/profile', icon: User },
        ];
      case 'warehouse':
        return [
          { label: 'Dashboard', path: '/warehouse/dashboard', icon: LayoutDashboard },
          { label: 'Local Godown Hub', path: '/warehouse/godown', icon: Building },
          { label: 'Incoming Shipments', path: '/warehouse/incoming', icon: Truck },
          { label: 'COD Orders & Cash Audit', path: '/warehouse/orders', icon: ShoppingBag },
          { label: 'Godown Inventory', path: '/warehouse/inventory', icon: Warehouse },
          { label: 'Warehouse Transfers', path: '/warehouse/transfers', icon: Compass },
          { label: 'Dispatch Management', path: '/warehouse/dispatch', icon: Package },
          { label: 'Partner Approvals (Manager)', path: '/warehouse/partner-approvals', icon: ShieldCheck },
          { label: 'Delivery & COD Audit', path: '/warehouse/verifications', icon: CheckCircle },
          { label: 'Storage Reports', path: '/warehouse/reports', icon: BarChart3 },
        ];
      case 'inspector':
        return [
          { label: 'Dashboard', path: '/inspector/dashboard', icon: LayoutDashboard },
          { label: 'Assigned Inspections', path: '/inspector/assignments', icon: ClipboardList },
          { label: 'Inspection Workspace', path: '/inspector/inspections', icon: FileCheck },
          { label: 'QC Certificates & Log', path: '/inspector/history', icon: ShieldCheck },
        ];
      case 'admin':
      default:
        return [
          { label: 'Executive Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'User Directory', path: '/admin/users', icon: Users },
          { label: 'Registered Farmers', path: '/admin/farmers', icon: Sprout },
          { label: 'Agricultural Products', path: '/admin/products', icon: Package },
          { label: 'Orders & Shipments', path: '/admin/orders', icon: ShoppingBag },
          { label: 'Delivery Fleet', path: '/admin/delivery-partners', icon: Truck },
          { label: 'Partner Approvals', path: '/admin/partner-approvals', icon: ShieldCheck },
          { label: 'Regional Warehouses', path: '/admin/warehouses', icon: Warehouse },
          { label: 'Local Godown Operations', path: '/warehouse/godown', icon: Building },
          { label: 'Quality Control Audits', path: '/admin/quality-checks', icon: FileCheck },
          { label: 'Delivery Verifications', path: '/admin/delivery-verifications', icon: CheckCircle },
          { label: 'COD Deposit Audits', path: '/admin/cod', icon: DollarSign },
          { label: 'Seller Settlements', path: '/admin/seller-payments', icon: CreditCard },
          { label: 'Platform Analytics', path: '/admin/reports', icon: BarChart3 },
          { label: 'System Settings', path: '/admin/settings', icon: Settings },
        ];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifications = [
    { id: 1, title: 'New Pickup Assigned', time: '10m ago', text: 'Farmer Rafiqul Islam prepared 45kg rice in Shibganj' },
    { id: 2, title: 'Quality Check Approved', time: '1h ago', text: 'Batch BOG-CHIN-202603 certified Grade A Premium' },
    { id: 3, title: 'Delivery Verification Required', time: '2h ago', text: 'Consignment AGRO-2026-0891 reported delivered' },
  ];

  const allowedRoleForPath = location.pathname.startsWith('/admin') ? 'admin'
    : location.pathname.startsWith('/farmer') ? 'farmer'
    : location.pathname.startsWith('/buyer') ? 'buyer'
    : location.pathname.startsWith('/delivery') ? 'delivery'
    : location.pathname.startsWith('/inspector') ? 'inspector'
    : location.pathname.startsWith('/warehouse') || location.pathname.startsWith('/godown') ? 'warehouse'
    : null;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status">
        <span>Verifying session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoleForPath && role !== allowedRoleForPath) {
    const homeByRole: Record<string, string> = {
      admin: '/admin/dashboard',
      farmer: '/farmer/dashboard',
      buyer: '/buyer/dashboard',
      delivery: '/delivery/dashboard',
      inspector: '/inspector/dashboard',
      warehouse: '/warehouse/dashboard',
    };
    return <Navigate to={homeByRole[role || ''] || '/login'} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Dark Forest-Green Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#064E3B] text-slate-100 flex flex-col shadow-xl transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-0 max-md:-translate-x-full'
        }`}
      >
        {/* Brand Lockup */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-emerald-900/60 bg-[#043d2e]">
          <Link to="/" className="flex items-center">
            <Logo variant="light" size="sm" />
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Role Subheading */}
        <div className="px-6 py-3.5 bg-emerald-950/40 border-b border-emerald-900/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Active Panel
            </div>
            <div className="text-xs font-semibold text-white capitalize">{role || 'User'} Workspace</div>
          </div>
          
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-emerald-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Quick Info & Public Portal Button */}
        <div className="p-3 border-t border-emerald-900/60 bg-[#043d2e] space-y-2">
          <Link
            to="/products"
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-emerald-900/40 hover:bg-emerald-900/70 text-xs text-emerald-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Agri Marketplace</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-emerald-800 text-emerald-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Authorized User'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.location || 'Bangladesh'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-emerald-900 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-2xs">
          {/* Left: Mobile trigger & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
              <span className="font-semibold text-slate-800 capitalize">{role || 'Portal'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate text-slate-600">
                {navLinks.find((l) => l.path === location.pathname)?.label || 'Overview'}
              </span>
            </div>
          </div>

          {/* Right: Notifications & Quick Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">System Notifications</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                      3 New
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="py-2.5 px-1 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900">{n.title}</span>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{n.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-colors text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px] uppercase">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="font-semibold text-slate-900 block truncate max-w-[120px]">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                </div>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {role}
                    </span>
                  </div>
                  <div className="pt-1 text-xs">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-md text-slate-700"
                    >
                      AgroChain Homepage
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 rounded-md text-rose-600 font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Main Viewport Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Always render SWITCH PANEL */}
      {import.meta.env.DEV && <DemoRoleSwitcher />}
    </div>
  );
};

