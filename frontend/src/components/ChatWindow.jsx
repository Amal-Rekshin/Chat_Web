import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import MessageBubble from './MessageBubble';
import EmojiPicker from 'emoji-picker-react';
import { Send, Image as ImageIcon, Smile, Plus, UserPlus } from 'lucide-react';
import AddGroupMemberModal from './AddGroupMemberModal';
import ChatInfoSidebar from './ChatInfoSidebar';
const ChatWindow = ({
  chat,
  onBack
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [editingMessage, setEditingMessage] = useState(null);
  const [memberStatuses, setMemberStatuses] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const {
    client,
    connected,
    onlineUsers,
    subscribeToTyping,
    sendMessage,
    sendTypingEvent,
    sendEditMessageEvent
  } = useWebSocket();
  const {
    user
  } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch initial messages and statuses
    Promise.all([
      api.get(`/chats/${chat.id}/messages`),
      api.get(`/chats/${chat.id}/member-status`)
    ]).then(([messagesRes, statusRes]) => {
      setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
      setMemberStatuses(Array.isArray(statusRes.data) ? statusRes.data : []);
      scrollToBottom();
      // If we opened the chat, let's mark it as read!
      if (messagesRes.data && messagesRes.data.length > 0) {
          api.post(`/chats/${chat.id}/read`, { userId: user.id }).catch(err => console.error(err));
      }
    }).catch(err => {
      console.error('Failed to load chat data:', err);
      setMessages([]);
      setMemberStatuses([]);
    });
  }, [chat.id, user?.id]);

  useEffect(() => {
    let subChat;
    let subTyping;
    let subStatus;

    if (client && connected) {
      subChat = client.subscribe(`/topic/chat/${chat.id}`, message => {
        const payload = JSON.parse(message.body);
        setMessages(prev => {
          const arr = Array.isArray(prev) ? prev : [];
          const idx = arr.findIndex(m => m.id === payload.id);
          if (idx >= 0) {
            const copy = [...arr];
            copy[idx] = { ...copy[idx], ...payload };
            return copy;
          }
          return [...arr, payload];
        });
        scrollToBottom();
        
        // If we received a message from someone else while in the active chat, mark as read
        if (payload.senderId !== user?.id) {
            api.post(`/chats/${chat.id}/read`, { userId: user.id }).catch(err => console.error(err));
        }
      });

      subTyping = subscribeToTyping(chat.id, payload => {
        if (payload.userId !== user?.id) {
          setTypingUsers(prev => {
            const next = new Set(prev);
            if (payload.typing) next.add(payload.username);
            else next.delete(payload.username);
            return next;
          });
        }
      });
      
      subStatus = client.subscribe(`/topic/chat/${chat.id}/status`, message => {
        const payload = JSON.parse(message.body);
        setMemberStatuses(prev => {
           const existing = prev.findIndex(s => s.userId === payload.userId);
           if (existing >= 0) {
               const copy = [...prev];
               copy[existing] = { ...copy[existing], lastDeliveredId: payload.lastDeliveredId, lastReadId: payload.lastReadId };
               return copy;
           }
           return [...prev, payload];
        });
      });
    }
    
    // Store subStatus on cleanup
    return () => {
      if (subChat) subChat.unsubscribe();
      if (subTyping) subTyping.unsubscribe();
      if (subStatus) subStatus.unsubscribe();
      setTypingUsers(new Set());
      setEditingMessage(null);
      setInput('');
    };
  }, [chat.id, client, connected, user?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
    }, 100);
  };

  const handleInputChange = e => {
    setInput(e.target.value);
    
    // Send typing event
    sendTypingEvent(chat.id, true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingEvent(chat.id, false);
    }, 2000);
  };

  const handleSend = e => {
    e.preventDefault();
    if (!input.trim()) return;
    
    if (editingMessage) {
      sendEditMessageEvent(chat.id, editingMessage.id, input);
      setEditingMessage(null);
    } else {
      sendMessage(chat.id, input, 'TEXT');
    }
    
    setInput('');
    setShowEmojiPicker(false);
    sendTypingEvent(chat.id, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };
  
  const handleEditRequest = (msg) => {
    setEditingMessage(msg);
    setInput(msg.content);
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setShowAttachMenu(false);
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { fileUrl, fileName } = res.data;
      
      sendMessage(chat.id, fileName, type, fileUrl);
    } catch (err) {
      console.error('File upload failed', err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  return <div className="flex-1 flex bg-slate-900 relative h-full overflow-hidden">
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Header */}
      <div 
        className="h-16 border-b border-slate-800 flex items-center px-4 md:px-6 bg-slate-900/95 backdrop-blur z-10 shrink-0 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setShowInfo(!showInfo)}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {onBack && (
            <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="md:hidden p-2 text-slate-400 hover:text-white rounded-full transition-colors mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
            {chat.image ? (
              <>
                <img src={chat.image} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
                <span style={{display: 'none'}}>{chat.name?.[0]?.toUpperCase() || 'C'}</span>
              </>
            ) : chat.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-lg text-slate-100 truncate">{chat.name || 'Unknown Chat'}</h3>
            {chat.type === 'PRIVATE' && (
              <span className={`text-xs flex items-center ${onlineUsers[chat.name] ? 'text-emerald-400' : 'text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${onlineUsers[chat.name] ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                {onlineUsers[chat.name] ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
        </div>
        
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-900/50 bg-blend-overlay">
        {Array.isArray(messages) && messages.map((msg, idx) => {
           const isOwn = msg?.senderId === user?.id || msg?.sender?.id === user?.id;
           let status = 'SENT';
           if (isOwn && memberStatuses.length > 0) {
               const others = memberStatuses.filter(s => s.userId !== user?.id);
               const maxRead = Math.max(...others.map(s => s.lastReadId || 0), 0);
               const maxDelivered = Math.max(...others.map(s => s.lastDeliveredId || 0), 0);
               if (msg.id <= maxRead) status = 'READ';
               else if (msg.id <= maxDelivered) status = 'DELIVERED';
           }
           return <MessageBubble key={idx} message={msg || {}} isOwn={isOwn} status={status} onEditRequest={handleEditRequest} />
        })}
        {typingUsers.size > 0 && (
          <div className="text-sm text-slate-400 italic animate-pulse">
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {chat.type === 'GROUP' && chat.currentUserRole === 'REMOVED' ? (
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 flex justify-center text-red-400 italic text-sm font-medium">
          You are no longer a participant of this group
        </div>
      ) : chat.type === 'PRIVATE' && chat.canMessage === false ? (
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 flex justify-center text-red-400 italic text-sm font-medium">
          You cannot message this user any further
        </div>
      ) : chat.type === 'ANNOUNCEMENT' && user?.role !== 'ADMIN' ? (
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 flex justify-center text-slate-500 italic text-sm font-medium">
          Only Admins can send announcements
        </div>
      ) : (
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 relative">
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 sm:left-auto right-0 sm:right-4 mb-2 z-50 shadow-2xl">
              <EmojiPicker 
                onEmojiClick={(emojiObject) => setInput(prev => prev + emojiObject.emoji)}
                theme="dark"
                searchDisabled={true}
                skinTonesDisabled={true}
              />
            </div>
          )}
          <form onSubmit={handleSend} className="flex flex-col w-full max-w-4xl mx-auto relative">
            {editingMessage && (
              <div className="flex items-center justify-between bg-slate-800/80 px-4 py-2 rounded-t-2xl border-t border-l border-r border-slate-700 text-sm">
                <span className="text-indigo-400 font-medium">Editing message...</span>
                <button type="button" onClick={() => { setEditingMessage(null); setInput(''); }} className="text-slate-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            )}
            <div className="flex items-end space-x-2">
              {!editingMessage && (
                <div className="flex space-x-2 shrink-0 pb-2 relative">
                  <div className="relative">
                    <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} className={`p-2 rounded-full transition-colors ${showAttachMenu ? 'text-indigo-400 bg-slate-800' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'}`}>
                      <Plus size={20} />
                    </button>
                    {showAttachMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left text-sm">
                          <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          Document
                        </button>
                        <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full flex items-center px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left text-sm">
                          <ImageIcon className="w-5 h-5 mr-3 text-emerald-400" />
                          Photos & videos
                        </button>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-full transition-colors">
                    <ImageIcon size={20} />
                  </button>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'FILE')} />
                  <input type="file" accept="image/*,video/*" className="hidden" ref={imageInputRef} onChange={(e) => handleFileUpload(e, 'IMAGE')} />
                </div>
              )}
            
            <div className={`flex-1 bg-slate-800 border-slate-700 flex items-end shadow-inner min-h-[44px] ${editingMessage ? 'rounded-b-2xl rounded-tr-2xl border-b border-l border-r' : 'rounded-2xl border'}`}>
              <textarea value={input} onChange={handleInputChange} disabled={uploading} placeholder={uploading ? "Uploading..." : "Type a message..."} className="w-full bg-transparent text-slate-200 placeholder-slate-500 px-4 py-3 focus:outline-none resize-none max-h-32 min-h-[44px]" rows={1} onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }} />
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-3 transition-colors ${showEmojiPicker ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}>
                <Smile size={20} />
              </button>
            </div>
            
            <button type="submit" className={`p-3 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all duration-200 ${input.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`} disabled={!input.trim()}>
              {editingMessage ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10"/></svg>
              ) : (
                <Send size={20} className={input.trim() ? 'translate-x-0.5' : ''} />
              )}
            </button>
            </div>
          </form>
        </div>
      )}

      {showAddMemberModal && (
        <AddGroupMemberModal 
          chat={chat} 
          currentUserId={user?.id}
          onClose={() => setShowAddMemberModal(false)}
          onAdded={() => {
            // maybe refresh member statuses or just let websocket handle it
            setShowAddMemberModal(false);
          }}
        />
      )}
    </div>
    
    {showInfo && (
      <ChatInfoSidebar 
        chat={chat} 
        currentUserId={user?.id} 
        onClose={() => setShowInfo(false)} 
        onAddMember={() => setShowAddMemberModal(true)}
        onlineUsers={onlineUsers}
      />
    )}
  </div>;
};
export default ChatWindow;