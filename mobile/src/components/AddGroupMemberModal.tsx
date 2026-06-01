import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Search } from 'lucide-react-native';
import api from '../services/api';

interface AddGroupMemberModalProps {
  visible: boolean;
  chat: any;
  currentUserId: number;
  onClose: () => void;
  onAdded: () => void;
}

const AddGroupMemberModal: React.FC<AddGroupMemberModalProps> = ({
  visible,
  chat,
  currentUserId,
  onClose,
  onAdded
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      api.get('/users')
        .then(res => {
          const currentMemberIds = chat?.members?.map((m: any) => m.userId) || [];
          const availableUsers = res.data.filter((u: any) => !currentMemberIds.includes(u.id));
          setUsers(availableUsers);
        })
        .catch(err => console.error("Failed to fetch users", err))
        .finally(() => setLoading(false));
    }
  }, [visible, chat]);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUser = (id: number) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUserIds(newSelected);
  };

  const handleAddMembers = async () => {
    if (selectedUserIds.size === 0) return;
    setSubmitting(true);
    try {
      await api.post(`/chats/${chat.id}/members`, {
        requesterId: currentUserId,
        userIds: Array.from(selectedUserIds)
      });
      onAdded();
      onClose();
      setSelectedUserIds(new Set());
      setSearchTerm('');
    } catch (error) {
      console.error("Failed to add members", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Members</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Search color="#64748b" size={18} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor="#64748b"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
          </View>

          <View style={styles.content}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator color="#6366f1" />
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={item => item.id.toString()}
                ListEmptyComponent={
                  <View style={styles.center}>
                    <Text style={styles.emptyText}>No available users found.</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = selectedUserIds.has(item.id);
                  return (
                    <TouchableOpacity
                      style={[styles.userRow, isSelected && styles.userRowSelected]}
                      onPress={() => toggleUser(item.id)}
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.username}>{item.username}</Text>
                        <Text style={styles.email}>{item.email}</Text>
                      </View>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.submitButton, (selectedUserIds.size === 0 || submitting) && styles.submitDisabled]}
              disabled={selectedUserIds.size === 0 || submitting}
              onPress={handleAddMembers}
            >
              <Text style={styles.submitText}>
                {submitting ? 'Adding...' : `Add ${selectedUserIds.size > 0 ? selectedUserIds.size : ''} Members`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    flexDirection: 'col',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    paddingVertical: 10,
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginBottom: 4,
  },
  userRowSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#818cf8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  email: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: '#1e293b',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  }
});

export default AddGroupMemberModal;
