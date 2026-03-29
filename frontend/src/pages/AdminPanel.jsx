import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminStats, getAllUsers, toggleBlockUser, verifyUser, getAllListings, verifyListing, getAllBookings, getAllPayments } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [payments, setPayments] = useState([]);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) navigate('/');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user && user.role === 'admin') fetchOverview();
    }, [user]);

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const { data } = await getAdminStats();
            setStats(data.data);
        } catch (err) { toast.error("Failed to fetch admin stats"); }
        finally { setLoading(false); }
    };

    const loadUsers = async () => {
        setLoading(true);
        try { const { data } = await getAllUsers(); setUsers(data.data); } catch (err) { toast.error("Failed to load users"); } finally { setLoading(false); }
    };

    const loadListings = async () => {
        setLoading(true);
        try { const { data } = await getAllListings(); setListings(data.data); } catch (err) { toast.error("Failed to load listings"); } finally { setLoading(false); }
    };

    const loadBookings = async () => {
        setLoading(true);
        try { const { data } = await getAllBookings(); setBookings(data.data); } catch (err) { toast.error("Failed to load bookings"); } finally { setLoading(false); }
    };

    const loadPayments = async () => {
        setLoading(true);
        try { const { data } = await getAllPayments(); setPayments(data.data); } catch (err) { toast.error("Failed to load payments"); } finally { setLoading(false); }
    };

    useEffect(() => {
        if (activeTab === 'users') loadUsers();
        else if (activeTab === 'listings') loadListings();
        else if (activeTab === 'bookings') loadBookings();
        else if (activeTab === 'payments') loadPayments();
        else if (activeTab === 'overview') fetchOverview();
    }, [activeTab]);

    // Handlers
    const handleBlockUser = async (id) => {
        try { await toggleBlockUser(id); loadUsers(); toast.success('User updated'); } catch (err) { toast.error('Failed to change block status'); }
    };
    const handleVerifyUser = async (id) => {
        try { await verifyUser(id); loadUsers(); toast.success('User verification updated'); } catch (err) { toast.error('Failed to update verification'); }
    };
    const handleVerifyListing = async (id, status) => {
        try { await verifyListing(id, status); loadListings(); toast.success(`Listing ${status.toLowerCase()}`); } catch (err) { toast.error('Failed to verify listing'); }
    };

    if (authLoading || !user) return null;

    const TABS = [
        { key: 'overview', label: 'Overview' },
        { key: 'users', label: 'Users' },
        { key: 'listings', label: 'Vehicles' },
        { key: 'bookings', label: 'Bookings' },
        { key: 'payments', label: 'Payments' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <p className="text-blue-600 font-semibold text-xs tracking-widest uppercase mb-1">System Administration</p>
                    <h1 className="font-bold text-3xl text-slate-900">Admin Control Panel</h1>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-2">
                    {TABS.map(({ key, label }) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`px-4 py-2 font-semibold text-sm rounded-lg transition-colors ${activeTab === key ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="p-10 text-center text-blue-600 font-semibold animate-pulse">Loading data...</div>
                ) : (
                    <>
                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && stats && (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                                    {[
                                        { label: 'Total Users', value: stats.totalUsers },
                                        { label: 'Total Listings', value: stats.totalListings },
                                        { label: 'Total Bookings', value: stats.totalBookings },
                                        { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}` },
                                        { label: 'Pending Users', value: stats.pendingUsers, alert: true },
                                        { label: 'Pending Vehicles', value: stats.pendingListings, alert: true },
                                    ].map((s, i) => (
                                        <div key={i} className={`bg-white rounded-xl shadow-sm border p-6 ${s.alert && s.value > 0 ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
                                            <p className="text-sm font-semibold text-slate-500 mb-1">{s.label}</p>
                                            <p className={`text-3xl font-bold ${s.alert && s.value > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{s.value}</p>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="font-semibold text-slate-800 mb-6">Platform Activity Overview</h3>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Users', count: stats.totalUsers },
                                                { name: 'Listings', count: stats.totalListings },
                                                { name: 'Bookings', count: stats.totalBookings },
                                            ]}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 13 }} />
                                                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={60} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* USERS TAB */}
                        {activeTab === 'users' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                                            <th className="p-4 border-b">User</th>
                                            <th className="p-4 border-b">Role</th>
                                            <th className="p-4 border-b">Verified</th>
                                            <th className="p-4 border-b">Status</th>
                                            <th className="p-4 border-b text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {users.map(u => (
                                            <tr key={u._id} className="border-b last:border-0 hover:bg-slate-50">
                                                <td className="p-4"><p className="font-semibold text-slate-800">{u.username}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                                                <td className="p-4"><span className="uppercase text-[10px] font-bold tracking-wider px-2 py-1 rounded-md bg-blue-50 text-blue-700">{u.role}</span></td>
                                                <td className="p-4">{u.isVerified ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-slate-400">No</span>}</td>
                                                <td className="p-4">{u.isBlocked ? <span className="text-red-600 font-bold">Blocked</span> : <span className="text-green-600 font-bold">Active</span>}</td>
                                                <td className="p-4 text-right flex flex-col gap-1 items-end">
                                                    {u.role !== 'admin' && (
                                                        <>
                                                            <button onClick={() => handleVerifyUser(u._id)} className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">
                                                                {u.isVerified ? 'Unverify' : 'Verify'}
                                                            </button>
                                                            <button onClick={() => handleBlockUser(u._id)} className={`text-xs font-semibold px-2 py-1 rounded ${u.isBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                                                                {u.isBlocked ? 'Unblock' : 'Block'}
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* LISTINGS (VEHICLES) TAB */}
                        {activeTab === 'listings' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                                            <th className="p-4 border-b">Vehicle</th>
                                            <th className="p-4 border-b">Owner</th>
                                            <th className="p-4 border-b">Status</th>
                                            <th className="p-4 border-b text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {listings.map(l => (
                                            <tr key={l._id} className="border-b last:border-0 hover:bg-slate-50">
                                                <td className="p-4"><p className="font-semibold text-slate-800">{l.name}</p><p className="text-xs text-slate-500">{l.type} - ₹{l.pricePerDay}/day</p></td>
                                                <td className="p-4">{l.owner?.username || 'Unknown'}</td>
                                                <td className="p-4">
                                                    <span className={`uppercase text-[10px] font-bold tracking-wider px-2 py-1 rounded-md ${
                                                        l.verificationStatus === 'APPROVED' ? 'bg-green-50 text-green-700' :
                                                        l.verificationStatus === 'REJECTED' ? 'bg-red-50 text-red-700' :
                                                        'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {l.verificationStatus}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right flex gap-2 justify-end">
                                                    {l.verificationStatus !== 'APPROVED' && (
                                                        <button onClick={() => handleVerifyListing(l._id, 'APPROVED')} className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200">Approve</button>
                                                    )}
                                                    {l.verificationStatus !== 'REJECTED' && (
                                                        <button onClick={() => handleVerifyListing(l._id, 'REJECTED')} className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Reject</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* BOOKINGS TAB */}
                        {activeTab === 'bookings' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                                            <th className="p-4 border-b">ID / Date</th>
                                            <th className="p-4 border-b">Vehicle</th>
                                            <th className="p-4 border-b">Renter</th>
                                            <th className="p-4 border-b">Total</th>
                                            <th className="p-4 border-b">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {bookings.map(b => (
                                            <tr key={b._id} className="border-b last:border-0 hover:bg-slate-50">
                                                <td className="p-4"><p className="font-mono text-xs">{b._id}</p><p className="text-xs text-slate-500">{format(new Date(b.createdAt), 'dd MMM yyyy')}</p></td>
                                                <td className="p-4">{b.listing?.name || 'N/A'}</td>
                                                <td className="p-4">{b.renter?.username || 'N/A'}</td>
                                                <td className="p-4 font-semibold text-blue-600">₹{b.totalCost}</td>
                                                <td className="p-4"><span className="uppercase text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100">{b.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* PAYMENTS TAB */}
                        {activeTab === 'payments' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                                            <th className="p-4 border-b">TXN ID</th>
                                            <th className="p-4 border-b">Type / Booking</th>
                                            <th className="p-4 border-b">User</th>
                                            <th className="p-4 border-b">Amount</th>
                                            <th className="p-4 border-b">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {payments.map(p => (
                                            <tr key={p._id} className="border-b last:border-0 hover:bg-slate-50">
                                                <td className="p-4"><p className="font-mono text-xs font-bold text-slate-700">{p.transactionId}</p><p className="text-[10px] text-slate-500">{format(new Date(p.createdAt), 'dd MMM yyyy HH:mm')}</p></td>
                                                <td className="p-4"><p className="font-bold text-slate-800">{p.type}</p><p className="font-mono text-[10px] text-slate-400">{p.booking?._id}</p></td>
                                                <td className="p-4">{p.user?.username || 'N/A'}</td>
                                                <td className="p-4 font-semibold text-blue-600">₹{p.amount}</td>
                                                <td className="p-4"><span className="uppercase text-[10px] font-bold px-2 py-1 rounded-md bg-green-50 text-green-700">{p.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
