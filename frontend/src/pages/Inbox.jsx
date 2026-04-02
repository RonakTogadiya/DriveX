import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyInbox } from '../services/api';
import ChatBox from '../components/ChatBox';

const Inbox = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [inbox, setInbox] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState(null);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        const fetchInbox = async () => {
            try {
                const { data } = await getMyInbox();
                setInbox(data.data || []);
            } catch (error) {
                console.error('Error fetching inbox:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInbox();
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto h-[70vh] flex flex-col md:flex-row gap-6">

                {/* ── Left Pane: Inbox List ──────────────────────────── */}
                <div className="w-full md:w-80 flex-shrink-0 bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-gray-100 bg-slate-50/50">
                        <h2 className="font-semibold text-slate-800 text-lg">Messages</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
                            </div>
                        ) : inbox.length === 0 ? (
                            <div className="p-8 text-center">
                                <span className="text-4xl block mb-2">📥</span>
                                <p className="text-slate-500 text-sm font-medium">No messages yet</p>
                            </div>
                        ) : (
                            inbox.map((chat) => (
                                <button
                                    key={chat.roomId}
                                    onClick={() => setSelectedRoom(chat)}
                                    className={`w-full text-left p-4 border-b border-slate-100 transition-colors
                                        ${selectedRoom?.roomId === chat.roomId ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-semibold text-sm text-slate-800 truncate">
                                            {chat.otherParticipant.name}
                                        </p>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {new Date(chat.lastMessage.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-emerald-600 font-medium truncate mb-1">
                                        🚗 {chat.listing.name}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {chat.lastMessage.senderId === user._id ? 'You: ' : ''}{chat.lastMessage.text}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Right Pane: Active Chat ────────────────────────── */}
                <div className="flex-1 h-[500px] md:h-full">
                    {selectedRoom ? (
                        <div className="h-full">
                            <ChatBox
                                listingId={selectedRoom.listing.id}
                                ownerId={selectedRoom.otherParticipant.id}
                                ownerName={selectedRoom.otherParticipant.name}
                            />
                        </div>
                    ) : (
                        <div className="h-full bg-white border border-gray-200 shadow-sm rounded-2xl flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-5xl mb-4">💬</div>
                                <h3 className="text-slate-800 font-semibold mb-1">Your Messages</h3>
                                <p className="text-slate-500 text-sm">Select a conversation from the list to start chatting.</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Inbox;
