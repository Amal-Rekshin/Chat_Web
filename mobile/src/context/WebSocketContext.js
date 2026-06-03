import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useAuth } from './AuthContext';
import api from '../services/api';
import Constants from 'expo-constants';

import 'fast-text-encoding'; // Polyfill required for StompJS in React Native

const WebSocketContext = createContext(undefined);

// Adjust baseURL based on platform for local development
const getWsUrl = () => {
  return 'wss://chat-web-1-b3uj.onrender.com/ws';
};

export const WebSocketProvider = ({ children }) => {
  const { token, user, isLoading } = useAuth();
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const subscriptions = useRef(new Map());

  // Fetch initial online status of all users
  useEffect(() => {
    if (token && !isLoading) {
      api.get('/users').then(res => {
        const initialStatus = {};
        res.data.forEach(u => {
          initialStatus[u.username] = (u.status?.name === 'ONLINE' || u.status === 'ONLINE');
        });
        setOnlineUsers(prev => ({ ...prev, ...initialStatus }));
      }).catch(err => console.error("Failed to fetch initial user status", err));
    }
  }, [token, isLoading]);

  useEffect(() => {
    if (!token || !user || isLoading) return;

    const stompClient = new Client({
      brokerURL: getWsUrl(),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: str => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
    });

    stompClient.onConnect = frame => {
      setConnected(true);
      console.log('Connected to WebSocket:', frame);
      
      stompClient.subscribe('/topic/status', message => {
        const payload = JSON.parse(message.body);
        setOnlineUsers(prev => ({
          ...prev,
          [payload.username]: payload.status === 'ONLINE'
        }));
      });
    };

    stompClient.onStompError = frame => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    stompClient.activate();
    setClient(stompClient);

    return () => {
      stompClient.deactivate();
      setConnected(false);
    };
  }, [token, user, isLoading]);

  const subscribeToChat = (chatId, callback) => {
    if (client && connected && !subscriptions.current.has(chatId)) {
      const sub = client.subscribe(`/topic/chat/${chatId}`, message => {
        callback(JSON.parse(message.body));
      });
      subscriptions.current.set(chatId, sub);
    }
  };

  const subscribeToTyping = (chatId, callback) => {
    if (client && connected) {
      return client.subscribe(`/topic/chat/${chatId}/typing`, message => {
        callback(JSON.parse(message.body));
      });
    }
    return null;
  };

  const subscribeToNewMessages = (userId, callback) => {
    if (client && connected) {
      return client.subscribe(`/topic/user/${userId}/new_message`, message => {
        callback(JSON.parse(message.body));
      });
    }
    return null;
  };

  const sendMessage = (chatId, content, messageType, fileUrl = null, replyToMessageId = null) => {
    console.log(`[WebSocket] sendMessage called - client: ${!!client}, connected: ${connected}, user: ${!!user}`);
    if (client && connected && user) {
      const payload = {
        chatId: parseInt(chatId),
        senderId: user.id,
        content,
        messageType,
        fileUrl,
        replyToMessageId
      };
      console.log(`[WebSocket] Publishing message to /app/chat/${chatId}/sendMessage:`, payload);
      client.publish({
        destination: `/app/chat/${chatId}/sendMessage`,
        body: JSON.stringify(payload)
      });
    } else {
      console.warn('[WebSocket] Cannot send message - socket not ready');
    }
  };

  const sendTypingEvent = (chatId, isTyping) => {
    if (client && connected && user) {
      client.publish({
        destination: `/app/chat/${chatId}/typing`,
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
          typing: isTyping
        })
      });
    }
  };

  const sendEditMessageEvent = (chatId, messageId, content) => {
    if (client && connected && user) {
      client.publish({
        destination: `/app/chat/${chatId}/editMessage`,
        body: JSON.stringify({
          messageId,
          content
        })
      });
    }
  };

  const subscribeToAdminStats = (callback) => {
    if (client && connected) {
      return client.subscribe('/topic/admin/stats', message => {
        callback(JSON.parse(message.body));
      });
    }
    return null;
  };

  return (
    <WebSocketContext.Provider value={{
      client,
      connected,
      onlineUsers,
      subscribeToChat,
      subscribeToTyping,
      subscribeToNewMessages,
      subscribeToAdminStats,
      sendMessage,
      sendTypingEvent,
      sendEditMessageEvent
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
