// App.js - COMPLETELY CORRECTED WITH AUTH PROVIDER
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
//import { NavigationContainer } from '@react-native-community/navigation';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, Text, TouchableOpacity, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// ✅ MUST IMPORT AUTH PROVIDER
import { AuthProvider } from './context/AuthContext';
import { TournamentProvider } from './context/TournamentContext';

// Import ALL screens
import AdminDashboard from './screens/AdminDashboard';
import EnhancedHomeControl from './screens/EnhancedHomeControl';
import TournamentControlScreen from './screens/TournamentControlScreen';

// Tournament management screens
import TournamentManagementScreen from './screens/TournamentManagementScreen';
import PlayerManagementScreen from './screens/PlayerManagementScreen';
import MatchControlScreen from './screens/MatchControlScreen';
import ScoreboardControlScreen from './screens/ScoreboardControlScreen';
import PrizeManagementScreen from './screens/PrizeManagementScreen';
import NotificationControlScreen from './screens/NotificationControlScreen';
import AnalyticsControlScreen from './screens/AnalyticsControlScreen';
import BracketViewScreen from './screens/BracketViewScreen';

// Other screens
import WalletControlScreen from './screens/WalletControlScreen';
import ProfileControlScreen from './screens/ProfileControlScreen';
import MyGameControlScreen from './screens/MyGameControlScreen';
import TopUpControlScreen from './screens/TopUpControlScreen';

const Stack = createStackNavigator();

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// Better Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('🚨 App Error:', error);
    console.log('📋 Error Info:', errorInfo);
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: '#0a0c23',
          padding: 20 
        }}>
          <Text style={{ color: '#ff6b6b', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
            ⚠️ App Crash
          </Text>
          <Text style={{ color: 'white', fontSize: 16, marginBottom: 10, textAlign: 'center' }}>
            Something went wrong in the application
          </Text>
          <Text style={{ color: '#b0b8ff', fontSize: 12, marginBottom: 20, textAlign: 'center' }}>
            {this.state.error?.toString()}
          </Text>
          
          <TouchableOpacity 
            style={{ 
              marginTop: 20, 
              padding: 15, 
              backgroundColor: '#2962ff', 
              borderRadius: 8,
              minWidth: 120 
            }}
            onPress={this.resetError}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              Try Again
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ 
              marginTop: 10, 
              padding: 12, 
              backgroundColor: '#455a64', 
              borderRadius: 8,
              minWidth: 120 
            }}
            onPress={() => console.log(this.state.errorInfo)}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>
              Debug Info
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// App Loading Component
const AppLoading = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0c23' }}>
    <Text style={{ color: 'white', fontSize: 18 }}>Loading Tournament App...</Text>
  </View>
);

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  React.useEffect(() => {
    // App initialization
    setTimeout(() => {
      setAppIsReady(true);
    }, 1000);
  }, []);

  if (!appIsReady) {
    return <AppLoading />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        {/* ✅ MUST ADD AUTH PROVIDER - এইটা সবচেয়ে important */}
        <AuthProvider>
          <TournamentProvider>
            <NavigationContainer>
              <StatusBar 
                backgroundColor="#1a237e" 
                barStyle="light-content" 
                translucent={false}
              />
              <Stack.Navigator
                initialRouteName="AdminDashboard"
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: true,
                  cardOverlayEnabled: true,
                  animation: 'slide_from_right'
                }}
              >
                {/* Main Navigation Stack */}
                <Stack.Screen 
                  name="AdminDashboard" 
                  component={AdminDashboard}
                  options={{ animation: 'fade' }}
                />
                
                <Stack.Screen 
                  name="EnhancedHomeControl" 
                  component={EnhancedHomeControl} 
                />
                
                <Stack.Screen 
                  name="TournamentControl" 
                  component={TournamentControlScreen} 
                />
                
                {/* Tournament Management Stack */}
                <Stack.Group>
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
                    name="NotificationControl" 
                    component={NotificationControlScreen} 
                  />
                  <Stack.Screen 
                    name="AnalyticsControl" 
                    component={AnalyticsControlScreen} 
                  />
                  <Stack.Screen 
                    name="BracketView" 
                    component={BracketViewScreen} 
                  />
                </Stack.Group>
                
                {/* Other Features Stack */}
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
              </Stack.Navigator>
            </NavigationContainer>
          </TournamentProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
