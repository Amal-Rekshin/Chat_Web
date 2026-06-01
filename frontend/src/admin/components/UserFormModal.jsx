import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import api from '../../services/api';

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["USER", "ADMIN"]),
  status: z.enum(["ONLINE", "OFFLINE", "DISABLED"]).optional(),
  password: z.string().optional(),
  groupIds: z.array(z.number()).optional()
});

const UserFormModal = ({ user, onClose, onSave }) => {
  const isEditing = !!user;
  const [groups, setGroups] = useState([]);
  
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      role: user?.role?.name || user?.role || 'USER',
      status: user?.status?.name || user?.status || 'OFFLINE',
      password: '',
      groupIds: []
    }
  });

  const selectedGroupIds = watch('groupIds') || [];

  useEffect(() => {
    // Fetch all groups for dropdown
    api.get('/admin/groups').then(res => setGroups(res.data)).catch(console.error);
    
    // Fetch user's existing groups if editing
    if (isEditing) {
      api.get(`/admin/users/${user.id}/groups`).then(res => {
        setValue('groupIds', res.data);
      }).catch(console.error);
    }
  }, [isEditing, user?.id, setValue]);

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await api.put(`/admin/users/${user.id}`, data);
      } else {
        await api.post('/admin/users', data);
      }
      onSave();
    } catch (error) {
      console.error("Failed to save user", error);
      alert("Failed to save user");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">{isEditing ? 'Edit User' : 'Create New User'}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input 
              {...register('username')} 
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
              {...register('email')} 
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password {isEditing && <span className="text-slate-500 text-xs">(leave blank to keep current)</span>}
            </label>
            <input 
              type="password"
              {...register('password')} 
              placeholder={isEditing ? "••••••••" : "Enter password"}
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
            <select 
              {...register('role')} 
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
            {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Assign Groups</label>
            <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-800 border border-slate-700 rounded-lg p-2">
              {groups.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-2">No groups available</p>
              ) : (
                groups.map(group => (
                  <label key={group.id} className="flex items-center space-x-2 p-1 hover:bg-slate-700 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedGroupIds.includes(group.id)}
                      onChange={(e) => {
                        const current = [...selectedGroupIds];
                        if (e.target.checked) {
                          setValue('groupIds', [...current, group.id]);
                        } else {
                          setValue('groupIds', current.filter(id => id !== group.id));
                        }
                      }}
                      className="rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-700"
                    />
                    <span className="text-slate-300 text-sm">{group.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
