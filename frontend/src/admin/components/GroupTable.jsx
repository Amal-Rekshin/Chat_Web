import React, { useState } from 'react';
import { Search, Filter, Trash2, Users, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GroupTable = ({ groups, onDelete, onManageMembers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredGroups = groups.filter(group => 
    group.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/50">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search groups..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-sm text-slate-200 placeholder-slate-500 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 transition-all" 
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex items-center space-x-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-sm font-medium w-full sm:w-auto justify-center">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-800 sticky top-0">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Group Name</th>
              <th scope="col" className="px-6 py-4 font-semibold">Created By</th>
              <th scope="col" className="px-6 py-4 font-semibold">Created At</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroups.length > 0 ? filteredGroups.map((group) => (
              <tr key={group.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0 border border-purple-500/30">
                      <Users size={14} />
                    </div>
                    <div className="font-semibold text-slate-200">{group.name || 'Unnamed Group'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-300">
                  {group.createdBy ? group.createdBy.username : 'System'}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Unknown'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => onManageMembers(group.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
                      title="Manage Members"
                    >
                      <Users size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(group.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                      title="Delete Group"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                  No groups found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination (Mock) */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
        <span className="text-sm text-slate-500">Showing <span className="font-medium text-slate-300">{filteredGroups.length}</span> groups</span>
        <div className="flex space-x-1">
          <button className="px-3 py-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 disabled:opacity-50 text-sm">Prev</button>
          <button className="px-3 py-1 bg-indigo-600 text-white rounded font-medium text-sm">1</button>
          <button className="px-3 py-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 disabled:opacity-50 text-sm">Next</button>
        </div>
      </div>
    </div>
  );
};

export default GroupTable;
