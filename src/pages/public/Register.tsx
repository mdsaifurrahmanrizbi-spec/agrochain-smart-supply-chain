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
    <div className="bg-slate-50 min-h-screen py-12 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create an AgroChain Account
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Join Bangladesh's transparent agricultural supply network
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSelectedRole('farmer')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'farmer'
                ? 'bg-emerald-700 text-white shadow-xs'
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
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
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
                        <input type="text" inputMode="numeric" pattern="([0-9]{10}|[0-9]{13}|[0-9]{17})" title="Enter a 10, 13 or 17 digit NID number" required placeholder="10, 13 or 17 digits" value={formData.nid} onChange={e => setFormData({...formData, nid:e.target.value.replace(/\\D/g, '').slice(0,17)})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600" />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Home District</label>
                        <select required value={formData.district} onChange={e => setFormData({...formData, district:e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg">
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
                      <label className="block text-slate-700 font-semibold mb-1">National ID (NID No.)</label>
                      <input
                        type="text"
                        required
                        placeholder="17-digit NID Number"
                        value={formData.nid}
                        onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600"
                      />
                    </div>

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
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
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
    </div>
  );
};
