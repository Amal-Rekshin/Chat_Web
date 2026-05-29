import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Megaphone, AlertCircle, Info } from 'lucide-react';
import api from '../../services/api';
import AnnouncementFormModal from '../components/AnnouncementFormModal';

const AnnouncementsManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/announcements');
      setAnnouncements(response.data);
    } catch (error) {
      console.error("Failed to fetch announcements", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (data) => {
    try {
      await api.post('/announcements', data);
      fetchAnnouncements();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create announcement", error);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await api.delete(`/announcements/${id}`);
        fetchAnnouncements();
      } catch (error) {
        console.error("Failed to delete announcement", error);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Announcements</h1>
          <p className="text-slate-400 text-sm">Broadcast global messages to all organization members</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-indigo-600/20"
        >
          <Plus size={18} />
          <span>New Announcement</span>
        </button>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-6 overflow-y-auto">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading announcements...</div>
        ) : announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors flex items-start justify-between group">
                <div className="flex gap-4 items-start">
                  <div className={`p-2 rounded-lg border bg-blue-400/10 text-blue-400 border-blue-400/20`}>
                    <Megaphone size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{ann.title}</h3>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{ann.content}</p>
                    <div className="text-xs text-slate-500">
                      Broadcasted by <span className="font-medium text-slate-400">{ann.createdBy}</span> on {new Date(ann.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Announcement"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 flex flex-col items-center">
            <Megaphone size={48} className="text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-1">No active announcements</h3>
            <p className="text-slate-500">Click the button above to broadcast a new message.</p>
          </div>
        )}
      </div>

      <AnnouncementFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateAnnouncement}
      />
    </div>
  );
};

export default AnnouncementsManagement;
