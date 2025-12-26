// navigation/AppNavigator.js - COMPLETELY UPDATED VERSION
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Platform, StatusBar, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';

// ✅ Import contexts
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../context/WalletContext';

// ✅ Import ALL screens
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
import SplashScreen from '../screens/SplashScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

// ✅ Import Notification and Chat screens
import NotificationsScreen from '../screens/NotificationsScreen';
import ChatScreen from '../screens/ChatScreen';
import SupportScreen from '../screens/SupportScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ✅ Custom Tab Bar Badge Component
const TabBarBadge = ({ count, color = '#FF6B35' }) => {
  if (!count || count === 0) return null;
  
  return (
    <View style={{
      position: 'absolute',
      top: -2,
      right: -5,
      backgroundColor: color,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#1a1f3d',
      zIndex: 1,
    }}>
      <Text style={{
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
      }}>
        {count > 9 ? '9+' : count}
      </Text>
    </View>
  );
};

// ✅ Splash Stack
function SplashStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Auth" component={AuthStack} />
    </Stack.Navigator>
  );
}

// ✅ Auth Stack - Login and Register screens
function AuthStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#0a0c23' }
      }}
      initialRouteName="Login"
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{
          animationTypeForReplace: 'pop'
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{
          animationTypeForReplace: 'push'
        }}
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen} 
        options={{
          title: 'Reset Password'
        }}
      />
    </Stack.Navigator>
  );
}

// ✅ Home Stack
function HomeStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0c23' }
      }}
    >
      <Stack.Screen name="HomeMain" component={EnhancedHomeScreen} />
      <Stack.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{
          headerShown: true,
          title: 'Leaderboard',
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="LiveMatches" 
        component={LiveMatchesScreen}
        options={{
          headerShown: true,
          title: 'Live Matches',
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen name="Invite" component={InviteScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
    </Stack.Navigator>
  );
}

// ✅ Tournament Stack
function TournamentStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0c23' }
      }}
    >
      <Stack.Screen name="TournamentsMain" component={TournamentsScreen} />
      <Stack.Screen 
        name="MatchDetails" 
        component={MatchDetailsScreen}
        options={{
          headerShown: true,
          title: 'Match Details',
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="JoinMatch" 
        component={JoinMatchScreen}
        options={{
          headerShown: true,
          title: 'Join Match',
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="Room" 
        component={RoomScreen}
        options={{
          headerShown: true,
          title: 'Game Room',
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 15 }}>
              <Ionicons name="share-social" size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen 
        name="CreateMatch" 
        component={CreateMatchScreen}
        options={{
          headerShown: true,
          title: 'Create Match',
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
        }}
      />
    </Stack.Navigator>
  );
}

// ✅ Wallet Stack - ENHANCED WITH WITHDRAWAL SYSTEM
function WalletStack() {
  const { balance, getPendingWithdrawals } = useWallet();
  
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0c23' }
      }}
    >
      <Stack.Screen 
        name="WalletMain" 
        component={WalletScreen}
        options={{
          headerShown: true,
          title: `Wallet - ৳${balance.toFixed(2)}`,
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="Deposit" 
        component={DepositScreen}
        options={{
          headerShown: true,
          title: 'Add Money',
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="Withdraw" 
        component={WithdrawScreen}
        options={{
          headerShown: true,
          title: 'Withdraw Money',
          headerStyle: {
            backgroundColor: '#667eea',
          },
          headerTintColor: 'white',
          headerRight: () => {
            const pending = getPendingWithdrawals();
            return pending.length > 0 ? (
              <TouchableOpacity 
                style={{ 
                  marginRight: 15, 
                  backgroundColor: '#FF6B35',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  Pending: {pending.length}
                </Text>
              </TouchableOpacity>
            ) : null;
          },
        }}
      />
      <Stack.Screen 
        name="TransactionHistory" 
        component={TransactionHistoryScreen}
        options={{
          headerShown: true,
          title: 'Transaction History',
          headerStyle: {
            backgroundColor: '#667eea',
          },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="Donate" 
        component={DonateScreen}
        options={{
          headerShown: true,
          title: 'Donate',
          headerStyle: {
            backgroundColor: '#9C27B0',
          },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="PaymentMethods" 
        component={PaymentMethodsScreen}
        options={{
          headerShown: true,
          title: 'Payment Methods',
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
        }}
      />
    </Stack.Navigator>
  );
}

// ✅ Profile Stack
function ProfileStack() {
  const { user } = useAuth();
  
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0c23' }
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: user?.name || 'Profile',
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          headerShown: true,
          title: 'Edit Profile',
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="PrivacySecurity" 
        component={PrivacySecurityScreen}
        options={{
          headerShown: true,
          title: 'Privacy & Security',
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="Invite" 
        component={InviteScreen}
        options={{
          headerShown: true,
          title: 'Invite Friends',
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          headerShown: true,
          title: 'Notifications',
          headerStyle: {
            backgroundColor: '#1a1f3d',
          },
          headerTintColor: 'white',
        }}
      />
    </Stack.Navigator>
  );
}

// ✅ Main Tab Navigator - ENHANCED
function MainTabs() {
  const { theme } = useTheme();
  const { getPendingWithdrawals } = useWallet();
  const pendingWithdrawals = getPendingWithdrawals();
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar 
        backgroundColor="#1a237e" 
        barStyle="light-content" 
        translucent={false}
      />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let IconComponent = Ionicons;
            let badgeCount = 0;
            
            switch (route.name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline';
                badgeCount = 5; // Example: unread notifications
                break;
              case 'Tournament':
                iconName = focused ? 'trophy' : 'trophy-outline';
                break;
              case 'MyGame':
                iconName = focused ? 'game-controller' : 'game-controller-outline';
                break;
              case 'Wallet':
                iconName = focused ? 'wallet' : 'wallet-outline';
                badgeCount = pendingWithdrawals.length;
                break;
              case 'TopUp':
                IconComponent = MaterialIcons;
                iconName = 'attach-money';
                break;
              case 'Profile':
                iconName = focused ? 'person' : 'person-outline';
                break;
              default:
                iconName = 'help-circle-outline';
            }

            return (
              <View style={{ position: 'relative' }}>
                <IconComponent name={iconName} size={size} color={color} />
                {badgeCount > 0 && (
                  <TabBarBadge 
                    count={badgeCount} 
                    color={route.name === 'Wallet' ? '#FF6B35' : '#FF4444'} 
                  />
                )}
              </View>
            );
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
            position: 'relative',
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
          tabBarHideOnKeyboard: true,
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStack} 
          options={{ 
            title: 'Home',
            tabBarLabelStyle: { fontWeight: 'bold' }
          }}
        />
        <Tab.Screen 
          name="Tournament" 
          component={TournamentStack} 
          options={{ 
            title: 'Tournament',
            tabBarLabelStyle: { fontWeight: 'bold' }
          }}
        />
        <Tab.Screen 
          name="MyGame" 
          component={MyGameScreen} 
          options={{ 
            title: 'My Game',
            tabBarLabelStyle: { fontWeight: 'bold' }
          }}
        />
        <Tab.Screen 
          name="Wallet" 
          component={WalletStack} 
          options={{ 
            title: 'Wallet',
            tabBarLabelStyle: { fontWeight: 'bold' }
          }}
        />
        <Tab.Screen 
          name="TopUp" 
          component={TopUpScreen} 
          options={{ 
            title: 'Top Up',
            tabBarLabelStyle: { fontWeight: 'bold' }
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileStack} 
          options={{ 
            title: 'Profile',
            tabBarLabelStyle: { fontWeight: 'bold' }
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

// ✅ Loading Component
function LoadingScreen() {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#0a0c23' 
    }}>
      <ActivityIndicator size="large" color="#2962ff" />
      <Text style={{ 
        color: 'white', 
        marginTop: 10,
        fontSize: 16,
        fontWeight: 'bold'
      }}>
        Loading XOSS Gaming...
      </Text>
      <Text style={{ 
        color: '#b0b8ff', 
        marginTop: 5,
        fontSize: 12
      }}>
        Preparing your gaming experience
      </Text>
    </View>
  );
}

// ✅ Root Navigator - Handles Auth and Main App
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  // Show loading while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={{
      dark: theme.mode === 'dark',
      colors: {
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.card,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.error,
      }
    }}>
      <StatusBar 
        backgroundColor={theme.colors.background} 
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
      />
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.background },
          animationEnabled: true,
          gestureEnabled: true,
        }}
      >
        {isAuthenticated ? (
          // ✅ User is authenticated - Show Main App
          <Stack.Screen 
            name="MainApp" 
            component={MainTabs} 
            options={{
              animationTypeForReplace: 'push',
              gestureEnabled: false,
            }}
          />
        ) : (
          // ✅ User is not authenticated - Show Auth Screens
          <Stack.Screen 
            name="Auth" 
            component={AuthStack} 
            options={{
              animationTypeForReplace: 'pop',
              gestureEnabled: false,
            }}
          />
        )}
        
        {/* ✅ Global Screens Accessible from Anywhere */}
        <Stack.Group screenOptions={{ 
          presentation: 'modal',
          headerShown: false 
        }}>
          <Stack.Screen name="NotificationsModal" component={NotificationsScreen} />
          <Stack.Screen name="ChatModal" component={ChatScreen} />
          <Stack.Screen name="SupportModal" component={SupportScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
