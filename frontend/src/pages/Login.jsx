import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/api';
import toast from 'react-hot-toast';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await loginApi(form);
            if (data.success) {
                login(data.data, data.data.token);
                toast.success('Welcome back! 🚗');
                navigate('/listings');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-1.5 mb-6">
                        <span className="text-emerald-600 font-bold text-2xl">Drive</span>
                        <span className="text-slate-900 font-bold text-2xl">X</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    </Link>
                    <h1 className="font-bold text-2xl text-slate-900">Sign In</h1>
                    <p className="text-slate-500 text-sm mt-1">Access your DriveX account</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="email">Email Address</label>
                            <input id="email" name="email" type="email" value={form.email} onChange={handleChange}
                                placeholder="you@email.com" required
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm placeholder:text-slate-400
                           focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="password">Password</label>
                            <input id="password" name="password" type="password" value={form.password} onChange={handleChange}
                                placeholder="••••••••" required
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm placeholder:text-slate-400
                           focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                        </div>
                        <button type="submit" disabled={loading}
                            className="bg-emerald-600 text-white font-semibold text-sm mt-2 py-3 rounded-xl hover:bg-emerald-700 transition-colors
                                       disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</> : 'Sign In'}
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-gray-200" /><span className="text-slate-400 text-xs">OR</span><div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <p className="text-center text-slate-500 text-sm">
                        New to DriveX?{' '}
                        <Link to="/register" className="text-emerald-600 hover:underline font-semibold">Create Account →</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
