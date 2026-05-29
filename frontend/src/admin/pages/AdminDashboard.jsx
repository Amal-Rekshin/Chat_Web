import React, { useEffect, useState } from 'react';
import { Users, MessageSquare, Building2, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';

const mockChartData = [
  { name: 'Mon', users: 400, messages: 2400 },
  { name: 'Tue', users: 300, messages: 1398 },
  { name: 'Wed', users: 200, messages: 9800 },
  { name: 'Thu', users: 278, messages: 3908 },
  { name: 'Fri', users: 189, messages: 4800 },
  { name: 'Sat', users: 239, messages: 3800 },
  { name: 'Sun', users: 349, messages: 4300 },
];

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
      </div>
      <div className={`p-4 rounded-full ${colorClass}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeGroups: 0,
    totalMessages: 0,
    onlineUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const { subscribeToAdminStats, connected } = useWebSocket();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    let sub = null;
    if (connected) {
      sub = subscribeToAdminStats((newStats) => {
        setStats(newStats);
      });
    }
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [connected, subscribeToAdminStats]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard Overview</h1>
        <p className="text-slate-400 text-sm">Real-time statistics for your organization's chat system</p>
      </div>

      {loading ? (
        <div className="text-center py-10"><span className="text-slate-400">Loading dashboard data...</span></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers} 
            icon={Users} 
            colorClass="bg-blue-600/20 text-blue-500 border border-blue-500/20" 
          />
          <StatCard 
            title="Active Groups" 
            value={stats.activeGroups} 
            icon={Building2} 
            colorClass="bg-purple-600/20 text-purple-500 border border-purple-500/20" 
          />
          <StatCard 
            title="Total Messages" 
            value={stats.totalMessages} 
            icon={MessageSquare} 
            colorClass="bg-emerald-600/20 text-emerald-500 border border-emerald-500/20" 
          />
          <StatCard 
            title="Online Users" 
            value={stats.onlineUsers} 
            icon={Activity} 
            colorClass="bg-orange-600/20 text-orange-500 border border-orange-500/20" 
          />
        </div>
      )}

      {/* Analytics Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm mt-8">
        <h2 className="text-lg font-semibold text-white mb-6">Activity Trends (Mock Data)</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#475569" tick={{fill: '#94a3b8'}} />
              <YAxis stroke="#475569" tick={{fill: '#94a3b8'}} />
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Area type="monotone" dataKey="messages" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorMessages)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
