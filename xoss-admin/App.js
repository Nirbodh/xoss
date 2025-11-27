// App.js - COMPLETELY FIXED VERSION
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { TournamentProvider } from './context/TournamentContext';
import { MatchProvider } from './context/MatchContext';
import { WalletProvider } from './context/WalletContext';

// Import ALL Screens with CORRECT names
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

// ✅ Temporary Placeholder Screen
const TemporaryScreen = ({ route }) => {
  const { title = 'Module' } = route.params || {};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        This module is under development and will be available soon.
      </Text>
    </View>
  );
};

// ✅ Main App
export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <TournamentProvider>
          <MatchProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  cardStyle: { backgroundColor: '#0a0c23' },
                }}
                initialRouteName="AdminDashboard"
              >
                {/* ✅ Main Admin Dashboard */}
                <Stack.Screen name="AdminDashboard" component={AdminDashboard} />

                {/* ✅ 6 MAIN CONTROL SCREENS - EXACT names as used in AdminDashboard.js */}
                <Stack.Screen name="EnhancedHomeControl" component={EnhancedHomeControl} />
                <Stack.Screen name="TournamentControl" component={TournamentControlScreen} />
                <Stack.Screen name="WalletControl" component={WalletControlScreen} />
                <Stack.Screen name="ProfileControl" component={ProfileControlScreen} />
                <Stack.Screen name="MyGameControl" component={MyGameControlScreen} />
                <Stack.Screen name="TopUpControl" component={TopUpControlScreen} />

                {/* ✅ Tournament Management Sub-Modules */}
                <Stack.Screen name="TournamentManagement" component={TournamentManagementScreen} />
                <Stack.Screen name="PlayerManagement" component={PlayerManagementScreen} />
                <Stack.Screen name="MatchControl" component={MatchControlScreen} />
                <Stack.Screen name="ScoreboardControl" component={ScoreboardControlScreen} />
                <Stack.Screen name="PrizeManagement" component={PrizeManagementScreen} />
                <Stack.Screen name="NotificationControl" component={NotificationControlScreen} />
                <Stack.Screen name="AnalyticsControl" component={AnalyticsControlScreen} />
                <Stack.Screen name="BracketView" component={BracketViewScreen} />

                {/* ✅ Additional Admin Screens */}
                <Stack.Screen name="ResultVerification" component={ResultVerificationScreen} />
                <Stack.Screen name="CreateAdmin" component={CreateAdmin} />
                <Stack.Screen name="EditMatchModal" component={EditMatchModal} />

                {/* ✅ Temporary Fallback */}
                <Stack.Screen name="TemporaryScreen" component={TemporaryScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </MatchProvider>
        </TournamentProvider>
      </WalletProvider>
    </AuthProvider>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
  },
});
