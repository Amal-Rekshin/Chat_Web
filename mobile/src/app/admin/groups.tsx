// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, ChevronLeft, Trash2, Building2, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ChatInfoModal from '../../components/ChatInfoModal';

const GroupsManagement = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');

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

  const openCreateModal = () => {
    setGroupName('');
    setDescription('');
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? All messages and members will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/groups/${id}`);
              fetchGroups();
            } catch (error) {
              console.error("Failed to delete group", error);
              Alert.alert('Error', 'Failed to delete group');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!groupName) {
      Alert.alert('Error', 'Group name is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Must map to /chats/group, and requires createdBy and memberIds arrays
      // We will create the group with just the current user (admin) for now, and they can add others later, 
      // or we can just pass empty memberIds since backend handles it.
      await api.post('/chats/group', { 
        name: groupName, 
        image: null,
        createdBy: user?.id,
        memberIds: []
      });
      setModalVisible(false);
      fetchGroups();
    } catch (error) {
      console.error("Failed to create group", error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.avatar}>
          <Building2 size={24} color="#a855f7" />
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description || 'No description provided.'}
          </Text>
          <Text style={styles.memberCount}>{item.members?.length || 0} members</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => { setSelectedGroup(item); setShowInfo(true); }} style={styles.manageButton}>
          <Users size={20} color="#818cf8" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
          <Trash2 size={20} color="#f87171" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Management</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Plus size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Group</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Group Name</Text>
              <TextInput
                style={styles.input}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Enter group name"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Create Group</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reusing ChatInfoModal which handles viewing, adding, and removing members */}
      <ChatInfoModal 
        visible={showInfo} 
        chat={{ ...selectedGroup, currentUserRole: 'ADMIN' }} // Force ADMIN so we get the manage features
        currentUserId={user?.id}
        onlineUsers={{}} // Admin dashboard might not need online statuses right now
        onClose={() => { setShowInfo(false); fetchGroups(); }} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  addButton: {
    backgroundColor: '#4f46e5',
    padding: 8,
    borderRadius: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  details: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 6,
  },
  memberCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818cf8',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageButton: {
    padding: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    color: '#f8fafc',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default GroupsManagement;
