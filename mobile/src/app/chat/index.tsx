// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { Search, LogOut, MessageSquarePlus, User, Users, X } from 'lucide-react-native';
import PrivateChatModal from '../../components/PrivateChatModal';
import GroupChatModal from '../../components/GroupChatModal';

const ChatList = () => {
  const { user, logout } = useAuth();
  const { onlineUsers, subscribeToNewMessages, connected } = useWebSocket();
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const router = useRouter();

  const fetchChats = () => {
    if (user?.id) {
      api.get(`/chats/user/${user.id}`).then(res => {
        const loadedChats = res.data;
        setChats(loadedChats);
        
        loadedChats.forEach(chat => {
          if (chat.unreadCount > 0) {
            api.post(`/chats/${chat.id}/delivered`, { userId: user.id }).catch((err: any) => console.error(err));
          }
        });
      }).catch((err: any) => console.error(err));
    }
  };
  
  useEffect(() => {
    fetchChats();
  }, [user]);

  useEffect(() => {
    let sub = null;
    if (user?.id && connected) {
      sub = subscribeToNewMessages(user.id, (payload: any) => {
        setChats(prev => {
          const updated = prev.map(chat => {
            if (chat.id === payload.chatId) {
              api.post(`/chats/${chat.id}/delivered`, { userId: user.id }).catch((err: any) => console.error(err));
              return {
                ...chat,
                lastMessage: payload.content,
                lastMessageAt: payload.createdAt,
                unreadCount: payload.senderId === user.id ? (chat.unreadCount || 0) : (chat.unreadCount || 0) + 1
              };
            }
            return chat;
          });
          return updated.sort((a, b) => {
            if (a.type === 'ANNOUNCEMENT' && b.type !== 'ANNOUNCEMENT') return -1;
            if (b.type === 'ANNOUNCEMENT' && a.type !== 'ANNOUNCEMENT') return 1;
            return new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt);
          });
        });
      });
    }
    return () => {
      // Return value isn't an object with unsubscribe on StompJS directly sometimes if null
    };
  }, [user, connected]);
  
  const handleSelectChat = (chat: any) => {
    if (chat.unreadCount > 0) {
      api.post(`/chats/${chat.id}/read`, { userId: user.id }).catch((err: any) => console.error(err));
      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
    }
    // Navigate to chat window
    router.push(`/chat/${chat.id}`);
  };

  const handleChatCreated = (chatId: number) => {
    fetchChats();
    router.push(`/chat/${chatId}`);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };
  
  const filteredChats = chats.filter(chat => {
    if (!chat.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.chatItem} onPress={() => handleSelectChat(item)}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || 'C'}</Text>
        </View>
        {item.type === 'PRIVATE' && onlineUsers[item.name] && (
          <View style={styles.onlineBadge} />
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, item.unreadCount > 0 && styles.unreadChatName]} numberOfLines={1}>
            {item.name || 'Unknown Chat'}
          </Text>
          {item.lastMessageAt && (
            <Text style={[styles.timeText, item.unreadCount > 0 && styles.unreadTimeText]}>
              {new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <View style={styles.chatFooter}>
          <Text style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessageText]} numberOfLines={1}>
            {item.lastMessage || 'No messages yet'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{user?.username?.[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{user?.username}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowActionSheet(true)}>
            <MessageSquarePlus color="#cbd5e1" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut color="#f87171" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search color="#64748b" size={18} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search chats..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No chats found.' : 'No chats yet.'}
            </Text>
          </View>
        }
      />

      {/* Action Sheet for New Chat */}
      {showActionSheet && (
        <View style={styles.actionSheetOverlay}>
          <TouchableOpacity style={styles.actionSheetBackdrop} onPress={() => setShowActionSheet(false)} />
          <View style={styles.actionSheetContainer}>
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle}>Create New Chat</Text>
              <TouchableOpacity onPress={() => setShowActionSheet(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.actionSheetItem}
              onPress={() => { setShowActionSheet(false); setShowPrivateModal(true); }}
            >
              <View style={[styles.actionSheetIcon, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                <User size={20} color="#818cf8" />
              </View>
              <Text style={styles.actionSheetItemText}>New Direct Message</Text>
            </TouchableOpacity>
            {user?.role === 'ADMIN' && (
              <TouchableOpacity 
                style={styles.actionSheetItem}
                onPress={() => { setShowActionSheet(false); setShowGroupModal(true); }}
              >
                <View style={[styles.actionSheetIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <Users size={20} color="#34d399" />
                </View>
                <Text style={styles.actionSheetItemText}>New Group Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Modals */}
      <PrivateChatModal 
        visible={showPrivateModal} 
        onClose={() => setShowPrivateModal(false)}
        onChatCreated={handleChatCreated}
      />
      <GroupChatModal 
        visible={showGroupModal} 
        onClose={() => setShowGroupModal(false)}
        onChatCreated={handleChatCreated}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    marginRight: 8,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 20,
  },
  searchContainer: {
    padding: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 20,
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
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    backgroundColor: '#10b981',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  unreadChatName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  unreadTimeText: {
    color: '#818cf8',
    fontWeight: '600',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    color: '#94a3b8',
    fontSize: 14,
    flex: 1,
    paddingRight: 8,
  },
  unreadMessageText: {
    color: '#e2e8f0',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
  actionSheetOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  actionSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionSheetContainer: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40, // Safe area padding
  },
  actionSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  actionSheetTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  actionSheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionSheetItemText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '500',
  }
});

export default ChatList;
