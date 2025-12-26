// App.js - ENHANCED VERSION
import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';
import { LeaderboardProvider } from './context/LeaderboardContext';
import { TournamentProvider } from './context/TournamentContext';
import { MatchProvider } from './context/MatchContext';
import { ThemeProvider } from './context/ThemeContext';

// Navigation
import AppNavigator from './navigation/AppNavigator';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
]);

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You can log to error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
          <View style={styles.errorContent}>
            <Text style={styles.errorEmoji}>🚨</Text>
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Text style={styles.errorHint}>
              Please try restarting the application
            </Text>
            
            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleRetry}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() => {
                  // Handle error reporting
                  console.log('Report error:', this.state.error);
                }}
              >
                <Text style={styles.reportButtonText}>Report Issue</Text>
              </TouchableOpacity>
            </View>
            
            {this.state.errorInfo && (
              <Text style={styles.errorDetails}>
                {this.state.errorInfo.componentStack?.split('\n')[1]}
              </Text>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = {
  errorContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorHint: {
    fontSize: 14,
    color: '#888',
    marginBottom: 30,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#667eea',
    minWidth: 120,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'center',
  },
};

// Main App Component
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <WalletProvider>
                <NotificationProvider>
                  <ChatProvider>
                    <LeaderboardProvider>
                      <TournamentProvider>
                        <MatchProvider>
                          <StatusBar 
                            barStyle="light-content" 
                            backgroundColor="transparent" 
                            translucent 
                          />
                          <NavigationContainer>
                            <AppNavigator />
                          </NavigationContainer>
                        </MatchProvider>
                      </TournamentProvider>
                    </LeaderboardProvider>
                  </ChatProvider>
                </NotificationProvider>
              </WalletProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
