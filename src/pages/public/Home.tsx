import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HERO_IMAGE, RICE_IMAGE, PRODUCE_IMAGE, WAREHOUSE_IMAGE } from '../../services/mockData';
import { store } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sprout,
  Warehouse,
  CheckCircle2,
  QrCode,
  TrendingUp,
  MapPin,
  ChevronRight,
  Star,
  Users,
  Award,
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Grains & Cereals',
    'Vegetables',
    'Fruits',
    'Spices',
    'Cash Crops',
  ];

  const featuredProducts = store.products.slice(0, 4);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative bg-gradient-to-b from-[#064E3B] to-[#043d2e] text-white overflow-hidden py-16 sm:py-24">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Copy & Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                <Sprout className="w-4 h-4 text-emerald-400" />
                <span>Bangladesh Smart Agricultural Supply Chain</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Connecting Farmers to Markets Through Smarter Supply Chains
              </h1>

              <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed max-w-2xl">
                Discover quality agricultural products, track every step of their journey, and
                experience a transparent farm-to-market ecosystem with independent pickup and delivery networks.
              </p>

              {/* Hero Search Box */}
              <form onSubmit={handleSearch} className="flex items-center max-w-xl bg-white rounded-xl p-1.5 shadow-lg border border-emerald-800">
                <div className="pl-3 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search Chinigura rice, Bogura potatoes, Rajshahi mango..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap shadow-xs"
                >
                  Search
                </button>
              </form>

              {/* Hero Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/products"
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register?role=farmer"
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-xs border border-white/20 transition-colors"
                >
                  Join as Farmer
                </Link>
                <Link
                  to="/register?role=delivery"
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-xs border border-white/20 transition-colors"
                >
                  Become a Delivery Partner
                </Link>
              </div>

              {/* Key Trust Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-emerald-800/80 text-xs">
                <div>
                  <div className="text-xl font-bold text-white tabular-nums">1,240+</div>
                  <div className="text-emerald-200/70 mt-0.5">Verified Farmers</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white tabular-nums">100%</div>
                  <div className="text-emerald-200/70 mt-0.5">QC Certified</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white tabular-nums">৳ 0</div>
                  <div className="text-emerald-200/70 mt-0.5">Middleman Markups</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-emerald-700/50 shadow-2xl bg-emerald-950/40">
                <img
                  src={HERO_IMAGE}
                  alt="Bangladeshi agricultural harvest and smart supply chain"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                
                {/* Floating Traceability Badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 text-slate-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Live Traceability Active
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">BOG-CHIN-202603</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900">
                    Chinigura Paddy Harvest · Bogura to Banani DOHS
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Pickup · Cold Hub · Lab QC · Dispatched</span>
                    <strong className="text-emerald-700">100% Verified</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Product Categories Strip */}
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Agricultural Product Categories
            </h2>
            <Link to="/products" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Agricultural Harvest (Marketplace Preview) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Direct From Bangladeshi Farms
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Fresh Harvest & Certified Crops
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Quality-tested by agronomists with complete farm origin verification.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <StatusBadge status={prod.qualityStatus} size="sm" />
                </div>
                {prod.isOrganic && (
                  <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                    Organic
                  </span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{prod.farmLocation}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {prod.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-base font-extrabold text-slate-900 tabular-nums">
                      ৳{prod.pricePerUnit}
                    </span>
                    <span className="text-xs text-slate-500"> / {prod.unit}</span>
                  </div>

                  <button
                    onClick={() => addToCart(prod, 1)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Complete Supply Chain Journey Workflow (12 Stages) */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Transparent Operations
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1">
              The Complete AgroChain Supply Journey
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              From the rural fields of Bogura & Rajshahi to Dhaka dining tables, AgroChain manages its own pickup,
              warehouse, quality, and last-mile delivery fleet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
            {[
              { step: '01', title: 'Product Listing', desc: 'Farmer adds crop variety, harvest date & available quantity.' },
              { step: '02', title: 'Customer Order', desc: 'Buyer places order via COD or online payment.' },
              { step: '03', title: 'Pickup Assignment', desc: 'System matches approved delivery partner in farmer service area.' },
              { step: '04', title: 'Farm Pickup', desc: 'Partner visits farm, inspects seal & collects produce.' },
              { step: '05', title: 'Quality Inspection', desc: 'Agronomist tests moisture, grade, and pesticide residue.' },
              { step: '06', title: 'Central Warehouse', desc: 'Cold storage intake at Central Gazipur Agro-Logistics Center.' },
              { step: '07', title: 'Regional Godown', desc: 'Inter-warehouse transit to Tejgaon/Banani local dispatch.' },
              { step: '08', title: 'Delivery Assignment', desc: 'Approved local partner assigned for customer route.' },
              { step: '09', title: 'Customer Handover', desc: 'Partner delivers produce with OTP verification or photo proof.' },
              { step: '10', title: 'Delivery Verification', desc: 'Authorized admin verifies condition before payment unlock.' },
              { step: '11', title: 'COD Reconciliation', desc: 'Partner deposits cash to godown office and gets verified.' },
              { step: '12', title: 'Seller Settlement', desc: 'Farmer receives direct mobile payout via bKash/Nagad.' },
            ].map((st) => (
              <div
                key={st.step}
                className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl hover:border-emerald-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-emerald-400 font-mono font-bold text-sm mb-1">{st.step}</div>
                  <h4 className="font-bold text-white text-sm mb-1">{st.title}</h4>
                  <p className="text-slate-400 leading-relaxed text-xs">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <span>Explore Interactive Supply-Chain Architecture</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Why Choose AgroChain & Value Pillars */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <Truck className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Proprietary Logistics Fleet</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Approved delivery partners handle both farm pickup and customer delivery inside designated service areas
              such as Tejgaon, Savar, Mirpur, and Bogura.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Rigorous Quality Gate</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Certified agronomists inspect batches for moisture content, grade, and safety before products leave central
              storage for final customer dispatch.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <Award className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Fair Farmer Settlements</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Delivery reporting and authorized delivery verification are strictly separated. Farmers are paid promptly
              upon verified delivery without predatory syndicates.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Testimonials */}
      <section className="py-16 bg-emerald-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold">Trusted Across the Agriculture Value Chain</h2>
            <p className="text-xs text-emerald-200 mt-1">
              Voices of growers, logistics partners, and conscious consumers in Bangladesh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="bg-emerald-900/50 border border-emerald-800/80 p-5 rounded-xl">
              <p className="text-slate-200 italic leading-relaxed">
                "Before AgroChain, local middlemen took 40% of our potato profits in Bogura. Now pickup partners arrive at
                my farm gate, weigh the sacks transparently, and payment arrives directly in my bKash account."
              </p>
              <div className="mt-4 pt-3 border-t border-emerald-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center">
                  R
                </div>
                <div>
                  <div className="font-bold text-white">Md. Rafiqul Islam</div>
                  <div className="text-emerald-300 text-[11px]">Rice & Potato Farmer, Shibganj, Bogura</div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-900/50 border border-emerald-800/80 p-5 rounded-xl">
              <p className="text-slate-200 italic leading-relaxed">
                "I operate my pickup van in Tejgaon and Savar. AgroChain gives me steady daily pickup and delivery jobs.
                The COD reconciliation at the Tejgaon godown is crystal clear and accountable."
              </p>
              <div className="mt-4 pt-3 border-t border-emerald-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center">
                  K
                </div>
                <div>
                  <div className="font-bold text-white">Kamal Hossain</div>
                  <div className="text-emerald-300 text-[11px]">Approved Delivery Partner, Dhaka Fleet</div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-900/50 border border-emerald-800/80 p-5 rounded-xl">
              <p className="text-slate-200 italic leading-relaxed">
                "Scanning the batch QR code on our rice sack showed the exact harvest date in Bogura and the moisture lab
                certificate. Truly unprecedented transparency for agricultural food in Bangladesh."
              </p>
              <div className="mt-4 pt-3 border-t border-emerald-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center">
                  T
                </div>
                <div>
                  <div className="font-bold text-white">Tasnim Rahman</div>
                  <div className="text-emerald-300 text-[11px]">Consumer, Banani DOHS, Dhaka</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
