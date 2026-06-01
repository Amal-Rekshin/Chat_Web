import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Users } from 'lucide-react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface GroupChatModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: (chatId: number) => void;
}

const GroupChatModal: React.FC<GroupChatModalProps> = ({ visible, onClose, onGroupCreated }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (visible && user?.id) {
      setFetching(true);
      // Fetch all users to add to group
      api.get('/users')
        .then(res => {
          setUsers(res.data.filter((u: any) => u.id !== user.id));
        })
        .catch(err => console.error(err))
        .finally(() => setFetching(false));
    }
  }, [visible, user]);

  const toggleUser = (id: number) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || selectedUsers.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/chats/group', {
        name,
        createdBy: user?.id,
        memberIds: selectedUsers
      });
      onGroupCreated(res.data.id);
      onClose();
      // Reset form
      setName('');
      setSelectedUsers([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Users size={20} color="#818cf8" />
              <Text style={styles.headerTitle}>Create Group Chat</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Weekend Plans"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Select Members</Text>
            {fetching ? (
              <View style={styles.center}>
                <ActivityIndicator color="#6366f1" />
              </View>
            ) : (
              <FlatList
                data={users}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                  <View style={styles.center}>
                    <Text style={styles.emptyText}>No users found.</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = selectedUsers.includes(item.id);
                  return (
                    <TouchableOpacity
                      style={[styles.userRow, isSelected && styles.userRowSelected]}
                      onPress={() => toggleUser(item.id)}
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.username}>{item.username}</Text>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TouchableOpacity 
              style={[styles.submitButton, (!name.trim() || selectedUsers.length === 0 || loading) && styles.submitDisabled]}
              disabled={!name.trim() || selectedUsers.length === 0 || loading}
              onPress={handleSubmit}
            >
              <Text style={styles.submitText}>
                {loading ? 'Creating...' : `Create Group (${selectedUsers.length} members)`}
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
    height: '80%',
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
    flexDirection: 'col',
  },
  label: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  userRowSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  username: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#1e293b',
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
  submitButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
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

export default GroupChatModal;
