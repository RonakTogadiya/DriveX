import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getChatHistory } from '../services/api';

/**
 * useChat — Hook utilizing globalSocket for real-time chat
 *
 * @param {string} roomId - Unique room ID (e.g. `listingId_ownerId_renterId`)
 * @returns {{ messages, sendMessage, connected }}
 */
const useChat = (roomId) => {
    const { user } = useAuth();
    const { globalSocket: socket } = useNotification();
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!roomId || !user) return;

        // Fetch historical messages
        const fetchHistory = async () => {
            try {
                const { data } = await getChatHistory(roomId);
                // Attach isOwn for UI
                const processed = (data.data || []).map(m => ({
                    ...m,
                    isOwn: m.senderId === user._id
                }));
                setMessages(processed);
            } catch (error) {
                console.error('Failed to fetch chat history', error);
            }
        };

        fetchHistory();
    }, [roomId, user]);

    useEffect(() => {
        if (!socket || !roomId) return;

        setConnected(true);
        socket.emit('join_room', roomId);

        const handleReceive = (data) => {
            setMessages((prev) => [...prev, data]);
        };

        socket.on('receive_message', handleReceive);

        return () => {
            socket.off('receive_message', handleReceive);
        };
    }, [socket, roomId]);

    const sendMessage = useCallback(
        (text) => {
            if (!text.trim() || !socket || !user) return;

            const messageData = {
                roomId,
                text: text.trim(),
                senderId: user._id,
                senderName: user.username,
                timestamp: new Date().toISOString(),
            };

            // Optimistically add own message to UI
            setMessages((prev) => [...prev, { ...messageData, isOwn: true }]);

            // Emit to server to save and broadcast
            socket.emit('send_message', messageData);
        },
        [socket, roomId, user]
    );

    return { messages, sendMessage, connected };
};

export default useChat;
