const Message = require('../models/Message');
const Listing = require('../models/Listing');
const User = require('../models/User');

exports.getChatHistory = async (req, res) => {
    try {
        const messages = await Message.find({ roomId: req.params.roomId }).sort({ createdAt: 1 });
        // Format to match what frontend expects
        const data = messages.map(m => ({
            roomId: m.roomId,
            text: m.text,
            senderId: m.senderId,
            senderName: m.senderName,
            timestamp: m.createdAt,
        }));
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching chat history' });
    }
};

exports.getInbox = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all unique roomIds that include this user
        // The roomId format is: listingId_user1Id_user2Id
        // where user1Id and user2Id are sorted alphabetically.
        const messages = await Message.find({ roomId: new RegExp(userId) })
            .sort({ createdAt: -1 })
            .populate('listingId', 'name imageUrl')
            .lean();

        // Group by roomId to get the latest message and participant info
        const inboxMap = new Map();

        for (const msg of messages) {
            if (!inboxMap.has(msg.roomId)) {
                // Determine the other participant
                const roomParts = msg.roomId.split('_');
                const otherUserId = roomParts[1] === userId ? roomParts[2] : roomParts[1];

                // Fetch the other user's name
                const otherUser = await User.findById(otherUserId).select('username role');

                inboxMap.set(msg.roomId, {
                    roomId: msg.roomId,
                    listing: {
                        id: msg.listingId?._id,
                        name: msg.listingId?.name || 'Unknown Vehicle',
                        imageUrl: msg.listingId?.imageUrl,
                    },
                    otherParticipant: {
                        id: otherUser?._id,
                        name: otherUser?.username || 'Unknown User',
                        role: otherUser?.role || 'user',
                    },
                    lastMessage: {
                        text: msg.text,
                        senderId: msg.senderId,
                        timestamp: msg.createdAt,
                    }
                });
            }
        }

        const inbox = Array.from(inboxMap.values());
        res.json({ success: true, data: inbox });

    } catch (error) {
        console.error('Inbox Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching inbox' });
    }
};
