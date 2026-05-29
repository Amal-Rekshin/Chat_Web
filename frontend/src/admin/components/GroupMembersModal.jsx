import React, { useState, useEffect } from 'react';
import { X, Shield, User } from 'lucide-react';
import api from '../../services/api';

const GroupMembersModal = ({ groupId, onClose }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/groups/${groupId}/members`);
      setMembers(response.data);
    } catch (error) {
      console.error("Failed to fetch group members", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchMembers();
    }
  }, [groupId]);

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    try {
      await api.put(`/admin/groups/${groupId}/members/${userId}/role`, { role: newRole });
      fetchMembers(); // refresh
    } catch (error) {
      console.error("Failed to update member role", error);
    }
  };

  const removeMember = async (userId) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      try {
        await api.delete(`/admin/groups/${groupId}/members/${userId}`);
        fetchMembers();
      } catch (error) {
        console.error("Failed to remove member", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">Manage Group Members</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Loading members...</div>
          ) : members.length > 0 ? (
            <div className="space-y-3">
              {members.map(member => (
                <div key={member.userId} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">{member.username}</div>
                      <div className="text-xs text-slate-500">{member.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      member.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-700/50 text-slate-400 border-slate-600'
                    }`}>
                      {member.role}
                    </span>
                    {member.role !== 'REMOVED' && (
                      <>
                        <button 
                          onClick={() => toggleRole(member.userId, member.role)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            member.role === 'ADMIN' 
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' 
                            : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 border border-indigo-500/30'
                          }`}
                        >
                          {member.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                        <button 
                          onClick={() => removeMember(member.userId)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/30 transition-colors"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">No members found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupMembersModal;
