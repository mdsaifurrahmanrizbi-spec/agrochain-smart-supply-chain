import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { store } from '../../services/api';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShoppingBag, Truck, CheckCircle, CreditCard, ArrowRight, Package, QrCode } from 'lucide-react';

export const BuyerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const buyerId = user?.id || 'u-buyer-1';

  const myOrders = store.orders.filter((o) => o.buyerId === buyerId);
  const inTransitCount = myOrders.filter((o) => ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKUP_ASSIGNED'].includes(o.orderStatus)).length;
  const deliveredCount = myOrders.filter((o) => ['DELIVERED', 'VERIFIED'].includes(o.orderStatus)).length;
  const totalSpent = myOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-[#064E3B] text-white rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
            {t('Consumer & Buyer Portal')}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-0.5">
            {t('Welcome back')}, {user?.name || 'Tasnim Rahman'}
          </h1>
          <p className="text-xs text-emerald-100/80 mt-1">
            {t('Tracking fresh agricultural harvests direct from Bogura, Rajshahi, and Dinajpur farms to your door.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/buyer/products"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs"
          >
            {t('Browse Marketplace')}
          </Link>
          <Link
            to="/buyer/cart"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-xs border border-white/20 transition-colors"
          >
            {t('My Cart')}
          </Link>
        </div>
      </div>

      {/* 4 Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('Total Orders Placed')}
          value={myOrders.length}
          subtitle={t('Consignment history')}
          icon={ShoppingBag}
          onClick={() => navigate('/buyer/orders')}
        />
        <MetricCard
          title={t('Consignments In Transit')}
          value={inTransitCount}
          subtitle={t('Real-time vehicle trace active')}
          icon={Truck}
          onClick={() => navigate('/buyer/tracking/ord-1002')}
        />
        <MetricCard
          title={t('Successfully Delivered')}
          value={deliveredCount}
          subtitle={t('Doorstep verified produce')}
          icon={CheckCircle}
          onClick={() => navigate('/buyer/orders')}
        />
        <MetricCard
          title={t('Total Spent (BDT)')}
          value={`৳${totalSpent.toLocaleString()}`}
          subtitle={t('Direct fair farmer transactions')}
          icon={CreditCard}
        />
      </div>

      {/* Active Shipment Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {t('Live Delivery En Route')}
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-1">Consignment #AGRO-2026-0892</h3>
          </div>

          <Link
            to="/buyer/tracking/ord-1002"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>{t('View Vertical Timeline')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 font-medium">{t('Contents')}</span>
            <div className="font-bold text-slate-900 mt-0.5">50 kg Diamant Red Potato</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{t('Origin')}: শিবগঞ্জ, বগুড়া</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 font-medium">{t('Delivery Partner')}</span>
            <div className="font-bold text-slate-900 mt-0.5">Kamal Hossain (Tejgaon Fleet)</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{t('Vehicle')}: পিকআপ ভ্যান</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 font-medium">{t('Current Status')}</span>
            <div className="font-bold text-blue-700 mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>{t('Out for Delivery')} (বনানী ডিওএইচএস)</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{t('Estimated Arrival')}: {t('Today')} ~দুপুর ২:৩০</div>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">{t('Your Agricultural Orders')}</h3>
          <Link to="/buyer/orders" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
            {t('View All')}
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {myOrders.map((ord) => (
            <div key={ord.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900 text-sm">{ord.orderNumber}</span>
                  <StatusBadge status={ord.orderStatus} size="sm" />
                </div>
                <p className="text-slate-600 font-medium">
                  {ord.items.map((i) => `${i.quantity} ${i.unit} ${i.productName}`).join(' + ')}
                </p>
                <div className="text-[11px] text-slate-400">
                  {t('Ordered on')} {ord.createdAt} · {t('Payment')}: <strong className="text-slate-700 font-medium">{t(ord.paymentMethod === 'COD' || ord.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD' : ord.paymentMethod === 'ONLINE' || ord.paymentMethod === 'ONLINE_PAYMENT' ? 'Online' : ord.paymentMethod)}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">{t('Total')}</span>
                  <span className="text-base font-bold text-slate-900 tabular-nums">
                    ৳{ord.totalAmount.toLocaleString()}
                  </span>
                </div>

                <Link
                  to={`/buyer/tracking/${ord.id}`}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{t('Track')}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
