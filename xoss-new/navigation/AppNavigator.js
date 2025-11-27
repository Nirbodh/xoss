// navigation/AppNavigator.js - UPDATED WITH AUTH SCREENS
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Platform, StatusBar, View, ActivityIndicator, Text } from 'react-native';

// ✅ Import useAuth from context
import { useAuth } from '../context/AuthContext';

// Import screens
import EnhancedHomeScreen from '../screens/EnhancedHomeScreen';
import TournamentsScreen from '../screens/TournamentsScreen';
import WalletScreen from '../screens/WalletScreen';
import TopUpScreen from '../screens/TopUpScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyGameScreen from '../screens/MyGameScreen';
import MatchDetailsScreen from '../screens/MatchDetailsScreen';
import JoinMatchScreen from '../screens/JoinMatchScreen';
import RoomScreen from '../screens/RoomScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import LiveMatchesScreen from '../screens/LiveMatchesScreen';
import InviteScreen from '../screens/InviteScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import DepositScreen from '../screens/DepositScreen';
import WithdrawScreen from '../screens/WithdrawScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import DonateScreen from '../screens/DonateScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import CreateMatchScreen from '../screens/CreateMatchScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';

// ✅ Import Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ✅ Auth Stack - Login and Register screens
function AuthStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animationEnabled: true 
      }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Home Stack
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={EnhancedHomeScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="LiveMatches" component={LiveMatchesScreen} />
      <Stack.Screen name="Invite" component={InviteScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
    </Stack.Navigator>
  );
}

// Tournament Stack
function TournamentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TournamentsMain" component={TournamentsScreen} />
      <Stack.Screen name="MatchDetails" component={MatchDetailsScreen} />
      <Stack.Screen name="JoinMatch" component={JoinMatchScreen} />
      <Stack.Screen name="Room" component={RoomScreen} />
      <Stack.Screen name="CreateMatch" component={CreateMatchScreen} />
    </Stack.Navigator>
  );
}

// Wallet Stack
function WalletStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WalletMain" component={WalletScreen} />
      <Stack.Screen name="Deposit" component={DepositScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <Stack.Screen name="Donate" component={DonateScreen} />
    </Stack.Navigator>
  );
}

// Profile Stack
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Invite" component={InviteScreen} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0c23' }}>
      <StatusBar backgroundColor="#1a237e" barStyle="light-content" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let IconComponent = Ionicons;
            
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Tournament') {
              iconName = focused ? 'trophy' : 'trophy-outline';
            } else if (route.name === 'MyGame') {
              iconName = focused ? 'game-controller' : 'game-controller-outline';
            } else if (route.name === 'Wallet') {
              iconName = focused ? 'wallet' : 'wallet-outline';
            } else if (route.name === 'TopUp') {
              IconComponent = MaterialIcons;
              iconName = 'attach-money';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <IconComponent name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#ff8a00',
          tabBarInactiveTintColor: '#b0b8ff',
          tabBarStyle: {
            backgroundColor: '#1a1f3d',
            borderTopWidth: 0,
            height: Platform.OS === 'android' ? 70 : 85,
            paddingBottom: Platform.OS === 'android' ? 12 : 20,
            paddingTop: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginBottom: Platform.OS === 'android' ? 2 : 0,
          },
          tabBarItemStyle: {
            marginHorizontal: 2,
            borderRadius: 12,
            marginVertical: 4,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Tournament" component={TournamentStack} />
        <Tab.Screen name="MyGame" component={MyGameScreen} />
        <Tab.Screen name="Wallet" component={WalletStack} />
        <Tab.Screen name="TopUp" component={TopUpScreen} />
        <Tab.Screen name="Profile" component={ProfileStack} />
      </Tab.Navigator>
    </View>
  );
}

// ✅ Root Navigator - Handles Auth and Main App
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth(); // ✅ Now useAuth is imported

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0c23' }}>
        <ActivityIndicator size="large" color="#2962ff" />
        <Text style={{ color: 'white', marginTop: 10 }}>Loading XOSS Gaming...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // ✅ User is authenticated - Show Main App
          <Stack.Screen name="MainApp" component={MainTabs} />
        ) : (
          // ✅ User is not authenticated - Show Auth Screens
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
