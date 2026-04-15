import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getNotifications, markNotificationAsRead } from '../services/api';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const { data } = await getNotifications();
            setNotifications(data.data || []);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        if (!user || !token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setNotifications([]);
            return;
        }

        fetchNotifications();

        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            socket.emit('register', user._id);
        });

        socket.on('new_notification', (data) => {
            setNotifications(prev => [data, ...prev]);

            // Show toast based on type
            if (data.type === 'CHAT') {
                toast.success(data.message, { icon: '💬' });
            } else if (data.type === 'BOOKING') {
                toast.success(data.message, { icon: '📅' });
            } else if (data.type === 'PAYMENT') {
                toast.success(data.message, { icon: '💳' });
            } else if (data.type === 'LISTING_APPROVED') {
                toast.success(data.message, { icon: '✅' });
            } else if (data.type === 'LISTING_REJECTED') {
                toast(data.message, { icon: '❌' });
            } else if (data.type === 'USER_VERIFIED') {
                toast.success(data.message, { icon: '🎉' });
            } else if (data.type === 'REMINDER') {
                toast(data.message, { icon: '⏰' });
            } else {
                toast(data.message);
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user, token]);

    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);

    const markAsRead = async (id) => {
        try {
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            await markNotificationAsRead(id);
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, globalSocket: socketRef.current, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
