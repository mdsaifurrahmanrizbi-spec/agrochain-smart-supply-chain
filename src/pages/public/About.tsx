import React from 'react';
import { Logo } from '../../components/common/Logo';
import { ShieldCheck, Sprout, Truck, Users, Award, Database, Cpu } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            <Sprout className="w-3.5 h-3.5" />
            <span>University Capstone Project & Production-Ready Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            About AgroChain Bangladesh
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A comprehensive, technology-driven agricultural supply-chain and traceability platform designed to eliminate
            unregulated middlemen, assure food authenticity, and guarantee prompt payments for Bangladeshi farmers.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">The Problem in Bangladesh’s Agro Market</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            In Bangladesh, smallholder farmers in agricultural hubs like Bogura, Rajshahi, Dinajpur, and Rangpur frequently receive
            less than 40% of the terminal consumer price paid in Dhaka. Intermediary syndicates, unverified weight deductions, and delayed
            payments create economic vulnerability for producers. Simultaneously, urban consumers suffer from adulterated produce, chemical ripening,
            and complete opacity regarding product harvest dates.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            AgroChain replaces this fragmented ecosystem with a unified digital backbone: operating an approved, area-based delivery fleet
            for both farm pickup and customer delivery, integrating certified agronomist inspections, managing regional cold godowns,
            and enforcing multi-party delivery verification before releasing farmer settlements.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Proprietary Logistics Network</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Delivery partners are vetted and approved by system administrators. Once assigned to specific service areas
              (e.g. Tejgaon, Savar, Mirpur), the same trusted partner can perform farm pickups as well as customer deliveries.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Laboratory Quality Assurance</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Every crop batch undergoes formal scientific inspection (moisture %, pesticide ppm, physical defects) by qualified
              inspectors before dispatch to consumer markets.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Django & PostgreSQL Ready</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Architected to seamlessly interface with an existing Django REST Framework backend and PostgreSQL database
              (agricultural_blockchain_db) with models for Users, Farmers, Crops, Batches, Logistics, and Settlements.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Authorized Payment Release</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              To prevent delivery fraud and guarantee merchant trust, partner delivery completion is decoupled from payment release.
              Authorized employees independently verify dropoff condition before funds are disbursed to farmers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
