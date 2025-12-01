// screens/AdminDashboard.js - COMPLETE FIXED VERSION
import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();

  // ৬টি এডমিন কন্ট্রোল মডিউল
  const adminModules = [
    {
      id: 1,
      title: 'Home Screen Control',
      description: 'Manage featured content, games, banners',
      icon: 'home',
      color: '#2962ff',
      screen: 'EnhancedHomeControl'
    },
    {
      id: 2,
      title: 'Tournament Control',
      description: 'Create and manage tournaments',
      icon: 'trophy',
      color: '#FF6B35',
      screen: 'TournamentControl'
    },
    {
      id: 3,
      title: 'Wallet Control',
      description: 'Monitor transactions and payments',
      icon: 'wallet',
      color: '#4CAF50',
      screen: 'WalletControl'
    },
    {
      id: 4,
      title: 'Profile Control',
      description: 'Manage user profiles and settings',
      icon: 'person',
      color: '#9C27B0',
      screen: 'ProfileControl'
    },
    {
      id: 5,
      title: 'My Game Control',
      description: 'Manage game sessions and matches',
      icon: 'game-controller',
      color: '#FFD700',
      screen: 'MyGameControl'
    },
    {
      id: 6,
      title: 'TopUp Control',
      description: 'Manage top-up requests and methods',
      icon: 'cash',
      color: '#00BCD4',
      screen: 'TopUpControl'
    }
  ];

  // ✅ FIXED LOGOUT FUNCTION
  const handleLogout = async () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to logout from admin panel?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Starting logout process...');
              
              // Call logout from AuthContext
              const logoutResult = await logout();
              
              if (logoutResult.success) {
                console.log('✅ Logout successful, navigating to AdminLogin...');
                
                // ✅ FIXED: Use navigation reset to clear stack
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'AdminLogin' }],
                });
              } else {
                console.log('❌ Logout failed:', logoutResult.error);
                Alert.alert('Logout Error', 'Failed to logout. Please try again.');
              }
            } catch (error) {
              console.log('🔥 Logout error:', error);
              // Even if there's an error, try to navigate to login
              navigation.reset({
                index: 0,
                routes: [{ name: 'AdminLogin' }],
              });
            }
          }
        }
      ]
    );
  };

  const AdminModuleCard = ({ module }) => (
    <TouchableOpacity 
      style={styles.moduleCard}
      onPress={() => navigation.navigate(module.screen)}
    >
      <LinearGradient
        colors={[module.color, `${module.color}DD`]}
        style={styles.moduleIcon}
      >
        <Ionicons name={module.icon} size={28} color="white" />
      </LinearGradient>
      <View style={styles.moduleContent}>
        <Text style={styles.moduleTitle}>{module.title}</Text>
        <Text style={styles.moduleDescription}>{module.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <LinearGradient
          colors={['#1a237e', '#283593']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>XOSS Admin Panel</Text>
              <Text style={styles.headerSubtitle}>Manage All User Screens</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="white" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          
          {/* Admin Info */}
          <View style={styles.adminInfo}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.adminText}>
              Logged in as: {user?.email || 'Admin User'}
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>1,250</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>48</Text>
            <Text style={styles.statLabel}>Active Now</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>৳25K</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        {/* Admin Modules - 6 Buttons */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Screen Management</Text>
          {adminModules.map(module => (
            <AdminModuleCard key={module.id} module={module} />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#2962ff' }]}
              onPress={() => navigation.navigate('CreateAdmin')}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.actionText}>Create Match</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => navigation.navigate('TournamentControl')}
            >
              <Ionicons name="analytics" size={20} color="white" />
              <Text style={styles.actionText}>Tournaments</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Server Status */}
        <View style={styles.serverStatus}>
          <Text style={styles.sectionTitle}>🌐 Server Status</Text>
          <View style={styles.serverInfo}>
            <Ionicons name="server" size={20} color="#4CAF50" />
            <Text style={styles.serverText}>Connected: 192.168.0.100:5000</Text>
          </View>
          <View style={styles.serverInfo}>
            <Ionicons name="wifi" size={20} color="#4CAF50" />
            <Text style={styles.serverText}>Status: Online</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 30,
    paddingTop: 80,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#b0b8ff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  adminText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#b0b8ff',
    textAlign: 'center',
  },
  modulesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  moduleIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 12,
    color: '#b0b8ff',
  },
  quickActions: {
    padding: 20,
    paddingTop: 0,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  serverStatus: {
    padding: 20,
    paddingTop: 0,
  },
  serverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  serverText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 10,
  },
});

export default AdminDashboard;
