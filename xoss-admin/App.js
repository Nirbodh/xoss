import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import { TournamentProvider } from './context/TournamentContext';
import { WalletProvider } from './context/WalletContext';

// Import screens
import TournamentControlScreen from './screens/TournamentControlScreen';
import MatchControlScreen from './screens/MatchControlScreen';
import TournamentManagementScreen from './screens/TournamentManagementScreen';
import CreateAdmin from './screens/CreateAdmin';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <TournamentProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: '#0a0c23' }
              }}
            >
              {/* Admin Management Screens */}
              <Stack.Screen 
                name="TournamentControl" 
                component={TournamentControlScreen}
              />
              <Stack.Screen 
                name="MatchControl" 
                component={MatchControlScreen}
              />
              <Stack.Screen 
                name="TournamentManagement" 
                component={TournamentManagementScreen}
              />
              </Stack.Navigator>
               <Stack.Screen 
                name="CreateAdmin" 
               component={CreateAdmin}
            />
          </NavigationContainer>
        </TournamentProvider>
      </WalletProvider>
    </AuthProvider>
  );
}
