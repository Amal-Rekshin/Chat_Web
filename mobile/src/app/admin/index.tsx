// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { useRouter } from 'expo-router';
import { Users, MessageSquare, Building2, Activity, LogOut, Megaphone, Settings, Shield } from 'lucide-react-native';
import api from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, colorClass, iconColor }) => (
  <View style={styles.card}>
    <View style={styles.cardContent}>
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
      <View style={[styles.iconContainer, colorClass]}>
        <Icon size={24} color={iconColor} />
      </View>
    </View>
  </View>
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
  const { logout } = useAuth();
  const router = useRouter();

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
      sub = subscribeToAdminStats((newStats: any) => {
        setStats(newStats);
      });
    }
    return () => {
      // Safely unsubscribe
    };
  }, [connected]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Real-time organization statistics</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#f87171" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.grid}>
            <StatCard 
              title="Total Users" 
              value={stats.totalUsers} 
              icon={Users} 
              colorClass={styles.bgBlue} 
              iconColor="#3b82f6"
            />
            <StatCard 
              title="Active Groups" 
              value={stats.activeGroups} 
              icon={Building2} 
              colorClass={styles.bgPurple} 
              iconColor="#a855f7"
            />
            <StatCard 
              title="Total Messages" 
              value={stats.totalMessages} 
              icon={MessageSquare} 
              colorClass={styles.bgEmerald} 
              iconColor="#10b981"
            />
            <StatCard 
              title="Online Users" 
              value={stats.onlineUsers} 
              icon={Activity} 
              colorClass={styles.bgOrange} 
              iconColor="#f97316"
            />
          </View>
          
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Activity Trends</Text>
            {stats.activityTrends && stats.activityTrends.length > 0 ? (
              <View style={styles.giftedChartContainer}>
                <LineChart
                  data={stats.activityTrends.map((item: any) => ({
                    value: item.messages || 0,
                    label: (item.name || '').substring(0, 3)
                  }))}
                  width={Dimensions.get("window").width - 80}
                  height={220}
                  thickness={3}
                  color="#818cf8"
                  dataPointsColor="#c7d2fe"
                  yAxisTextStyle={{color: '#94a3b8'}}
                  xAxisLabelTextStyle={{color: '#94a3b8'}}
                  yAxisColor="#334155"
                  xAxisColor="#334155"
                  curved
                  isAnimated
                  rulesColor="#1e293b"
                  rulesType="solid"
                />
              </View>
            ) : (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>Not enough data to display trends.</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Management Menu</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/users')}>
            <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <Users size={20} color="#3b82f6" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>User Management</Text>
              <Text style={styles.menuSubtitle}>Manage roles, statuses, and profiles</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/groups')}>
            <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
              <Building2 size={20} color="#a855f7" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Group Management</Text>
              <Text style={styles.menuSubtitle}>Create and manage organization groups</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/announcements')}>
            <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Megaphone size={20} color="#ef4444" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Announcements</Text>
              <Text style={styles.menuSubtitle}>Broadcast messages to all users</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/audit')}>
            <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(52, 211, 153, 0.2)' }]}>
              <Shield size={20} color="#34d399" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Audit Logs</Text>
              <Text style={styles.menuSubtitle}>View system security and action logs</Text>
            </View>
          </TouchableOpacity>

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  logoutButton: {
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 16,
  },
  scrollContainer: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  bgPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  bgEmerald: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  bgOrange: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
  },
  chartContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  giftedChartContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    paddingTop: 30,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    overflow: 'hidden'
  },
  infoBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  }
});

export default AdminDashboard;
