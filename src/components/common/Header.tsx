import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, User, ArrowRight, Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, role, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { totalItemsCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardPath = () => {
    switch (role) {
      case 'farmer':
        return '/farmer/dashboard';
      case 'buyer':
        return '/buyer/dashboard';
      case 'delivery':
        return '/delivery/dashboard';
      case 'warehouse':
        return '/warehouse/dashboard';
      case 'inspector':
        return '/inspector/dashboard';
      case 'admin':
      default:
        return '/admin/dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand wordmark */}
          <Link to="/" className="shrink-0 flex items-center">
            <Logo size="md" />
          </Link>

          {/* Zone 2: 4-5 clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <Link to="/products" className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0">
              {t('Agricultural Marketplace')}
            </Link>
            <Link to="/how-it-works" className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0">
              {t('Supply Chain Process')}
            </Link>
            <Link to="/about" className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0">
              {t('About Platform')}
            </Link>
            <Link to="/contact" className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0">
              {t('Regional Hubs')}
            </Link>
          </nav>

          {/* Zone 3: Cart + Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher compact />
            {/* Cart Icon */}
            <Link
              to="/buyer/cart"
              className="relative p-2 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums shadow-xs">
                  {totalItemsCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <button
                onClick={() => navigate(getDashboardPath())}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                <span>{role ? `${role.toUpperCase()} PANEL` : 'DASHBOARD'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-700"
          >
            Agricultural Marketplace
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-700"
          >
            Supply Chain Process
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-700"
          >
            About Platform
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-700"
          >
            Regional Hubs
          </Link>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(getDashboardPath());
              }}
              className="w-full py-2.5 text-center text-xs font-bold text-white bg-emerald-700 rounded-lg"
            >
              Open Dashboard ({role?.toUpperCase() || 'DEMO'})
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
