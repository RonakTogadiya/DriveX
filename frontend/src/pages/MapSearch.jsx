import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useMapSearch from '../hooks/useMapSearch';

// ── Fix Leaflet default icon (broken by Vite bundling) ───────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TYPE_ICONS = { CAR: '🚗', BIKE: '🏍️', SUV: '🚙', TRUCK: '🚛', VAN: '🚌', SCOOTER: '🛵' };

// Custom map marker for each vehicle type
const vehicleIcon = (type) => L.divIcon({
    className: '',
    html: `
    <div style="
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #00F0FF, #7A04EB);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid rgba(0,240,255,0.6);
      box-shadow: 0 0 12px rgba(0,240,255,0.8);
      display:flex; align-items:center; justify-content:center;
    ">
      <span style="transform:rotate(45deg); font-size:14px;">
        ${TYPE_ICONS[type] || '🚗'}
      </span>
    </div>
  `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
});

// Click handler (must be inside MapContainer)
const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({ click: (e) => onMapClick(e.latlng) });
    return null;
};

const RADIUS_OPTIONS = [10, 25, 50, 100, 200];

const MapSearch = () => {
    const navigate = useNavigate();
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);

    const { listings, center, setCenter, radius, setRadius, loading, error } = useMapSearch();

    const handleMapClick = useCallback(({ lat, lng }) => {
        setCenter([lat, lng]);
    }, [setCenter]);

    return (
        <div className="min-h-screen bg-void pt-16 flex flex-col">

            {/* ── Top bar ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 bg-matte border-b border-gray-800 z-10 relative">
                <div>
                    <p className="text-neon font-mono text-[10px] uppercase tracking-[0.3em]">◈ DriveLink</p>
                    <h1 className="font-orbitron font-bold text-lg text-starlight uppercase leading-tight">Map Vehicle Search</h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="hud-label hidden sm:block">Radius</span>
                        <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}
                            className="bg-surface border border-gray-700 text-neon text-xs font-mono px-3 py-1.5 rounded-lg focus:outline-none focus:border-neon">
                            {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r} km</option>)}
                        </select>
                    </div>
                    <button onClick={() => setShowSidebar((v) => !v)} className="btn-ghost text-xs px-4 py-1.5">
                        {showSidebar ? '◀ Hide' : '▶ List'}
                    </button>
                </div>
            </div>

            {/* ── Main layout ──────────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Map ────────────────────────────────────────────────────── */}
                <div className="flex-1 relative">
                    {loading && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-void/60 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-neon/30 border-t-neon rounded-full animate-spin" />
                                <span className="text-neon font-mono text-xs uppercase tracking-widest animate-pulse">Searching area...</span>
                            </div>
                        </div>
                    )}

                    <MapContainer center={center} zoom={10} className="w-full h-full"
                        style={{ background: '#0B0C10' }} key={center.join(',')}>
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        />
                        <MapClickHandler onMapClick={handleMapClick} />
                        <Circle center={center} radius={radius * 1000}
                            pathOptions={{ color: '#00F0FF', fillColor: '#00F0FF', fillOpacity: 0.04, weight: 1, dashArray: '6,6' }} />

                        {listings.map((vehicle) => {
                            const coords = vehicle.location?.coordinates?.coordinates;
                            if (!coords || (coords[0] === 0 && coords[1] === 0)) return null;
                            const [lng, lat] = coords;
                            return (
                                <Marker key={vehicle._id} position={[lat, lng]}
                                    icon={vehicleIcon(vehicle.type)}
                                    eventHandlers={{ click: () => setSelectedVehicle(vehicle) }}>
                                    <Popup>
                                        <div className="bg-matte border border-gray-700 rounded-xl p-3 min-w-[180px]">
                                            <p className="text-starlight font-orbitron font-bold text-sm uppercase leading-tight mb-1">{vehicle.name}</p>
                                            <p className="text-dim text-xs font-mono">{vehicle.brand} {vehicle.model} · {vehicle.year}</p>
                                            <p className="text-neon font-mono text-sm font-bold mt-1">₹{vehicle.pricePerDay}<span className="text-dim text-xs">/day</span></p>
                                            <button onClick={() => navigate(`/listings/${vehicle._id}`)}
                                                className="mt-2 w-full bg-gradient-to-r from-neon to-nebula text-void
                                   font-orbitron font-bold text-[10px] uppercase tracking-wider
                                   py-1.5 rounded-lg hover:shadow-neon-sm transition-all">
                                                View & Book
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10
                bg-void/80 backdrop-blur-sm border border-gray-700 rounded-full
                px-4 py-2 text-dim text-[10px] font-mono uppercase tracking-widest">
                        Click map to search a new area · {listings.length} vehicle{listings.length !== 1 ? 's' : ''} found
                    </div>
                </div>

                {/* ── Side Panel ──────────────────────────────────────────────── */}
                {showSidebar && (
                    <div className="w-80 bg-matte border-l border-gray-800 overflow-y-auto flex-shrink-0 hidden md:flex flex-col">
                        <div className="p-3 border-b border-gray-800">
                            <p className="hud-label">{listings.length} vehicle{listings.length !== 1 ? 's' : ''} nearby</p>
                        </div>
                        {error && <div className="p-4 text-laser text-xs font-mono text-center">{error}</div>}

                        <div className="p-3 flex flex-col gap-3">
                            {listings.map((vehicle) => (
                                <div key={vehicle._id}
                                    className={`cursor-pointer rounded-xl border p-3 transition-all duration-200
                    ${selectedVehicle?._id === vehicle._id
                                            ? 'border-neon bg-neon/5 shadow-neon-sm'
                                            : 'border-gray-800 bg-surface hover:border-gray-600'}`}
                                    onClick={() => setSelectedVehicle(vehicle)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-matte rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                                            {vehicle.imageUrl
                                                ? <img src={vehicle.imageUrl} alt="" className="w-full h-full object-contain rounded-lg p-0.5" />
                                                : TYPE_ICONS[vehicle.type] || '🚗'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-starlight text-xs font-mono font-bold truncate">{vehicle.name}</p>
                                            <p className="text-dim text-[10px]">{vehicle.brand} · {vehicle.fuelType}</p>
                                            <p className="text-neon text-xs font-orbitron font-bold">₹{vehicle.pricePerDay}<span className="text-dim text-[9px]">/day</span></p>
                                        </div>
                                    </div>
                                    {selectedVehicle?._id === vehicle._id && (
                                        <button onClick={() => navigate(`/listings/${vehicle._id}`)}
                                            className="mt-2 w-full text-center text-void bg-gradient-to-r from-neon to-nebula
                                 font-orbitron font-bold text-[10px] uppercase tracking-wider
                                 py-1.5 rounded-lg hover:shadow-neon-sm transition-all">
                                            🚗 View & Book
                                        </button>
                                    )}
                                </div>
                            ))}

                            {!loading && listings.length === 0 && (
                                <div className="text-center py-8 text-dim text-xs font-mono">
                                    No vehicles in this area.<br />
                                    <span className="text-dim/60">Click elsewhere on the map to search.</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapSearch;
