import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { FileText, Check, CheckCheck, Pencil, Reply } from 'lucide-react-native';

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  status?: 'SENT' | 'DELIVERED' | 'READ';
  onEditRequest?: (msg: any) => void;
  onReplyRequest?: (msg: any) => void;
  onLongPress?: (msg: any) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  status = 'SENT',
  onEditRequest,
  onReplyRequest,
  onLongPress
}) => {
  const content = message.content || '';
  const dateStr = message.createdAt
    ? (message.createdAt.endsWith('Z') ? message.createdAt : message.createdAt + 'Z')
    : null;
  const time = dateStr
    ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Now';

  // Format URL relative to backend
  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url}`;
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(getFullUrl(url)).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <TouchableOpacity
      style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}
      onLongPress={() => onLongPress && onLongPress(message)}
      activeOpacity={0.8}
    >
      {!isOwn && (
        <View style={styles.messageAvatar}>
          <Text style={styles.messageAvatarText}>
            {message.sender?.username?.[0]?.toUpperCase() || message.senderName?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
      )}

      <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>

        {/* Reply Context */}
        {message.replyToMessageContent && (
          <View style={[styles.replyContext, isOwn ? styles.replyContextOwn : styles.replyContextOther]}>
            <Text style={[styles.replySenderName, isOwn ? styles.replySenderNameOwn : styles.replySenderNameOther]}>
              {message.replyToSenderName || 'Someone'}
            </Text>
            <Text style={[styles.replyContent, isOwn ? styles.replyContentOwn : styles.replyContentOther]} numberOfLines={2}>
              {message.replyToMessageContent}
            </Text>
          </View>
        )}

        {/* Media Attachments */}
        {message.messageType === 'IMAGE' && message.fileUrl && (
          <TouchableOpacity onPress={() => handleLinkPress(message.fileUrl)}>
            <Image
              source={{ uri: getFullUrl(message.fileUrl) }}
              style={styles.imageAttachment}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {message.messageType === 'FILE' && message.fileUrl && (
          <TouchableOpacity
            style={[styles.fileAttachment, isOwn ? styles.fileAttachmentOwn : styles.fileAttachmentOther]}
            onPress={() => handleLinkPress(message.fileUrl)}
          >
            <FileText color={isOwn ? "#e0e7ff" : "#94a3b8"} size={24} />
            <Text style={[styles.fileText, isOwn ? styles.fileTextOwn : styles.fileTextOther]} numberOfLines={1}>
              {content || 'Attachment'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Text Content */}
        {content && message.messageType !== 'FILE' && (
          <Text style={[styles.messageText, isOwn ? styles.messageTextOwn : styles.messageTextOther]}>
            {content}
          </Text>
        )}

        {/* Footer (Time & Status) */}
        <View style={styles.footer}>
          <Text style={[styles.messageTime, isOwn ? styles.messageTimeOwn : styles.messageTimeOther]}>
            {time}
          </Text>

          {message.isEdited && (
            <Text style={[styles.editedText, isOwn ? styles.editedTextOwn : styles.editedTextOther]}>
              (edited)
            </Text>
          )}

          {isOwn && (
            <View style={styles.statusIcon}>
              {status === 'SENT' && <Check size={12} color="#c7d2fe" />}
              {status === 'DELIVERED' && <CheckCheck size={12} color="#cbd5e1" />}
              {status === 'READ' && <CheckCheck size={12} color="#38bdf8" />}
            </View>
          )}
        </View>

      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
    paddingHorizontal: 14,
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
  replyContext: {
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  replyContextOwn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderLeftColor: '#c7d2fe',
  },
  replyContextOther: {
    backgroundColor: '#0f172a',
    borderLeftColor: '#64748b',
  },
  replySenderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  replySenderNameOwn: {
    color: '#e0e7ff',
  },
  replySenderNameOther: {
    color: '#94a3b8',
  },
  replyContent: {
    fontSize: 12,
  },
  replyContentOwn: {
    color: '#c7d2fe',
  },
  replyContentOther: {
    color: '#cbd5e1',
  },
  imageAttachment: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  fileAttachmentOwn: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  fileAttachmentOther: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  fileText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  fileTextOwn: {
    color: '#fff',
  },
  fileTextOther: {
    color: '#e2e8f0',
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeOwn: {
    color: '#c7d2fe',
  },
  messageTimeOther: {
    color: '#94a3b8',
  },
  editedText: {
    fontSize: 10,
    fontStyle: 'italic',
    marginLeft: 4,
  },
  editedTextOwn: {
    color: '#a5b4fc',
  },
  editedTextOther: {
    color: '#64748b',
  },
  statusIcon: {
    marginLeft: 4,
  }
});

export default MessageBubble;
