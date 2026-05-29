import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Search } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const schema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  image: z.string().url("Must be a valid image URL").optional().or(z.literal(''))
});

const GroupFormModal = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', image: '' }
  });

  useEffect(() => {
    api.get('/admin/users').then(res => {
      // Filter out current admin so they don't select themselves (they get added as creator)
      setUsers(res.data.filter(u => u.id !== user?.id));
    }).catch(console.error);
  }, [user?.id]);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (id) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubmit = async (data) => {
    if (selectedUserIds.size === 0) {
      alert("Please select at least one member.");
      return;
    }
    
    try {
      await api.post('/chats/group', {
        name: data.name,
        image: data.image || null,
        createdBy: user.id,
        memberIds: Array.from(selectedUserIds)
      });
      onSave();
    } catch (error) {
      console.error("Failed to create group", error);
      alert("Failed to create group");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-800 shrink-0">
          <h2 className="text-xl font-bold text-white">Create New Group</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col flex-1 overflow-hidden space-y-4">
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Group Name</label>
              <input 
                {...register('name')} 
                placeholder="Marketing Team..."
                className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Image URL (Optional)</label>
              <input 
                {...register('image')} 
                placeholder="https://example.com/icon.png"
                className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              {errors.image && <p className="text-red-400 text-xs mt-1">{errors.image.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Assign Members ({selectedUserIds.size} selected)</label>
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-800/50 border border-slate-700 rounded-lg p-2 custom-scrollbar">
                {filteredUsers.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-2">No users found</p>
                ) : (
                  filteredUsers.map(u => (
                    <label key={u.id} className="flex items-center space-x-3 p-2 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedUserIds.has(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-700 w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-200 text-sm font-medium truncate">{u.username}</div>
                        <div className="text-slate-500 text-xs truncate">{u.email}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800 shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || selectedUserIds.size === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupFormModal;
