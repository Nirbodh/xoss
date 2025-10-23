// screens/TournamentsScreen.js - UPDATED CARD DESIGN
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, 
  Dimensions, RefreshControl, StatusBar, Animated,
  TextInput, ActivityIndicator, Modal, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';

const { width, height } = Dimensions.get('window');

// Game icons mapping - ADDED MORE ICONS
const gameIcons = {
  'freefire': require('../assets/games/free-fire-banner.jpg'),
  'pubg': require('../assets/games/pubg-banner.jpg'), 
  'cod': require('../assets/games/cod-banner.jpg'),
  'ludo': require('../assets/games/ludo-banner.jpg'),
  'fortnite': require('../assets/games/fortnite-banner.jpg'),
  'valorant': require('../assets/games/valorant-banner.jpg'),
 // 'bgmi': require('../assets/games/bgmi.png'),
  //'clashroyale': require('../assets/games/clashroyale.png'),
  //'clashofclans': require('../assets/games/clashofclans.png'),
  //'amongus': require('../assets/games/amongus.png'),
  //'minecraft': require('../assets/games/minecraft.png')
};

// Game display names
const getGameDisplayName = (gameId) => {
  const gameNames = {
    'freefire': 'Free Fire',
    'pubg': 'PUBG Mobile',
    'cod': 'Call of Duty',
    'ludo': 'Ludo King',
    'fortnite': 'Fortnite',
    'valorant': 'Valorant',
    'bgmi': 'BGMI',
    'clashroyale': 'Clash Royale',
    'clashofclans': 'Clash of Clans',
    'amongus': 'Among Us',
    'minecraft': 'Minecraft'
  };
  return gameNames[gameId] || gameId;
};

// Tournament Card Component - UPDATED DESIGN
const TournamentCard = ({ tournament, onJoin, onDetails, onRoomCode, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Get game icon - using images from assets
  const GameIcon = () => {
    const iconSource = gameIcons[tournament.game];
    
    if (iconSource) {
      return (
        <Image 
          source={iconSource} 
          style={styles.gameIconImage}
          resizeMode="contain"
        />
      );
    }
    
    // Fallback to FontAwesome5 icon if image not found
    return (
      <FontAwesome5 
        name="gamepad" 
        size={24} 
        color="#FFD700" 
      />
    );
  };

  return (
    <Animated.View 
      style={[
        styles.tournamentCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={['#1a237e', '#283593']}
        style={styles.cardGradient}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.gameInfo}>
            <GameIcon />
            <View style={styles.gameTextContainer}>
              <Text style={styles.gameName}>{getGameDisplayName(tournament.game)}</Text>
              <Text style={styles.tournamentTitle}>{tournament.title}</Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: tournament.status === 'live' ? '#4CAF50' : '#FF9800' }
          ]}>
            <Text style={styles.statusText}>
              {tournament.status === 'live' ? 'LIVE' : 'UPCOMING'}
            </Text>
          </View>
        </View>

        {/* Tournament Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.detailLabel}>Prize Pool</Text>
              <Text style={styles.detailValue}>৳{tournament.totalPrize}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people" size={20} color="#4FC3F7" />
              <Text style={styles.detailLabel}>Players</Text>
              <Text style={styles.detailValue}>{tournament.currentParticipants}/{tournament.maxParticipants}</Text>
            </View>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="cash" size={20} color="#4CAF50" />
              <Text style={styles.detailLabel}>Entry Fee</Text>
              <Text style={styles.detailValue}>৳{tournament.entryFee}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={20} color="#FF9800" />
              <Text style={styles.detailLabel}>Time Left</Text>
              <Text style={styles.detailValue}>{tournament.timeLeft || '2h 30m'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons - UPDATED TO MATCH FIRST IMAGE */}
        <View style={styles.actionButtons}>
          {/* Left Side - Two Large Buttons */}
          <View style={styles.leftButtons}>
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => onDetails(tournament)}
            >
              <LinearGradient
                colors={['#2962ff', '#448AFF']}
                style={styles.largeButtonGradient}
              >
                <Ionicons name="information-circle" size={18} color="#fff" />
                <Text style={styles.largeButtonText}>DETAILS</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.roomCodeButton}
              onPress={() => onRoomCode(tournament)}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.largeButtonGradient}
              >
                <Ionicons name="key" size={18} color="#fff" />
                <Text style={styles.largeButtonText}>ROOM ID</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Right Side - JOIN Button */}
          {!tournament.registered && (
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={() => onJoin(tournament)}
            >
              <LinearGradient
                colors={['#FF5722', '#FF7043']}
                style={styles.joinButtonGradient}
              >
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={styles.joinButtonText}>JOIN</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {tournament.registered && (
            <View style={styles.registeredBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <Text style={styles.registeredText}>REGISTERED</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Quick Join Modal Component (unchanged)
const QuickJoinModal = ({ visible, matches, onClose, onJoin }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const availableMatches = matches.filter(match => 
    !match.registered && match.status === 'upcoming' && match.spotsLeft > 0
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View style={[
          styles.quickJoinModal,
          { transform: [{ translateY: slideAnim }] }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🚀 Quick Join</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.quickJoinList}>
            {availableMatches.map((match, index) => (
              <TouchableOpacity 
                key={match._id}
                style={styles.quickJoinItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onJoin(match);
                  onClose();
                }}
              >
                <LinearGradient
                  colors={['#2962ff', '#448AFF']}
                  style={styles.quickJoinGradient}
                >
                  <View style={styles.quickJoinContent}>
                    <View style={styles.quickJoinInfo}>
                      <Text style={styles.quickJoinTitle}>{match.title}</Text>
                      <Text style={styles.quickJoinGame}>{getGameDisplayName(match.game)} • {match.matchType === 'tournament' ? 'Tournament' : 'Match'}</Text>
                      <View style={styles.quickJoinDetails}>
                        <Text style={styles.quickJoinPrize}>৳{match.totalPrize}</Text>
                        <Text style={styles.quickJoinFee}>Entry: ৳{match.entryFee}</Text>
                        <Text style={styles.quickJoinSpots}>{match.spotsLeft} spots left</Text>
                      </View>
                    </View>
                    <View style={styles.quickJoinAction}>
                      <TouchableOpacity
                        style={styles.quickJoinButton}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          onJoin(match);
                          onClose();
                        }}
                      >
                        <Text style={styles.quickJoinButtonText}>JOIN</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {availableMatches.length === 0 && (
            <View style={styles.noMatchesContainer}>
              <Ionicons name="sad-outline" size={64} color="#666" />
              <Text style={styles.noMatchesText}>No available matches</Text>
              <Text style={styles.noMatchesSubtext}>Check back later for new tournaments</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

// Main TournamentsScreen Component (unchanged)
const TournamentsScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMainTab, setCurrentMainTab] = useState('all');
  const [currentGame, setCurrentGame] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickJoin, setShowQuickJoin] = useState(false);
  const { user: authUser } = useAuth();
  const { balance } = useWallet();

  const scrollY = useRef(new Animated.Value(0)).current;

  // ALL GAMES AVAILABLE
  const games = [
    { id: 'all', name: 'All Games', icon: 'game-controller', color: '#ff8a00' },
    { id: 'freefire', name: 'Free Fire', icon: 'flame', color: '#FF6B00' },
    { id: 'pubg', name: 'PUBG Mobile', icon: 'target', color: '#4CAF50' },
    { id: 'cod', name: 'Call of Duty', icon: 'sports-esports', color: '#2196F3' },
    { id: 'ludo', name: 'Ludo King', icon: 'dice-five', color: '#9C27B0' },
    { id: 'valorant', name: 'Valorant', icon: 'crosshairs', color: '#FF4444' },
    { id: 'bgmi', name: 'BGMI', icon: 'mobile-alt', color: '#FF5722' },
    { id: 'fortnite', name: 'Fortnite', icon: 'gamepad', color: '#FF9800' },
    { id: 'clashroyale', name: 'Clash Royale', icon: 'crown', color: '#E91E63' },
    { id: 'clashofclans', name: 'Clash of Clans', icon: 'fort-awesome', color: '#FFC107' },
    { id: 'amongus', name: 'Among Us', icon: 'user-astronaut', color: '#607D8B' },
    { id: 'minecraft', name: 'Minecraft', icon: 'cube', color: '#795548' }
  ];

  const mainTabs = [
    { id: 'all', name: 'All Events', icon: 'grid' },
    { id: 'matches', name: 'Matches', icon: 'flash' },
    { id: 'tournaments', name: 'Tournaments', icon: 'trophy' }
  ];

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      // Your existing mock matches data...
      const mockMatches = [
        // Your existing mock data remains the same
        {
          _id: 1,
          title: "SOLO MATCH | 2:00 PM",
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          totalPrize: 400,
          perKill: 5,
          entryFee: 10,
          type: "Solo",
          version: "Mobile",
          map: "Bermuda",
          currentParticipants: 16,
          maxParticipants: 48,
          roomId: "4598XY",
          roomPassword: "1234",
          roomCode: "789123",
          prizeDetails: { first: 150, second: 100, third: 70, fourth: 40 },
          status: 'upcoming',
          game: 'freefire',
          matchType: 'match',
          registered: false,
          spotsLeft: 32,
          skillLevel: 3
        },
        // ... rest of your mock data
      ];
      setMatches(mockMatches);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchMatches();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleJoinPress = (tournament) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('JoinMatch', { match: tournament });
  };

  const handleDetailsPress = (tournament) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('MatchDetails', { match: tournament });
  };

  const handleRoomCodePress = async (tournament) => {
    try {
      await Clipboard.setStringAsync(
        `Room ID: ${tournament.roomId}\nPassword: ${tournament.roomPassword}`
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Room Info Copied!',
        `Room ID: ${tournament.roomId}\nPassword: ${tournament.roomPassword}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to copy room info');
    }
  };

  // Filtering logic (unchanged)
  const filteredMatches = matches.filter(match => {
    if (currentMainTab === 'matches' && match.matchType !== 'match') return false;
    if (currentMainTab === 'tournaments' && match.matchType !== 'tournament') return false;
    if (currentGame !== 'all' && match.game !== currentGame) return false;
    if (searchQuery && !match.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Header animations (unchanged)
  const headerBackground = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: ['rgba(26, 35, 126, 1)', 'rgba(26, 35, 126, 0.95)'],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#1a237e" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tournaments...</Text>
          <ActivityIndicator size="large" color="#2962ff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar backgroundColor="#1a237e" barStyle="light-content" />
      
      {/* Enhanced Header with Animation */}
      <Animated.View style={[styles.header, { backgroundColor: headerBackground }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>XOSS</Text>
              <Text style={styles.logoSubtitle}>TOURNAMENTS</Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={() => navigation.navigate('CreateMatch')}
              >
                <Ionicons name="add" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={() => setShowSearch(!showSearch)}
              >
                <Ionicons name="search" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={() => setShowQuickJoin(true)}
              >
                <Ionicons name="rocket" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          {showSearch && (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#b0b8ff" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tournaments..."
                placeholderTextColor="#b0b8ff"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close" size={20} color="#b0b8ff" />
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* User Status Bar */}
          <View style={styles.statusBar}>
            <View style={styles.userInfo}>
              <LinearGradient
                colors={['#2962ff', '#448AFF']}
                style={styles.userAvatar}
              >
                <Ionicons name="person" size={20} color="white" />
              </LinearGradient>
              <View>
                <Text style={styles.userName}>{authUser?.name || 'Player123'}</Text>
                <Text style={styles.userLevel}>Pro Player</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.walletBalance}
              onPress={() => navigation.navigate('Wallet')}
            >
              <Ionicons name="wallet" size={16} color="#4CAF50" />
              <Text style={styles.balanceText}>৳ {balance || '1,250'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Main Tabs - All Events, Matches, Tournaments */}
      <View style={styles.mainTabSection}>
        <View style={styles.mainTabs}>
          {mainTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.mainTab,
                currentMainTab === tab.id && styles.mainTabActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCurrentMainTab(tab.id);
                setCurrentGame('all');
              }}
            >
              <Ionicons 
                name={tab.icon} 
                size={16} 
                color={currentMainTab === tab.id ? 'white' : '#b0b8ff'} 
              />
              <Text style={[
                styles.mainTabText,
                currentMainTab === tab.id && styles.mainTabTextActive
              ]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.matchesCount}>
          {filteredMatches.length} {currentMainTab === 'matches' ? 'matches' : 
                                   currentMainTab === 'tournaments' ? 'tournaments' : 'events'} found
          {currentGame !== 'all' && ` in ${getGameDisplayName(currentGame)}`}
        </Text>
      </View>

      {/* Game Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterSection}
        contentContainerStyle={styles.filterContainer}
      >
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[
              styles.gameFilter,
              currentGame === game.id && styles.gameFilterActive
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentGame(game.id);
            }}
          >
            <LinearGradient
              colors={currentGame === game.id ? ['#2962ff', '#448AFF'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.gameFilterGradient}
            >
              <FontAwesome5 
                name={game.icon} 
                size={16} 
                color={currentGame === game.id ? 'white' : '#b0b8ff'} 
              />
              <Text style={[
                styles.gameFilterText,
                currentGame === game.id && styles.gameFilterTextActive
              ]}>
                {game.name}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Matches List */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2962ff', '#ff8a00']}
            tintColor="#2962ff"
            progressBackgroundColor="#1a237e"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.matchesContainer}>
          {filteredMatches.map((match, index) => (
            <TournamentCard
              key={match._id}
              tournament={match}
              onJoin={handleJoinPress}
              onDetails={handleDetailsPress}
              onRoomCode={handleRoomCodePress}
              index={index}
            />
          ))}
          
          {filteredMatches.length === 0 && (
            <View style={styles.noMatchesFound}>
              <Ionicons name="trophy-outline" size={64} color="#2962ff" />
              <Text style={styles.noMatchesText}>
                {currentGame !== 'all' 
                  ? `No ${getGameDisplayName(currentGame)} ${currentMainTab} found` 
                  : `No ${currentMainTab} found`
                }
              </Text>
              <Text style={styles.noMatchesSubtext}>
                {searchQuery ? 'Try a different search' : 'Check back later for new events'}
              </Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Quick Join Modal */}
      <QuickJoinModal
        visible={showQuickJoin}
        matches={matches}
        onClose={() => setShowQuickJoin(false)}
        onJoin={handleJoinPress}
      />
    </SafeAreaView>
  );
};

// UPDATED STYLES SECTION
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0c23',
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
    marginBottom: 15,
  },
  logoContainer: {
    alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  logoSubtitle: {
    fontSize: 12,
    color: '#2962ff',
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    marginLeft: 10,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userLevel: {
    color: '#b0b8ff',
    fontSize: 12,
  },
  walletBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  balanceText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  // Main Tabs Section
  mainTabSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  mainTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  mainTabActive: {
    backgroundColor: '#2962ff',
  },
  mainTabText: {
    color: '#b0b8ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mainTabTextActive: {
    color: 'white',
  },
  matchesCount: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Game Filter Tabs
  filterSection: {
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    maxHeight: 70,
  },
  filterContainer: {
    paddingHorizontal: 15,
  },
  gameFilter: {
    marginRight: 8,
    borderRadius: 16,
    overflow: 'hidden',
    height: 50,
    minWidth: 100,
  },
  gameFilterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    height: '100%',
    gap: 8,
  },
  gameFilterText: {
    color: '#b0b8ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameFilterTextActive: {
    color: 'white',
  },
  gameFilterActive: {
    shadowColor: '#2962ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // UPDATED TOURNAMENT CARD STYLES
  scrollView: {
    flex: 1,
  },
  matchesContainer: {
    padding: 16,
  },
  tournamentCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  gameIconImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  gameTextContainer: {
    flex: 1,
  },
  gameName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  tournamentTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Tournament Details
  detailsContainer: {
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 2,
  },
  detailValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // UPDATED ACTION BUTTONS - MATCHING FIRST IMAGE
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  leftButtons: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
  },
  detailsButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  roomCodeButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  largeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  largeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  joinButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    maxWidth: 100,
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  registeredBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    maxWidth: 120,
  },
  registeredText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Rest of the styles remain the same...
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#2962ff',
    fontSize: 16,
    marginTop: 16,
  },
  noMatchesFound: {
    alignItems: 'center',
    padding: 40,
  },
  noMatchesText: {
    color: '#2962ff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  noMatchesSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  // Quick Join Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  quickJoinModal: {
    backgroundColor: '#0a0c23',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  quickJoinList: {
    padding: 16,
  },
  quickJoinItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickJoinGradient: {
    padding: 16,
  },
  quickJoinContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickJoinInfo: {
    flex: 1,
  },
  quickJoinTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  quickJoinGame: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  quickJoinDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  quickJoinPrize: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  quickJoinFee: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  quickJoinSpots: {
    fontSize: 12,
    color: '#4CAF50',
  },
  quickJoinAction: {
    marginLeft: 12,
  },
  quickJoinButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickJoinButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noMatchesContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noMatchesText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  noMatchesSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default TournamentsScreen;
