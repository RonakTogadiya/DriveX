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
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', role: 'renter', phone: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
        setLoading(true);
        try {
            const { data } = await registerApi({ username: form.username, email: form.email, password: form.password, role: form.role, phone: form.phone });
            if (data.success) {
                login(data.data, data.data.token);
                toast.success(`Welcome to DriveX, ${form.username}!`);
                navigate('/listings');
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
                        <span className="text-blue-600 font-bold text-2xl">Drive</span>
                        <span className="text-slate-900 font-bold text-2xl">X</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </Link>
                    <h1 className="font-bold text-2xl text-slate-900">Create Account</h1>
                    <p className="text-slate-500 text-sm mt-1">Join the DriveX platform</p>
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
                      ${form.role === value ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{icon}</span>
                                            <span className={`text-sm font-semibold ${form.role === value ? 'text-blue-600' : 'text-slate-700'}`}>{label}</span>
                                        </div>
                                        <span className="text-slate-400 text-xs">{desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Fields */}
                        {[
                            { id: 'username', label: 'Full Name / Username', placeholder: 'e.g. John Doe', type: 'text' },
                            { id: 'email', label: 'Email Address', placeholder: 'you@email.com', type: 'email' },
                            { id: 'phone', label: 'Phone Number', placeholder: '+91 9876543210', type: 'tel' },
                        ].map(({ id, label, placeholder, type }) => (
                            <div key={id} className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor={id}>{label}</label>
                                <input id={id} name={id} type={type} value={form[id]} onChange={handleChange} placeholder={placeholder}
                                    required={id !== 'phone'}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm placeholder:text-slate-400
                             focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                            </div>
                        ))}

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
                                                : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`} />
                                </div>
                            ))}
                        </div>
                        {form.confirmPassword && form.password !== form.confirmPassword && (
                            <p className="text-red-500 text-xs -mt-3">⚠ Passwords do not match</p>
                        )}

                        <button type="submit"
                            disabled={loading || (!!form.confirmPassword && form.password !== form.confirmPassword)}
                            className="bg-blue-600 text-white font-semibold text-sm mt-1 py-3 rounded-xl hover:bg-blue-700 transition-colors
                                       disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading
                                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
                                : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 hover:underline font-semibold">Sign In →</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
