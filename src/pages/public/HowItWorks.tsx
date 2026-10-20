import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Warehouse,
  CheckCircle,
  CreditCard,
  DollarSign,
  ArrowRight,
  QrCode,
  MapPin,
} from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Farmer / Seller Listing',
      icon: Sprout,
      desc: 'The farmer registers their farm (division, soil type, irrigation), records crops, harvests batches, and creates product listings with verified quantities, pricing in ৳, and harvest dates.',
    },
    {
      num: '02',
      title: 'Customer Order Placement',
      icon: ShoppingBag,
      desc: 'Customers in Dhaka or other divisions browse available fresh batches, add items to cart, select Online Payment or Cash on Delivery (COD), and receive an order consignment number.',
    },
    {
      num: '03',
      title: 'Area-Based Pickup Partner Assignment',
      icon: Truck,
      desc: 'AgroChain’s logistics dispatch matches an approved delivery partner authorized for the farmer’s sub-district (e.g. Shibganj, Bogura) considering vehicle capacity and active workload.',
    },
    {
      num: '04',
      title: 'Farm Gate Product Collection',
      icon: MapPin,
      desc: 'The delivery partner visits the farm, verifies sack seals, weighs the goods, and logs pickup completion in the mobile portal.',
    },
    {
      num: '05',
      title: 'Agronomist Quality Inspection',
      icon: ShieldCheck,
      desc: 'Certified inspectors evaluate physical grain intactness, moisture percentage, and chemical residues at the farm or intake dock. Only approved batches proceed.',
    },
    {
      num: '06',
      title: 'Central Warehouse Intake',
      icon: Warehouse,
      desc: 'Central Agro-Logistics Center in Gazipur receives shipments, enters inventory into controlled temperature rooms, and allocates storage zones.',
    },
    {
      num: '07',
      title: 'Regional Godown Transfer',
      icon: Truck,
      desc: 'Products are dispatched via fleet haulers to regional urban godowns (such as Tejgaon Urban Godown) close to urban consumer destinations.',
    },
    {
      num: '08',
      title: 'Last-Mile Delivery Partner Assignment',
      icon: Truck,
      desc: 'A local delivery partner in the customer’s area (e.g. Tejgaon, Banani, Mirpur) accepts the final delivery job and collects the sorted package from the godown.',
    },
    {
      num: '09',
      title: 'Customer Delivery & Cash Collection',
      icon: CheckCircle,
      desc: 'Partner delivers to customer doorstep. For COD orders, the exact cash amount in BDT is collected. Delivery partner records job as delivered.',
    },
    {
      num: '10',
      title: 'Authorized Delivery Verification',
      icon: ShieldCheck,
      desc: 'Critical business rule: Partner clicking Delivered does NOT auto-release money. An authorized supervisor independently verifies customer receipt and package integrity.',
    },
    {
      num: '11',
      title: 'COD Deposit & Audit',
      icon: DollarSign,
      desc: 'For COD transactions, the delivery partner deposits collected cash at the regional godown desk, and the administrator audits and marks the deposit verified.',
    },
    {
      num: '12',
      title: 'Direct Seller Payment Settlement',
      icon: CreditCard,
      desc: 'Once delivery is verified (and COD deposited if applicable), the seller payment settlement is approved, and net earnings are transferred to the farmer via bKash/Nagad.',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Architecture & Workflow
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
            The 12-Stage Farm-to-Consumer Supply Chain
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
            AgroChain integrates farmers, customers, independent delivery partners, godowns, and quality inspectors
            into a verified, accountable chain of custody.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.num}
                className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Phase {st.num}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{st.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-2xl p-8 sm:p-12 text-center max-w-4xl mx-auto border border-emerald-800 shadow-xl">
          <h2 className="text-2xl font-bold">Ready to Experience Transparent Agriculture?</h2>
          <p className="text-xs sm:text-sm text-emerald-200 mt-2 max-w-xl mx-auto">
            Explore live farm produce, check batch QR codes, or preview any of our six specialized role portals.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/products"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-xs font-bold transition-colors"
            >
              Browse Products
            </Link>
            <Link
              to="/admin/dashboard"
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition-colors"
            >
              Launch Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
