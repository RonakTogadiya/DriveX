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

// ── Bookings ──────────────────────────────────────────────────────────
export const createBooking = (data) => api.post('/bookings', data);
export const getMyBookings = () => api.get('/bookings/my-bookings');
export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const cancelBooking = (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason });
export const confirmBooking = (id) => api.patch(`/bookings/${id}/confirm`);
export const getListingAvailability = (listingId) => api.get(`/bookings/availability/${listingId}`);

// ── Users ─────────────────────────────────────────────────────────────
export const getMyProfile = () => api.get('/users/profile');
export const updateMyProfile = (data) => api.put('/users/profile', data);

// ── Notifications ─────────────────────────────────────────────────────
export const getNotifications = () => api.get('/notifications');
export const markNotificationAsRead = (id) => api.put(`/notifications/${id}/read`);
export const clearAllNotifications = () => api.put('/notifications/clear');

// ── Chat ──────────────────────────────────────────────────────────────
export const getMyInbox = () => api.get('/chat/inbox');
export const getChatHistory = (roomId) => api.get(`/chat/${roomId}`);

export default api;
