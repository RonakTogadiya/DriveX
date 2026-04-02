import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import VehicleCard from '../components/VehicleCard';
import { Link } from 'react-router-dom';

const WishlistPage = () => {
    const { user, token } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                // Ensure auth token is set if not already handled perfectly by context
                if (token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }
                const { data } = await axios.get('/users/wishlist');
                if (data.success) {
                    setWishlist(data.data);
                }
            } catch (err) {
                setError('Failed to load wishlist. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchWishlist();
        } else {
            setLoading(false);
        }
    }, [user, token]);

    // Keep the local state in sync if a user un-hearts directly from the wishlist page
    useEffect(() => {
        if (user?.wishlist) {
            setWishlist(prev => prev.filter(item => 
                user.wishlist.some(id => 
                    id === item._id || (typeof id === 'object' && id._id === item._id)
                )
            ));
        }
    }, [user?.wishlist]);

    if (loading) {
        return (
            <div className="min-h-screen pt-24 px-4 pb-12 bg-slate-50 flex justify-center">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mt-20"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 px-4 pb-12 bg-slate-50">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 leading-tight">My Wishlist</h1>
                    <p className="text-slate-500 mt-2 text-sm">{wishlist.length} saved vehicles</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm mb-6">
                        {error}
                    </div>
                )}

                {wishlist.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="text-6xl mb-4">🤍</div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Your wishlist is empty</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                            Save vehicles you love by clicking the heart icon on any vehicle card, so you can easily find them later.
                        </p>
                        <Link 
                            to="/listings" 
                            className="inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 text-white font-medium text-sm rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                            Browse Vehicles
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {wishlist.map(listing => (
                            <VehicleCard key={listing._id} listing={listing} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;
