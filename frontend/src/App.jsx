import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// ── Pages ──────────────────────────────────────────────────────────────
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import Register from './pages/Register';
import ListingDetail from './pages/ListingDetail';
import Dashboard from './pages/Dashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import MapSearch from './pages/MapSearch';
import ListingForm from './pages/ListingForm';
import MyListings from './pages/MyListings';
import AdminPanel from './pages/AdminPanel';
import Inbox from './pages/Inbox';
import WishlistPage from './pages/WishlistPage';
import PaymentPage from './pages/PaymentPage';
import AboutUs from './pages/AboutUs';

// ── Route Guards ───────────────────────────────────────────────────────
const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <span className="text-neon font-orbitron text-sm animate-pulse">Authenticating...</span>
        </div>
    );
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
    return children;
};

const PlaceholderPage = ({ title }) => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-16 text-center px-4">
        <p className="text-neon font-mono text-xs uppercase tracking-[0.4em]">DriveLink</p>
        <h1 className="font-orbitron font-black text-4xl text-starlight uppercase">{title}</h1>
    </div>
);

const AppRoutes = () => (
    <>
        <Navbar />
        <Routes>
            {/* Public */}
            <Route path="/" element={<SearchResults />} />
            <Route path="/listings" element={<SearchResults />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/map" element={<MapSearch />} />
            <Route path="/about" element={<AboutUs />} />

            {/* Protected: any logged-in user */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
            <Route path="/payment/:bookingId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />

            {/* Protected: Owner */}
            <Route path="/owner-dashboard" element={<ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/my-listings" element={<ProtectedRoute role="owner"><MyListings /></ProtectedRoute>} />
            <Route path="/listings/new" element={<ProtectedRoute role="owner"><ListingForm /></ProtectedRoute>} />
            <Route path="/listings/edit/:id" element={<ProtectedRoute role="owner"><ListingForm /></ProtectedRoute>} />

            {/* Protected: Admin */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />

            {/* Aliases / Redirects for common typos or legacy URLs */}
            <Route path="/ownerdashboard" element={<Navigate to="/owner-dashboard" replace />} />
            <Route path="/Ownerdashboard" element={<Navigate to="/owner-dashboard" replace />} />
            <Route path="/mywishlist" element={<Navigate to="/wishlist" replace />} />
            <Route path="/my-wishlist" element={<Navigate to="/wishlist" replace />} />
            <Route path="/Mywishlist" element={<Navigate to="/wishlist" replace />} />
            <Route path="/adminpanel" element={<Navigate to="/admin" replace />} />
            <Route path="/mylistings" element={<Navigate to="/my-listings" replace />} />

            {/* 404 */}
            <Route path="*" element={<PlaceholderPage title="404 — Page Not Found" />} />
        </Routes>
    </>
);

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: '#1A1A2E',
                            color: '#E0E6ED',
                            border: '1px solid #374151',
                            fontFamily: '"Roboto Mono", monospace',
                            fontSize: '12px',
                        },
                        success: { iconTheme: { primary: '#00F0FF', secondary: '#0B0C10' } },
                        error: { iconTheme: { primary: '#FF003C', secondary: '#0B0C10' } },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
