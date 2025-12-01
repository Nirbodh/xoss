// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import All Admin Screens
import AdminDashboard from '../screens/AdminDashboard';
import AdminLogin from '../screens/AdminLogin'; // ✅ ADD THIS LINE
import EnhancedHomeControl from '../screens/EnhancedHomeControl';
import TournamentControlScreen from '../screens/TournamentControlScreen';
import WalletControlScreen from '../screens/WalletControlScreen';
import ProfileControlScreen from '../screens/ProfileControlScreen';
import MyGameControlScreen from '../screens/MyGameControlScreen';
import TopUpControlScreen from '../screens/TopUpControlScreen';

// Import Tournament Sub-Modules
import TournamentManagementScreen from '../screens/TournamentManagementScreen';
import PlayerManagementScreen from '../screens/PlayerManagementScreen';
import MatchControlScreen from '../screens/MatchControlScreen';
import ScoreboardControlScreen from '../screens/ScoreboardControlScreen';
import PrizeManagementScreen from '../screens/PrizeManagementScreen';
import NotificationControlScreen from '../screens/NotificationControlScreen';
import AnalyticsControlScreen from '../screens/AnalyticsControlScreen';
import BracketViewScreen from '../screens/BracketViewScreen';

// Import Additional Admin Screens
import ResultVerificationScreen from '../screens/ResultVerificationScreen';
import CreateAdmin from '../screens/CreateAdmin';
import EditMatchModal from '../screens/EditMatchModal';

const Stack = createStackNavigator();

function AdminStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminLogin" // ✅ CHANGE THIS LINE
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0c23' },
        animationEnabled: true,
        gestureEnabled: true
      }}
    >
      {/* ✅ ADD THIS SCREEN AS FIRST */}
      <Stack.Screen 
        name="AdminLogin" 
        component={AdminLogin} 
      />
      
      {/* Main Admin Dashboard */}
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminDashboard} 
      />
      
      {/* Keep all your existing screens below... */}
      <Stack.Screen 
        name="EnhancedHomeControl" 
        component={EnhancedHomeControl} 
      />
      <Stack.Screen 
        name="TournamentControl" 
        component={TournamentControlScreen} 
      />
      {/* ... rest of your screens remain the same */}
      
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <AdminStack />
    </NavigationContainer>
  );
}
