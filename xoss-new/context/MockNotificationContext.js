// Mock implementation for expo-notifications and expo-haptics
const MockNotifications = {
  setNotificationHandler: () => {},
  addNotificationReceivedListener: () => ({ remove: () => {} }),
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  removeAllNotificationListeners: () => {},
  getExpoPushTokenAsync: async () => ({ data: 'mock-token' }),
  scheduleNotificationAsync: async () => {},
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  getPermissionsAsync: async () => ({ status: 'granted' }),
};

const MockHaptics = {
  notificationAsync: () => {},
  impactAsync: () => {},
  selectionAsync: () => {},
};

export { MockNotifications as Notifications, MockHaptics as Haptics };
