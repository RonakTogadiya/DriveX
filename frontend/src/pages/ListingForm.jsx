import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createListing, getListingById, updateListing } from '../services/api';
import toast from 'react-hot-toast';

const VEHICLE_TYPES = ['CAR', 'BIKE', 'SUV', 'TRUCK', 'VAN', 'SCOOTER'];
const FUEL_TYPES = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG'];
const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC'];
const TYPE_ICONS = { CAR: '🚗', BIKE: '🏍️', SUV: '🚙', TRUCK: '🚛', VAN: '🚌', SCOOTER: '🛵' };

const EMPTY_FORM = {
    name: '', type: 'CAR', description: '', pricePerDay: '', weekendPrice: '',
    brand: '', model: '', year: new Date().getFullYear(), seats: 5,
    fuelType: 'PETROL', transmission: 'MANUAL', mileage: '',
    imageUrl: '',
    location: { address: '', city: '', country: '' },
};

const ListingForm = () => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    useEffect(() => {
        if (!isEdit) return;
        const fetch = async () => {
            try {
                const { data } = await getListingById(id);
                const l = data.data;
                setForm({
                    name: l.name, type: l.type, description: l.description || '', pricePerDay: l.pricePerDay, weekendPrice: l.weekendPrice || '',
                    brand: l.brand, model: l.model, year: l.year, seats: l.seats,
                    fuelType: l.fuelType, transmission: l.transmission, mileage: l.mileage || '',
                    imageUrl: l.imageUrl || '',
                    location: { address: l.location?.address || '', city: l.location?.city || '', country: l.location?.country || '' },
                });
            } catch { toast.error('Failed to load vehicle'); navigate('/my-listings'); }
            finally { setFetching(false); }
        };
        fetch();
    }, [id, isEdit, navigate]);

    const handle = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('location.')) {
            const key = name.split('.')[1];
            setForm((p) => ({ ...p, location: { ...p.location, [key]: value } }));
        } else {
            setForm((p) => ({ ...p, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const payload = {
            ...form,
            pricePerDay: Number(form.pricePerDay),
            weekendPrice: form.weekendPrice ? Number(form.weekendPrice) : undefined,
            year: Number(form.year),
            seats: Number(form.seats),
            mileage: Number(form.mileage) || 0,
        };
        try {
            if (isEdit) { await updateListing(id, payload); toast.success('Vehicle updated!'); }
            else { await createListing(payload); toast.success('Vehicle listed on marketplace!'); }
            navigate('/my-listings');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save listing');
        } finally { setLoading(false); }
    };

    if (fetching) return <div className="min-h-screen flex items-center justify-center text-blue-600 animate-pulse">Loading...</div>;

    const inputClass = "bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
    const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wider";

    const InputField = ({ label, name, type = 'text', placeholder, required, min, max, step }) => {
        const isLocation = name.startsWith('location.');
        const key = isLocation ? name.split('.')[1] : name;
        const value = isLocation ? form.location[key] : form[key];
        return (
            <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor={name}>{label}</label>
                <input id={name} name={name} type={type} value={value} onChange={handle}
                    placeholder={placeholder} required={required} min={min} max={max} step={step}
                    className={inputClass} />
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <button onClick={() => navigate('/my-listings')} className="text-slate-500 text-sm hover:text-blue-600 transition-colors mb-4 block">← Back to My Vehicles</button>
                    <h1 className="font-bold text-2xl text-slate-900">{isEdit ? 'Update Vehicle' : 'List a Vehicle'}</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">

                    {/* Section 1: Basic Info */}
                    <div>
                        <h2 className="text-xs text-blue-600 font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">01 — Vehicle Info</h2>
                        <div className="grid gap-4">
                            <InputField label="Listing Title *" name="name" placeholder="e.g. Toyota Fortuner 2022" required />
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Vehicle Type *</label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {VEHICLE_TYPES.map((t) => (
                                        <button key={t} type="button" onClick={() => setForm((p) => ({ ...p, type: t }))}
                                            className={`flex flex-col items-center py-2 px-1 rounded-xl border text-xs transition-all duration-150
                        ${form.type === t ? 'border-blue-500 bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'}`}>
                                            <span className="text-lg mb-0.5">{TYPE_ICONS[t]}</span>{t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass} htmlFor="description">Description</label>
                                <textarea id="description" name="description" value={form.description} onChange={handle}
                                    placeholder="Describe the vehicle, its condition, features..." rows={3}
                                    className={`${inputClass} resize-none`} />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Specs */}
                    <div>
                        <h2 className="text-xs text-blue-600 font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">02 — Specifications</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Brand *" name="brand" placeholder="Toyota" required />
                            <InputField label="Model *" name="model" placeholder="Fortuner" required />
                            <InputField label="Year *" name="year" type="number" min="1990" max={new Date().getFullYear() + 1} required />
                            <InputField label="Seats *" name="seats" type="number" min="1" max="50" required />
                            <InputField label="Mileage (km)" name="mileage" type="number" min="0" placeholder="e.g. 25000" />
                            <InputField label="Image URL" name="imageUrl" placeholder="https://..." />

                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Fuel Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {FUEL_TYPES.map((f) => (
                                        <button key={f} type="button" onClick={() => setForm((p) => ({ ...p, fuelType: f }))}
                                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all
                        ${form.fuelType === f ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{f}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Transmission</label>
                                <div className="flex gap-2">
                                    {TRANSMISSIONS.map((t) => (
                                        <button key={t} type="button" onClick={() => setForm((p) => ({ ...p, transmission: t }))}
                                            className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all
                        ${form.transmission === t ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Pricing */}
                    <div>
                        <h2 className="text-xs text-blue-600 font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">03 — Pricing</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Standard Price/Day (₹) *" name="pricePerDay" type="number" min="1" step="1" placeholder="e.g. 2500" required />
                            <InputField label="Weekend Price/Day (₹)" name="weekendPrice" type="number" min="1" step="1" placeholder="Optional (e.g. 3000)" />
                        </div>
                    </div>

                    {/* Section 4: Location */}
                    <div>
                        <h2 className="text-xs text-blue-600 font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">04 — Location</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><InputField label="Address" name="location.address" placeholder="Street / Area" /></div>
                            <InputField label="City" name="location.city" placeholder="Mumbai" />
                            <InputField label="Country" name="location.country" placeholder="India" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        className="bg-blue-600 text-white font-semibold text-sm py-3 rounded-xl hover:bg-blue-700 transition-colors
                                   disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading
                            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                            : isEdit ? '✏️ Update Listing' : '🚗 List Vehicle'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ListingForm;
