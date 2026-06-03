// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Keyboard, Alert, ActionSheetIOS } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Send, Smile, Info, Plus, X } from 'lucide-react-native';
import MessageBubble from '../../components/MessageBubble';
import ChatInfoModal from '../../components/ChatInfoModal';

const ChatRoom = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { client, connected, onlineUsers, subscribeToTyping, sendMessage, sendTypingEvent } = useWebSocket();

  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [memberStatuses, setMemberStatuses] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [replyingToMessage, setReplyingToMessage] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const flatListRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      if (!user || !user.id) return;

      // Fetch chat details
      api.get(`/chats/user/${user.id}?_t=${Date.now()}`).then(res => {
        const currentChat = res.data.find((c: any) => c.id === parseInt(id as string));
        if (currentChat) setChat(currentChat);
      });

      // Fetch initial messages and statuses
      Promise.all([
        api.get(`/chats/${id}/messages?_t=${Date.now()}`),
        api.get(`/chats/${id}/member-status?_t=${Date.now()}`)
      ]).then(([messagesRes, statusRes]) => {
        setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
        setMemberStatuses(Array.isArray(statusRes.data) ? statusRes.data : []);
        
        // Mark read
        if (messagesRes.data && messagesRes.data.length > 0) {
          api.post(`/chats/${id}/read`, { userId: user.id }).catch((err: any) => console.error(err));
        }
      }).catch((err: any) => console.error('Failed to load chat data:', err));
    }, [id, user])
  );

  useEffect(() => {
    let subChat: any;
    let subTyping: any;
    let subStatus: any;

    if (client && connected && chat) {
      subChat = client.subscribe(`/topic/chat/${id}`, (message: any) => {
        const payload = JSON.parse(message.body);
        setMessages(prev => {
          const arr = Array.isArray(prev) ? prev : [];
          const idx = arr.findIndex(m => m.id === payload.id);
          if (idx >= 0) {
            const copy = [...arr];
            copy[idx] = { ...copy[idx], ...payload };
            return copy;
          }
          return [...arr, payload];
        });
        
        if (payload.senderId !== user?.id) {
            api.post(`/chats/${id}/read`, { userId: user.id }).catch((err: any) => console.error(err));
        }
      });

      subTyping = subscribeToTyping(id as string, (payload: any) => {
        if (payload.userId !== user?.id) {
          setTypingUsers(prev => {
            const next = new Set(prev);
            if (payload.typing) next.add(payload.username);
            else next.delete(payload.username);
            return next;
          });
        }
      });

      subStatus = client.subscribe(`/topic/chat/${id}/status`, (message: any) => {
        const payload = JSON.parse(message.body);
        setMemberStatuses(prev => {
           const existing = prev.findIndex(s => s.userId === payload.userId);
           if (existing >= 0) {
               const copy = [...prev];
               copy[existing] = { ...copy[existing], lastDeliveredId: payload.lastDeliveredId, lastReadId: payload.lastReadId };
               return copy;
           }
           return [...prev, payload];
        });
      });
    }
    
    return () => {
      if (subChat) subChat.unsubscribe();
      if (subTyping) subTyping.unsubscribe();
      if (subStatus) subStatus.unsubscribe();
    };
  }, [id, client, connected, user?.id, chat]);

  const handleInputChange = (text: string) => {
    setInput(text);
    sendTypingEvent(id, true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingEvent(id, false);
    }, 2000);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    if (editingMessage) {
      // Assuming sendEditMessageEvent exists in WebSocketContext.js (need to ensure it does)
      if (client && connected) {
        client.publish({
          destination: `/app/chat/${id}/editMessage`,
          body: JSON.stringify({ messageId: editingMessage.id, content: input.trim() })
        });
      }
      setEditingMessage(null);
    } else {
      sendMessage(parseInt(id as string), input.trim(), 'TEXT', null, replyingToMessage?.id);
    }
    
    setInput('');
    setReplyingToMessage(null);
    sendTypingEvent(id as string, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    Keyboard.dismiss();
  };

  const handleFileUpload = async (result: any, type: 'IMAGE' | 'FILE') => {
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }
    
    setShowAttachMenu(false);
    setUploading(true);
    
    const asset = result.assets[0];
    const formData = new FormData();
    
    if (Platform.OS === 'web' && asset.file) {
      formData.append('file', asset.file);
    } else {
      // React Native FormData requires specific formatting for files
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || asset.name || (type === 'IMAGE' ? 'upload.jpg' : 'document.pdf'),
        type: asset.mimeType || (type === 'IMAGE' ? 'image/jpeg' : 'application/pdf')
      } as any);
    }
    
    // On web, setting Content-Type manually breaks FormData boundary. Let Axios handle it.
    const config = Platform.OS === 'web' ? {} : { headers: { 'Content-Type': 'multipart/form-data' } };
    
    try {
      const res = await api.post('/upload', formData, config);
      
      const { fileUrl, fileName } = res.data;
      sendMessage(parseInt(id as string), fileName, type, fileUrl, replyingToMessage?.id);
      setReplyingToMessage(null);
    } catch (err) {
      console.error('File upload failed', err);
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.8,
    });
    handleFileUpload(result, 'IMAGE');
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    handleFileUpload(result, 'FILE');
  };

  const showMessageActions = (msg: any) => {
    const isOwn = msg.senderId === user?.id || msg.sender?.id === user?.id;
    const isEditable = isOwn && msg.createdAt && (new Date().getTime() - new Date(msg.createdAt).getTime()) < 60 * 60 * 1000;
    
    const options = ['Reply'];
    if (isEditable) options.push('Edit');
    if (isOwn) options.push('Delete');
    options.push('Cancel');

    const destructiveButtonIndex = isOwn ? options.indexOf('Delete') : undefined;
    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex, destructiveButtonIndex },
        (buttonIndex) => {
          if (options[buttonIndex] === 'Reply') {
            setReplyingToMessage(msg);
            setEditingMessage(null);
          } else if (options[buttonIndex] === 'Edit') {
            setEditingMessage(msg);
            setReplyingToMessage(null);
            setInput(msg.content);
          } else if (options[buttonIndex] === 'Delete') {
            api.delete(`/chats/${id}/messages/${msg.id}`).catch((err: any) => console.error(err));
          }
        }
      );
    } else {
      // Android basic fallback using Alert
      Alert.alert('Message Actions', '', [
        { text: 'Reply', onPress: () => { setReplyingToMessage(msg); setEditingMessage(null); } },
        ...(isEditable ? [{ text: 'Edit', onPress: () => { setEditingMessage(msg); setReplyingToMessage(null); setInput(msg.content); } }] : []),
        ...(isOwn ? [{ text: 'Delete', onPress: () => api.delete(`/chats/${id}/messages/${msg.id}`).catch((err: any) => console.error(err)), style: 'destructive' as any }] : []),
        { text: 'Cancel', style: 'cancel' }
      ]);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.senderId === user?.id || item.sender?.id === user?.id;
    let status: 'SENT' | 'DELIVERED' | 'READ' = 'SENT';
    
    if (isOwn && memberStatuses.length > 0) {
      const others = memberStatuses.filter(s => s.userId !== user?.id);
      if (others.length > 0) {
        const maxRead = Math.max(...others.map(s => s.lastReadId || 0), 0);
        const maxDelivered = Math.max(...others.map(s => s.lastDeliveredId || 0), 0);
        if (item.id <= maxRead) status = 'READ';
        else if (item.id <= maxDelivered) status = 'DELIVERED';
      }
    }

    return (
      <MessageBubble 
        message={item} 
        isOwn={isOwn} 
        status={status} 
        onLongPress={showMessageActions}
      />
    );
  };

  if (!chat) {
    return <SafeAreaView style={styles.container} />
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/chat');
          }
        }}>
          <ChevronLeft color="#cbd5e1" size={28} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{chat.name}</Text>
          {chat.type === 'PRIVATE' && onlineUsers[chat.name] && (
            <Text style={styles.headerSubtitle}>Online</Text>
          )}
        </View>
        <TouchableOpacity style={styles.infoButton} onPress={() => setShowInfo(true)}>
          <Info color="#cbd5e1" size={24} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        
        {typingUsers.size > 0 && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </Text>
          </View>
        )}

        {chat.type === 'ANNOUNCEMENT' ? (
          <View style={styles.noChatBanner}>
            <Text style={styles.noChatText}>Only admins can broadcast announcements</Text>
          </View>
        ) : chat.canMessage === false ? (
          <View style={styles.noChatBanner}>
            <Text style={styles.noChatText}>No longer chat available</Text>
          </View>
        ) : (
          <View style={styles.inputWrapper}>
            {editingMessage && (
              <View style={styles.contextBanner}>
                <Text style={styles.contextBannerText}>Editing message...</Text>
                <TouchableOpacity onPress={() => { setEditingMessage(null); setInput(''); }}>
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            )}
            {replyingToMessage && (
              <View style={styles.contextBanner}>
                <View style={styles.contextBannerContent}>
                  <Text style={styles.contextBannerTitle}>Replying to {replyingToMessage.senderName || replyingToMessage.sender?.username}</Text>
                  <Text style={styles.contextBannerSubtitle} numberOfLines={1}>{replyingToMessage.content}</Text>
                </View>
                <TouchableOpacity onPress={() => setReplyingToMessage(null)}>
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.attachButton} onPress={() => setShowAttachMenu(!showAttachMenu)}>
                <Plus color={showAttachMenu ? "#818cf8" : "#94a3b8"} size={24} />
              </TouchableOpacity>
              
              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={handleInputChange}
                placeholder={uploading ? "Uploading..." : "Type a message..."}
                placeholderTextColor="#64748b"
                multiline
                editable={!uploading}
              />
              
              <TouchableOpacity 
                style={[styles.sendButton, input.trim() ? styles.sendButtonActive : null]}
                onPress={handleSend}
                disabled={!input.trim() || uploading}
              >
                <Send color={input.trim() ? "#fff" : "#94a3b8"} size={20} />
              </TouchableOpacity>
            </View>

            {showAttachMenu && (
              <View style={styles.attachMenu}>
                <TouchableOpacity style={styles.attachMenuItem} onPress={pickDocument}>
                  <Text style={styles.attachMenuItemText}>📄 Document</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachMenuItem} onPress={pickImage}>
                  <Text style={styles.attachMenuItemText}>🖼️ Photos & Videos</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      <ChatInfoModal 
        visible={showInfo} 
        chat={chat} 
        currentUserId={user?.id} 
        onlineUsers={onlineUsers} 
        onClose={() => setShowInfo(false)} 
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#10b981',
    fontSize: 12,
  },
  infoButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messageBubbleOwn: {
    backgroundColor: '#4f46e5',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#e2e8f0',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeOwn: {
    color: '#c7d2fe',
  },
  messageTimeOther: {
    color: '#94a3b8',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingText: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputWrapper: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  noChatBanner: {
    backgroundColor: '#1e293b',
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  noChatText: {
    color: '#94a3b8',
    fontSize: 15,
    fontStyle: 'italic',
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginHorizontal: 8,
    marginTop: 8,
  },
  contextBannerContent: {
    flex: 1,
    marginRight: 16,
  },
  contextBannerText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '500',
  },
  contextBannerTitle: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contextBannerSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attachButton: {
    padding: 10,
  },
  attachMenu: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  attachMenuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  attachMenuItemText: {
    color: '#e2e8f0',
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    minHeight: 44,
    marginHorizontal: 8,
  },
  sendButton: {
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#4f46e5',
  },
});

export default ChatRoom;
