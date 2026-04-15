import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getListings } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import Footer from '../components/Footer';

const VEHICLE_TYPES = ['CAR', 'BIKE', 'SUV', 'TRUCK', 'VAN', 'SCOOTER'];
const FUEL_TYPES = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG'];
const SORT_OPTIONS = [
    { value: 'pricePerDay', label: 'Price' },
    { value: 'year', label: 'Year' },
    { value: 'createdAt', label: 'Newest' },
];

const SearchResults = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);

    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const fuelType = searchParams.get('fuelType') || '';
    const sort = searchParams.get('sort') || 'pricePerDay';
    const order = searchParams.get('order') || 'asc';
    const page = Number(searchParams.get('page') || 1);

    const setParam = (key, val) => {
        const p = new URLSearchParams(searchParams);
        if (val) p.set(key, val); else p.delete(key);
        if (key !== 'page') p.delete('page');
        setSearchParams(p);
    };

    useEffect(() => {
        const fetchListings = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await getListings({ search, type, fuelType, sort, order, page, limit: 8 });
                setListings(data.data || []);
                setTotal(data.total || 0);
                setPages(data.pages || 1);
            } catch (err) {
                setError(err?.response?.data?.message || 'Could not connect to server. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, [search, type, fuelType, sort, order, page]);

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
            <div className="max-w-7xl mx-auto">

                {/* ── Hero ──────────────────────────────────────────────── */}
                <div className="text-center mb-10">
                    <p className="text-emerald-600 text-xs font-semibold uppercase tracking-widest mb-2">DriveLink Marketplace</p>
                    <h1 className="font-bold text-4xl md:text-5xl text-slate-900">
                        Find Your <span className="text-emerald-600">Ride</span>
                    </h1>
                    <p className="text-slate-500 mt-3 text-sm max-w-md mx-auto">
                        Browse premium vehicles. Book in minutes. Drive anywhere.
                    </p>
                </div>

                {/* ── Filters ───────────────────────────────────────────── */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                        <input
                            type="text"
                            placeholder="Search by name, brand, city..."
                            value={search}
                            onChange={(e) => setParam('search', e.target.value)}
                            className="flex-1 min-w-[200px] bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5
                         text-slate-800 text-sm placeholder:text-slate-400
                         focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                        <select value={type} onChange={(e) => setParam('type', e.target.value)}
                            className="bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-slate-600 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
                            <option value="">All Types</option>
                            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select value={fuelType} onChange={(e) => setParam('fuelType', e.target.value)}
                            className="bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-slate-600 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
                            <option value="">All Fuel Types</option>
                            {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <select value={sort} onChange={(e) => setParam('sort', e.target.value)}
                            className="bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-slate-600 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
                            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <button onClick={() => setParam('order', order === 'asc' ? 'desc' : 'asc')}
                            className="bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-slate-600 text-sm hover:border-emerald-400 hover:bg-emerald-50 transition-all">
                            {order === 'asc' ? '↑ Low to High' : '↓ High to Low'}
                        </button>
                    </div>
                </div>

                {/* ── Count ─────────────────────────────────────────────── */}
                <div className="flex justify-between items-center mb-5">
                    <p className="text-slate-500 text-sm">
                        {loading ? 'Searching...' : <><span className="font-semibold text-slate-800">{total}</span> vehicle{total !== 1 ? 's' : ''} found</>}
                    </p>
                    <p className="text-slate-400 text-sm">Page {page} of {pages}</p>
                </div>

                {/* ── Error state ────────────────────────────────────────── */}
                {error && !loading && (
                    <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <div className="text-4xl mb-4">⚠️</div>
                        <p className="font-semibold text-red-500 text-lg">Connection Error</p>
                        <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">{error}</p>
                        <button
                            onClick={() => setSearchParams(new URLSearchParams())}
                            className="mt-6 px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* ── Skeleton Grid ─────────────────────────────────────── */}
                {loading && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
                                <div className="h-44 bg-slate-100" />
                                <div className="p-4 space-y-2">
                                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Empty state ────────────────────────────────────────── */}
                {!loading && !error && listings.length === 0 && (
                    <div className="text-center py-24 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <div className="text-5xl mb-4">🚗</div>
                        <p className="font-semibold text-slate-800 text-lg">No vehicles found</p>
                        <p className="text-slate-500 text-sm mt-2">Try adjusting your filters or search term.</p>
                    </div>
                )}

                {/* ── Grid ──────────────────────────────────────────────── */}
                {!loading && !error && listings.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {listings.map((listing) => (
                            <VehicleCard key={listing._id} listing={listing} />
                        ))}
                    </div>
                )}

                {/* ── Pagination ────────────────────────────────────────── */}
                {pages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-10">
                        <button disabled={page <= 1} onClick={() => setParam('page', page - 1)}
                            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-slate-600 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-40 transition-colors">
                            ← Prev
                        </button>
                        <span className="text-slate-500 text-sm px-4">{page} / {pages}</span>
                        <button disabled={page >= pages} onClick={() => setParam('page', page + 1)}
                            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-slate-600 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-40 transition-colors">
                            Next →
                        </button>
                    </div>
                )}
            </div>
            
            {/* Added Footer directly to the end of Explore Vehicles page as requested */}
            <div className="mt-16 -mx-4 -mb-16">
                <Footer />
            </div>
        </div>
    );
};

export default SearchResults;
