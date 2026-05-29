import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { Search, LogOut, Users, MessageSquarePlus } from 'lucide-react';
import GroupModal from './GroupModal';
import PrivateChatModal from './PrivateChatModal';
const Sidebar = ({
  onSelectChat,
  selectedChatId
}) => {
  const {
    user,
    logout
  } = useAuth();
  const { onlineUsers, subscribeToNewMessages } = useWebSocket();
  const [chats, setChats] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchChats = () => {
    if (user?.id) {
      api.get(`/chats/user/${user.id}`).then(res => {
        const loadedChats = res.data;
        setChats(loadedChats);
        
        // Notify backend that all unread messages in these chats have now been delivered to our device
        loadedChats.forEach(chat => {
          if (chat.unreadCount > 0) {
            api.post(`/chats/${chat.id}/delivered`, { userId: user.id }).catch(err => console.error(err));
          }
        });
      }).catch(err => console.error(err));
    }
  };
  
  useEffect(() => {
    fetchChats();
  }, [user]);

  useEffect(() => {
    let sub = null;
    if (user?.id) {
      sub = subscribeToNewMessages(user.id, (payload) => {
        setChats(prev => {
          const updated = prev.map(chat => {
            if (chat.id === payload.chatId) {
              if (chat.id === selectedChatId) {
                api.post(`/chats/${chat.id}/read`, { userId: user.id }).catch(err => console.error(err));
              } else {
                api.post(`/chats/${chat.id}/delivered`, { userId: user.id }).catch(err => console.error(err));
              }
              return {
                ...chat,
                lastMessage: payload.content,
                lastMessageAt: payload.createdAt,
                unreadCount: chat.id === selectedChatId ? 0 : (chat.unreadCount || 0) + 1
              };
            }
            return chat;
          });
          return updated.sort((a, b) => {
            if (a.type === 'ANNOUNCEMENT' && b.type !== 'ANNOUNCEMENT') return -1;
            if (b.type === 'ANNOUNCEMENT' && a.type !== 'ANNOUNCEMENT') return 1;
            return new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt);
          });
        });
      });
    }
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [user, selectedChatId, subscribeToNewMessages]);
  
  const handleSelectChat = (chat) => {
    if (chat.unreadCount > 0) {
      api.post(`/chats/${chat.id}/read`, { userId: user.id }).catch(err => console.error(err));
      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
    }
    onSelectChat(chat);
  };
  
  const hasActiveGroup = chats.some(chat => chat.type === 'GROUP' && chat.currentUserRole !== 'REMOVED');
  
  const filteredChats = chats.filter(chat => {
    if (!chat.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (chat.type === 'ANNOUNCEMENT') return true;
    return hasActiveGroup;
  });

  return <div className="w-full flex-1 md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span className="font-semibold text-lg">{user?.username}</span>
        </div>
        <div className="flex items-center space-x-2">
          {user?.role !== 'ADMIN' && (
            <button onClick={() => setShowPrivateModal(true)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors text-slate-300" title="New Chat">
              <MessageSquarePlus size={18} />
            </button>
          )}
          <button onClick={() => setShowGroupModal(true)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors text-slate-300" title="Create Group">
            <Users size={18} />
          </button>
          <button onClick={logout} className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors text-slate-300" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input type="text" placeholder="Search chats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-800 text-sm text-slate-200 placeholder-slate-500 rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 transition-all" />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
        {filteredChats.map(chat => <div key={chat.id} onClick={() => handleSelectChat(chat)} className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${selectedChatId === chat.id ? 'bg-indigo-600 shadow-md' : 'hover:bg-slate-800'}`}>
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white overflow-hidden shrink-0 border border-slate-600">
                {chat.image ? (
                  <>
                    <img src={chat.image} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
                    <span style={{display: 'none'}}>{chat.name?.[0]?.toUpperCase() || 'C'}</span>
                  </>
                ) : chat.name?.[0]?.toUpperCase() || 'C'}
              </div>
              {chat.type === 'PRIVATE' && onlineUsers[chat.name] && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className={`truncate ${chat.unreadCount > 0 ? 'font-bold text-white' : 'font-semibold text-slate-100'}`}>{chat.name || 'Unknown Chat'}</h3>
                {chat.lastMessageAt && (
                  <span className={`text-xs shrink-0 ml-2 ${chat.unreadCount > 0 ? 'text-indigo-400 font-medium' : 'text-slate-400'}`}>
                    {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <p className={`text-sm truncate pr-2 ${selectedChatId === chat.id ? 'text-indigo-200' : (chat.unreadCount > 0 ? 'text-slate-200 font-medium' : 'text-slate-400')}`}>
                  {chat.lastMessage || 'No messages yet'}
                </p>
                {chat.unreadCount > 0 && (
                  <span className="shrink-0 bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-md">
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>)}
        {filteredChats.length === 0 && <div className="text-center text-slate-500 mt-10 p-4">
            {searchQuery ? 'No chats found matching your search.' : 'No chats yet. Click the chat icon above to start a direct message, or the users icon for a group chat.'}
          </div>}
      </div>

      {showGroupModal && <GroupModal onClose={() => setShowGroupModal(false)} onGroupCreated={fetchChats} />}
      {showPrivateModal && <PrivateChatModal onClose={() => setShowPrivateModal(false)} onChatCreated={fetchChats} />}
    </div>;
};
export default Sidebar;