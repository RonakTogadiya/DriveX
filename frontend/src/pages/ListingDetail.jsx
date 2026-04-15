import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListingById, getListingAvailability, createBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import toast from 'react-hot-toast';
import { format, differenceInCalendarDays } from 'date-fns';

const fuelBadge = {
    PETROL: 'bg-orange-50 text-orange-600 border-orange-200',
    DIESEL: 'bg-slate-100 text-slate-600 border-slate-200',
    ELECTRIC: 'bg-green-50 text-green-600 border-green-200',
    HYBRID: 'bg-teal-50 text-teal-600 border-teal-200',
    CNG: 'bg-emerald-50 text-emerald-600 border-emerald-200',
};
const typeIcon = { CAR: '🚗', BIKE: '🏍️', SUV: '🚙', TRUCK: '🚛', VAN: '🚌', SCOOTER: '🛵' };

const ListingDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [activeImage, setActiveImage] = useState(0);
    const [bookedDates, setBookedDates] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Dynamic date-overlap check instead of static isAvailable flag
    const hasDateConflict = (() => {
        if (!startDate || !endDate || !bookedDates.length) return false;
        const selStart = new Date(startDate);
        const selEnd = new Date(endDate);
        selStart.setHours(0,0,0,0);
        selEnd.setHours(23,59,59,999);
        return bookedDates.some(b => {
            if (b.status === 'CANCELLED' || b.status === 'COMPLETED') return false;
            const bStart = new Date(b.startDate);
            const bEnd = new Date(b.endDate);
            bStart.setHours(0,0,0,0);
            bEnd.setHours(23,59,59,999);
            return selStart < bEnd && selEnd > bStart;
        });
    })();

    const totalDays = startDate && endDate ? differenceInCalendarDays(new Date(endDate), new Date(startDate)) : 0;
    
    let totalCost = 0;
    if (totalDays > 0 && listing) {
        const wp = listing.weekendPrice > 0 ? listing.weekendPrice : listing.pricePerDay;
        const current = new Date(startDate);
        current.setHours(0,0,0,0);
        for (let i = 0; i < totalDays; i++) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                totalCost += wp;
            } else {
                totalCost += listing.pricePerDay;
            }
            current.setDate(current.getDate() + 1);
        }
    }

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const [listRes, availRes] = await Promise.all([getListingById(id), getListingAvailability(id)]);
                setListing(listRes.data.data);
                setBookedDates(availRes.data.data);
            } catch {
                toast.error('Failed to load vehicle'); navigate('/listings');
            } finally { setLoading(false); }
        };
        fetch();
    }, [id, navigate]);

    const handleBooking = async () => {
        if (!user) { toast.error('Please sign in to book'); navigate('/login'); return; }
        if (!startDate || !endDate) { toast.error('Please select pickup and return dates'); return; }
        if (totalDays < 1) { toast.error('Return date must be after pickup date'); return; }
        setBookingLoading(true);
        try {
            const { data } = await createBooking({ listingId: id, startDate, endDate });
            if (data.success) { toast.success('Booking confirmed! Check your dashboard.'); navigate('/dashboard'); }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Booking failed');
        } finally { setBookingLoading(false); }
    };

    const today = format(new Date(), 'yyyy-MM-dd');

    if (loading) return (
        <div className="min-h-screen bg-slate-50 pt-24 px-4">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_360px] gap-8 animate-pulse">
                <div className="space-y-4">
                    <div className="bg-slate-200 h-80 rounded-2xl" />
                    <div className="bg-slate-200 h-5 w-1/2 rounded" />
                </div>
                <div className="bg-slate-200 h-72 rounded-2xl" />
            </div>
        </div>
    );

    if (!listing) return null;

    const images = listing.images?.length > 0 ? listing.images : listing.imageUrl ? [listing.imageUrl] : [];
    const tabs = [{ key: 'details', label: 'Details' }, { key: 'specs', label: 'Specs' }, { key: 'availability', label: '📅 Availability' }, { key: 'chat', label: '💬 Chat' }];
    
    const isOwner = user && listing.owner?._id === user._id;

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto">

                {/* ── Breadcrumb ────────────────────────────────────────── */}
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
                    <button onClick={() => navigate('/listings')} className="hover:text-emerald-600 transition-colors">
                        ← Explore Vehicles
                    </button>
                    <span>/</span>
                    <span className="text-slate-700 font-medium truncate">{listing.name}</span>
                </div>

                <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">

                    {/* ── LEFT ──────────────────────────────────────────── */}
                    <div className="flex flex-col gap-6">

                        {/* Image Gallery */}
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="h-72 md:h-80 relative overflow-hidden bg-gray-100">
                                {images.length > 0 ? (
                                    <img src={images[activeImage]} alt={listing.name}
                                        className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-8xl">
                                        {typeIcon[listing.type] || '🚗'}
                                    </div>
                                )}
                                <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                                  ${listing.isAvailable
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${listing.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                                    {listing.isAvailable ? 'Available' : 'Booked'}
                                </div>
                            </div>
                            {images.length > 1 && (
                                <div className="flex gap-2 px-4 py-3 border-t border-gray-100">
                                    {images.map((img, i) => (
                                        <button key={i} onClick={() => setActiveImage(i)}
                                            className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0
                                            ${i === activeImage ? 'border-emerald-500' : 'border-gray-200 opacity-60 hover:opacity-100'}`}>
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Title + badges */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                                        {listing.brand} · {listing.type}
                                    </p>
                                    <h1 className="font-bold text-2xl text-slate-900 leading-tight">{listing.name}</h1>
                                    <p className="text-slate-400 text-sm mt-0.5">{listing.model} · {listing.year}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-emerald-600 font-bold text-2xl">₹{listing.pricePerDay?.toLocaleString()}</p>
                                    <p className="text-slate-400 text-xs">per day</p>
                                    {listing.weekendPrice > 0 && (
                                        <p className="text-amber-500 font-bold text-xs mt-1">
                                            ₹{listing.weekendPrice.toLocaleString()} <span className="font-normal text-slate-400">on weekends</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${fuelBadge[listing.fuelType] || fuelBadge.PETROL}`}>
                                    {listing.fuelType}
                                </span>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                                    {listing.transmission}
                                </span>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                                    💺 {listing.seats} Seats
                                </span>
                                {listing.mileage > 0 && (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                                        {listing.fuelType === 'ELECTRIC' ? `${listing.mileage} km range` : `${listing.mileage} km/l`}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                            {tabs.map(({ key, label }) => (
                                <button key={key} onClick={() => setActiveTab(key)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150
                                    ${activeTab === key
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'details' && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Description</h3>
                                <p className="text-slate-700 text-sm leading-relaxed">
                                    {listing.description || 'No description provided.'}
                                </p>
                                {listing.location?.city && (
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                        <span>📍</span>
                                        <span className="text-slate-500 text-sm">
                                            {[listing.location.address, listing.location.city, listing.location.state, listing.location.country].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'specs' && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Vehicle Specifications</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Brand', value: listing.brand },
                                        { label: 'Model', value: listing.model },
                                        { label: 'Year', value: listing.year },
                                        { label: 'Seats', value: `${listing.seats} seats` },
                                        { label: 'Fuel Type', value: listing.fuelType },
                                        { label: 'Transmission', value: listing.transmission },
                                        { label: 'Mileage', value: listing.fuelType === 'ELECTRIC' ? `${listing.mileage} km range` : `${listing.mileage} km/l` },
                                        { label: 'Type', value: listing.type },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                            <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block mb-1">{label}</span>
                                            <span className="text-slate-800 text-sm font-medium">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'availability' && (
                            <AvailabilityCalendar 
                                listingId={id} 
                                isOwner={isOwner} 
                                initialBookedStatus={bookedDates} 
                            />
                        )}

                        {activeTab === 'chat' && (
                            <ChatBox listingId={id} ownerId={listing.owner?._id} ownerName={listing.owner?.username} />
                        )}
                    </div>

                    {/* ── RIGHT: Booking Panel ───────────────────────────── */}
                    <div className="sticky top-24 flex flex-col gap-4">
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <h3 className="font-semibold text-slate-900 text-base mb-5">Book This Vehicle</h3>

                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pickup Date</label>
                                    <input type="date" min={today} value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value >= endDate) setEndDate(''); }}
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm
                                       focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Return Date</label>
                                    <input type="date" min={startDate || today} value={endDate} disabled={!startDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm
                                       focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all disabled:opacity-40" />
                                </div>
                            </div>

                            {totalDays > 0 && (
                                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">₹{listing.pricePerDay} × {totalDays} day{totalDays !== 1 ? 's' : ''}</span>
                                        <span className="text-slate-700">₹{totalCost.toLocaleString()}</span>
                                    </div>
                                    <div className="h-px bg-slate-200" />
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 text-sm font-semibold">Total</span>
                                        <span className="text-emerald-600 font-bold text-lg">₹{totalCost.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            <button onClick={handleBooking}
                                disabled={bookingLoading || hasDateConflict || totalDays < 1}
                                className="w-full mt-4 bg-emerald-600 text-white font-semibold text-sm py-3 rounded-xl
                                           hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                                           flex items-center justify-center gap-2">
                                {bookingLoading
                                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
                                    : hasDateConflict ? '⛔ Dates Unavailable — Choose Different Dates' : totalDays < 1 ? '📅 Select Dates to Book' : '🚗 Book Now'}
                            </button>

                            {!user && (
                                <p className="text-center text-slate-400 text-xs mt-2">
                                    <button onClick={() => navigate('/login')} className="text-emerald-600 hover:underline">Sign in</button> to book
                                </p>
                            )}
                        </div>

                        {/* Owner card */}
                        {listing.owner && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Listed by</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-base">
                                        {listing.owner.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-slate-800 text-sm font-semibold">{listing.owner.username}</p>
                                        <p className="text-slate-400 text-xs capitalize">{listing.owner.licenseType || 'Owner'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingDetail;
