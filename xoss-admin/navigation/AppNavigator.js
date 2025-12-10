// navigation/AppNavigator.js - UPDATED WITH YOUR ACTUAL SCREENS
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// ✅ IMPORT ONLY THE SCREENS YOU HAVE
import AdminLogin from '../screens/AdminLogin';
import CreateAdmin from '../screens/CreateAdmin';
import AdminDashboard from '../screens/AdminDashboard';
import AuthScreen from '../screens/AuthScreen';
import EnhancedHomeControl from '../screens/EnhancedHomeControl';
import TournamentControlScreen from '../screens/TournamentControlScreen';
import WalletControlScreen from '../screens/WalletControlScreen';
import ProfileControlScreen from '../screens/ProfileControlScreen';
import MyGameControlScreen from '../screens/MyGameControlScreen';
import TopUpControlScreen from '../screens/TopUpControlScreen';
import TournamentManagementScreen from '../screens/TournamentManagementScreen';
import PlayerManagementScreen from '../screens/PlayerManagementScreen';
import MatchControlScreen from '../screens/MatchControlScreen';
import ScoreboardControlScreen from '../screens/ScoreboardControlScreen';
import PrizeManagementScreen from '../screens/PrizeManagementScreen';
import AnalyticsControlScreen from '../screens/AnalyticsControlScreen';
import BracketViewScreen from '../screens/BracketViewScreen';
import NotificationControlScreen from '../screens/NotificationControlScreen';
import ResultVerificationScreen from '../screens/ResultVerificationScreen';
import EditMatchModal from '../screens/EditMatchModal';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="AuthScreen" // বা "AdminLogin" - আপনি যেটা চান
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0a0c23' },
          animationEnabled: true,
          gestureEnabled: true
        }}
      >
        {/* ==================== AUTHENTICATION ==================== */}
        <Stack.Screen 
          name="AuthScreen" 
          component={AuthScreen} 
        />
        
        <Stack.Screen 
          name="AdminLogin" 
          component={AdminLogin} 
        />
        
        <Stack.Screen 
          name="CreateAdmin" 
          component={CreateAdmin} 
        />

        {/* ==================== MAIN DASHBOARD ==================== */}
        <Stack.Screen 
          name="AdminDashboard" 
          component={AdminDashboard} 
        />

        {/* ==================== HOME & CONTROL ==================== */}
        <Stack.Screen 
          name="EnhancedHomeControl" 
          component={EnhancedHomeControl} 
        />
        
        <Stack.Screen 
          name="TournamentControl" 
          component={TournamentControlScreen} 
        />
        
        <Stack.Screen 
          name="WalletControl" 
          component={WalletControlScreen} 
        />
        
        <Stack.Screen 
          name="ProfileControl" 
          component={ProfileControlScreen} 
        />
        
        <Stack.Screen 
          name="MyGameControl" 
          component={MyGameControlScreen} 
        />
        
        <Stack.Screen 
          name="TopUpControl" 
          component={TopUpControlScreen} 
        />

        {/* ==================== TOURNAMENT SYSTEM ==================== */}
        <Stack.Screen 
          name="TournamentManagement" 
          component={TournamentManagementScreen} 
        />
        
        <Stack.Screen 
          name="PlayerManagement" 
          component={PlayerManagementScreen} 
        />
        
        <Stack.Screen 
          name="MatchControl" 
          component={MatchControlScreen} 
        />
        
        <Stack.Screen 
          name="ScoreboardControl" 
          component={ScoreboardControlScreen} 
        />
        
        <Stack.Screen 
          name="PrizeManagement" 
          component={PrizeManagementScreen} 
        />
        
        <Stack.Screen 
          name="BracketView" 
          component={BracketViewScreen} 
        />

        {/* ==================== ANALYTICS & NOTIFICATIONS ==================== */}
        <Stack.Screen 
          name="AnalyticsControl" 
          component={AnalyticsControlScreen} 
        />
        
        <Stack.Screen 
          name="NotificationControl" 
          component={NotificationControlScreen} 
        />

        {/* ==================== RESULTS & VERIFICATION ==================== */}
        <Stack.Screen 
          name="ResultVerification" 
          component={ResultVerificationScreen} 
        />

        {/* ==================== MODAL SCREENS ==================== */}
        <Stack.Screen 
          name="EditMatchModal" 
          component={EditMatchModal} 
          options={{
            presentation: 'modal',
            animationEnabled: true,
            gestureEnabled: true,
            cardOverlayEnabled: true
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
