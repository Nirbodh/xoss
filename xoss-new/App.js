// App.js - FIXED VERSION
import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar 
} from 'react-native'; // View এবং অন্যান্য components import করুন
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';
import { LeaderboardProvider } from './context/LeaderboardContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Enhanced Demo Auth Provider
const DemoAuthProvider = ({ children }) => {
  const demoUser = {
    id: 'XOSS_789123',
    username: 'ProPlayer',
    name: 'Robert Fox',
    email: 'robert.fox@example.com',
    phone: '+8801XXXXXXXXX',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    walletBalance: 1250.75,
    level: 15,
    experience: 1250,
    nextLevelExp: 2000,
    joinDate: '2024-01-15',
    totalEarnings: 5250,
    matchesPlayed: 45,
    matchesWon: 25,
    winRate: '55%',
    favoriteGame: 'Free Fire',
    achievements: ['First Win', '5 Wins Streak', 'Team Player'],
    rank: 'Gold III',
    team: 'Bangladesh Warriors'
  };

  const authValue = {
    user: demoUser,
    token: 'demo-token-xoss-2024',
    isLoading: false,
    isAuthenticated: true,
    login: (credentials) => {
      console.log('Login called with:', credentials);
      return Promise.resolve({ success: true, user: demoUser });
    },
    logout: () => {
      console.log('Logout called');
      return Promise.resolve();
    },
    register: (userData) => {
      console.log('Register called with:', userData);
      return Promise.resolve({ success: true, user: demoUser });
    },
    updateProfile: (updates) => {
      console.log('Profile update called with:', updates);
      return Promise.resolve({ success: true, user: { ...demoUser, ...updates } });
    },
    refreshUser: () => {
      console.log('Refresh user called');
      return Promise.resolve(demoUser);
    }
  };

  return (
    <AuthProvider value={authValue}>
      {children}
    </AuthProvider>
  );
};

// Enhanced Demo Wallet Provider
const DemoWalletProvider = ({ children }) => {
  const walletValue = {
    balance: 1250.75,
    transactions: [
      {
        id: '1',
        type: 'credit',
        amount: 500,
        description: 'Tournament Win - Free Fire Solo',
        date: '2024-03-15T14:30:00Z',
        status: 'completed'
      },
      {
        id: '2', 
        type: 'debit',
        amount: 50,
        description: 'Tournament Entry - PUBG Squad',
        date: '2024-03-14T10:15:00Z',
        status: 'completed'
      },
      {
        id: '3',
        type: 'credit',
        amount: 200,
        description: 'Referral Bonus',
        date: '2024-03-13T16:45:00Z',
        status: 'completed'
      }
    ],
    addMoney: (amount) => {
      console.log('Add money:', amount);
      return Promise.resolve({ success: true, newBalance: 1250.75 + amount });
    },
    withdrawMoney: (amount) => {
      console.log('Withdraw money:', amount);
      return Promise.resolve({ success: true, newBalance: 1250.75 - amount });
    },
    getTransactionHistory: () => {
      return Promise.resolve(walletValue.transactions);
    }
  };

  return (
    <WalletProvider value={walletValue}>
      {children}
    </WalletProvider>
  );
};

// Enhanced Demo Notification Provider
const DemoNotificationProvider = ({ children }) => {
  const notificationValue = {
    notifications: [
      {
        id: '1',
        type: 'tournament',
        title: 'Tournament Starting Soon!',
        message: 'Your Free Fire Solo match starts in 15 minutes',
        timestamp: '2024-03-15T14:15:00Z',
        isRead: false,
        data: { tournamentId: '123' }
      },
      {
        id: '2',
        type: 'payment',
        title: 'Payment Received!',
        message: '৳500 has been credited to your wallet',
        timestamp: '2024-03-15T10:30:00Z',
        isRead: true,
        data: { amount: 500 }
      },
      {
        id: '3',
        type: 'achievement',
        title: 'New Achievement Unlocked!',
        message: 'You unlocked the "5 Wins Streak" badge',
        timestamp: '2024-03-14T18:45:00Z',
        isRead: true,
        data: { achievementId: '2' }
      }
    ],
    unreadCount: 1,
    markAsRead: (notificationId) => {
      console.log('Mark as read:', notificationId);
      return Promise.resolve();
    },
    markAllAsRead: () => {
      console.log('Mark all as read');
      return Promise.resolve();
    },
    registerForPushNotifications: () => {
      console.log('Register for push notifications');
      return Promise.resolve();
    }
  };

  return (
    <NotificationProvider value={notificationValue}>
      {children}
    </NotificationProvider>
  );
};

// Error Boundary Component - FIXED VERSION
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0c23' }}>
          <Text style={{ color: 'white', fontSize: 18, marginBottom: 10 }}>Something went wrong</Text>
          <Text style={{ color: '#b0b8ff', fontSize: 14 }}>Please restart the app</Text>
          <TouchableOpacity 
            style={{ marginTop: 20, padding: 10, backgroundColor: '#2962ff', borderRadius: 8 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: 'white' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Main App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <DemoAuthProvider>
          <DemoWalletProvider>
            <NotificationProvider>
              <ChatProvider>
                <LeaderboardProvider>
                  <StatusBar 
                    barStyle="light-content" 
                    backgroundColor="transparent" 
                    translucent 
                  />
                  <AppNavigator />
                </LeaderboardProvider>
              </ChatProvider>
            </NotificationProvider>
          </DemoWalletProvider>
        </DemoAuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

// Optional: Add App Loading Component
const AppLoading = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0c23' }}>
    <Text style={{ color: 'white', fontSize: 20, marginBottom: 20 }}>XOSS Gaming</Text>
    <ActivityIndicator size="large" color="#2962ff" />
  </View>
);
