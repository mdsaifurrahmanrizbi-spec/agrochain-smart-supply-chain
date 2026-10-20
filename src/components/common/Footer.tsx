import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { MapPin, Phone, Mail, ShieldCheck, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1 */}
          <div className="space-y-4">
            <Logo variant="light" size="md" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart Agricultural Supply Chain & Traceability Platform empowering Bangladeshi farmers,
              ensuring food safety, transparent pricing, and managed cold-chain logistics from field to consumer.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Independent Pickup & Delivery Network</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Supply Chain</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  Agricultural Marketplace
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  12-Stage Journey Workflow
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Register as Farmer / Seller
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Join as Delivery Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Platform Portals</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/admin/dashboard" className="hover:text-white transition-colors">
                  Admin Central Control
                </Link>
              </li>
              <li>
                <Link to="/farmer/dashboard" className="hover:text-white transition-colors">
                  Farmer & Crop Management
                </Link>
              </li>
              <li>
                <Link to="/delivery/dashboard" className="hover:text-white transition-colors">
                  Delivery Partner Logistics Hub
                </Link>
              </li>
              <li>
                <Link to="/warehouse/dashboard" className="hover:text-white transition-colors">
                  Godown & Warehouse Inventory
                </Link>
              </li>
              <li>
                <Link to="/inspector/dashboard" className="hover:text-white transition-colors">
                  Quality Inspector Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Headquarters</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Khamarbari, Farmgate, Tejgaon, Dhaka-1215, Bangladesh</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono">+880 2-9112345 / +880 1700-000000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>support@agrochain.gov.bd</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 AgroChain. University Final-Year Capstone Project · Ready for Django & PostgreSQL backend.
          </div>
          <div className="flex items-center gap-6">
            <span>Prices displayed in Bangladeshi Taka (৳)</span>
            <span>All 6 user panels operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
