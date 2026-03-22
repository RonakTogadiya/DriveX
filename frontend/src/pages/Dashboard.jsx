import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/api';
import { format } from 'date-fns';

const STATUS_CONFIG = {
    PENDING: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending' },
    CONFIRMED: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Confirmed' },
    ACTIVE: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Active' },
    COMPLETED: { color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Completed' },
    CANCELLED: { color: 'bg-red-50 text-red-600 border-red-200', label: 'Cancelled' },
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        const fetch = async () => {
            try {
                const { data } = await getMyBookings();
                setBookings(data.data || []);
            } catch { /* silently fail */ }
            finally { setLoading(false); }
        };
        fetch();
    }, [user, navigate]);

    const totalSpent = bookings.filter(b => !['CANCELLED'].includes(b.status)).reduce((s, b) => s + (b.totalCost || 0), 0);
    const totalDays = bookings.filter(b => !['CANCELLED'].includes(b.status)).reduce((s, b) => s + (b.totalDays || 0), 0);
    const activeCount = bookings.filter(b => b.status === 'ACTIVE').length;
    const pendingCount = bookings.filter(b => b.status === 'PENDING').length;

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-1">Dashboard</p>
                    <h1 className="font-bold text-2xl text-slate-900">
                        Welcome back, {user?.username}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your rentals and account details</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: '💳', color: 'text-blue-600' },
                        { label: 'Days Rented', value: totalDays, icon: '📅', color: 'text-violet-600' },
                        { label: 'Active', value: activeCount, icon: '🚗', color: 'text-green-600' },
                        { label: 'Pending', value: pendingCount, icon: '⏳', color: 'text-amber-600' },
                    ].map(({ label, value, icon, color }) => (
                        <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                                <span className="text-xl">{icon}</span>
                            </div>
                            <span className={`${color} font-bold text-2xl`}>{value}</span>
                        </div>
                    ))}
                </div>

                {/* Booking History */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-gray-100">
                        <h2 className="font-semibold text-base text-slate-900">Booking History</h2>
                    </div>

                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">🚗</div>
                            <p className="text-slate-800 font-semibold">No bookings yet</p>
                            <p className="text-slate-500 text-sm mt-1">Browse vehicles and make your first booking</p>
                            <button onClick={() => navigate('/listings')}
                                className="bg-blue-600 text-white text-sm font-semibold px-6 py-2 rounded-lg mt-4 hover:bg-blue-700 transition-colors">
                                Browse Vehicles
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="hidden md:grid grid-cols-[1fr_120px_160px_100px_100px] gap-4 px-5 py-3 border-b border-gray-100">
                                {['Vehicle', 'Status', 'Dates', 'Days', 'Total'].map(h => (
                                    <span key={h} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</span>
                                ))}
                            </div>
                            {bookings.map((booking, idx) => {
                                const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                                return (
                                    <div key={booking._id}
                                        className={`grid grid-cols-1 md:grid-cols-[1fr_120px_160px_100px_100px] gap-3 md:gap-4 px-5 py-4 items-center
                      ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}
                      hover:bg-blue-50/40 transition-colors duration-150`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-sm">
                                                🚗
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-slate-800 text-sm font-semibold truncate">{booking.listing?.name || 'Vehicle'}</p>
                                                <p className="text-slate-400 text-xs">{booking.listing?.brand} {booking.listing?.model}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border w-fit ${status.color}`}>
                                            {status.label}
                                        </span>
                                        <div className="text-slate-500 text-xs">
                                            {booking.startDate ? format(new Date(booking.startDate), 'dd MMM yy') : '—'}
                                            {' → '}
                                            {booking.endDate ? format(new Date(booking.endDate), 'dd MMM yy') : '—'}
                                        </div>
                                        <span className="text-slate-500 text-sm">{booking.totalDays} days</span>
                                        <span className="text-blue-600 font-bold text-sm">₹{booking.totalCost?.toLocaleString()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
