// App.js - COMPLETELY FIXED WITH ADMIN LOGIN
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { TournamentProvider } from './context/TournamentContext';
import { MatchProvider } from './context/MatchContext';
import { WalletProvider } from './context/WalletContext';

// Import ALL Screens
import AdminDashboard from './screens/AdminDashboard';
import EnhancedHomeControl from './screens/EnhancedHomeControl';
import TournamentControlScreen from './screens/TournamentControlScreen';
import WalletControlScreen from './screens/WalletControlScreen';
import ProfileControlScreen from './screens/ProfileControlScreen';
import MyGameControlScreen from './screens/MyGameControlScreen';
import TopUpControlScreen from './screens/TopUpControlScreen';

// Tournament Sub-Modules
import TournamentManagementScreen from './screens/TournamentManagementScreen';
import PlayerManagementScreen from './screens/PlayerManagementScreen';
import MatchControlScreen from './screens/MatchControlScreen';
import ScoreboardControlScreen from './screens/ScoreboardControlScreen';
import PrizeManagementScreen from './screens/PrizeManagementScreen';
import NotificationControlScreen from './screens/NotificationControlScreen';
import AnalyticsControlScreen from './screens/AnalyticsControlScreen';
import BracketViewScreen from './screens/BracketViewScreen';

// Additional Screens
import ResultVerificationScreen from './screens/ResultVerificationScreen';
import CreateAdmin from './screens/CreateAdmin';
import EditMatchModal from './screens/EditMatchModal';

const Stack = createStackNavigator();

// ✅ Admin Login Screen Component
const AdminLoginScreen = ({ navigation }) => {
  const { login, isLoading } = useAuth();
  const [credentials, setCredentials] = useState({
    email: 'admin@xoss.com',
    password: 'admin123'
  });
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    const result = await login(credentials);
    
    if (result.success) {
      navigation.replace('AdminDashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <View style={styles.loginContainer}>
      <StatusBar style="light" />
      
      <View style={styles.loginHeader}>
        <Text style={styles.loginTitle}>XOSS Admin</Text>
        <Text style={styles.loginSubtitle}>Tournament Management System</Text>
      </View>

      <View style={styles.loginForm}>
        <Text style={styles.inputLabel}>Admin Email</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputField}>{credentials.email}</Text>
          <Text style={styles.inputHint}>(Default admin account)</Text>
        </View>

        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputField}>{'*'.repeat(credentials.password.length)}</Text>
          <Text style={styles.inputHint}>(Default: admin123)</Text>
        </View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Text style={styles.infoText}>
            This is the admin panel. Use default credentials to login.
          </Text>
        )}

        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Login as Admin</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.guestButton}
          onPress={() => navigation.replace('AdminDashboard')}
        >
          <Text style={styles.guestButtonText}>Continue as Guest (Limited Access)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.loginFooter}>
        <Text style={styles.footerText}>© 2024 XOSS Gaming Platform</Text>
        <Text style={styles.footerSubtext}>Admin Panel v1.0</Text>
      </View>
    </View>
  );
};

// ✅ Main App Navigator with Auth Check - FIXED
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2962ff" />
        <Text style={styles.loadingText}>Loading Admin Panel...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "AdminDashboard" : "AdminLogin"}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0a0c23' }
        }}
      >
        {/* Always include both login and dashboard in the stack */}
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />

        {/* All other screens */}
        <Stack.Screen name="EnhancedHomeControl" component={EnhancedHomeControl} />
        <Stack.Screen name="TournamentControl" component={TournamentControlScreen} />
        <Stack.Screen name="WalletControl" component={WalletControlScreen} />
        <Stack.Screen name="ProfileControl" component={ProfileControlScreen} />
        <Stack.Screen name="MyGameControl" component={MyGameControlScreen} />
        <Stack.Screen name="TopUpControl" component={TopUpControlScreen} />
        <Stack.Screen name="TournamentManagement" component={TournamentManagementScreen} />
        <Stack.Screen name="PlayerManagement" component={PlayerManagementScreen} />
        <Stack.Screen name="MatchControl" component={MatchControlScreen} />
        <Stack.Screen name="ScoreboardControl" component={ScoreboardControlScreen} />
        <Stack.Screen name="PrizeManagement" component={PrizeManagementScreen} />
        <Stack.Screen name="NotificationControl" component={NotificationControlScreen} />
        <Stack.Screen name="AnalyticsControl" component={AnalyticsControlScreen} />
        <Stack.Screen name="BracketView" component={BracketViewScreen} />
        <Stack.Screen name="ResultVerification" component={ResultVerificationScreen} />
        <Stack.Screen name="CreateAdmin" component={CreateAdmin} />
        <Stack.Screen name="EditMatchModal" component={EditMatchModal} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// ✅ Main App Component
export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <TournamentProvider>
          <MatchProvider>
            <AppNavigator />
          </MatchProvider>
        </TournamentProvider>
      </WalletProvider>
    </AuthProvider>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0c23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  loginHeader: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2962ff',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  loginForm: {
    paddingHorizontal: 20,
  },
  inputLabel: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
  },
  inputField: {
    color: 'white',
    fontSize: 16,
  },
  inputHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  infoText: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#2962ff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  guestButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  loginFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  footerSubtext: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    marginTop: 4,
  },
});
