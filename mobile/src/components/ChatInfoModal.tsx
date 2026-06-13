import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { X, User, Users, Mail, Clock, Info, UserPlus, LogOut, Trash2 } from 'lucide-react-native';
import api from '../services/api';
import Constants from 'expo-constants';
import AddGroupMemberModal from './AddGroupMemberModal';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

interface ChatInfoModalProps {
  visible: boolean;
  chat: any;
  currentUserId: number;
  onlineUsers: Record<string, boolean>;
  onClose: () => void;
}

const ChatInfoModal: React.FC<ChatInfoModalProps> = ({
  visible,
  chat,
  currentUserId,
  onlineUsers,
  onClose
}) => {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === 'ADMIN' || chat?.currentUserRole === 'ADMIN';

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/chats/${chat.id}/info`, {
        params: { userId: currentUserId }
      });
      if (response.data?.members) {
        response.data.members = response.data.members.filter((m: any) => m.role !== 'REMOVED');
        response.data.memberCount = response.data.members.length;
      }
      setInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch chat info', err);
    } finally {
      setLoading(false);
    }
  }, [chat?.id, currentUserId]);

  useEffect(() => {
    if (visible && chat?.id && currentUserId) {
      fetchInfo();
    }
  }, [visible, chat?.id, currentUserId, fetchInfo]);

  const handleRemoveMember = (userId: number) => {
    Alert.alert(
      "Remove Member",
      "Are you sure you want to remove this member?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/chats/${chat.id}/members/${userId}?requesterId=${currentUserId}`);
              fetchInfo();
            } catch (err) {
              console.error('Failed to remove member', err);
            }
          }
        }
      ]
    );
  };

  const handleUpdateRole = (userId: number, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    Alert.alert(
      "Update Role",
      `Are you sure you want to make this user a ${newRole}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await api.put(`/chats/${chat.id}/members/${userId}/role?requesterId=${currentUserId}&role=${newRole}`);
              fetchInfo();
            } catch (err) {
              console.error('Failed to update role', err);
            }
          }
        }
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to permanently delete this group? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/chats/${chat.id}?requesterId=${currentUserId}`);
              onClose();
              router.replace('/chat');
            } catch (err) {
              console.error('Failed to delete group', err);
            }
          }
        }
      ]
    );
  };

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://chat-web-1-b3uj.onrender.com${url}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {chat?.type === 'PRIVATE' ? 'Contact Info' : 'Group Info'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#6366f1" size="large" />
            </View>
          ) : !info ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>Failed to load info</Text>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

              {/* Profile Image & Name */}
              <View style={styles.profileSection}>
                {info.image ? (
                  <Image source={{ uri: getFullUrl(info.image) }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Text style={styles.profileInitials}>
                      {info.name?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.profileName}>{info.name}</Text>
                {info.type === 'PRIVATE' && (
                  <View style={styles.onlineBadge}>
                    <Text style={styles.onlineBadgeText}>
                      {onlineUsers[info.name] ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Private Info Details */}
              {info.type === 'PRIVATE' && (
                <View style={styles.detailsSection}>
                  {info.email && (
                    <View style={styles.detailRow}>
                      <Mail size={20} color="#94a3b8" />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Email</Text>
                        <Text style={styles.detailValue}>{info.email}</Text>
                      </View>
                    </View>
                  )}
                  {info.bio && (
                    <View style={styles.detailRow}>
                      <Info size={20} color="#94a3b8" />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>About</Text>
                        <Text style={styles.detailValue}>{info.bio}</Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Clock size={20} color="#94a3b8" />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Last Seen</Text>
                      <Text style={styles.detailValue}>
                        {info.lastSeen ? new Date(info.lastSeen).toLocaleString() : 'Never'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Group Info Details */}
              {info.type === 'GROUP' && (
                <View style={styles.detailsSection}>
                  <View style={styles.groupHeader}>
                    <View style={styles.memberCountContainer}>
                      <Users size={16} color="#94a3b8" />
                      <Text style={styles.memberCountText}>{info.memberCount} Members</Text>
                    </View>
                  </View>

                  {isAdmin && (
                    <TouchableOpacity
                      style={styles.addMemberButton}
                      onPress={() => setShowAddMember(true)}
                    >
                      <UserPlus size={18} color="#818cf8" />
                      <Text style={styles.addMemberText}>Add Participants</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.memberList}>
                    {info.members?.map((member: any) => (
                      <View key={member.userId} style={styles.memberRow}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>{member.username?.[0]?.toUpperCase()}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <View style={styles.memberNameContainer}>
                            <Text style={styles.memberName}>{member.username}</Text>
                            {member.role === 'ADMIN' && (
                              <View style={styles.adminBadge}>
                                <Text style={styles.adminBadgeText}>Admin</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.memberStatus}>
                            {onlineUsers[member.username] ? 'Online' : 'Offline'}
                          </Text>
                        </View>

                        {isAdmin && member.userId !== currentUserId && (
                          <View style={styles.memberActions}>
                            <TouchableOpacity
                              style={styles.roleButton}
                              onPress={() => handleUpdateRole(member.userId, member.role)}
                            >
                              <Text style={styles.roleButtonText}>
                                {member.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.removeMemberButton}
                              onPress={() => handleRemoveMember(member.userId)}
                            >
                              <Trash2 size={18} color="#f87171" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>

                  <View style={styles.createdBySection}>
                    <View style={styles.detailRow}>
                      <Info size={16} color="#94a3b8" />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Created By</Text>
                        <Text style={styles.detailValue}>{info.createdByUsername || 'Unknown'}</Text>
                        <Text style={styles.createdDateText}>
                          on {new Date(info.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {isAdmin && (
                    <TouchableOpacity
                      style={styles.deleteGroupButton}
                      onPress={handleDeleteGroup}
                    >
                      <Trash2 size={20} color="#f87171" />
                      <Text style={styles.deleteGroupText}>Delete Group</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>

      <AddGroupMemberModal
        visible={showAddMember}
        chat={info}
        currentUserId={currentUserId}
        onClose={() => setShowAddMember(false)}
        onAdded={() => {
          setShowAddMember(false);
          fetchInfo();
        }}
      />
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
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    flexDirection: 'col',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#64748b',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#475569',
  },
  profileInitials: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  onlineBadge: {
    marginTop: 8,
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  onlineBadgeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsSection: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  detailTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    color: '#f8fafc',
    fontSize: 16,
  },
  groupHeader: {
    marginBottom: 16,
  },
  memberCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCountText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    marginBottom: 24,
  },
  addMemberText: {
    color: '#818cf8',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  memberList: {
    marginBottom: 24,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#cbd5e1',
    fontWeight: 'bold',
    fontSize: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  adminBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  adminBadgeText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  memberStatus: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  removeMemberButton: {
    padding: 8,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: 8,
  },
  createdBySection: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 24,
  },
  createdDateText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 6,
    marginRight: 8,
  },
  roleButtonText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  deleteGroupText: {
    color: '#f87171',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  }
});

export default ChatInfoModal;
