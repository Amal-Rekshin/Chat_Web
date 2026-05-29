import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Megaphone, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const Chat = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [announcement, setAnnouncement] = useState(null);
  const { subscribeToAnnouncements, connected } = useWebSocket();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let sub = null;
    if (connected) {
      sub = subscribeToAnnouncements((data) => {
        setAnnouncement(data);
        setTimeout(() => setAnnouncement(null), 10000);
      });
    }
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [connected, subscribeToAnnouncements]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    const groupId = params.get('groupId');
    
    if (groupId) {
      // Find and select the group chat
      api.get(`/chats/user/${user?.id}`).then(res => {
        const groupChat = res.data.find(c => c.id === parseInt(groupId));
        if (groupChat) {
          setSelectedChat(groupChat);
          // clear url
          navigate('/', { replace: true });
        }
      });
    } else if (userId) {
      // Find private chat or create it
      api.post('/chats/private', {
        senderId: user?.id,
        receiverId: parseInt(userId)
      }).then(res => {
        setSelectedChat(res.data);
        navigate('/', { replace: true });
      }).catch(err => {
        console.error("Failed to open private chat", err);
        // Only members of mutual groups can chat. If it fails, maybe show an alert
        if (err.response?.status === 403) {
          alert("You can only chat with people who share a mutual group.");
          navigate('/', { replace: true });
        }
      });
    }
  }, [location.search, user?.id, navigate]);

  return <div className="h-screen w-full flex bg-slate-900 overflow-hidden text-slate-100 font-sans antialiased relative">
        {/* Announcement Banner */}
        {announcement && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 min-w-[300px] max-w-md p-4 rounded-xl shadow-2xl flex items-start space-x-3 transition-all transform translate-y-0 bg-indigo-600/90 border border-indigo-500 backdrop-blur-md">
            <div className="shrink-0 mt-0.5">
              <Megaphone size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">{announcement.title}</h4>
                <button onClick={() => setAnnouncement(null)} className="text-white/70 hover:text-white transition-colors p-1">
                  <X size={16} />
                </button>
              </div>
              <p className="text-white/90 text-sm mt-1">{announcement.content}</p>
            </div>
          </div>
        )}

        <div className={`w-full md:w-80 md:flex flex-shrink-0 border-r border-slate-800 ${selectedChat ? 'hidden' : 'flex'}`}>
          <Sidebar onSelectChat={chat => setSelectedChat(chat)} selectedChatId={selectedChat?.id || null} />
        </div>
        <div className={`flex-1 flex-col md:flex ${selectedChat ? 'flex w-full' : 'hidden'}`}>
          {selectedChat ? <ChatWindow chat={selectedChat} onBack={() => setSelectedChat(null)} /> : <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/50 hidden md:flex">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl border border-slate-700">
              <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Welcome to RoririConnect</h2>
            <p className="text-slate-400">Select a chat to start messaging</p>
          </div>}
        </div>
      </div>;
};
export default Chat;