// App.js - COMPLETELY FIXED (WITH MatchProvider)
import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';
import { LeaderboardProvider } from './context/LeaderboardContext';
import { TournamentProvider } from './context/TournamentContext';
import { MatchProvider } from './context/MatchContext'; // ✅ এই লাইন যোগ করুন
import { SafeAreaProvider } from 'react-native-safe-area-context';

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

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <WalletProvider>
            <NotificationProvider>
              <ChatProvider>
                <LeaderboardProvider>
                  <TournamentProvider>
                    {/* ✅ MatchProvider যোগ করুন TournamentProvider এর ভিতরে */}
                    <MatchProvider>
                      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                      <AppNavigator />
                    </MatchProvider>
                  </TournamentProvider>
                </LeaderboardProvider>
              </ChatProvider>
            </NotificationProvider>
          </WalletProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
