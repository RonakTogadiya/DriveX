import React, { useState, useRef, useEffect } from 'react';
import useChat from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';

const ChatBox = ({ listingId, ownerId, ownerName }) => {
    const { user } = useAuth();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // Room ID format: listingId_ownerId_renterId (sorted for consistency)
    const participants = [ownerId, user?._id].sort().join('_');
    const roomId = `${listingId}_${participants}`;

    const { messages, sendMessage, connected } = useChat(roomId);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        sendMessage(input);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    if (!user) {
        return (
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 text-center">
                <p className="text-slate-500 text-sm font-medium">Log in to contact the owner</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden relative flex flex-col h-[400px]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-sm">
                        {ownerName?.[0]?.toUpperCase() || 'O'}
                    </div>
                    <div>
                        <p className="text-slate-800 text-sm font-semibold">{ownerName || 'Owner'}</p>
                        <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Listing Owner</p>
                    </div>
                </div>

                {/* Connection status */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-sm">
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span className={`text-[10px] font-semibold uppercase tracking-widest ${connected ? 'text-green-600' : 'text-slate-400'}`}>
                        {connected ? 'Connected' : 'Offline'}
                    </span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-slate-50/30">
                {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-4xl mb-3">💬</div>
                            <p className="text-slate-800 font-semibold text-sm">Secure channel established</p>
                            <p className="text-slate-500 text-xs mt-1">Send a message to start conversation with {ownerName}</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isOwn = msg.isOwn || msg.senderId === user?._id;
                        return (
                            <div key={idx} className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] font-semibold text-slate-400 px-1">
                                    {isOwn ? 'You' : msg.senderName}
                                </span>
                                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isOwn ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-slate-700 rounded-tl-sm'}`}>
                                    {msg.text}
                                </div>
                                <span className="text-[9px] font-medium text-slate-400 px-1 mt-0.5">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                    <input
                        type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                        placeholder="Type a message..." disabled={!connected}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
                    />
                    <button type="submit" disabled={!connected || !input.trim()}
                        className="bg-blue-600 text-white font-semibold flex items-center justify-center w-10 h-10 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        <svg className="w-4 h-4 translate-x-px translate-y-px" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatBox;
