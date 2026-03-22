import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
    Chart as ChartJS,
    ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale, BarElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Themed chart defaults
const CHART_DEFAULTS = {
    plugins: { legend: { labels: { color: '#E0E6ED', font: { family: 'Roboto Mono', size: 10 } } } },
};

/**
 * AdminPanel — Full platform overview for admin role
 * Fetches aggregate stats and displays them with charts.
 */
const AdminPanel = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            navigate('/dashboard');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (!user || user.role !== 'admin') return;
        const fetchAll = async () => {
            try {
                const [listingsRes, bookingsRes, usersRes] = await Promise.all([
                    axios.get(`${API_URL}/listings?limit=100`),
                    axios.get(`${API_URL}/bookings/my-bookings`), // admin can see all (extend backend)
                    axios.get(`${API_URL}/users`),
                ]);

                const listings = listingsRes.data.data || [];
                const bookingsData = bookingsRes.data.data || [];
                const usersData = usersRes.data.data || [];

                setUsers(usersData);
                setStats({
                    totalListings: listingsRes.data.total || listings.length,
                    totalUsers: usersData.length,
                    totalBookings: bookingsData.length,
                    totalRevenue: bookingsData.reduce((s, b) => s + (b.totalCost || 0), 0),
                    listingsByType: listings.reduce((acc, l) => {
                        acc[l.type] = (acc[l.type] || 0) + 1;
                        return acc;
                    }, {}),
                    bookingsByStatus: bookingsData.reduce((acc, b) => {
                        acc[b.status] = (acc[b.status] || 0) + 1;
                        return acc;
                    }, {}),
                    usersByRole: usersData.reduce((acc, u) => {
                        acc[u.role] = (acc[u.role] || 0) + 1;
                        return acc;
                    }, {}),
                });
            } catch {
                // Stats will be null — show blank state with mock data for UI demo
                setStats({
                    totalListings: 0, totalUsers: 0, totalBookings: 0, totalRevenue: 0,
                    listingsByType: {}, bookingsByStatus: {}, usersByRole: {}
                });
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [user]);

    if (authLoading || !user) return null;

    const TABS = [
        { key: 'overview', label: '📊 Overview' },
        { key: 'users', label: '👥 Users' },
    ];

    return (
        <div className="min-h-screen bg-void pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <p className="text-laser font-mono text-xs uppercase tracking-[0.3em] mb-1">◈ Admin Access</p>
                    <h1 className="font-orbitron font-bold text-3xl text-starlight uppercase">
                        Command Center
                    </h1>
                    <p className="text-dim text-sm font-mono mt-1">Platform-wide operations and analytics</p>
                </div>

                {/* ── Stat Cards ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Listings', value: stats?.totalListings ?? '—', icon: '🛹', color: 'text-neon' },
                        { label: 'Operators', value: stats?.totalUsers ?? '—', icon: '👥', color: 'text-nebula' },
                        { label: 'Total Leases', value: stats?.totalBookings ?? '—', icon: '📋', color: 'text-yellow-400' },
                        { label: 'Revenue (credits)', value: stats?.totalRevenue ?? '—', icon: '💳', color: 'text-green-400' },
                    ].map(({ label, value, icon, color }) => (
                        <div key={label} className="card-hud p-4">
                            <div className="holo-bar" />
                            <div className="flex justify-between items-start mb-2">
                                <span className="hud-label">{label}</span>
                                <span className="text-xl">{icon}</span>
                            </div>
                            <span className={`${color} font-orbitron font-black text-2xl`}>
                                {loading ? <span className="skeleton inline-block w-12 h-6 rounded" /> : value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── Tabs ────────────────────────────────────────────────── */}
                <div className="flex gap-1 bg-surface border border-gray-800 rounded-xl p-1 mb-6 w-fit">
                    {TABS.map(({ key, label }) => (
                        <button
                            key={key} onClick={() => setActiveTab(key)}
                            className={`px-5 py-2 text-xs font-orbitron font-bold uppercase tracking-wider rounded-lg transition-all duration-200
                ${activeTab === key ? 'bg-laser text-void shadow-[0_0_12px_rgba(255,0,60,0.3)]' : 'text-dim hover:text-starlight'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Overview Tab ────────────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <div className="grid md:grid-cols-3 gap-6">

                        {/* Listings by type — Doughnut */}
                        <div className="bg-matte border border-gray-800 rounded-2xl p-5 relative">
                            <div className="holo-bar" />
                            <h3 className="hud-label mb-4">Listings by Type</h3>
                            {stats && Object.keys(stats.listingsByType).length > 0 ? (
                                <Doughnut
                                    data={{
                                        labels: Object.keys(stats.listingsByType),
                                        datasets: [{
                                            data: Object.values(stats.listingsByType),
                                            backgroundColor: ['#00F0FF', '#7A04EB', '#FF003C', '#F59E0B'],
                                            borderColor: '#121212',
                                            borderWidth: 3,
                                        }],
                                    }}
                                    options={{ ...CHART_DEFAULTS, cutout: '65%' }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-40 text-dim text-xs font-mono">No data yet</div>
                            )}
                        </div>

                        {/* Bookings by status — Bar */}
                        <div className="bg-matte border border-gray-800 rounded-2xl p-5 relative md:col-span-2">
                            <div className="holo-bar" />
                            <h3 className="hud-label mb-4">Lease Status Breakdown</h3>
                            {stats && Object.keys(stats.bookingsByStatus).length > 0 ? (
                                <Bar
                                    data={{
                                        labels: Object.keys(stats.bookingsByStatus).map((s) => s.replace('_', ' ')),
                                        datasets: [{
                                            label: 'Leases',
                                            data: Object.values(stats.bookingsByStatus),
                                            backgroundColor: ['#00F0FF88', '#7A04EB88', '#10b98188', '#FF003C88', '#F59E0B88'],
                                            borderColor: ['#00F0FF', '#7A04EB', '#10b981', '#FF003C', '#F59E0B'],
                                            borderWidth: 2,
                                            borderRadius: 8,
                                        }],
                                    }}
                                    options={{
                                        ...CHART_DEFAULTS,
                                        scales: {
                                            x: { ticks: { color: '#6B7280', font: { size: 9, family: 'Roboto Mono' } }, grid: { color: '#1f2937' } },
                                            y: { ticks: { color: '#6B7280', font: { size: 9, family: 'Roboto Mono' } }, grid: { color: '#1f2937' } },
                                        },
                                        plugins: { legend: { display: false } },
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-40 text-dim text-xs font-mono">No lease data yet</div>
                            )}
                        </div>

                        {/* Users by role */}
                        <div className="bg-matte border border-gray-800 rounded-2xl p-5 relative">
                            <div className="holo-bar" />
                            <h3 className="hud-label mb-4">Operators by Role</h3>
                            <div className="flex flex-col gap-3">
                                {stats && Object.entries(stats.usersByRole).map(([role, count]) => (
                                    <div key={role} className="flex items-center justify-between">
                                        <span className="text-starlight text-xs font-mono capitalize">{role}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-1.5 bg-surface rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-neon to-nebula rounded-full"
                                                    style={{ width: `${Math.min(100, (count / (stats.totalUsers || 1)) * 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-neon text-xs font-mono font-bold w-6 text-right">{count}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!stats || Object.keys(stats.usersByRole).length === 0) && (
                                    <p className="text-dim text-xs font-mono">No user data</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Users Tab ────────────────────────────────────────────── */}
                {activeTab === 'users' && (
                    <div>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-16 text-dim font-mono text-sm">No operator data available</div>
                        ) : (
                            <div className="bg-matte border border-gray-800 rounded-2xl overflow-hidden">
                                <div className="holo-bar" />
                                {/* Table header */}
                                <div className="grid grid-cols-[1fr_140px_120px_80px] gap-4 px-5 py-3 border-b border-gray-800">
                                    {['Operator', 'Email', 'Clearance', 'Credits'].map((h) => (
                                        <span key={h} className="hud-label">{h}</span>
                                    ))}
                                </div>
                                {users.map((u, idx) => (
                                    <div
                                        key={u._id}
                                        className={`grid grid-cols-[1fr_140px_120px_80px] gap-4 px-5 py-3 items-center
                      ${idx % 2 === 0 ? '' : 'bg-surface/30'}
                      hover:bg-neon/5 transition-colors duration-150`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon to-nebula
                                      flex items-center justify-center text-void text-xs font-bold flex-shrink-0">
                                                {u.username?.[0]?.toUpperCase()}
                                            </div>
                                            <span className="text-starlight text-xs font-mono truncate">{u.username}</span>
                                        </div>
                                        <span className="text-dim text-xs font-inter truncate">{u.email}</span>
                                        <span className={`text-xs font-mono  ${u.gravityClearance === 'ADMIN' ? 'text-laser' :
                                                u.gravityClearance === 'COMMANDER' ? 'text-nebula' :
                                                    u.gravityClearance === 'PILOT' ? 'text-blue-400' : 'text-green-400'}`}>
                                            {u.gravityClearance}
                                        </span>
                                        <span className="text-neon text-xs font-orbitron font-bold">{u.creditsBalance}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
