// context/NotificationContext.js - ENHANCED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem('user_notifications');
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        setNotifications(parsedNotifications);
        updateUnreadCount(parsedNotifications);
      } else {
        // Load initial mock notifications
        const mockNotifications = [
          {
            id: '1',
            type: 'tournament',
            title: 'Tournament Starting Soon!',
            message: 'Your Free Fire Solo match starts in 15 minutes',
            timestamp: new Date().toISOString(),
            isRead: false,
            data: { tournamentId: '123', game: 'Free Fire' },
            priority: 'high'
          },
          {
            id: '2',
            type: 'payment',
            title: 'Payment Received!',
            message: '৳500 has been credited to your wallet',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            isRead: true,
            data: { amount: 500, type: 'tournament_win' },
            priority: 'medium'
          },
          {
            id: '3',
            type: 'achievement',
            title: 'New Achievement Unlocked!',
            message: 'You unlocked the "5 Wins Streak" badge',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            isRead: true,
            data: { achievementId: '2', badge: '🔥' },
            priority: 'low'
          },
          {
            id: '4',
            type: 'system',
            title: 'Welcome to XOSS Gaming!',
            message: 'Complete your profile to get ৳100 bonus',
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            isRead: true,
            data: { bonusAmount: 100 },
            priority: 'medium'
          }
        ];
        setNotifications(mockNotifications);
        updateUnreadCount(mockNotifications);
        await AsyncStorage.setItem('user_notifications', JSON.stringify(mockNotifications));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const updateUnreadCount = (notifs) => {
    const unread = notifs.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  };

  const markAsRead = async (notificationId) => {
    try {
      let updatedNotifications;
      
      if (notificationId === 'all') {
        updatedNotifications = notifications.map(notif => ({ ...notif, isRead: true }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        updatedNotifications = notifications.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setNotifications(updatedNotifications);
      updateUnreadCount(updatedNotifications);
      await AsyncStorage.setItem('user_notifications', JSON.stringify(updatedNotifications));
      
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: 'Failed to mark as read' };
    }
  };

  const addNotification = async (notification) => {
    try {
      const newNotification = {
        id: `notif_${Date.now()}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        ...notification
      };

      const updatedNotifications = [newNotification, ...notifications];
      setNotifications(updatedNotifications);
      updateUnreadCount(updatedNotifications);
      
      await AsyncStorage.setItem('user_notifications', JSON.stringify(updatedNotifications));
      
      // Haptic feedback for new notification
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      return { success: true, notification: newNotification };
    } catch (error) {
      console.error('Error adding notification:', error);
      return { success: false, error: 'Failed to add notification' };
    }
  };

  const removeNotification = async (notificationId) => {
    try {
      const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
      setNotifications(updatedNotifications);
      updateUnreadCount(updatedNotifications);
      
      await AsyncStorage.setItem('user_notifications', JSON.stringify(updatedNotifications));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      return { success: true };
    } catch (error) {
      console.error('Error removing notification:', error);
      return { success: false, error: 'Failed to remove notification' };
    }
  };

  const clearAllNotifications = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      await AsyncStorage.removeItem('user_notifications');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      return { success: true };
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return { success: false, error: 'Failed to clear notifications' };
    }
  };

  const getNotificationsByType = (type) => {
    return notifications.filter(notif => notif.type === type);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(notif => !notif.isRead);
  };

  const registerForPushNotifications = async () => {
    try {
      // Mock implementation - replace with actual push notification setup
      console.log('Push notifications registered successfully');
      return { success: true, token: 'mock-push-token' };
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return { success: false, error: 'Failed to register for push notifications' };
    }
  };

  // Simulate receiving a push notification
  const simulatePushNotification = (notification) => {
    addNotification({
      type: 'push',
      title: notification.title || 'New Notification',
      message: notification.message || 'You have a new message',
      data: notification.data || {},
      priority: notification.priority || 'medium'
    });
  };

  const value = {
    // State
    notifications,
    unreadCount,
    isLoading,
    
    // Actions
    markAsRead,
    addNotification,
    removeNotification,
    clearAllNotifications,
    registerForPushNotifications,
    simulatePushNotification,
    
    // Getters
    getNotificationsByType,
    getUnreadNotifications,
    getRecentNotifications: (limit = 10) => notifications.slice(0, limit)
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      markAsRead: () => {},
      addNotification: () => {},
      registerForPushNotifications: async () => ({ success: true })
    };
  }
  return context;
};
