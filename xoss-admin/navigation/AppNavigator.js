// navigation/AppNavigator.js - COMPLETE ADMIN NAVIGATION WITH SUB-MODULES
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import All Admin Screens
import AdminDashboard from '../screens/AdminDashboard';
import EnhancedHomeControl from '../screens/EnhancedHomeControl';
import TournamentControlScreen from '../screens/TournamentControlScreen';
import WalletControlScreen from '../screens/WalletControlScreen';
import ProfileControlScreen from '../screens/ProfileControlScreen';
import MyGameControlScreen from '../screens/MyGameControlScreen';
import TopUpControlScreen from '../screens/TopUpControlScreen';

// ✅ Import All Sub-Modules for Tournament Control
import TournamentManagementScreen from '../screens/TournamentManagementScreen';
import PlayerManagementScreen from '../screens/PlayerManagementScreen';
import MatchControlScreen from '../screens/MatchControlScreen';
import ScoreboardControlScreen from '../screens/ScoreboardControlScreen';
import PrizeManagementScreen from '../screens/PrizeManagementScreen';
import NotificationControlScreen from '../screens/NotificationControlScreen';
import AnalyticsControlScreen from '../screens/AnalyticsControlScreen';
import BracketViewScreen from '../screens/BracketViewScreen';

const Stack = createStackNavigator();

function AdminStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0c23' },
        animationEnabled: true,
        gestureEnabled: true
      }}
    >
      {/* Main Admin Screens */}
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="EnhancedHomeControl" component={EnhancedHomeControl} />
      <Stack.Screen name="TournamentControl" component={TournamentControlScreen} />
      <Stack.Screen name="WalletControl" component={WalletControlScreen} />
      <Stack.Screen name="ProfileControl" component={ProfileControlScreen} />
      <Stack.Screen name="MyGameControl" component={MyGameControlScreen} />
      <Stack.Screen name="TopUpControl" component={TopUpControlScreen} />

      {/* ✅ Tournament Control Sub-Modules */}
      <Stack.Screen name="TournamentManagement" component={TournamentManagementScreen} />
      <Stack.Screen name="PlayerManagement" component={PlayerManagementScreen} />
      <Stack.Screen name="MatchControl" component={MatchControlScreen} />
      <Stack.Screen name="ScoreboardControl" component={ScoreboardControlScreen} />
      <Stack.Screen name="PrizeManagement" component={PrizeManagementScreen} />
      <Stack.Screen name="NotificationControl" component={NotificationControlScreen} />
      <Stack.Screen name="AnalyticsControl" component={AnalyticsControlScreen} />
      <Stack.Screen name="BracketView" component={BracketViewScreen} />
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
