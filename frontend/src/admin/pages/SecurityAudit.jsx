import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AuditTable from '../components/AuditTable';

const SecurityAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/audit-logs');
      setLogs(response.data);
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Security & Audit Logs</h1>
          <p className="text-slate-400 text-sm">Monitor critical system actions and admin activities</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          Refresh Logs
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10"><span className="text-slate-400">Loading audit logs...</span></div>
      ) : (
        <div className="flex-1 min-h-0">
          <AuditTable logs={logs} />
        </div>
      )}
    </div>
  );
};

export default SecurityAudit;
