// components/NotificationBell.js
import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '../context/NotificationContext';
import * as Haptics from 'expo-haptics';

const NotificationBell = ({ onPress, size = 24, color = "white" }) => {
  const { unreadCount } = useNotification();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true })
      ]).start();
    }
  }, [unreadCount]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.notificationIcon}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons name="notifications" size={size} color={color} />
      </Animated.View>
      {unreadCount > 0 && (
        <View style={[
          styles.notificationBadge,
          unreadCount > 9 && styles.notificationBadgeLarge
        ]}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = {
  notificationIcon: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a0c23',
  },
  notificationBadgeLarge: {
    width: 22,
    height: 22,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
};

export default NotificationBell;
