import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { LogOut, Bell, Search, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminTopNav = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [announcements, setAnnouncements] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await api.get('/announcements');
        setAnnouncements(response.data.slice(0, 5)); // Show top 5
        setUnreadCount(response.data.length > 0 ? 1 : 0); // Mock unread count
      } catch (error) {
        console.error("Failed to fetch announcements", error);
      }
    };
    fetchAnnouncements();
  }, []);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) setUnreadCount(0);
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex items-center flex-1">
        <button onClick={onMenuClick} className="p-2 md:hidden text-slate-400 hover:text-white transition-colors mr-2">
          <Menu size={24} />
        </button>
        <div className="relative w-full max-w-xs hidden sm:block md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search admin portal..." 
            className="w-full bg-slate-800 text-sm text-slate-200 placeholder-slate-500 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 transition-all" 
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <button onClick={toggleNotifications} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors relative">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-semibold text-white text-sm">System Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {announcements.length > 0 ? announcements.map((ann) => (
                  <div key={ann.id} className="p-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-slate-200 text-sm">{ann.title}</span>

                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{ann.content}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(ann.createdAt).toLocaleString()}</p>
                  </div>
                )) : (
                  <div className="p-4 text-center text-slate-500 text-sm">No new notifications</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-slate-700 mx-2"></div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{user?.username || 'Admin'}</p>
            <p className="text-xs text-indigo-400 font-medium">Super Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md border-2 border-slate-800">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>

        <button 
          onClick={handleLogout} 
          className="p-2 ml-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default AdminTopNav;
