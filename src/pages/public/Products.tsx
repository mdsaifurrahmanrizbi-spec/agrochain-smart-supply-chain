import React, { useState, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { store } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Search, Filter, MapPin, Check, ShoppingCart, Eye, Sparkles } from 'lucide-react';

export const Products: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [search, setSearch] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [notification, setNotification] = useState<string | null>(null);

  const categories = ['All', 'Grains & Cereals', 'Vegetables', 'Fruits', 'Spices', 'Cash Crops'];
  const locations = ['All', 'Bogura', 'Rajshahi'];

  const filteredProducts = useMemo(() => {
    return store.products
      .filter((p) => {
        const matchesQuery =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase()) ||
          p.variety.toLowerCase().includes(search.toLowerCase());
        const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesLoc = selectedLocation === 'All' || p.farmLocation.includes(selectedLocation);
        return matchesQuery && matchesCat && matchesLoc;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.pricePerUnit - b.pricePerUnit;
        if (sortBy === 'price-high') return b.pricePerUnit - a.pricePerUnit;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [search, selectedCategory, selectedLocation, sortBy]);

  const handleAddToCart = (product: typeof store.products[0]) => {
    addToCart(product, 1);
    setNotification(`Added 1 ${product.unit} of ${product.name} to cart`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBuyNow = (product: typeof store.products[0]) => {
    if (product.availableQuantity <= 0) {
      setNotification(`${product.name} is currently out of stock`);
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    addToCart(product, 1);
    navigate('/buyer/cart');
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Toast feedback */}
        {notification && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-800 text-white px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-emerald-300" />
            <span>{notification}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Agricultural Marketplace
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Verified farm produce with farm origin data and laboratory quality certificates.
              </p>
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              Showing <strong className="text-slate-800">{filteredProducts.length}</strong> available listings
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-8 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search crop name, variety, or farmer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500"
              >
                <option value="All">All Farm Regions</option>
                <option value="Bogura">Bogura Division</option>
                <option value="Rajshahi">Rajshahi Division</option>
              </select>
            </div>

            {/* Sorting */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500"
              >
                <option value="featured">Featured First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === c
                    ? 'bg-emerald-700 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
            <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No agricultural products match your filter</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search query, selecting another category, or clearing the location filter.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setSelectedLocation('All');
              }}
              className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Image */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <StatusBadge status={p.qualityStatus} size="sm" />
                  </div>
                  {p.isOrganic && (
                    <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      Organic
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{p.farmLocation}</span>
                      </span>
                      <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        {p.batchId.split('-')[1] || 'BATCH'}
                      </span>
                    </div>

                    <Link to={`/products/${p.id}`} className="block">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                    </Link>

                    <div className="text-[11px] text-slate-500 mt-1">
                      Variety: <strong className="text-slate-700 font-medium">{p.variety}</strong>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-base font-bold text-slate-900 tabular-nums">
                          ৳{p.pricePerUnit}
                        </span>
                        <span className="text-slate-500"> / {p.unit}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        Stock: {p.availableQuantity} {p.unit}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <Link
                        to={`/products/${p.id}`}
                        className="min-w-0 whitespace-nowrap py-1.5 px-1.5 text-center rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Trace</span>
                      </Link>
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="min-w-0 whitespace-nowrap py-1.5 px-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                      <button
                        onClick={() => handleBuyNow(p)}
                        disabled={p.availableQuantity <= 0}
                        className="min-w-0 whitespace-nowrap py-1.5 px-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-950 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs"
                      >
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
