import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';
const GroupModal = ({
  onClose,
  onGroupCreated
}) => {
  const {
    user
  } = useAuth();
  const [name, setName] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data.filter(u => u.id !== user?.id)));
  }, [user]);
  const toggleUser = id => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]);
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!name.trim() || selectedUsers.length === 0) return;
    setLoading(true);
    try {
      await api.post('/chats/group', {
        name,
        createdBy: user?.id,
        memberIds: selectedUsers
      });
      onGroupCreated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  return <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
          <h2 className="text-xl font-bold text-white">Create Group Chat</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 flex flex-col h-[60vh] max-h-[500px] min-h-[400px]">
          <div className="mb-4 shrink-0">
            <label className="block text-sm font-medium text-slate-300 mb-1">Group Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekend Plans" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>

          <label className="block text-sm font-medium text-slate-300 mb-2 shrink-0">Select Members</label>
          <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-700 rounded-xl bg-slate-900/50 p-2 space-y-1">
            {users.map(u => <div key={u.id} onClick={() => toggleUser(u.id)} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedUsers.includes(u.id) ? 'bg-indigo-600/20 border border-indigo-500/50' : 'hover:bg-slate-800 border border-transparent'}`}>
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {u.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1 font-medium text-slate-200">{u.username}</div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedUsers.includes(u.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600 bg-slate-800'}`}>
                  {selectedUsers.includes(u.id) && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>)}
            {users.length === 0 && <div className="text-center text-slate-500 p-4">No other users found.</div>}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700 shrink-0">
            <button type="submit" disabled={loading || !name.trim() || selectedUsers.length === 0} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Creating...' : `Create Group (${selectedUsers.length} members)`}
            </button>
          </div>
        </form>
      </div>
    </div>;
};
export default GroupModal;