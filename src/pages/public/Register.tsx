import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import { agroApi } from '../../services/api';
import { Sprout, ShoppingBag, Truck, Check, AlertCircle, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'farmer';
  const navigate = useNavigate();
  // Public registration creates accounts through the backend, not demo roles.

  const [selectedRole, setSelectedRole] = useState<'farmer' | 'buyer' | 'delivery' | 'warehouse'>(
    (['farmer', 'buyer', 'delivery', 'warehouse'].includes(initialRole) ? initialRole : 'farmer') as 'farmer' | 'buyer' | 'delivery' | 'warehouse'
  );

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    nid: '',
    district: 'Dhaka',
    upazila: '',
    permanentAddress: '',
    serviceDistricts: ['Dhaka'] as string[],
    serviceAreas: 'Tejgaon, Shantinagar',
    address: '',
    preferredArea: 'Tejgaon & Gulshan, Dhaka',
    vehicleType: 'Pickup Van' as const,
    vehicleRegNumber: '',
    canPickup: true,
    canDeliver: true,
    warehouseName: '',
    warehouseType: 'REGIONAL_GODOWN' as 'CENTRAL' | 'REGIONAL_GODOWN',
    warehouseAddress: '',
    warehouseCity: 'Dhaka',
    warehouseArea: 'Tejgaon',
    warehouseNid: '',
    warehouseCapacity: '50',
    temperatureControlled: false,
  });

  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError(null);
    setSubmittedMessage(null);

    if (formData.password.length < 12) {
      setRegistrationError('Password must be at least 12 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await agroApi.registerAccount({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: selectedRole,
        phone: formData.phone.trim(),
        location: (selectedRole === 'warehouse' ? formData.warehouseAddress : formData.address).trim(),
        ...(selectedRole === 'delivery' ? { deliveryProfile: { nid: formData.nid.trim(), district: formData.district, upazila: formData.upazila.trim(), permanentAddress: formData.permanentAddress.trim(), address: formData.address.trim(), preferredArea: formData.preferredArea, assignedAreas: formData.serviceAreas.split(',').map(area => area.trim()).filter(Boolean), serviceDistricts: formData.serviceDistricts, vehicleType: formData.vehicleType, vehicleRegNumber: formData.vehicleRegNumber.trim(), canPickup: formData.canPickup, canDeliver: formData.canDeliver } } : {}),
        ...(selectedRole === 'warehouse' ? { warehouseProfile: { managerNid: formData.warehouseNid.trim(), name: formData.warehouseName.trim(), type: formData.warehouseType, address: formData.warehouseAddress.trim(), city: formData.warehouseCity, area: formData.warehouseArea.trim(), capacityMetricTons: Number(formData.warehouseCapacity), temperatureControlled: formData.temperatureControlled } } : {}),
      });

      setSubmittedMessage(
        result.message || 'Account created successfully. You can now sign in.'
      );
    } catch (error) {
      setRegistrationError(
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7ef] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <style>{`
        @keyframes cropSway { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(4deg); } }
        @keyframes farmerWork { 0%,100% { transform: rotate(-2deg) translateY(0); } 50% { transform: rotate(3deg) translateY(3px); } }
        @keyframes sunDrift { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @media (prefers-reduced-motion: reduce) { .agro-motion, .agro-motion * { animation: none !important; transition: none !important; } }
      `}</style>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-stretch overflow-hidden rounded-[2rem] border border-emerald-950/10 bg-white shadow-[0_24px_80px_-28px_rgba(20,60,35,0.25)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden min-h-[760px] overflow-hidden bg-[#123d2b] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(181,215,122,0.22),transparent_35%),linear-gradient(150deg,#174b34_0%,#0d3025_75%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300 text-emerald-950 shadow-lg shadow-black/10"><Sprout className="h-7 w-7" /></div>
              <div><p className="text-xl font-black tracking-tight">AgroChain</p><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-lime-200">From soil to your door</p></div>
            </div>
            <div className="mt-16 max-w-md">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-lime-100"><span className="h-2 w-2 rounded-full bg-lime-300" /> GROW TOGETHER. THRIVE TOGETHER.</p>
              <h1 className="text-4xl font-black leading-[1.12] tracking-tight xl:text-5xl">Good food starts with <span className="text-lime-300">good people.</span></h1>
              <p className="mt-5 max-w-sm text-sm leading-7 text-emerald-50/75">Join Bangladesh’s connected agricultural community. Help fresh harvests reach homes with more trust, care and transparency.</p>
            </div>
          </div>
          <div className="agro-motion relative mx-auto my-6 h-[270px] w-full max-w-[470px] overflow-hidden rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-[#8fbd8b] via-[#d7e7a2] to-[#e8d99c] shadow-2xl shadow-black/20">
            <div className="absolute right-12 top-8 h-14 w-14 rounded-full bg-[#fff2b5] shadow-[0_0_45px_15px_rgba(255,242,181,0.25)]" style={{animation:'sunDrift 5s ease-in-out infinite'}} />
            <div className="absolute inset-x-0 bottom-0 h-24 rounded-[50%_50%_0_0] bg-[#69934f]" />
            <div className="absolute -bottom-7 -left-8 h-32 w-[120%] rotate-[-5deg] rounded-[50%] bg-[#3c713d]" />
            <div className="absolute -bottom-12 left-[-10%] h-28 w-[120%] rotate-[5deg] rounded-[50%] border-t-[16px] border-[#a4bd55] bg-[#245b35]" />
            <div className="absolute bottom-7 left-4 right-4 flex items-end justify-between text-4xl sm:text-5xl">
              {['🌾','🌿','🌾','🌱','🌾','🌿','🌾','🌱','🌾'].map((crop,i)=><span key={i} style={{display:'inline-block',transformOrigin:'bottom center',animation:'cropSway '+(2.2+(i%3)*0.45)+'s ease-in-out '+(i*0.13)+'s infinite'}}>{crop}</span>)}
            </div>
            <div className="absolute bottom-[68px] left-[43%] z-10 text-6xl drop-shadow-lg" style={{animation:'farmerWork 2.4s ease-in-out infinite'}}>👨🏽‍🌾</div>
            <div className="absolute bottom-4 left-4 rounded-xl border border-white/50 bg-white/85 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-900 shadow-lg backdrop-blur">🌾 Harvesting a better future</div>
            <div className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold text-emerald-900">BANGLADESH 🇧🇩</div>
          </div>
          <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-white/15 pt-6">
            <div><p className="text-lg font-extrabold text-lime-200">Farmers</p><p className="mt-1 text-[10px] text-white/60">Showcase your harvest</p></div>
            <div><p className="text-lg font-extrabold text-lime-200">Buyers</p><p className="mt-1 text-[10px] text-white/60">Find fresh produce</p></div>
            <div><p className="text-lg font-extrabold text-lime-200">Partners</p><p className="mt-1 text-[10px] text-white/60">Move goods smarter</p></div>
          </div>
        </aside>
        <main className="flex w-full min-w-0 flex-col justify-center px-4 py-7 sm:px-8 sm:py-10 lg:px-10 xl:px-14">
          <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800"><Sprout className="h-3.5 w-3.5" /> Your journey starts here</div>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Create your account<span className="text-emerald-700">.</span></h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Join Bangladesh’s agricultural community and bring your role in the harvest-to-home journey to life.</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-2">
          <button
            type="button"
            onClick={() => setSelectedRole('farmer')}
            className={`py-3 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'farmer'
                ? 'bg-emerald-800 text-white shadow-md shadow-emerald-950/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Farmer / Seller</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('buyer')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'buyer'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer / Buyer</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('delivery')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'delivery'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Delivery Partner</span>
          </button>

          <button type="button" onClick={() => setSelectedRole('warehouse')} className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${selectedRole === 'warehouse' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}><Truck className="w-4 h-4" /><span>Warehouse</span></button>
        </div>
        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(15,50,30,0.35)] sm:p-8">
          {submittedMessage ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Registration Processed</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {submittedMessage}
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-emerald-800"
                >
                  <span>Continue to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {registrationError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{registrationError}</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Md. Tariqul Islam"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number (Mobile Banking)</label>
                  <input
                    type="text"
                    required
                    placeholder="+880 17XX-XXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Create Password</label>
                  <input
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder="At least 12 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Delivery Partner Specific Details */}
              {selectedRole === 'delivery' && (
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Delivery & Logistics Fleet Credentials</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-800">Identity & Address Verification</h4>
                      <p className="text-slate-500 mt-1">Provide your identity details and current operating address for admin review.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">National ID (NID) Number</label>
                        <input type="text" inputMode="numeric" pattern="([0-9]{10}|[0-9]{13}|[0-9]{17})" title="Enter a 10, 13 or 17 digit NID number" required placeholder="10, 13 or 17 digits" value={formData.nid} onChange={e => setFormData({...formData, nid:e.target.value.replace(/\\D/g, '').slice(0,17)})} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Home District</label>
                        <select required value={formData.district} onChange={e => setFormData({...formData, district:e.target.value})} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10">
                          {['Bagerhat','Bandarban','Barguna','Barishal','Bhola','Bogura','Brahmanbaria','Chandpur','Chapainawabganj','Chattogram','Chuadanga','Cumilla',"Cox's Bazar",'Dhaka','Dinajpur','Faridpur','Feni','Gaibandha','Gazipur','Gopalganj','Habiganj','Jamalpur','Jashore','Jhalokati','Jhenaidah','Joypurhat','Khagrachhari','Khulna','Kishoreganj','Kurigram','Kushtia','Lakshmipur','Lalmonirhat','Madaripur','Magura','Manikganj','Meherpur','Moulvibazar','Munshiganj','Mymensingh','Naogaon','Narail','Narayanganj','Narsingdi','Natore','Netrokona','Nilphamari','Noakhali','Pabna','Panchagarh','Patuakhali','Pirojpur','Rajbari','Rajshahi','Rangamati','Rangpur','Satkhira','Shariatpur','Sherpur','Sirajganj','Sunamganj','Sylhet','Tangail','Thakurgaon'].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Current Upazila / Thana</label>
                        <input required placeholder="e.g. Tejgaon" value={formData.upazila} onChange={e => setFormData({...formData, upazila:e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Permanent Address (optional)</label>
                        <input placeholder="Permanent address" value={formData.permanentAddress} onChange={e => setFormData({...formData, permanentAddress:e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Current Full Address</label>
                      <input type="text" required placeholder="House/road, area, upazila, district" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Districts You Can Serve</label>
                      <p className="text-slate-500 mb-2">Select one or more districts. Delivery requests can be matched to these areas after approval.</p>
                      <select multiple required value={formData.serviceDistricts} onChange={e => setFormData({...formData, serviceDistricts:Array.from(e.target.selectedOptions, option => option.value)})} className="w-full min-h-36 px-3 py-2 bg-white border border-slate-200 rounded-lg">
                        {['Bagerhat','Bandarban','Barguna','Barishal','Bhola','Bogura','Brahmanbaria','Chandpur','Chapainawabganj','Chattogram','Chuadanga','Cumilla',"Cox's Bazar",'Dhaka','Dinajpur','Faridpur','Feni','Gaibandha','Gazipur','Gopalganj','Habiganj','Jamalpur','Jashore','Jhalokati','Jhenaidah','Joypurhat','Khagrachhari','Khulna','Kishoreganj','Kurigram','Kushtia','Lakshmipur','Lalmonirhat','Madaripur','Magura','Manikganj','Meherpur','Moulvibazar','Munshiganj','Mymensingh','Naogaon','Narail','Narayanganj','Narsingdi','Natore','Netrokona','Nilphamari','Noakhali','Pabna','Panchagarh','Patuakhali','Pirojpur','Rajbari','Rajshahi','Rangamati','Rangpur','Satkhira','Shariatpur','Sherpur','Sirajganj','Sunamganj','Sylhet','Tangail','Thakurgaon'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <p className="text-slate-500 mt-1">Tip: hold Ctrl (Windows) or Command (Mac) to select multiple districts.</p>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Service Areas (comma-separated)</label>
                      <input required placeholder="Tejgaon, Shantinagar, Gulshan" value={formData.serviceAreas} onChange={e => setFormData({...formData, serviceAreas:e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Vehicle Type</label>
                      <select
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                      >
                        <option value="Pickup Van">Pickup Van (High Capacity)</option>
                        <option value="Cargo Auto">Cargo Auto (Suburban)</option>
                        <option value="Motorcycle">Motorcycle (Express)</option>
                        <option value="Mini Truck">Mini Truck (Bulk Transfer)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Vehicle Registration Number</label>
                      <input
                        type="text"
                        required
                        placeholder="DHAKA-METRO-MA-11-XXXX"
                        value={formData.vehicleRegNumber}
                        onChange={(e) => setFormData({ ...formData, vehicleRegNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Preferred Working Area</label>
                      <select
                        value={formData.preferredArea}
                        onChange={(e) => setFormData({ ...formData, preferredArea: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                      >
                        <option value="Tejgaon & Gulshan, Dhaka">Tejgaon & Gulshan, Dhaka</option>
                        <option value="Savar & Gazipur">Savar & Gazipur</option>
                        <option value="Mirpur & Dhanmondi, Dhaka">Mirpur & Dhanmondi, Dhaka</option>
                        <option value="Uttara & Airport, Dhaka">Uttara & Airport, Dhaka</option>
                        <option value="Shibganj & Bogura Sadar">Shibganj & Bogura Sadar</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={formData.canPickup}
                        onChange={(e) => setFormData({ ...formData, canPickup: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                      />
                      <span>Farmer Product Pickup</span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={formData.canDeliver}
                        onChange={(e) => setFormData({ ...formData, canDeliver: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                      />
                      <span>Customer Doorstep Delivery</span>
                    </label>
                  </div>
                </div>
              )}

              {selectedRole === 'warehouse' && (<div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3"><div className="font-bold text-emerald-900">Warehouse / Godown Application Details</div><p className="text-slate-600">Manager identity and facility address are required. The warehouse will be activated only after admin approval.</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="block text-slate-700 font-semibold mb-1">Manager National ID (NID)</label><input required type="text" inputMode="numeric" pattern="([0-9]{10}|[0-9]{13}|[0-9]{17})" title="Enter a 10, 13 or 17 digit NID number" value={formData.warehouseNid} onChange={e => setFormData({...formData,warehouseNid:e.target.value.replace(/\\D/g,'').slice(0,17)})} placeholder="10, 13 or 17 digits" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg" /></div><div><label className="block text-slate-700 font-semibold mb-1">Warehouse / Godown Name</label><input required value={formData.warehouseName} onChange={e => setFormData({...formData, warehouseName:e.target.value})} placeholder="Warehouse name" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg" /></div><div><label className="block text-slate-700 font-semibold mb-1">Facility Type</label><select value={formData.warehouseType} onChange={e => setFormData({...formData, warehouseType:e.target.value as 'CENTRAL' | 'REGIONAL_GODOWN'})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"><option value="REGIONAL_GODOWN">Regional Godown</option><option value="CENTRAL">Central Warehouse</option></select></div><div><label className="block text-slate-700 font-semibold mb-1">Full Facility Address</label><input required value={formData.warehouseAddress} onChange={e => setFormData({...formData, warehouseAddress:e.target.value})} placeholder="Full address" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg" /></div><div><label className="block text-slate-700 font-semibold mb-1">City / District</label><input required value={formData.warehouseCity} onChange={e => setFormData({...formData, warehouseCity:e.target.value})} placeholder="City or district" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg" /></div><div><label className="block text-slate-700 font-semibold mb-1">Storage Capacity (metric tons)</label><input required type="number" min="1" max="100000" value={formData.warehouseCapacity} onChange={e => setFormData({...formData, warehouseCapacity:e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg" /></div><label className="flex items-center gap-2 text-slate-700 font-medium"><input type="checkbox" checked={formData.temperatureControlled} onChange={e => setFormData({...formData, temperatureControlled:e.target.checked})} />Temperature-controlled / cold storage</label></div><p className="text-xs text-amber-800">Warehouse applications remain pending until reviewed by an administrator.</p></div>)}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 py-3.5 font-bold text-white shadow-lg shadow-emerald-900/15 transition-all hover:-translate-y-0.5 hover:bg-emerald-900 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{isSubmitting ? "Creating Account..." : (['delivery', 'warehouse'].includes(selectedRole) ? "Submit for Approval" : "Complete Registration")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-700 font-bold hover:underline">
            Sign In here
          </Link>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
};
