import React, { useState } from 'react';
import { Search, Filter, Edit, Trash2 } from 'lucide-react';

const DepartmentTable = ({ departments, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/50">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search departments..." 
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
              <th scope="col" className="px-6 py-4 font-semibold">Name</th>
              <th scope="col" className="px-6 py-4 font-semibold">Description</th>
              <th scope="col" className="px-6 py-4 font-semibold">Created At</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.length > 0 ? filteredDepartments.map((dept) => (
              <tr key={dept.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-200">{dept.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-slate-400 truncate max-w-xs">{dept.description || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : 'Unknown'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => onEdit(dept)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
                      title="Edit Department"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(dept.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                  No departments found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination (Mock) */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
        <span className="text-sm text-slate-500">Showing <span className="font-medium text-slate-300">{filteredDepartments.length}</span> departments</span>
        <div className="flex space-x-1">
          <button className="px-3 py-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 disabled:opacity-50 text-sm">Prev</button>
          <button className="px-3 py-1 bg-indigo-600 text-white rounded font-medium text-sm">1</button>
          <button className="px-3 py-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 disabled:opacity-50 text-sm">Next</button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentTable;
