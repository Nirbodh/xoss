// screens/TournamentControlScreen.js - UPDATED WITH CREATE MATCH FUNCTIONALITY
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Image,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Game icons mapping
const gameIcons = {
  'freefire': require('../assets/games/free-fire-banner.jpg'),
  'pubg': require('../assets/games/pubg-banner.jpg'), 
  'cod': require('../assets/games/cod-banner.jpg'),
  'ludo': require('../assets/games/ludo-banner.jpg'),
  'fortnite': require('../assets/games/fortnite-banner.jpg'),
  'valorant': require('../assets/games/valorant-banner.jpg'),
};

const getGameDisplayName = (gameId) => {
  const gameNames = {
    'freefire': 'Free Fire',
    'pubg': 'PUBG Mobile',
    'cod': 'Call of Duty',
    'ludo': 'Ludo King',
    'fortnite': 'Fortnite',
    'valorant': 'Valorant'
  };
  return gameNames[gameId] || gameId;
};

// Sub-modules for Tournament Control
const SUB_MODULES = [
  {
    id: 'tournament-management',
    title: 'Tournament Management',
    description: 'Create, edit, delete tournaments',
    icon: 'tournament',
    color: '#2962ff',
    screen: 'TournamentManagement'
  },
  {
    id: 'player-management',
    title: 'Player Management',
    description: 'Manage players, teams, participants',
    icon: 'account-group',
    color: '#4CAF50',
    screen: 'PlayerManagement'
  },
  {
    id: 'match-control',
    title: 'Match Control',
    description: 'Create and manage matches',
    icon: 'sword-cross',
    color: '#FF6B35',
    screen: 'MatchControl'
  },
  {
    id: 'scoreboard',
    title: 'Scoreboard',
    description: 'Live scores and leaderboard',
    icon: 'scoreboard',
    color: '#FFD700',
    screen: 'ScoreboardControl'
  },
  {
    id: 'prize-management',
    title: 'Prize Management',
    description: 'Manage prizes and distribution',
    icon: 'gift',
    color: '#9C27B0',
    screen: 'PrizeManagement'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Send alerts and updates',
    icon: 'bell',
    color: '#00BCD4',
    screen: 'NotificationControl'
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    description: 'View stats and insights',
    icon: 'chart-bar',
    color: '#795548',
    screen: 'AnalyticsControl'
  },
{
  id: 'tournament-management',
  title: 'Tournament Management',
  description: 'Create, edit, delete tournaments',
  icon: 'tournament',
  color: '#2962ff',
  screen: 'TournamentManagement' // 🆕 Add this line
},
  {
    id: 'brackets',
    title: 'Tournament Brackets',
    description: 'Visual bracket management',
    icon: 'sitemap',
    color: '#E91E63',
    screen: 'BracketView'
  }
];

const TournamentControlScreen = ({ navigation }) => {
  const [activeModule, setActiveModule] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMatchData, setNewMatchData] = useState({
    type: 'match', // 'match' or 'tournament'
    title: '',
    game: 'freefire',
    entryFee: '',
    prizePool: '',
    roomId: '',
    roomPassword: '',
    maxParticipants: '',
    perKill: ''
  });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPlayers: 0,
    activeEvents: 0,
    completedEvents: 0,
    totalPrizePool: 0
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Your existing event loading logic...
      const mockEvents = [
        {
          id: '1',
          title: "SOLO MATCH | 2:00 PM",
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          totalPrize: 400,
          perKill: 5,
          entryFee: 10,
          type: "solo",
          version: "Mobile",
          map: "Bermuda",
          currentParticipants: 16,
          maxParticipants: 48,
          roomId: "4598XY",
          roomPassword: "1234",
          status: 'upcoming',
          game: 'freefire',
          matchType: 'match',
          registeredPlayers: 16,
          spotsLeft: 32,
          isActive: true,
          featured: false,
          createdAt: new Date().toISOString()
        }
      ];
      setEvents(mockEvents);
      calculateStats(mockEvents);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (eventsList) => {
    const totalRevenue = eventsList.reduce((sum, event) => 
      sum + (event.entryFee * event.registeredPlayers), 0
    );
    
    const totalPlayers = eventsList.reduce((sum, event) => 
      sum + event.registeredPlayers, 0
    );
    
    const activeEvents = eventsList.filter(event => 
      event.isActive && (event.status === 'upcoming' || event.status === 'live')
    ).length;
    
    const completedEvents = eventsList.filter(event => 
      event.status === 'completed'
    ).length;

    const totalPrizePool = eventsList.reduce((sum, event) => 
      sum + event.totalPrize, 0
    );

    setStats({
      totalRevenue,
      totalPlayers,
      activeEvents,
      completedEvents,
      totalPrizePool
    });
  };

  const handleCreateMatch = async () => {
    // Validation
    if (!newMatchData.title || !newMatchData.entryFee || !newMatchData.prizePool || 
        !newMatchData.roomId || !newMatchData.roomPassword || !newMatchData.maxParticipants) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const matchData = {
        id: Date.now().toString(),
        ...newMatchData,
        entryFee: parseInt(newMatchData.entryFee),
        prizePool: parseInt(newMatchData.prizePool),
        maxParticipants: parseInt(newMatchData.maxParticipants),
        perKill: parseInt(newMatchData.perKill) || 0,
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        currentParticipants: 0,
        registeredPlayers: 0,
        spotsLeft: parseInt(newMatchData.maxParticipants),
        status: 'upcoming',
        isActive: true,
        featured: false,
        createdAt: new Date().toISOString(),
        type: "solo",
        version: "Mobile",
        map: "Bermuda"
      };

      // Save to your state/database
      const updatedEvents = [...events, matchData];
      setEvents(updatedEvents);
      calculateStats(updatedEvents);

      // Reset form and close modal
      setNewMatchData({
        type: 'match',
        title: '',
        game: 'freefire',
        entryFee: '',
        prizePool: '',
        roomId: '',
        roomPassword: '',
        maxParticipants: '',
        perKill: ''
      });
      setShowCreateModal(false);

      Alert.alert('Success', `${newMatchData.type === 'match' ? 'Regular Match' : 'Tournament'} created successfully!`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to create match');
      console.error(error);
    }
  };

  const handleModulePress = (module) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveModule(module);
    
    // Navigate to specific sub-module screens
    switch(module.id) {
      case 'tournament-management':
        navigation.navigate('TournamentManagement');
        break;
      case 'player-management':
        navigation.navigate('PlayerManagement');
        break;
      case 'match-control':
        navigation.navigate('MatchControl');
        break;
      case 'scoreboard':
        navigation.navigate('ScoreboardControl');
        break;
      case 'prize-management':
        navigation.navigate('PrizeManagement');
        break;
      case 'notifications':
        navigation.navigate('NotificationControl');
        break;
      case 'analytics':
        navigation.navigate('AnalyticsControl');
        break;
      case 'brackets':
        navigation.navigate('BracketView');
        break;
      default:
        Alert.alert('Module', `${module.title} selected`);
    }
  };

  // Create Match Modal Component
  const CreateMatchModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Match</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Match Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Match Type *</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity 
                  style={[
                    styles.typeButton,
                    newMatchData.type === 'match' && styles.typeButtonActive
                  ]}
                  onPress={() => setNewMatchData({...newMatchData, type: 'match'})}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newMatchData.type === 'match' && styles.typeButtonTextActive
                  ]}>Regular Match</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.typeButton,
                    newMatchData.type === 'tournament' && styles.typeButtonActive
                  ]}
                  onPress={() => setNewMatchData({...newMatchData, type: 'tournament'})}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newMatchData.type === 'tournament' && styles.typeButtonTextActive
                  ]}>Tournament</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Match Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., SOLO MATCH | 2:00 PM"
                value={newMatchData.title}
                onChangeText={(text) => setNewMatchData({...newMatchData, title: text})}
              />
            </View>

            {/* Game Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Game *</Text>
              <View style={styles.gameButtons}>
                {Object.keys(gameIcons).map((game) => (
                  <TouchableOpacity
                    key={game}
                    style={[
                      styles.gameButton,
                      newMatchData.game === game && styles.gameButtonActive
                    ]}
                    onPress={() => setNewMatchData({...newMatchData, game})}
                  >
                    <Text style={[
                      styles.gameButtonText,
                      newMatchData.game === game && styles.gameButtonTextActive
                    ]}>
                      {getGameDisplayName(game)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Entry Fee & Prize Pool */}
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Entry Fee (৳) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="10"
                  keyboardType="numeric"
                  value={newMatchData.entryFee}
                  onChangeText={(text) => setNewMatchData({...newMatchData, entryFee: text})}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Prize Pool (৳) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="400"
                  keyboardType="numeric"
                  value={newMatchData.prizePool}
                  onChangeText={(text) => setNewMatchData({...newMatchData, prizePool: text})}
                />
              </View>
            </View>

            {/* Room ID & Password */}
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Room ID *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="4598XY"
                  value={newMatchData.roomId}
                  onChangeText={(text) => setNewMatchData({...newMatchData, roomId: text})}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Room Password *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="1234"
                  value={newMatchData.roomPassword}
                  onChangeText={(text) => setNewMatchData({...newMatchData, roomPassword: text})}
                />
              </View>
            </View>

            {/* Max Participants & Per Kill */}
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Max Players *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="48"
                  keyboardType="numeric"
                  value={newMatchData.maxParticipants}
                  onChangeText={(text) => setNewMatchData({...newMatchData, maxParticipants: text})}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Per Kill Prize (৳)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="5"
                  keyboardType="numeric"
                  value={newMatchData.perKill}
                  onChangeText={(text) => setNewMatchData({...newMatchData, perKill: text})}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateMatch}
            >
              <Text style={styles.createButtonText}>
                Create {newMatchData.type === 'match' ? 'Match' : 'Tournament'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const SubModuleCard = ({ module, index }) => {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          delay: index * 100,
          useNativeDriver: true,
        })
      ]).start();
    }, []);

    const getIconComponent = (iconName) => {
      switch(iconName) {
        case 'tournament':
          return <MaterialCommunityIcons name="tournament" size={28} color="white" />;
        case 'account-group':
          return <MaterialCommunityIcons name="account-group" size={28} color="white" />;
        case 'sword-cross':
          return <MaterialCommunityIcons name="sword-cross" size={28} color="white" />;
        case 'scoreboard':
          return <MaterialCommunityIcons name="scoreboard" size={28} color="white" />;
        case 'gift':
          return <MaterialIcons name="card-giftcard" size={28} color="white" />;
        case 'bell':
          return <Ionicons name="notifications" size={28} color="white" />;
        case 'chart-bar':
          return <MaterialCommunityIcons name="chart-bar" size={28} color="white" />;
        case 'sitemap':
          return <FontAwesome5 name="sitemap" size={28} color="white" />;
        default:
          return <Ionicons name="settings" size={28} color="white" />;
      }
    };

    return (
      <Animated.View 
        style={[
          styles.moduleCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.moduleTouchable}
          onPress={() => handleModulePress(module)}
        >
          <LinearGradient
            colors={[module.color, `${module.color}DD`]}
            style={styles.moduleGradient}
          >
            <View style={styles.moduleIconContainer}>
              {getIconComponent(module.icon)}
            </View>
            
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Text style={styles.moduleDescription}>{module.description}</Text>
            </View>
            
            <View style={styles.moduleArrow}>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const QuickActionButton = ({ icon, title, color, onPress }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <LinearGradient
        colors={[color, `${color}DD`]}
        style={styles.quickActionGradient}
      >
        <Ionicons name={icon} size={24} color="white" />
        <Text style={styles.quickActionText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const headerBackground = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: ['rgba(26, 35, 126, 1)', 'rgba(26, 35, 126, 0.95)'],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2962ff" />
          <Text style={styles.loadingText}>Loading Tournament Control...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <CreateMatchModal />
      
      <Animated.View style={[styles.header, { backgroundColor: headerBackground }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Tournament Control</Text>
              <Text style={styles.headerSubtitle}>Complete Management System</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => Alert.alert('Settings', 'Tournament control settings')}
            >
              <Ionicons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.statNumber}>{stats.activeEvents}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people" size={20} color="#2196F3" />
              <Text style={styles.statNumber}>{stats.totalPlayers}</Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash" size={20} color="#4CAF50" />
              <Text style={styles.statNumber}>৳{stats.totalRevenue}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="analytics" size={20} color="#FF9800" />
              <Text style={styles.statNumber}>{stats.completedEvents}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <QuickActionButton 
                icon="add-circle" 
                title="Create Match" 
                color="#2962ff"
                onPress={() => setShowCreateModal(true)}
              />
              <QuickActionButton 
                icon="play-circle" 
                title="Start All" 
                color="#4CAF50"
                onPress={() => Alert.alert('Start All', 'Starting all upcoming events')}
              />
              <QuickActionButton 
                icon="notifications" 
                title="Notify" 
                color="#FF9800"
                onPress={() => navigation.navigate('NotificationControl')}
              />
              <QuickActionButton 
                icon="download" 
                title="Export" 
                color="#9C27B0"
                onPress={() => Alert.alert('Export', 'Exporting tournament data')}
              />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Main Content - Sub Modules Grid */}
      <Animated.ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadEvents}
            colors={['#2962ff']}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.modulesContainer}>
          <Text style={styles.sectionTitle}>Tournament Control Modules</Text>
          <Text style={styles.sectionSubtitle}>
            Manage every aspect of your tournaments
          </Text>

          <View style={styles.modulesGrid}>
            {SUB_MODULES.map((module, index) => (
              <SubModuleCard 
                key={module.id} 
                module={module} 
                index={index}
              />
            ))}
          </View>

          {/* Recent Activity Section */}
          <View style={styles.recentActivity}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityList}>
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: '#4CAF50' }]}>
                  <Ionicons name="checkmark-done" size={16} color="white" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Weekend Tournament Completed</Text>
                  <Text style={styles.activityTime}>2 hours ago</Text>
                </View>
              </View>
              
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: '#2962ff' }]}>
                  <Ionicons name="add" size={16} color="white" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>New Solo Match Created</Text>
                  <Text style={styles.activityTime}>5 hours ago</Text>
                </View>
              </View>
              
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: '#FF9800' }]}>
                  <Ionicons name="person" size={16} color="white" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>25 New Players Registered</Text>
                  <Text style={styles.activityTime}>1 day ago</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0c23',
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    marginTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  quickActionsContainer: {
    marginBottom: 10,
  },
  quickActionsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  modulesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
  },
  modulesGrid: {
    gap: 12,
  },
  moduleCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  moduleTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  moduleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  moduleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    color: 'rgba(255,255,255,0.8)',
  },
  moduleArrow: {
    marginLeft: 8,
  },
  recentActivity: {
    marginTop: 30,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  inputGroup: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#2962ff',
  },
  typeButtonText: {
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  gameButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gameButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  gameButtonActive: {
    backgroundColor: '#2962ff',
  },
  gameButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  gameButtonTextActive: {
    color: 'white',
  },
  rowInputs: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  halfInput: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  createButton: {
    flex: 2,
    padding: 16,
    backgroundColor: '#2962ff',
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TournamentControlScreen;
