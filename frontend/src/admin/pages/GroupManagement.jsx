import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '../../services/api';
import GroupTable from '../components/GroupTable';
import GroupMembersModal from '../components/GroupMembersModal';
import GroupFormModal from '../components/GroupFormModal';

const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/groups');
      setGroups(response.data);
    } catch (error) {
      console.error("Failed to fetch groups", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this group? All messages and members will be removed.")) {
      try {
        await api.delete(`/admin/groups/${id}`);
        fetchGroups();
      } catch (error) {
        console.error("Failed to delete group", error);
        alert("Failed to delete group");
      }
    }
  };

  const handleManageMembers = (id) => {
    setSelectedGroupId(id);
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Group Management</h1>
          <p className="text-slate-400">View and manage all active groups in the system</p>
        </div>
        <button 
          onClick={() => setShowFormModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus size={20} />
          <span>Create Group</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10"><span className="text-slate-400">Loading groups...</span></div>
      ) : (
        <div className="flex-1 min-h-0">
          <GroupTable 
            groups={groups} 
            onDelete={handleDelete} 
            onManageMembers={handleManageMembers}
          />
        </div>
      )}

      {selectedGroupId && (
        <GroupMembersModal 
          groupId={selectedGroupId} 
          onClose={() => setSelectedGroupId(null)} 
        />
      )}

      {showFormModal && (
        <GroupFormModal 
          onClose={() => setShowFormModal(false)}
          onSave={() => {
            setShowFormModal(false);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
};

export default GroupManagement;
