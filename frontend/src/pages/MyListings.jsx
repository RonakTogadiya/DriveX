import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getListings, deleteListing } from '../services/api';
import toast from 'react-hot-toast';

const typeIcon = { CAR: '🚗', BIKE: '🏍️', SUV: '🚙', TRUCK: '🚛', VAN: '🚌', SCOOTER: '🛵' };

const MyListings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        const fetch = async () => {
            setLoading(true);
            try {
                const { data } = await getListings({ limit: 100 });
                const mine = (data.data || []).filter(l => l.owner?._id === user._id || l.owner === user._id);
                setListings(mine);
            } catch { toast.error('Failed to load listings'); }
            finally { setLoading(false); }
        };
        fetch();
    }, [user]);

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this vehicle from the marketplace?')) return;
        setDeletingId(id);
        try {
            await deleteListing(id);
            setListings(p => p.filter(l => l._id !== id));
            toast.success('Listing removed');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        } finally { setDeletingId(null); }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <p className="text-emerald-600 text-xs font-semibold uppercase tracking-widest mb-1">Owner Dashboard</p>
                        <h1 className="font-bold text-2xl text-slate-900">My Vehicles</h1>
                    </div>
                    <button onClick={() => navigate('/listings/new')}
                        className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                        + List New Vehicle
                    </button>
                </div>

                {loading && <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-gray-200 rounded-2xl animate-pulse" />)}</div>}

                {!loading && listings.length === 0 && (
                    <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <div className="text-5xl mb-4">🚗</div>
                        <p className="text-slate-800 font-semibold mb-2">No vehicles listed</p>
                        <p className="text-slate-500 text-sm mb-6">Start earning by listing your first vehicle.</p>
                        <button onClick={() => navigate('/listings/new')}
                            className="bg-emerald-600 text-white text-sm font-semibold px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                            List First Vehicle
                        </button>
                    </div>
                )}

                {!loading && listings.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="hidden md:grid grid-cols-[64px_1fr_80px_80px_100px_100px_120px] gap-4 px-5 py-3 border-b border-gray-100">
                            {['', 'Vehicle', 'Type', 'City', 'Price/Day', 'Status', 'Actions'].map(h => (
                                <span key={h} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</span>
                            ))}
                        </div>
                        {listings.map((l, idx) => (
                            <div key={l._id}
                                className={`grid grid-cols-1 md:grid-cols-[64px_1fr_80px_80px_100px_100px_120px] gap-4 px-5 py-4 items-center
                  ${idx % 2 === 0 ? '' : 'bg-slate-50/50'} hover:bg-emerald-50/40 transition-colors`}>
                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                                    {l.imageUrl
                                        ? <img src={l.imageUrl} alt="" className="w-full h-full object-contain rounded-xl p-1" />
                                        : <span className="text-2xl">{typeIcon[l.type] || '🚗'}</span>}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-slate-800 text-sm font-semibold truncate">{l.name}</p>
                                    <p className="text-slate-400 text-xs">{l.brand} {l.model} · {l.year}</p>
                                </div>
                                <span className="text-slate-500 text-sm hidden md:block">{l.type}</span>
                                <span className="text-slate-500 text-sm hidden md:block truncate">{l.location?.city || '—'}</span>
                                <span className="text-emerald-600 font-bold text-sm">₹{l.pricePerDay}<span className="text-slate-400 text-xs">/day</span></span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${l.isAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
                                    <span className="text-sm text-slate-500">{l.isAvailable ? 'Available' : 'Booked'}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => navigate(`/listings/edit/${l._id}`)}
                                        className="flex-1 text-center text-emerald-600 border border-emerald-200 text-xs font-semibold py-1.5 rounded-lg hover:bg-emerald-50 transition-colors">
                                        ✏️ Edit
                                    </button>
                                    <button onClick={() => handleDelete(l._id)} disabled={deletingId === l._id}
                                        className="flex-1 text-center text-red-500 border border-red-200 text-xs font-semibold py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40">
                                        {deletingId === l._id ? '...' : '🗑'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyListings;
