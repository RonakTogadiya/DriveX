import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import Register from './pages/Register';
import ListingDetail from './pages/ListingDetail';
import Dashboard from './pages/Dashboard';
import ListingForm from './pages/ListingForm';
import MyListings from './pages/MyListings';
import Inbox from './pages/Inbox';

// ── Lazy-load heavy pages (Leaflet + Chart.js) to prevent synchronous crash ──
const MapSearch = lazy(() => import('./pages/MapSearch'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <span className="text-neon font-orbitron text-sm animate-pulse">Authenticating...</span>
        </div>
    );
    if (!user) return <a href="/login" />;
    if (role && user.role !== role) return <a href="/dashboard" />;
    return children;
};

const PlaceholderPage = ({ title }) => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-16 text-center px-4">
        <p className="text-neon font-mono text-xs uppercase tracking-[0.4em]">DriveX</p>
        <h1 className="font-orbitron font-black text-4xl text-starlight uppercase">{title}</h1>
    </div>
);

const Loading = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-neon/30 border-t-neon rounded-full animate-spin" />
            <span className="text-neon font-mono text-xs animate-pulse">Loading...</span>
        </div>
    </div>
);

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <NotificationProvider>
                    <Navbar />
                    <Suspense fallback={<Loading />}>
                        <Routes>
                            {/* Public */}
                            <Route path="/" element={<SearchResults />} />
                            <Route path="/listings" element={<SearchResults />} />
                            <Route path="/listings/:id" element={<ListingDetail />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/map" element={<MapSearch />} />
                            <Route path="/about" element={<PlaceholderPage title="How It Works" />} />

                            {/* Protected */}
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
                            <Route path="/my-listings" element={<ProtectedRoute role="owner"><MyListings /></ProtectedRoute>} />
                            <Route path="/listings/new" element={<ProtectedRoute role="owner"><ListingForm /></ProtectedRoute>} />
                            <Route path="/listings/edit/:id" element={<ProtectedRoute role="owner"><ListingForm /></ProtectedRoute>} />
                            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />
                            <Route path="*" element={<PlaceholderPage title="404 — Page Not Found" />} />
                        </Routes>
                    </Suspense>
                    <Toaster position="bottom-right" toastOptions={{
                        style: { background: '#ffffff', color: '#1e293b', border: '1px solid #e2e8f0', fontFamily: '"Inter", sans-serif', fontSize: '13px' },
                        success: { iconTheme: { primary: '#2563eb', secondary: '#ffffff' } },
                        error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
                    }} />
                </NotificationProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
