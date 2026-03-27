require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

// --- Route Imports ---
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const Message = require('./models/Message');
const Notification = require('./models/Notification');

// --- Connect to Database ---
connectDB();

// --- Global Online Users map for notifications ---
global.onlineUsers = new Map();

const app = express();
const httpServer = http.createServer(app);

// --- Socket.io Setup (Real-time Chat) ---
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

global.io = io; // Export io to be used in controllers

io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    socket.on('register', (userId) => {
        if (userId) {
            global.onlineUsers.set(userId, socket.id);
            console.log(`User ${userId} registered to socket ${socket.id}`);
        }
    });

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    socket.on('send_message', async (data) => {
        try {
            // Save message to DB
            const listingId = data.roomId.split('_')[0];
            const msg = await Message.create({
                roomId: data.roomId,
                listingId,
                senderId: data.senderId,
                senderName: data.senderName,
                text: data.text,
            });

            // Emit to room
            socket.to(data.roomId).emit('receive_message', data);

            // Find recipient
            const participants = data.roomId.split('_').slice(1);
            const recipientId = participants.find(id => id !== data.senderId);

            if (recipientId) {
                // Create notification
                const notification = await Notification.create({
                    userId: recipientId,
                    type: 'CHAT',
                    message: `New message from ${data.senderName}`,
                    relatedId: listingId
                });

                // Emit notification if user is online
                const recipientSocketId = global.onlineUsers.get(recipientId);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('new_notification', notification);
                }
            }
        } catch (err) {
            console.error('Socket message error:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.id}`);
        // Remove from online users
        for (let [userId, sockId] of global.onlineUsers.entries()) {
            if (sockId === socket.id) {
                global.onlineUsers.delete(userId);
                break;
            }
        }
    });
});

// --- Middlewares ---
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// --- API Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/listings', require('./routes/listingRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// --- Health Check ---
app.get('/', (req, res) => {
    res.json({ message: '🚀 Antigravity Rental Platform API is live!' });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
