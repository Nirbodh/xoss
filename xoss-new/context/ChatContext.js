// context/ChatContext.js
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Mock WebSocket service (replace with actual WebSocket implementation)
class ChatWebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(roomId) {
    return new Promise((resolve, reject) => {
      try {
        // Simulate WebSocket connection
        console.log(`Connecting to chat room: ${roomId}`);
        
        // Simulate successful connection
        setTimeout(() => {
          this.socket = { 
            roomId, 
            connected: true,
            close: () => console.log('WebSocket closed')
          };
          this.reconnectAttempts = 0;
          resolve(this.socket);
        }, 500);
      } catch (error) {
        reject(error);
      }
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    console.log(`Emitting ${event}:`, data);
    // Simulate message sending and receiving
    if (event === 'send_message') {
      // Simulate other users responding
      setTimeout(() => {
        const mockResponses = [
          "Great game!",
          "Let's team up next round",
          "Anyone want to practice?",
          "GG everyone!",
          "That was close!"
        ];
        
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        
        const mockMessage = {
          id: Date.now().toString(),
          roomId: data.roomId,
          userId: `user-${Math.floor(Math.random() * 1000)}`,
          username: `Player${Math.floor(Math.random() * 1000)}`,
          message: randomResponse,
          timestamp: new Date().toISOString(),
          type: 'text'
        };

        this.trigger('message_received', mockMessage);
      }, 2000);
    }
  }

  trigger(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [activeChats, setActiveChats] = useState([]);
  const [unreadChats, setUnreadChats] = useState(0);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const wsService = useRef(new ChatWebSocketService());
  const reconnectTimeout = useRef();

  // 🎯 Initialize chat system
  useEffect(() => {
    loadChatData();
    setupWebSocketListeners();

    return () => {
      cleanupWebSocket();
    };
  }, []);

  // 🎯 Load chat data from storage
  const loadChatData = async () => {
    try {
      setIsLoading(true);
      const [chatsData, unreadData] = await Promise.all([
        AsyncStorage.getItem('user_chats'),
        AsyncStorage.getItem('unread_chats_count')
      ]);

      if (chatsData) {
        const parsedChats = JSON.parse(chatsData);
        setActiveChats(parsedChats);
        updateUnreadCount(parsedChats);
      }

      if (unreadData) {
        setUnreadChats(JSON.parse(unreadData));
      }
    } catch (error) {
      console.error('Failed to load chat data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 Setup WebSocket listeners
  const setupWebSocketListeners = () => {
    wsService.current.on('message_received', handleIncomingMessage);
    wsService.current.on('user_joined', handleUserJoined);
    wsService.current.on('user_left', handleUserLeft);
    wsService.current.on('connection_established', handleConnectionEstablished);
  };

  // 🎯 Cleanup WebSocket
  const cleanupWebSocket = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    wsService.current.disconnect();
  };

  // 🎯 Join chat room
  const joinChat = async (roomId, roomName = 'Tournament Chat') => {
    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Connect to WebSocket
      await wsService.current.connect(roomId);
      setIsConnected(true);

      // Set current room
      const roomInfo = {
        id: roomId,
        name: roomName,
        joinedAt: new Date().toISOString()
      };
      
      setCurrentRoom(roomInfo);

      // Add to active chats if not already present
      setActiveChats(prev => {
        const existingChat = prev.find(chat => chat.id === roomId);
        if (existingChat) {
          return prev;
        }

        const newChat = {
          id: roomId,
          name: roomName,
          lastMessage: 'Chat started',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          participantCount: Math.floor(Math.random() * 50) + 10
        };

        const updatedChats = [newChat, ...prev];
        saveChatsToStorage(updatedChats);
        return updatedChats;
      });

      // Load room messages
      await loadRoomMessages(roomId);

      // Simulate users joining
      simulateUsersJoining(roomId);

      return true;
    } catch (error) {
      console.error('Failed to join chat:', error);
      Alert.alert('Error', 'Failed to join chat room');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 Leave chat room
  const leaveChat = async (roomId) => {
    try {
      if (currentRoom?.id === roomId) {
        setCurrentRoom(null);
      }
      
      wsService.current.disconnect();
      setIsConnected(false);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error leaving chat:', error);
    }
  };

  // 🎯 Send message
  const sendMessage = async (messageText, roomId = currentRoom?.id) => {
    if (!roomId || !messageText.trim()) return;

    try {
      const message = {
        id: Date.now().toString(),
        roomId,
        userId: 'current-user', // Replace with actual user ID
        username: 'You', // Replace with actual username
        message: messageText.trim(),
        timestamp: new Date().toISOString(),
        type: 'text',
        status: 'sent'
      };

      // Add message locally immediately
      addMessageToRoom(roomId, message);

      // Send via WebSocket
      wsService.current.emit('send_message', {
        roomId,
        message: messageText.trim(),
        timestamp: message.timestamp
      });

      // Update last message in active chats
      updateLastMessage(roomId, messageText);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Update message status to failed
      updateMessageStatus(roomId, message.id, 'failed');
    }
  };

  // 🎯 Handle incoming message
  const handleIncomingMessage = (message) => {
    const { roomId } = message;
    
    // Add message to room
    addMessageToRoom(roomId, { ...message, status: 'delivered' });

    // Update last message in active chats
    updateLastMessage(roomId, message.message);

    // Increment unread count if not in current room
    if (currentRoom?.id !== roomId) {
      incrementUnreadCount(roomId);
    }

    // Haptic feedback for new message
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 🎯 Add message to room
  const addMessageToRoom = (roomId, message) => {
    setMessages(prev => {
      const roomMessages = prev.get(roomId) || [];
      const updatedMessages = new Map(prev);
      updatedMessages.set(roomId, [...roomMessages, message]);
      return updatedMessages;
    });
  };

  // 🎯 Update message status
  const updateMessageStatus = (roomId, messageId, status) => {
    setMessages(prev => {
      const roomMessages = prev.get(roomId);
      if (!roomMessages) return prev;

      const updatedMessages = roomMessages.map(msg =>
        msg.id === messageId ? { ...msg, status } : msg
      );

      const newMap = new Map(prev);
      newMap.set(roomId, updatedMessages);
      return newMap;
    });
  };

  // 🎯 Update last message in active chats
  const updateLastMessage = (roomId, message) => {
    setActiveChats(prev => 
      prev.map(chat =>
        chat.id === roomId
          ? {
              ...chat,
              lastMessage: message,
              lastMessageTime: new Date().toISOString()
            }
          : chat
      )
    );
  };

  // 🎯 Increment unread count for a chat
  const incrementUnreadCount = (roomId) => {
    setActiveChats(prev => {
      const updatedChats = prev.map(chat =>
        chat.id === roomId
          ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 }
          : chat
      );
      
      updateUnreadCount(updatedChats);
      saveChatsToStorage(updatedChats);
      return updatedChats;
    });
  };

  // 🎯 Mark chat as read
  const markChatAsRead = (roomId) => {
    setActiveChats(prev => {
      const updatedChats = prev.map(chat =>
        chat.id === roomId ? { ...chat, unreadCount: 0 } : chat
      );
      
      updateUnreadCount(updatedChats);
      saveChatsToStorage(updatedChats);
      return updatedChats;
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 🎯 Update overall unread count
  const updateUnreadCount = (chats) => {
    const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    setUnreadChats(totalUnread);
    AsyncStorage.setItem('unread_chats_count', JSON.stringify(totalUnread));
  };

  // 🎯 Save chats to storage
  const saveChatsToStorage = async (chats) => {
    try {
      await AsyncStorage.setItem('user_chats', JSON.stringify(chats));
    } catch (error) {
      console.error('Failed to save chats:', error);
    }
  };

  // 🎯 Load room messages
  const loadRoomMessages = async (roomId) => {
    try {
      // Simulate loading messages from API
      const mockMessages = generateMockMessages(roomId);
      setMessages(prev => new Map(prev).set(roomId, mockMessages));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // 🎯 Generate mock messages for demonstration
  const generateMockMessages = (roomId) => {
    const baseTime = Date.now();
    return [
      {
        id: '1',
        roomId,
        userId: 'system',
        username: 'System',
        message: 'Welcome to the tournament chat!',
        timestamp: new Date(baseTime - 30 * 60 * 1000).toISOString(),
        type: 'system'
      },
      {
        id: '2',
        roomId,
        userId: 'user1',
        username: 'ProPlayer',
        message: "Hey everyone! Good luck in the tournament!",
        timestamp: new Date(baseTime - 25 * 60 * 1000).toISOString(),
        type: 'text',
        status: 'delivered'
      },
      {
        id: '3',
        roomId,
        userId: 'user2',
        username: 'GameMaster',
        message: "Remember to check the tournament rules!",
        timestamp: new Date(baseTime - 20 * 60 * 1000).toISOString(),
        type: 'text',
        status: 'delivered'
      }
    ];
  };

  // 🎯 Handle user joined event
  const handleUserJoined = (data) => {
    setOnlineUsers(prev => new Set(prev).add(data.userId));
  };

  // 🎯 Handle user left event
  const handleUserLeft = (data) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(data.userId);
      return newSet;
    });
  };

  // 🎯 Handle connection established
  const handleConnectionEstablished = () => {
    setIsConnected(true);
  };

  // 🎯 Simulate users joining (for demo)
  const simulateUsersJoining = (roomId) => {
    const userCount = Math.floor(Math.random() * 10) + 5;
    const newUsers = Array.from({ length: userCount }, (_, i) => `user-${i}`);
    setOnlineUsers(new Set(newUsers));
  };

  // 🎯 Get messages for current room
  const getCurrentRoomMessages = () => {
    return currentRoom ? messages.get(currentRoom.id) || [] : [];
  };

  // 🎯 Delete chat
  const deleteChat = async (roomId) => {
    try {
      setActiveChats(prev => {
        const filtered = prev.filter(chat => chat.id !== roomId);
        saveChatsToStorage(filtered);
        updateUnreadCount(filtered);
        return filtered;
      });

      if (currentRoom?.id === roomId) {
        leaveChat(roomId);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const value = {
    // State
    activeChats,
    unreadChats,
    currentRoom,
    messages: getCurrentRoomMessages(),
    isConnected,
    isLoading,
    onlineUsers: Array.from(onlineUsers),
    
    // Actions
    joinChat,
    leaveChat,
    sendMessage,
    markChatAsRead,
    deleteChat,
    
    // Getters
    getMessagesForRoom: (roomId) => messages.get(roomId) || []
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export default ChatContext;
