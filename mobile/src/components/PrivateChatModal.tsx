import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator } from 'react-native';
import { X, MessageSquarePlus } from 'lucide-react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PrivateChatModalProps {
  visible: boolean;
  onClose: () => void;
  onChatCreated: (chatId: number) => void;
}

const PrivateChatModal: React.FC<PrivateChatModalProps> = ({ visible, onClose, onChatCreated }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (visible && user?.id) {
      setFetching(true);
      api.get('/users/mutual')
        .then(res => {
          setUsers(res.data.filter((u: any) => u.id !== user.id));
        })
        .catch(err => console.error(err))
        .finally(() => setFetching(false));
    }
  }, [visible, user]);

  const startChat = async (receiverId: number) => {
    setLoading(true);
    try {
      const res = await api.post('/chats/private', {
        senderId: user?.id,
        receiverId
      });
      // The API returns the created chat, we pass the ID to redirect
      onChatCreated(res.data.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <MessageSquarePlus size={20} color="#818cf8" />
              <Text style={styles.headerTitle}>New Direct Message</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
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
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.userRow, loading && styles.disabled]}
                    disabled={loading}
                    onPress={() => startChat(item.id)}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.username}>{item.username}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </View>
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
    height: '70%',
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
    borderColor: '#334155',
  },
  disabled: {
    opacity: 0.5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  }
});

export default PrivateChatModal;
