import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const fuelBadge = {
    PETROL: 'bg-orange-50 text-orange-600 border-orange-200',
    DIESEL: 'bg-slate-100 text-slate-600 border-slate-200',
    ELECTRIC: 'bg-green-50 text-green-600 border-green-200',
    HYBRID: 'bg-teal-50 text-teal-600 border-teal-200',
    CNG: 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

const typeIcon = {
    CAR: '🚗', BIKE: '🏍️', SUV: '🚙', TRUCK: '🚛', VAN: '🚌', SCOOTER: '🛵',
};

const VehicleCard = ({ listing }) => {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    
    // Check if listing is in user's wishlist
    const isWishlisted = user?.wishlist?.some(id => 
        id === listing._id || (typeof id === 'object' && id._id === listing._id)
    );

    const toggleWishlist = async (e) => {
        e.stopPropagation();
        if (!user) return navigate('/login');
        try {
            const { data } = await axios.post(`/users/wishlist/${listing._id}`);
            if (data.success) {
                setUser({ ...user, wishlist: data.data });
            }
        } catch (err) {
            console.error('Failed to toggle wishlist:', err);
        }
    };

    return (
        <div
            className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer
                       transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group relative"
            onClick={() => navigate(`/listings/${listing._id}`)}
        >
            {/* ── Image ─────────────────────────────────────────────── */}
            <div className="h-44 bg-gray-100 flex items-center justify-center relative overflow-hidden border-b border-gray-100">
                {listing.imageUrl ? (
                    <img
                        src={listing.imageUrl}
                        alt={listing.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="text-6xl">{typeIcon[listing.type] || '🚗'}</div>
                )}

                {/* Availability badge */}
                <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold
                         ${listing.isAvailable
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${listing.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                    {listing.isAvailable ? 'Available' : 'Booked'}
                </div>

                {/* Fuel badge */}
                <div className={`absolute top-2.5 right-2.5 text-[9px] font-bold uppercase tracking-wide
                         px-2 py-1 rounded-full border ${fuelBadge[listing.fuelType] || fuelBadge.PETROL}`}>
                    {listing.fuelType}
                </div>

                {/* Wishlist Heart */}
                <button 
                    onClick={toggleWishlist}
                    className="absolute bottom-2.5 right-2.5 p-2 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full shadow-sm transition-all active:scale-95 text-xl"
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                    <span className={isWishlisted ? "text-red-500" : "text-gray-400"}>
                        {isWishlisted ? '❤️' : '🤍'}
                    </span>
                </button>
            </div>

            {/* ── Card Body ─────────────────────────────────────────── */}
            <div className="p-4">
                <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">{listing.brand}</p>
                <h3 className="text-slate-900 font-semibold text-base leading-tight truncate">{listing.name}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{listing.model} · {listing.year}</p>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2 my-3 py-3 border-y border-gray-100 text-center">
                    {[
                        { icon: '💺', label: `${listing.seats || 5} Seats` },
                        { icon: '⚙️', label: listing.transmission || 'Manual' },
                        { icon: '📍', label: listing.location?.city || 'N/A' },
                    ].map(({ icon, label }) => (
                        <div key={label} className="flex flex-col items-center gap-1">
                            <span className="text-sm">{icon}</span>
                            <span className="text-slate-500 text-[9px] font-medium truncate w-full text-center">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Price + rating */}
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-emerald-600 font-bold text-lg">₹{listing.pricePerDay?.toLocaleString()}</span>
                        <span className="text-slate-400 text-xs ml-1">/ day</span>
                    </div>
                    {listing.averageRating > 0 && (
                        <span className="text-amber-500 text-xs font-medium">★ {listing.averageRating.toFixed(1)}</span>
                    )}
                </div>
            </div>

            {/* ── Hover CTA ─────────────────────────────────────────── */}
            <div className="px-4 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-1">
                <div className="w-full py-2 bg-emerald-600 text-white text-xs font-semibold text-center rounded-lg">
                    View Details →
                </div>
            </div>
        </div>
    );
};

export default VehicleCard;
