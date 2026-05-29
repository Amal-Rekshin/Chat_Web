import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, MessageSquarePlus } from 'lucide-react';
const PrivateChatModal = ({
  onClose,
  onChatCreated
}) => {
  const {
    user
  } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    api.get('/users/mutual').then(res => setUsers(res.data.filter(u => u.id !== user?.id)));
  }, [user]);
  const startChat = async receiverId => {
    setLoading(true);
    try {
      await api.post('/chats/private', {
        senderId: user?.id,
        receiverId
      });
      onChatCreated();
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
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquarePlus size={20} className="text-indigo-400" />
            New Direct Message
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex flex-col h-[60vh] max-h-[400px] min-h-[300px]">
          <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-700 rounded-xl bg-slate-900/50 p-2 space-y-1">
            {users.map(u => <div key={u.id} onClick={() => !loading && startChat(u.id)} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-800 border border-transparent ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white shrink-0 shadow-sm border border-slate-600">
                  {u.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1 font-medium text-slate-200">{u.username}</div>
              </div>)}
            {users.length === 0 && <div className="text-center text-slate-500 p-4">No other users found.</div>}
          </div>
        </div>
      </div>
    </div>;
};
export default PrivateChatModal;