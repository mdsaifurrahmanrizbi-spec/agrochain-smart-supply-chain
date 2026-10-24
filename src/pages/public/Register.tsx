import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { agroApi } from '../../services/api';
import { Sprout, ShoppingBag, Truck, Warehouse, Check, AlertCircle, ArrowRight, MapPin } from 'lucide-react';

const DISTRICTS = ["Bagerhat","Bandarban","Barguna","Barishal","Bhola","Bogura","Brahmanbaria","Chandpur","Chapainawabganj","Chattogram","Chuadanga","Cumilla","Cox's Bazar","Dhaka","Dinajpur","Faridpur","Feni","Gaibandha","Gazipur","Gopalganj","Habiganj","Jamalpur","Jashore","Jhalokati","Jhenaidah","Joypurhat","Khagrachhari","Khulna","Kishoreganj","Kurigram","Kushtia","Lakshmipur","Lalmonirhat","Madaripur","Magura","Manikganj","Meherpur","Moulvibazar","Munshiganj","Mymensingh","Naogaon","Narail","Narayanganj","Narsingdi","Natore","Netrokona","Nilphamari","Noakhali","Pabna","Panchagarh","Patuakhali","Pirojpur","Rajbari","Rajshahi","Rangamati","Rangpur","Satkhira","Shariatpur","Sherpur","Sirajganj","Sunamganj","Sylhet","Tangail","Thakurgaon"];
type Role = 'farmer' | 'buyer' | 'delivery' | 'warehouse';
const fieldClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600';
const labelClass = 'block text-slate-700 font-semibold mb-1';

export const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'farmer';
  const [selectedRole, setSelectedRole] = useState<Role>(
    (['farmer', 'buyer', 'delivery', 'warehouse'].includes(initialRole) ? initialRole : 'farmer') as Role
  );
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '', nid: '',
    address: '', permanentAddress: '', homeDistrict: 'Dhaka', homeUpazila: '',
    serviceDistricts: ['Dhaka'] as string[],
    serviceAreas: { Dhaka: 'Tejgaon, Shantinagar' } as Record<string, string>,
    vehicleType: 'Pickup Van', vehicleRegNumber: '', canPickup: true, canDeliver: true,
    warehouseName: '', warehouseType: 'REGIONAL_GODOWN', warehouseDistrict: 'Dhaka',
    warehouseUpazila: 'Tejgaon', warehouseCapacity: '10', temperatureControlled: false,
  });
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const serviceAreaList = useMemo(() => formData.serviceDistricts.flatMap((district) =>
    (formData.serviceAreas[district] || '').split(',').map((area) => area.trim())
      .filter(Boolean).map((area) => `${area}, ${district}`)
  ), [formData.serviceDistricts, formData.serviceAreas]);
  const setField = (key: string, value: any) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError(null);
    setSubmittedMessage(null);
    if (formData.password.length < 12) return setRegistrationError('Password must be at least 12 characters long.');
    if (selectedRole === 'delivery') {
      if (!/^\d{10,17}$/.test(formData.nid.replace(/[- ]/g, ''))) return setRegistrationError('Enter a valid 10–17 digit NID number.');
      if (!formData.address.trim() || !formData.homeUpazila.trim()) return setRegistrationError('Enter your current address, district and upazila/thana.');
      if (!formData.serviceDistricts.length || !serviceAreaList.length) return setRegistrationError('Select at least one service district and enter at least one area for it.');
      if (!formData.canPickup && !formData.canDeliver) return setRegistrationError('Select at least one service: farm pickup or customer delivery.');
      if (!formData.vehicleRegNumber.trim()) return setRegistrationError('Vehicle registration number is required.');
    }
    if (selectedRole === 'warehouse') {
      if (!formData.warehouseName.trim() || !formData.address.trim() || !formData.warehouseUpazila.trim()) return setRegistrationError('Warehouse name, full address and area/upazila are required.');
      if (Number(formData.warehouseCapacity) <= 0) return setRegistrationError('Enter a valid warehouse capacity.');
    }
    setIsSubmitting(true);
    try {
      const profile = selectedRole === 'delivery' ? {
        phone: formData.phone.trim(), nid: formData.nid.trim(), address: formData.address.trim(),
        permanentAddress: formData.permanentAddress.trim(), homeDistrict: formData.homeDistrict,
        homeUpazila: formData.homeUpazila.trim(), preferredArea: serviceAreaList[0],
        assignedAreas: serviceAreaList, serviceDistricts: formData.serviceDistricts,
        serviceAreasByDistrict: Object.fromEntries(formData.serviceDistricts.map((d) => [d, (formData.serviceAreas[d] || '').split(',').map((a) => a.trim()).filter(Boolean)])),
        vehicleType: formData.vehicleType, vehicleRegNumber: formData.vehicleRegNumber.trim(),
        canPickup: formData.canPickup, canDeliver: formData.canDeliver,
      } : selectedRole === 'warehouse' ? {
        phone: formData.phone.trim(), address: formData.address.trim(),
        warehouseName: formData.warehouseName.trim(), warehouseType: formData.warehouseType,
        district: formData.warehouseDistrict, upazila: formData.warehouseUpazila.trim(),
        capacityMetricTons: Number(formData.warehouseCapacity), temperatureControlled: formData.temperatureControlled,
        isMainWarehouse: formData.warehouseType === 'CENTRAL',
      } : { phone: formData.phone.trim() };
      const result = await agroApi.registerAccount({
        name: formData.name.trim(), email: formData.email.trim(), password: formData.password,
        role: selectedRole, profile,
      });
      setSubmittedMessage(result.message || 'Registration submitted successfully.');
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDistrict = (district: string) => {
    setFormData((prev) => {
      const selected = prev.serviceDistricts.includes(district)
        ? prev.serviceDistricts.filter((d) => d !== district)
        : [...prev.serviceDistricts, district];
      return { ...prev, serviceDistricts: selected,
        serviceAreas: { ...prev.serviceAreas, ...(selected.includes(district) && !prev.serviceAreas[district] ? { [district]: '' } : {}) } };
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-6">
        <div className="text-center"><div className="flex justify-center mb-3"><Logo size="lg" /></div>
          <h2 className="text-2xl font-extrabold text-slate-900">Create an AgroChain Account</h2>
          <p className="text-xs text-slate-500 mt-1">Join Bangladesh's agricultural supply network</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white p-1.5 rounded-xl border border-slate-200">
          {([
            ['farmer', Sprout, 'Farmer / Seller'], ['buyer', ShoppingBag, 'Customer / Buyer'],
            ['delivery', Truck, 'Delivery Partner'], ['warehouse', Warehouse, 'Warehouse'],
          ] as const).map(([role, Icon, title]) => <button key={role} type="button" onClick={() => { setSelectedRole(role); setRegistrationError(null); setSubmittedMessage(null); }}
            className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 ${selectedRole === role ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Icon className="w-4 h-4" /><span>{title}</span>
          </button>)}
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
          {submittedMessage ? <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto"><Check className="w-6 h-6" /></div>
            <h3 className="text-base font-bold text-slate-900">Application Submitted</h3>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">{submittedMessage}</p>
            <Link to="/login" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold">Continue to Sign In <ArrowRight className="w-4 h-4" /></Link>
          </div> : <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {registrationError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{registrationError}</span></div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelClass}>Full Legal Name {selectedRole === 'warehouse' ? '(Manager)' : ''}</label><input required maxLength={120} value={formData.name} onChange={(e) => setField('name', e.target.value)} className={fieldClass} placeholder="Full legal name" /></div>
              <div><label className={labelClass}>Phone Number</label><input required type="tel" value={formData.phone} onChange={(e) => setField('phone', e.target.value)} className={fieldClass} placeholder="+8801XXXXXXXXX" /></div>
              <div><label className={labelClass}>Email Address</label><input required type="email" value={formData.email} onChange={(e) => setField('email', e.target.value)} className={fieldClass} placeholder="name@example.com" /></div>
              <div><label className={labelClass}>Create Password</label><input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={formData.password} onChange={(e) => setField('password', e.target.value)} className={fieldClass} placeholder="At least 12 characters" /></div>
            </div>
            {selectedRole === 'delivery' && <>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                <h3 className="font-bold text-emerald-900 flex items-center gap-2"><Truck className="w-4 h-4" /> Identity & Address Verification</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className={labelClass}>National ID (NID) Number</label><input required inputMode="numeric" value={formData.nid} onChange={(e) => setField('nid', e.target.value)} className={fieldClass} placeholder="10, 13 or 17 digits" /></div>
                  <div><label className={labelClass}>Home District</label><select required value={formData.homeDistrict} onChange={(e) => setField('homeDistrict', e.target.value)} className={fieldClass}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></div>
                  <div><label className={labelClass}>Current Upazila / Thana</label><input required value={formData.homeUpazila} onChange={(e) => setField('homeUpazila', e.target.value)} className={fieldClass} placeholder="e.g. Tejgaon" /></div>
                  <div><label className={labelClass}>Permanent Address (optional)</label><input value={formData.permanentAddress} onChange={(e) => setField('permanentAddress', e.target.value)} className={fieldClass} /></div>
                  <div className="sm:col-span-2"><label className={labelClass}>Current Full Address</label><textarea required rows={2} value={formData.address} onChange={(e) => setField('address', e.target.value)} className={fieldClass} placeholder="House/road, area, upazila, district" /></div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><MapPin className="w-4 h-4" /> Districts & Areas You Can Serve</h3>
                <p className="text-slate-500">Select one or more districts. Then list areas separated by commas for each selected district. Requests are matched to these areas after admin approval.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto border rounded-lg p-3">{DISTRICTS.map((d) => <label key={d} className="flex items-center gap-2"><input type="checkbox" checked={formData.serviceDistricts.includes(d)} onChange={() => toggleDistrict(d)} /><span>{d}</span></label>)}</div>
                {formData.serviceDistricts.map((d) => <div key={d}><label className={labelClass}>{d} — service areas</label><input required value={formData.serviceAreas[d] || ''} onChange={(e) => setFormData((p) => ({ ...p, serviceAreas: { ...p.serviceAreas, [d]: e.target.value } }))} className={fieldClass} placeholder="e.g. Tejgaon, Shantinagar, Mirpur" /></div>)}
              </div>
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="font-bold text-slate-900">Vehicle & Work Type</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className={labelClass}>Vehicle Type</label><select value={formData.vehicleType} onChange={(e) => setField('vehicleType', e.target.value)} className={fieldClass}><option>Motorcycle</option><option>Pickup Van</option><option>Cargo Auto</option><option>Mini Truck</option></select></div>
                  <div><label className={labelClass}>Vehicle Registration Number</label><input required value={formData.vehicleRegNumber} onChange={(e) => setField('vehicleRegNumber', e.target.value)} className={fieldClass} placeholder="Vehicle plate number" /></div>
                </div>
                <div className="flex gap-6"><label className="flex items-center gap-2"><input type="checkbox" checked={formData.canPickup} onChange={(e) => setField('canPickup', e.target.checked)} /> Farm pickup / QC</label><label className="flex items-center gap-2"><input type="checkbox" checked={formData.canDeliver} onChange={(e) => setField('canDeliver', e.target.checked)} /> Customer delivery</label></div>
              </div>
            </>}
            {selectedRole === 'warehouse' && <>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                <h3 className="font-bold text-emerald-900 flex items-center gap-2"><Warehouse className="w-4 h-4" /> Warehouse Application</h3>
                <p className="text-slate-600">Warehouse becomes operational only after admin approval. For the main hub, select Central Warehouse and Dhaka → Tejgaon.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className={labelClass}>Warehouse Name</label><input required value={formData.warehouseName} onChange={(e) => setField('warehouseName', e.target.value)} className={fieldClass} placeholder="e.g. AgroChain Dhaka Main Warehouse" /></div>
                  <div><label className={labelClass}>Warehouse Type</label><select value={formData.warehouseType} onChange={(e) => setField('warehouseType', e.target.value)} className={fieldClass}><option value="CENTRAL">Main / Central Warehouse</option><option value="REGIONAL_GODOWN">Regional Warehouse / Godown</option></select></div>
                  <div><label className={labelClass}>District</label><select value={formData.warehouseDistrict} onChange={(e) => setField('warehouseDistrict', e.target.value)} className={fieldClass}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></div>
                  <div><label className={labelClass}>Area / Upazila</label><input required value={formData.warehouseUpazila} onChange={(e) => setField('warehouseUpazila', e.target.value)} className={fieldClass} placeholder="Tejgaon" /></div>
                  <div><label className={labelClass}>Storage Capacity (metric tons)</label><input required type="number" min="0.1" step="0.1" value={formData.warehouseCapacity} onChange={(e) => setField('warehouseCapacity', e.target.value)} className={fieldClass} /></div>
                  <label className="flex items-center gap-2 self-end pb-2"><input type="checkbox" checked={formData.temperatureControlled} onChange={(e) => setField('temperatureControlled', e.target.checked)} /> Temperature-controlled storage</label>
                  <div className="sm:col-span-2"><label className={labelClass}>Full Warehouse Address</label><textarea required rows={2} value={formData.address} onChange={(e) => setField('address', e.target.value)} className={fieldClass} placeholder="Building, road, area, district" /></div>
                </div>
              </div>
            </>}
            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-lg font-bold flex items-center justify-center gap-2">
              {isSubmitting ? 'Submitting...' : selectedRole === 'delivery' || selectedRole === 'warehouse' ? 'Submit for Admin Approval' : 'Complete Registration'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>}
        </div>
        <div className="text-center text-xs text-slate-500">Already registered? <Link to="/login" className="text-emerald-700 font-bold hover:underline">Sign In here</Link></div>
      </div>
    </div>
  );
};
