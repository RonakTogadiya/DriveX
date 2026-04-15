import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const profileRef = useRef(null);
    const notifRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
        setProfileOpen(false);
        setNotifOpen(false);
    }, [location.pathname]);

    const navLinks = [
        { to: '/listings', label: 'Browse Vehicles' },
        { to: '/map', label: 'Map Search' },
        { to: '/about', label: 'How It Works' },
    ];

    const isActive = (path) => location.pathname === path;

    // Handle clicking a notification — mark as read and navigate to relevant page
    const handleNotificationClick = (notification) => {
        // Mark as read if unread
        if (!notification.read) {
            markAsRead(notification._id);
        }

        // Close dropdown
        setNotifOpen(false);

        // Navigate based on notification type and relatedId
        const relatedId = notification.relatedId;
        switch (notification.type) {
            case 'CHAT':
                navigate(`/inbox?listingId=${relatedId}`);
                break;
            case 'BOOKING':
            case 'REMINDER':
                // Owner goes to owner-dashboard, renter goes to dashboard
                if (user?.role === 'owner') {
                    navigate(`/owner-dashboard?bookingId=${relatedId}`);
                } else {
                    navigate(`/dashboard?bookingId=${relatedId}`);
                }
                break;
            case 'PAYMENT':
                navigate(`/dashboard?bookingId=${relatedId}`);
                break;
            case 'LISTING_APPROVED':
            case 'LISTING_REJECTED':
                navigate(`/my-listings?listingId=${relatedId}`);
                break;
            case 'USER_VERIFIED':
                navigate('/dashboard');
                break;
            default:
                navigate('/dashboard');
                break;
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* ── Brand ───────────────────────────────────────────── */}
                <Link to="/" className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold text-xl tracking-tight">Drive</span>
                    <span className="text-slate-900 font-bold text-xl tracking-tight">X</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
                </Link>

                {/* ── Desktop Nav ─────────────────────────────────────── */}
                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map(({ to, label }) => (
                        <Link
                            key={to} to={to}
                            className={`text-sm font-medium transition-colors duration-150
                                ${isActive(to) ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            {label}
                        </Link>
                    ))}
                </div>

                {/* ── Auth / Notifications ─────────────────────────────── */}
                <div className="flex items-center gap-4">
                    {!user ? (
                        <div className="hidden md:flex items-center gap-2">
                            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors">Login</Link>
                            <Link to="/register" className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors">Join Now</Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            {/* Notification Bell */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
                                    className="relative p-2 text-slate-500 hover:bg-slate-50 hover:text-emerald-600 rounded-full transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {notifOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                            <p className="text-slate-800 text-sm font-semibold">Notifications</p>
                                            {unreadCount > 0 && <span className="text-xs text-emerald-600 font-semibold">{unreadCount} new</span>}
                                        </div>
                                        <div className="max-h-[320px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-slate-500 text-sm">No new notifications</div>
                                            ) : (
                                                notifications.map(n => {
                                                    // Icon mapping for all notification types
                                                    const iconMap = {
                                                        CHAT: '💬',
                                                        BOOKING: '📅',
                                                        REMINDER: '⏰',
                                                        PAYMENT: '💳',
                                                        LISTING_APPROVED: '✅',
                                                        LISTING_REJECTED: '❌',
                                                        USER_VERIFIED: '🎉',
                                                    };
                                                    const icon = iconMap[n.type] || '🔔';

                                                    return (
                                                        <div
                                                            key={n._id}
                                                            onClick={() => handleNotificationClick(n)}
                                                            className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${!n.read ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-sm ${!n.read ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>{n.message}</p>
                                                                    <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">
                                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                                    </p>
                                                                </div>
                                                                <svg className="w-4 h-4 text-slate-300 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile Dropdown */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
                                    className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 hover:border-slate-300 transition-all duration-150"
                                >
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-emerald-100">
                                        {user.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="hidden sm:block text-left leading-tight py-0.5">
                                        <p className="text-slate-800 text-xs font-semibold">{user.username}</p>
                                        <p className="text-slate-400 text-[10px] capitalize font-medium">{user.role}</p>
                                    </div>
                                    <svg className="w-3.5 h-3.5 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {profileOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                            <p className="text-slate-800 text-sm font-semibold truncate">{user.username}</p>
                                            <p className="text-slate-400 text-xs truncate mt-0.5">{user.email}</p>
                                        </div>

                                        <div className="py-2">
                                            {[
                                                { to: '/dashboard', label: 'My Trips', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                                                user.role === 'owner' && { to: '/owner-dashboard', label: 'Owner Dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                                                { to: '/wishlist', label: 'My Wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                                                { to: '/inbox', label: 'Messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
                                                user.role === 'owner' && { to: '/my-listings', label: 'My Vehicles', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
                                                user.role === 'owner' && { to: '/listings/new', label: 'List a Vehicle', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
                                                user.role === 'admin' && { to: '/admin', label: 'Admin Panel', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                                            ].filter(Boolean).map((item) => (
                                                <Link
                                                    key={item.to} to={item.to}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                                    </svg>
                                                    {item.label}
                                                </Link>
                                            ))}
                                        </div>

                                        <div className="border-t border-slate-100 py-1.5">
                                            <button
                                                onClick={() => { logout(); navigate('/'); setProfileOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mobile hamburger */}
                    <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-3">
                    {navLinks.map(({ to, label }) => (
                        <Link key={to} to={to} className="text-slate-600 font-medium text-sm hover:text-emerald-600 transition-colors py-2">{label}</Link>
                    ))}
                    {user && (
                        <>
                            <Link to="/dashboard" className="text-slate-600 font-medium text-sm hover:text-emerald-600 transition-colors py-2">My Trips</Link>
                            {user.role === 'owner' && <Link to="/owner-dashboard" className="text-slate-600 font-medium text-sm hover:text-emerald-600 transition-colors py-2">Owner Dashboard</Link>}
                            <Link to="/wishlist" className="text-slate-600 font-medium text-sm hover:text-emerald-600 transition-colors py-2">My Wishlist</Link>
                        </>
                    )}
                    {!user
                        ? <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-slate-100">
                            <Link to="/login" className="bg-slate-50 border border-slate-200 text-center font-medium text-slate-700 text-sm px-4 py-2.5 rounded-xl">Login</Link>
                            <Link to="/register" className="bg-emerald-600 font-medium text-white text-center text-sm px-4 py-2.5 rounded-xl shadow-sm">Join Now</Link>
                        </div>
                        : <button onClick={() => { logout(); navigate('/'); }} className="mt-4 pt-4 border-t border-slate-100 text-red-500 font-medium text-sm text-left w-full py-2">Sign Out</button>
                    }
                </div>
            )}
        </nav>
    );
};

export default Navbar;
