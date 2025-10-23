// screens/NotificationsScreen.js - WITH MARK AS READ
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Tournament Starting', message: 'Your PUBG match starts in 10 mins', time: '2 mins ago', read: false },
    { id: 2, title: 'Prize Won', message: 'You won ৳250 in Daily Royale', time: '1 hour ago', read: false },
    { id: 3, title: 'New Tournament', message: 'Free Fire Clash Squad is live', time: '3 hours ago', read: false },
    { id: 4, title: 'Friend Request', message: 'ProGamer99 sent you a friend request', time: '5 hours ago', read: true },
    { id: 5, title: 'Withdrawal Successful', message: '৳500 has been added to your bKash', time: '1 day ago', read: true }
  ]);

  const markAsRead = (id) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notif => ({
      ...notif,
      read: true
    }));
    setNotifications(updatedNotifications);
    Alert.alert('Success', 'All notifications marked as read');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
          <Text style={styles.markAllText}>Mark All Read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.notificationSummary}>
          <Text style={styles.summaryText}>
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationCard,
              !notification.read && styles.unreadCard
            ]}
            onPress={() => markAsRead(notification.id)}
          >
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
            <Text style={styles.notificationTime}>{notification.time}</Text>
            
            {!notification.read && (
              <TouchableOpacity 
                style={styles.markReadButton}
                onPress={() => markAsRead(notification.id)}
              >
                <Text style={styles.markReadText}>Mark as Read</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(26, 35, 126, 0.5)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    color: '#2962ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  notificationSummary: {
    backgroundColor: 'rgba(41, 98, 255, 0.2)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2962ff',
  },
  summaryText: {
    color: '#2962ff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  notificationCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  unreadCard: {
    backgroundColor: 'rgba(41, 98, 255, 0.1)',
    borderColor: '#2962ff',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2962ff',
  },
  notificationMessage: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  notificationTime: {
    color: '#888',
    fontSize: 12,
  },
  markReadButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  markReadText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default NotificationsScreen;
