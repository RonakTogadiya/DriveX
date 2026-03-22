import React from 'react';

// Clearance badge color mapping
const clearanceBadgeClass = {
    CIVILIAN: 'badge-civilian',
    PILOT: 'badge-pilot',
    COMMANDER: 'badge-commander',
    ADMIN: 'badge-admin',
};

// Gear type icon mapping (emoji as fallback — swap with SVG icons in production)
const gearTypeIcon = {
    HOVERBOARD: '🛹',
    GRAVITY_SUIT: '🦾',
    JETPACK: '🚀',
    REPULSOR_BOOTS: '👢',
};

/**
 * FloatingGearCard
 * Animated listing card component using the Antigravity design system.
 *
 * Props:
 *  - gear: Listing object from the API (see Listing model)
 *  - onLease: Callback fn when "Initiate Lease" is clicked
 */
const FloatingGearCard = ({ gear, onLease }) => {
    const {
        name = 'Unknown Gear',
        type = 'HOVERBOARD',
        pricePerCycle = 0,
        thrustPower = 0,
        batteryLife = 0,
        requiredClearance = 'CIVILIAN',
        imageUrl,
        averageRating = 0,
        numReviews = 0,
        isAvailable = true,
    } = gear || {};

    const handleLease = (e) => {
        e.preventDefault();
        if (onLease) onLease(gear);
    };

    return (
        <div
            className="
        group relative w-full bg-matte rounded-2xl border border-gray-800
        transition-all duration-500 cursor-pointer overflow-hidden flex flex-col
        hover:-translate-y-3
        hover:border-neon/40
        hover:shadow-[0_0_30px_rgba(0,240,255,0.25),0_20px_40px_rgba(0,0,0,0.6)]
      "
        >
            {/* ── Holographic top bar ───────────────────────────────────── */}
            <div className="holo-bar" />

            {/* ── Availability indicator (top-right corner) ─────────────── */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400 animate-pulse' : 'bg-laser'}`} />
                <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isAvailable ? 'text-green-400' : 'text-laser'}`}>
                    {isAvailable ? 'AVAILABLE' : 'DEPLOYED'}
                </span>
            </div>

            {/* ── Gear Type Icon (top-left) ─────────────────────────────── */}
            <div className="absolute top-3 left-3 z-10 text-lg">
                {gearTypeIcon[type] || '⚙️'}
            </div>

            {/* ── Background gradient hover overlay ────────────────────── */}
            <div className="
        absolute inset-0 bg-gradient-to-b from-nebula/10 to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl
      " />

            {/* ── Gear Image ───────────────────────────────────────────── */}
            <div className="relative h-44 flex items-center justify-center p-4 mt-2">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="
              h-full w-full object-contain
              transition-transform duration-700 group-hover:scale-110
              group-hover:drop-shadow-[0_0_20px_rgba(0,240,255,0.6)]
              animate-float-slow
            "
                    />
                ) : (
                    /* Placeholder with gear icon when no image */
                    <div className="
            w-32 h-32 rounded-full bg-surface border border-gray-700
            flex items-center justify-center text-5xl
            transition-transform duration-700 group-hover:scale-110
            group-hover:shadow-neon-md animate-float-slow
          ">
                        {gearTypeIcon[type] || '⚙️'}
                    </div>
                )}
            </div>

            {/* ── Card Body ────────────────────────────────────────────── */}
            <div className="relative z-10 flex flex-col flex-grow px-5 pb-6 pt-2">

                {/* Gear Name */}
                <h3 className="
          text-starlight font-orbitron font-bold text-base uppercase tracking-wider
          leading-tight mb-1 group-hover:text-neon transition-colors duration-300
        ">
                    {name}
                </h3>

                {/* Clearance badge */}
                <div className="mb-3">
                    <span className={`clearance-badge ${clearanceBadgeClass[requiredClearance] || ''}`}>
                        ◈ {requiredClearance}
                    </span>
                </div>

                {/* ── Tech Specs Grid ───────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3 mb-4 border-t border-gray-800 pt-3">
                    <div className="flex flex-col gap-0.5">
                        <span className="hud-label">Thrust</span>
                        <span className="hud-value">{thrustPower} <span className="text-neon text-xs">kN</span></span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="hud-label">Battery</span>
                        <span className="hud-value">{batteryLife} <span className="text-neon text-xs">hrs</span></span>
                    </div>
                </div>

                {/* ── Rating ───────────────────────────────────────────── */}
                <div className="flex items-center gap-1.5 mb-4">
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                className={`text-xs ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-700'}`}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                    <span className="text-dim text-xs font-mono">({numReviews})</span>
                </div>

                {/* ── Price & Action ────────────────────────────────────── */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <span className="hud-label">Price</span>
                        <span className="text-neon font-orbitron font-bold text-lg">
                            {pricePerCycle}
                            <span className="text-dim text-xs font-mono ml-1">credits/cycle</span>
                        </span>
                    </div>

                    {/* Lease button — slides up on hover */}
                    <button
                        onClick={handleLease}
                        disabled={!isAvailable}
                        className="
              relative overflow-hidden
              bg-gradient-to-r from-neon to-nebula
              text-void font-orbitron font-bold text-xs uppercase tracking-widest
              px-4 py-2 rounded-full
              transition-all duration-300
              hover:shadow-neon-md hover:scale-105
              active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
              opacity-0 translate-y-2
              group-hover:opacity-100 group-hover:translate-y-0
            "
                    >
                        {isAvailable ? '⚡ Initiate Lease' : 'Deployed'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingGearCard;
