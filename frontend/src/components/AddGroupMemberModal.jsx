import React, { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';
import api from '../services/api';

const AddGroupMemberModal = ({ chat, currentUserId, onClose, onAdded }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        // Filter out users who are already in the chat
        const currentMemberIds = chat.members?.map(m => m.userId) || [];
        const availableUsers = response.data.filter(u => !currentMemberIds.includes(u.id));
        setUsers(availableUsers);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUser = (id) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUserIds(newSelected);
  };

  const handleAddMembers = async () => {
    if (selectedUserIds.size === 0) return;
    
    setSubmitting(true);
    try {
      await api.post(`/chats/${chat.id}/members`, {
        requesterId: currentUserId,
        userIds: Array.from(selectedUserIds)
      });
      onAdded();
      onClose();
    } catch (error) {
      console.error("Failed to add members", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Add Members</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 text-sm text-slate-200 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-slate-700"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-sm">Loading users...</div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-1">
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  onClick={() => toggleUser(user.id)}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedUserIds.has(user.id) ? 'bg-indigo-500/10' : 'hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-200 text-sm truncate">{user.username}</h4>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedUserIds.has(user.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-600'
                  }`}>
                    {selectedUserIds.has(user.id) && <Check size={12} />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm">No users found.</div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button 
            onClick={handleAddMembers}
            disabled={selectedUserIds.size === 0 || submitting}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Adding...' : `Add ${selectedUserIds.size > 0 ? selectedUserIds.size : ''} Members`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGroupMemberModal;
