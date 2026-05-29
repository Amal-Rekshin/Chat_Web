import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '../../services/api';
import DepartmentTable from '../components/DepartmentTable';
import DepartmentFormModal from '../components/DepartmentFormModal';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error("Failed to fetch departments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = () => {
    setSelectedDepartment(null);
    setModalOpen(true);
  };

  const handleEdit = (dept) => {
    setSelectedDepartment(dept);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this department? Users in this department will have their department cleared.")) {
      try {
        await api.delete(`/admin/departments/${id}`);
        fetchDepartments();
      } catch (error) {
        console.error("Failed to delete department", error);
        alert("Failed to delete department");
      }
    }
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Departments</h1>
          <p className="text-slate-400 text-sm">Organize users into structural units</p>
        </div>
        <div className="flex w-full sm:w-auto">
          <button 
            onClick={handleCreate}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10"><span className="text-slate-400">Loading departments...</span></div>
      ) : (
        <div className="flex-1 min-h-0">
          <DepartmentTable 
            departments={departments} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        </div>
      )}

      {modalOpen && (
        <DepartmentFormModal 
          department={selectedDepartment} 
          onClose={() => setModalOpen(false)} 
          onSave={() => {
            setModalOpen(false);
            fetchDepartments();
          }} 
        />
      )}
    </div>
  );
};

export default DepartmentManagement;
