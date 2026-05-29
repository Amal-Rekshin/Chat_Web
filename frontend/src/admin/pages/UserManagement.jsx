import React, { useState, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import api from '../../services/api';
import UserTable from '../components/UserTable';
import UserFormModal from '../components/UserFormModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };



  const handleExportCSV = () => {
    if (users.length === 0) return;
    
    // Headers
    const headers = ['ID', 'Username', 'Email', 'Role', 'Status', 'Last Seen'];
    
    // Rows
    const rows = users.map(user => [
      user.id,
      user.username,
      user.email,
      user.role?.name || user.role,
      user.status?.name || user.status || 'OFFLINE',
      user.lastSeen ? new Date(user.lastSeen).toISOString() : 'Never'
    ]);
    
    // Combine
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'users_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
          <p className="text-slate-400 text-sm">Manage organization members, roles, and access</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button 
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors font-medium"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={handleCreate}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10"><span className="text-slate-400">Loading users...</span></div>
      ) : (
        <div className="flex-1 min-h-0">
          <UserTable 
            users={users} 
            onEdit={handleEdit} 
          />
        </div>
      )}

      {modalOpen && (
        <UserFormModal 
          user={selectedUser} 
          onClose={() => setModalOpen(false)} 
          onSave={() => {
            setModalOpen(false);
            fetchUsers();
          }} 
        />
      )}
    </div>
  );
};

export default UserManagement;
