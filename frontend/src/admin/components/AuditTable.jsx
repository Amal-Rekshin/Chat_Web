import React, { useState } from 'react';
import { Search, ShieldAlert, CheckCircle, Info } from 'lucide-react';

const AuditTable = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.adminUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionIcon = (action) => {
    if (action.includes('DELETE') || action.includes('DISABLE')) return <ShieldAlert size={16} className="text-red-400" />;
    if (action.includes('CREATE')) return <CheckCircle size={16} className="text-emerald-400" />;
    return <Info size={16} className="text-blue-400" />;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/50">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search audit logs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-sm text-slate-200 placeholder-slate-500 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 transition-all" 
          />
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-800 sticky top-0">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Timestamp</th>
              <th scope="col" className="px-6 py-4 font-semibold">Admin User</th>
              <th scope="col" className="px-6 py-4 font-semibold">Action</th>
              <th scope="col" className="px-6 py-4 font-semibold">Details</th>
              <th scope="col" className="px-6 py-4 font-semibold">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-200">{log.adminUsername}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {getActionIcon(log.action)}
                    <span className="font-medium text-slate-300">{log.action}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-400">
                  {log.details}
                </td>
                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                  {log.ipAddress || 'Unknown'}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
        <span className="text-sm text-slate-500">Showing <span className="font-medium text-slate-300">{filteredLogs.length}</span> events</span>
      </div>
    </div>
  );
};

export default AuditTable;
