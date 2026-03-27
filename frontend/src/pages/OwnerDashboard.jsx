import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOwnerBookings, confirmBooking, rejectBooking } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    PENDING: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending' },
    CONFIRMED: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Confirmed' },
    ACTIVE: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Active' },
    COMPLETED: { color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Completed' },
    CANCELLED: { color: 'bg-red-50 text-red-600 border-red-200', label: 'Cancelled' },
};

const OwnerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // stores booking ID being acted upon

    useEffect(() => {
        if (!user || user.role !== 'owner') { navigate('/'); return; }
        fetchBookings();
    }, [user, navigate]);

    const fetchBookings = async () => {
        try {
            const { data } = await getOwnerBookings();
            setBookings(data.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch owner dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        setActionLoading(id);
        try {
            if (action === 'accept') {
                await confirmBooking(id);
                toast.success('Booking accepted!');
            } else if (action === 'reject') {
                await rejectBooking(id, 'Unspecified reason');
                toast.success('Booking rejected.');
            }
            // Update local state to reflect change without refetch
            setBookings(prev => prev.map(b => 
                b._id === id ? { ...b, status: action === 'accept' ? 'CONFIRMED' : 'CANCELLED' } : b
            ));
        } catch (err) {
            toast.error(`Failed to ${action} booking.`);
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const totalEarnings = bookings.filter(b => ['COMPLETED', 'ACTIVE', 'CONFIRMED'].includes(b.status)).reduce((s, b) => s + (b.totalCost || 0), 0);
    const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
    const activeCount = bookings.filter(b => b.status === 'ACTIVE').length;
    const totalRequests = bookings.length;

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-1">Owner Area</p>
                    <h1 className="font-bold text-2xl text-slate-900">
                        Dashboard & Requests
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage incoming bookings and track your earnings</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'Est. Earnings', value: `₹${totalEarnings.toLocaleString()}`, icon: '💰', color: 'text-green-600' },
                        { label: 'Pending Requests', value: pendingCount, icon: '🔔', color: 'text-amber-600' },
                        { label: 'Active Rentals', value: activeCount, icon: '🚗', color: 'text-blue-600' },
                        { label: 'Total Requests', value: totalRequests, icon: '📈', color: 'text-violet-600' },
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

                {/* Booking Requests */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="font-semibold text-base text-slate-900">All Booking Requests</h2>
                    </div>

                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-3">🛌</div>
                            <p className="text-slate-800 font-semibold">No booking requests yet</p>
                            <p className="text-slate-500 text-sm mt-1">When users book your vehicles, they will appear here.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {bookings.map((booking) => {
                                const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                                return (
                                    <div key={booking._id} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                        <div className="flex gap-4 items-center min-w-0 flex-1">
                                            {booking.listing?.imageUrl ? (
                                                <img src={booking.listing.imageUrl} alt="" className="w-16 h-12 rounded-lg object-cover bg-gray-100" />
                                            ) : (
                                                <div className="w-16 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl">🚗</div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-slate-900 font-semibold text-sm truncate">{booking.listing?.name}</p>
                                                <div className="text-slate-500 text-xs mt-1 flex items-center gap-2">
                                                    <span>👤 {booking.renter?.username}</span>
                                                    <span>•</span>
                                                    <span>📅 {format(new Date(booking.startDate), 'MMM dd')} - {format(new Date(booking.endDate), 'MMM dd, yyyy')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                            <div className="text-right">
                                                <p className="text-blue-600 font-bold text-sm">₹{booking.totalCost?.toLocaleString()}</p>
                                                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            {booking.status === 'PENDING' ? (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleAction(booking._id, 'accept')}
                                                        disabled={actionLoading === booking._id}
                                                        className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg border border-green-200 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === booking._id ? '...' : 'Accept'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(booking._id, 'reject')}
                                                        disabled={actionLoading === booking._id}
                                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === booking._id ? '...' : 'Reject'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-[110px] text-right text-xs text-slate-400 font-medium">
                                                    No actions needed
                                                </div>
                                            )}
                                        </div>
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

export default OwnerDashboard;
