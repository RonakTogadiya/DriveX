import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../services/api';
import toast from 'react-hot-toast';

const ROLES = [
    { value: 'renter', icon: '🧑‍💼', label: 'Renter', desc: 'Browse and book vehicles' },
    { value: 'owner', icon: '🏢', label: 'Owner', desc: 'List your vehicles for rent' },
];

const Register = () => {
    const [form, setForm] = useState({ 
        username: '', email: '', password: '', confirmPassword: '', role: 'renter', phone: '',
        vName: '', vBrand: '', vModel: '', vYear: new Date().getFullYear(), vType: 'CAR', vFuel: 'PETROL', vPrice: '' 
    });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').substring(0, 10);
        setForm(p => ({ ...p, phone: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
        if (form.phone.length !== 10) return toast.error('Phone number must be exactly 10 digits');
        setLoading(true);
        try {
            const payload = {
                username: form.username,
                email: form.email,
                password: form.password,
                role: form.role,
                phone: `+91${form.phone}`
            };
            
            if (form.role === 'owner') {
                payload.initialVehicle = {
                    name: form.vName,
                    brand: form.vBrand,
                    model: form.vModel,
                    year: Number(form.vYear),
                    type: form.vType,
                    fuelType: form.vFuel,
                    pricePerDay: Number(form.vPrice)
                };
            }
            
            const { data } = await registerApi(payload);
            if (data.success) {
                if (data.pendingApproval) {
                    toast.success(data.message || 'Registration submitted! Admin will review your account.', { duration: 5000 });
                    navigate('/login');
                } else {
                    login(data.data, data.data.token);
                    toast.success(`Welcome to DriveLink, ${form.username}!`);
                    navigate('/listings');
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-1.5 mb-6">
                        <span className="text-emerald-600 font-bold text-2xl">Drive</span>
                        <span className="text-slate-900 font-bold text-2xl">Link</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    </Link>
                    <h1 className="font-bold text-2xl text-slate-900">Create Account</h1>
                    <p className="text-slate-500 text-sm mt-1">Join the DriveLink platform</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                        {/* Role selector */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">I want to</label>
                            <div className="grid grid-cols-2 gap-3">
                                {ROLES.map(({ value, icon, label, desc }) => (
                                    <button key={value} type="button" onClick={() => setForm((p) => ({ ...p, role: value }))}
                                        className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-150
                      ${form.role === value ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{icon}</span>
                                            <span className={`text-sm font-semibold ${form.role === value ? 'text-emerald-600' : 'text-slate-700'}`}>{label}</span>
                                        </div>
                                        <span className="text-slate-400 text-xs">{desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name / Username</label>
                            <input name="username" value={form.username} onChange={handleChange} required placeholder="e.g. John Doe"
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@email.com"
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</label>
                            <div className="flex">
                                <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-sm font-bold">
                                    +91
                                </span>
                                <input name="phone" type="tel" value={form.phone} onChange={handlePhoneChange} required placeholder="9876543210" minLength={10} maxLength={10}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-r-xl px-4 py-3 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                            </div>
                        </div>

                        {form.role === 'owner' && (
                            <div className="p-5 mt-2 border-2 border-emerald-500/20 bg-emerald-50/50 rounded-xl space-y-4">
                                <div>
                                    <h3 className="text-emerald-800 font-bold text-sm tracking-wide uppercase">Your Vehicle Details</h3>
                                    <p className="text-xs text-emerald-600/80 mt-1">Required for vendor approval. You can add more later.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input name="vName" value={form.vName} onChange={handleChange} required placeholder="Vehicle Name (e.g. Swift LXI)" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-400" />
                                    <input name="vBrand" value={form.vBrand} onChange={handleChange} required placeholder="Brand (e.g. Maruti)" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-400" />
                                    <input name="vModel" value={form.vModel} onChange={handleChange} required placeholder="Model (e.g. Swift)" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-400" />
                                    <input name="vYear" type="number" min="2000" max={new Date().getFullYear() + 1} value={form.vYear} onChange={handleChange} required placeholder="Year" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-400" />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <select name="vType" value={form.vType} onChange={handleChange} required className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all">
                                        <option value="CAR">Car</option><option value="SUV">SUV</option><option value="BIKE">Bike</option><option value="SCOOTER">Scooter</option>
                                    </select>
                                    <select name="vFuel" value={form.vFuel} onChange={handleChange} required className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all">
                                        <option value="PETROL">Petrol</option><option value="DIESEL">Diesel</option><option value="ELECTRIC">Electric</option>
                                    </select>
                                    <input name="vPrice" type="number" min="100" value={form.vPrice} onChange={handleChange} required placeholder="₹/Day" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-400" />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {['password', 'confirmPassword'].map((id) => (
                                <div key={id} className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor={id}>
                                        {id === 'password' ? 'Password' : 'Confirm Password'}
                                    </label>
                                    <input id={id} name={id} type="password" value={form[id]} onChange={handleChange}
                                        placeholder="min 6 chars" required
                                        className={`bg-slate-50 border rounded-xl px-4 py-3 text-slate-800 text-sm placeholder:text-slate-400
                                focus:outline-none transition-all
                                ${id === 'confirmPassword' && form.confirmPassword && form.password !== form.confirmPassword
                                                ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                                                : 'border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'}`} />
                                </div>
                            ))}
                        </div>
                        {form.confirmPassword && form.password !== form.confirmPassword && (
                            <p className="text-red-500 text-xs -mt-3">⚠ Passwords do not match</p>
                        )}

                        <button type="submit"
                            disabled={loading || (!!form.confirmPassword && form.password !== form.confirmPassword)}
                            className="bg-emerald-600 text-white font-semibold text-sm mt-1 py-3 rounded-xl hover:bg-emerald-700 transition-colors
                                       disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading
                                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
                                : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-emerald-600 hover:underline font-semibold">Sign In →</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
