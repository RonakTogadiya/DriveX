import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBookings, cancelBooking, downloadReceipt } from '../services/api';
import { format, isFuture } from 'date-fns';

const STATUS_CONFIG = {
    PENDING: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending' },
    CONFIRMED: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Confirmed' },
    ACTIVE: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Active' },
    COMPLETED: { color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Completed' },
    CANCELLED: { color: 'bg-red-50 text-red-600 border-red-200', label: 'Cancelled' },
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelModal, setCancelModal] = useState({ isOpen: false, bookingId: null, reason: '', loading: false });
    const [highlightedBookingId, setHighlightedBookingId] = useState(null);
    const highlightRef = useRef(null);

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

        // Check for bookingId in URL for highlighting
        const bookingId = searchParams.get('bookingId');
        if (bookingId) {
            setHighlightedBookingId(bookingId);
            // Auto-clear highlight after 5 seconds
            const timer = setTimeout(() => setHighlightedBookingId(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [user, navigate, searchParams]);

    // Scroll to highlighted booking when data loads
    useEffect(() => {
        if (highlightedBookingId && !loading && highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [highlightedBookingId, loading]);

    const handleCancelClick = (bookingId) => {
        setCancelModal({ isOpen: true, bookingId, reason: '', loading: false });
    };

    const confirmCancel = async () => {
        if (!cancelModal.bookingId) return;
        setCancelModal(prev => ({ ...prev, loading: true }));
        try {
            await cancelBooking(cancelModal.bookingId, cancelModal.reason);
            setBookings(prev => prev.map(b => 
                b._id === cancelModal.bookingId ? { ...b, status: 'CANCELLED' } : b
            ));
            setCancelModal({ isOpen: false, bookingId: null, reason: '', loading: false });
        } catch (err) {
            console.error(err);
            setCancelModal(prev => ({ ...prev, loading: false }));
            alert('Failed to cancel booking. Please try again later.');
        }
    };

    const totalSpent = bookings.filter(b => !['CANCELLED'].includes(b.status)).reduce((s, b) => s + (b.totalCost || 0), 0);
    const totalDays = bookings.filter(b => !['CANCELLED'].includes(b.status)).reduce((s, b) => s + (b.totalDays || 0), 0);
    const activeCount = bookings.filter(b => b.status === 'ACTIVE').length;
    const pendingCount = bookings.filter(b => b.status === 'PENDING').length;

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <p className="text-emerald-600 text-xs font-semibold uppercase tracking-widest mb-1">Dashboard</p>
                    <h1 className="font-bold text-2xl text-slate-900">
                        Welcome back, {user?.username}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your rentals and account details</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: '💳', color: 'text-emerald-600' },
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
                                className="bg-emerald-600 text-white text-sm font-semibold px-6 py-2 rounded-lg mt-4 hover:bg-emerald-700 transition-colors">
                                Browse Vehicles
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="hidden md:grid grid-cols-[1fr_120px_160px_100px_100px_80px] gap-4 px-5 py-3 border-b border-gray-100">
                                {['Vehicle', 'Status', 'Dates', 'Days', 'Total', 'Actions'].map(h => (
                                    <span key={h} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</span>
                                ))}
                            </div>
                            {bookings.map((booking, idx) => {
                                const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                                const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status) && isFuture(new Date(booking.startDate));
                                return (
                                    <div key={booking._id}
                                        ref={highlightedBookingId === booking._id ? highlightRef : null}
                                        className={`grid grid-cols-1 md:grid-cols-[1fr_120px_160px_100px_100px_80px] gap-3 md:gap-4 px-5 py-4 items-center
                      ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}
                      ${highlightedBookingId === booking._id ? 'ring-2 ring-emerald-400 bg-emerald-50/60 animate-pulse' : ''}
                      hover:bg-emerald-50/40 transition-colors duration-150`}>
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
                                        <span className="text-emerald-600 font-bold text-sm flex flex-col items-end">
                                            ₹{booking.totalCost?.toLocaleString()}
                                            {(booking.status === 'CONFIRMED' || booking.status === 'ACTIVE') && (
                                                <div className="flex flex-col gap-1 mt-2 items-end">
                                                    {!booking.depositPaid && (
                                                        <button 
                                                            onClick={() => navigate(`/payment/${booking._id}?type=DEPOSIT`)}
                                                            className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white px-2 py-1 rounded"
                                                        >
                                                            Pay Deposit
                                                        </button>
                                                    )}
                                                    {booking.depositPaid && !booking.rentalPaid && (
                                                        <button 
                                                            onClick={() => navigate(`/payment/${booking._id}?type=RENTAL`)}
                                                            className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-1 rounded"
                                                        >
                                                            Pay Rental
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </span>
                                        <div className="flex flex-col gap-1 items-end">
                                            {canCancel && (
                                                <button 
                                                    onClick={() => handleCancelClick(booking._id)}
                                                    className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors border border-red-200 mt-1 w-full"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDownloadReceipt(booking._id)}
                                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors border border-slate-200 mt-1 w-full"
                                            >
                                                Receipt
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Modal */}
            {cancelModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Cancel Booking</h3>
                        <p className="text-slate-500 text-sm mb-4">Are you sure you want to cancel this booking? This action cannot be undone.</p>
                        
                        <textarea 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm mb-6 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            rows="3"
                            placeholder="Reason for cancellation (optional)"
                            value={cancelModal.reason}
                            onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                        />

                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={() => setCancelModal({ isOpen: false, bookingId: null, reason: '', loading: false })}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                No, Go Back
                            </button>
                            <button 
                                onClick={confirmCancel}
                                disabled={cancelModal.loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {cancelModal.loading ? 'Cancelling...' : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
