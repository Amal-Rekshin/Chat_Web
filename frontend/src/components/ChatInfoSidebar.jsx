import React, { useState, useEffect } from 'react';
import { X, User, Users, Mail, Clock, Info, UserPlus } from 'lucide-react';
import api from '../services/api';
import { formatImageUrl } from '../utils/imageUtils';

const ChatInfoSidebar = ({ chat, currentUserId, onClose, onAddMember, onlineUsers = {} }) => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/chats/${chat.id}/info`, {
        params: { userId: currentUserId }
      });
      // Filter out REMOVED members on the frontend
      if (response.data?.members) {
        response.data.members = response.data.members.filter(m => m.role !== 'REMOVED');
        response.data.memberCount = response.data.members.length;
      }
      setInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch chat info', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chat?.id && currentUserId) {
      fetchInfo();
    }
  }, [chat?.id, currentUserId]);

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    try {
      await api.put(`/chats/${chat.id}/members/${userId}/role?requesterId=${currentUserId}&role=${newRole}`);
      fetchInfo();
    } catch (err) {
      console.error('Failed to update role', err);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await api.delete(`/chats/${chat.id}/members/${userId}?requesterId=${currentUserId}`);
        fetchInfo();
      } catch (err) {
        console.error('Failed to remove member', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-80 border-l border-slate-800 bg-slate-900/95 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="w-80 border-l border-slate-800 bg-slate-900/95 flex flex-col items-center justify-center h-full text-slate-500">
        Failed to load info
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-slate-800 bg-slate-900/95 flex flex-col h-full shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 bg-slate-900/95 backdrop-blur z-10 shrink-0">
        <h3 className="font-semibold text-slate-100">
          {info.type === 'PRIVATE' ? 'Contact Info' : 'Group Info'}
        </h3>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Main Info */}
      <div className="p-6 flex flex-col items-center border-b border-slate-800 shrink-0">
        <div className="w-24 h-24 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-3xl text-white overflow-hidden mb-4 shadow-lg">
          {info.image ? (
            <>
              <img src={formatImageUrl(info.image)} className="w-full h-full object-cover" alt={info.name} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
              <div style={{display: 'none'}} className="w-full h-full items-center justify-center">
                {info.name?.[0]?.toUpperCase() || (info.type === 'GROUP' ? <Users size={40} /> : <User size={40} />)}
              </div>
            </>
          ) : (
            info.name?.[0]?.toUpperCase() || (info.type === 'GROUP' ? <Users size={40} /> : <User size={40} />)
          )}
        </div>
        <h2 className="text-xl font-bold text-slate-100 text-center">{info.name}</h2>
        {info.type === 'PRIVATE' && info.status && (
          <span className="mt-2 px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm font-medium border border-slate-700">
            {onlineUsers[info.name] ? 'ONLINE' : 'OFFLINE'}
          </span>
        )}
      </div>

      {/* Details Section */}
      <div className="p-6 space-y-6 flex-1">
        {info.type === 'PRIVATE' ? (
          <>
            {info.email && (
              <div className="space-y-1">
                <div className="flex items-center text-slate-400 text-sm font-medium">
                  <Mail size={16} className="mr-2" /> Email
                </div>
                <div className="text-slate-200">{info.email}</div>
              </div>
            )}
            
            {info.bio && (
              <div className="space-y-1">
                <div className="flex items-center text-slate-400 text-sm font-medium">
                  <Info size={16} className="mr-2" /> About
                </div>
                <div className="text-slate-200">{info.bio}</div>
              </div>
            )}
            
            <div className="space-y-1">
              <div className="flex items-center text-slate-400 text-sm font-medium">
                <Clock size={16} className="mr-2" /> Last Seen
              </div>
              <div className="text-slate-200">
                {info.lastSeen ? new Date(info.lastSeen).toLocaleString() : 'Never'}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-sm font-medium mb-2">
                <span className="flex items-center"><Users size={16} className="mr-2" /> {info.memberCount} Members</span>
              </div>
              
              {chat.currentUserRole === 'ADMIN' && (
                <button 
                  onClick={onAddMember}
                  className="w-full flex items-center justify-center space-x-2 p-2 mt-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors border border-indigo-500/20 text-sm font-medium"
                >
                  <UserPlus size={16} />
                  <span>Add Participants</span>
                </button>
              )}

              <div className="space-y-3 mt-4">
                {info.members?.map(member => (
                  <div key={member.userId} className="flex items-center space-x-3 group relative">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0">
                      {member.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200 truncate">{member.username}</span>
                        {member.role === 'ADMIN' && (
                          <span className="text-[10px] uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full ml-2 shrink-0">Admin</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{onlineUsers[member.username] ? 'ONLINE' : 'OFFLINE'}</div>
                    </div>
                    
                    {chat.currentUserRole === 'ADMIN' && member.userId !== currentUserId && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center space-x-2 bg-slate-900/90 pl-4 py-1 rounded-l-lg">
                        <button onClick={() => handleRemoveMember(member.userId)} className="text-[10px] uppercase font-semibold px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/20 shadow-sm">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
              <div className="flex items-center text-slate-400 text-sm font-medium">
                <Info size={16} className="mr-2" /> Created By
              </div>
              <div className="text-slate-200">{info.createdByUsername || 'Unknown'}</div>
              <div className="text-xs text-slate-500 mt-1">
                on {new Date(info.createdAt).toLocaleDateString()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatInfoSidebar;
