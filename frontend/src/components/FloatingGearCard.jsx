import React from 'react';

// Vehicle type icon mapping
const vehicleTypeIcon = {
    CAR: '🚗',
    SUV: '🚙',
    BIKE: '🏍️',
    TRUCK: '🚛',
    VAN: '🚐',
    SCOOTER: '🛵',
};

/**
 * FloatingGearCard
 * Animated listing card component for the DriveX car rental platform.
 *
 * Props:
 *  - gear: Listing object from the API (see Listing model)
 *  - onLease: Callback fn when "Book Now" is clicked
 */
const FloatingGearCard = ({ gear, onLease }) => {
    const {
        name = 'Unknown Vehicle',
        type = 'CAR',
        pricePerDay = 0,
        brand = '',
        model = '',
        seats = 0,
        fuelType = 'PETROL',
        transmission = 'MANUAL',
        mileage = 0,
        imageUrl,
        averageRating = 0,
        numReviews = 0,
        isAvailable = true,
        location,
    } = gear || {};

    const handleLease = (e) => {
        e.preventDefault();
        if (onLease) onLease(gear);
    };

    return (
        <div
            className="
        group relative w-full bg-white rounded-xl border border-gray-200
        transition-all duration-300 cursor-pointer overflow-hidden flex flex-col
        hover:-translate-y-1
        hover:shadow-md
      "
        >
            {/* ── Top accent bar ─────────────────────────────────────── */}
            <div className="holo-bar" />

            {/* ── Availability indicator (top-right corner) ─────────────── */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className={`text-[9px] font-semibold uppercase tracking-widest ${isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                    {isAvailable ? 'AVAILABLE' : 'BOOKED'}
                </span>
            </div>

            {/* ── Vehicle Type Icon (top-left) ────────────────────────── */}
            <div className="absolute top-3 left-3 z-10 text-lg">
                {vehicleTypeIcon[type] || '🚗'}
            </div>

            {/* ── Vehicle Image ──────────────────────────────────────── */}
            <div className="relative h-44 flex items-center justify-center p-4 mt-2">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="
              h-full w-full object-contain
              transition-transform duration-500 group-hover:scale-105
            "
                    />
                ) : (
                    /* Placeholder with vehicle icon when no image */
                    <div className="
            w-32 h-32 rounded-full bg-slate-50 border border-gray-200
            flex items-center justify-center text-5xl
            transition-transform duration-500 group-hover:scale-105
          ">
                        {vehicleTypeIcon[type] || '🚗'}
                    </div>
                )}
            </div>

            {/* ── Card Body ────────────────────────────────────────────── */}
            <div className="relative z-10 flex flex-col flex-grow px-5 pb-6 pt-2">

                {/* Vehicle Name */}
                <h3 className="
          text-slate-900 font-semibold text-base
          leading-tight mb-1 group-hover:text-emerald-600 transition-colors duration-300
        ">
                    {name}
                </h3>

                {/* Brand & Location */}
                <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                    <span>{brand} {model}</span>
                    {location?.city && (
                        <>
                            <span>•</span>
                            <span>📍 {location.city}</span>
                        </>
                    )}
                </div>

                {/* ── Vehicle Specs Grid ──────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3 mb-4 border-t border-gray-100 pt-3">
                    <div className="flex flex-col gap-0.5">
                        <span className="hud-label">Seats</span>
                        <span className="hud-value">{seats}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="hud-label">Fuel</span>
                        <span className="hud-value text-xs">{fuelType}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="hud-label">{fuelType === 'ELECTRIC' ? 'Range' : 'Mileage'}</span>
                        <span className="hud-value">{mileage} <span className="text-slate-400 text-xs">{fuelType === 'ELECTRIC' ? 'km' : 'km/l'}</span></span>
                    </div>
                </div>

                {/* ── Rating ───────────────────────────────────────────── */}
                <div className="flex items-center gap-1.5 mb-4">
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                className={`text-xs ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                    <span className="text-slate-400 text-xs">({numReviews})</span>
                </div>

                {/* ── Price & Action ────────────────────────────────────── */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <span className="hud-label">Price</span>
                        <span className="text-emerald-600 font-bold text-lg">
                            ₹{pricePerDay}
                            <span className="text-slate-400 text-xs font-normal ml-1">/day</span>
                        </span>
                    </div>

                    {/* Book button */}
                    <button
                        onClick={handleLease}
                        disabled={!isAvailable}
                        className="
              bg-emerald-600 text-white font-semibold text-xs uppercase tracking-wide
              px-4 py-2 rounded-lg
              transition-all duration-200
              hover:bg-emerald-700 hover:shadow-md
              active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600
              opacity-0 translate-y-2
              group-hover:opacity-100 group-hover:translate-y-0
            "
                    >
                        {isAvailable ? '🚀 Book Now' : 'Booked'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingGearCard;
