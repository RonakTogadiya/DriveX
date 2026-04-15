import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('agToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Auth ──────────────────────────────────────────────────────────────
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// ── Listings (Vehicles) ───────────────────────────────────────────────
export const getListings = (params) => api.get('/listings', { params });
export const getListingById = (id) => api.get(`/listings/${id}`);
export const createListing = (data) => api.post('/listings', data);
export const updateListing = (id, data) => api.put(`/listings/${id}`, data);
export const deleteListing = (id) => api.delete(`/listings/${id}`);
export const getNearbyListings = (params) => api.get('/listings/nearby', { params });
export const toggleListingStatus = (id) => api.patch(`/listings/${id}/toggle-status`);
export const getMyListings = () => api.get('/listings/my-listings');

// ── Bookings ──────────────────────────────────────────────────────────
export const createBooking = (data) => api.post('/bookings', data);
export const getMyBookings = () => api.get('/bookings/my-bookings');
export const getOwnerBookings = () => api.get('/bookings/owner-bookings');
export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const cancelBooking = (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason });
export const confirmBooking = (id) => api.patch(`/bookings/${id}/confirm`);
export const rejectBooking = (id, reason) => api.patch(`/bookings/${id}/reject`, { reason });
export const downloadReceipt = (id) => api.get(`/bookings/${id}/receipt`, { responseType: 'blob' });
export const getListingAvailability = (listingId) => api.get(`/bookings/availability/${listingId}`);
export const updateListingAvailability = (listingId, blockedDates) => api.put(`/listings/${listingId}/availability`, { blockedDates });

// ── Payments ──────────────────────────────────────────────────────────
export const generatePaymentQR = (bookingId, type) => api.get(`/payments/qr/${bookingId}/${type}`);
export const verifyPayment = (bookingId, data) => api.post(`/payments/verify/${bookingId}`, data);

// ── Users ─────────────────────────────────────────────────────────────
export const getMyProfile = () => api.get('/users/profile');
export const updateMyProfile = (data) => api.put('/users/profile', data);
export const getWishlist = () => api.get('/users/wishlist');
export const toggleWishlist = (listingId) => api.post(`/users/wishlist/${listingId}`);

// ── Admin ─────────────────────────────────────────────────────────────
export const getAdminStats = () => api.get('/admin/stats');
export const getAllUsers = () => api.get('/admin/users');
export const toggleBlockUser = (id) => api.patch(`/admin/users/${id}/block`);
export const verifyUser = (id) => api.patch(`/admin/users/${id}/verify`);
export const getAllListings = () => api.get('/admin/listings');
export const verifyListing = (id, status) => api.patch(`/admin/listings/${id}/verify`, { status });
export const getAllBookings = () => api.get('/admin/bookings');
export const getAllPayments = () => api.get('/admin/payments');
export const getPendingOwners = () => api.get('/admin/pending-owners');
export const approveOwner = (id) => api.patch(`/admin/owners/${id}/approve`);
export const rejectOwner = (id, reason) => api.patch(`/admin/owners/${id}/reject`, { reason });

// ── Notifications ─────────────────────────────────────────────────────
export const getNotifications = () => api.get('/notifications');
export const markNotificationAsRead = (id) => api.put(`/notifications/${id}/read`);
export const clearAllNotifications = () => api.put('/notifications/clear');

// ── Chat ──────────────────────────────────────────────────────────────
export const getMyInbox = () => api.get('/chat/inbox');
export const getChatHistory = (roomId) => api.get(`/chat/${roomId}`);

export default api;
