// screens/TournamentsScreen.js - COMPLETE VERSION
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
import { useTournaments } from '../context/TournamentContext';

const { width, height } = Dimensions.get('window');

// Game icons mapping
const gameIcons = {
  'freefire': require('../assets/games/free-fire-banner.jpg'),
  'pubg': require('../assets/games/pubg-banner.jpg'), 
  'cod': require('../assets/games/cod-banner.jpg'),
  'ludo': require('../assets/games/ludo-banner.jpg'),
};

// Game display names
const getGameDisplayName = (gameId) => {
  const gameNames = {
    'freefire': 'Free Fire',
    'pubg': 'PUBG Mobile',
    'cod': 'Call of Duty',
    'ludo': 'Ludo King',
    'bgmi': 'BGMI'
  };
  return gameNames[gameId] || gameId;
};

// Tournament Card Component
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
    
    return (
      <FontAwesome5 name="gamepad" size={24} color="#FFD700" />
    );
  };

  const getTimeLeft = (scheduleTime) => {
    if (!scheduleTime) return '2h 30m';
    
    const now = new Date();
    const schedule = new Date(scheduleTime);
    const diff = schedule - now;
    
    if (diff <= 0) return 'Started';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const participants = {
    current: tournament.currentParticipants || tournament.currentPlayers || 0,
    max: tournament.maxParticipants || tournament.maxPlayers || 50
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
      <LinearGradient colors={['#1a237e', '#283593']} style={styles.cardGradient}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.gameInfo}>
            <GameIcon />
            <View style={styles.gameTextContainer}>
              <Text style={styles.gameName}>{getGameDisplayName(tournament.game)}</Text>
              <Text style={styles.tournamentTitle}>{tournament.title}</Text>
              <Text style={styles.matchTypeBadge}>
                {tournament.matchType === 'tournament' ? '🏆 TOURNAMENT' : '⚡ MATCH'}
              </Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge,
            { 
              backgroundColor: tournament.status === 'live' ? '#4CAF50' : 
                              tournament.status === 'completed' ? '#2196F3' : '#FF9800'
            }
          ]}>
            <Text style={styles.statusText}>
              {tournament.status === 'live' ? 'LIVE' : 
               tournament.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}
            </Text>
          </View>
        </View>

        {/* Tournament Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.detailLabel}>Prize Pool</Text>
              <Text style={styles.detailValue}>৳{tournament.prizePool || 0}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people" size={20} color="#4FC3F7" />
              <Text style={styles.detailLabel}>Players</Text>
              <Text style={styles.detailValue}>{participants.current}/{participants.max}</Text>
            </View>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="cash" size={20} color="#4CAF50" />
              <Text style={styles.detailLabel}>Entry Fee</Text>
              <Text style={styles.detailValue}>৳{tournament.entryFee || 0}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={20} color="#FF9800" />
              <Text style={styles.detailLabel}>Time Left</Text>
              <Text style={styles.detailValue}>{getTimeLeft(tournament.scheduleTime)}</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(participants.current / participants.max) * 100}%`,
                  backgroundColor: tournament.status === 'live' ? '#4CAF50' : '#2962ff'
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {participants.current}/{participants.max} registered • {Math.round((participants.current / participants.max) * 100)}% full
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <View style={styles.leftButtons}>
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => onDetails(tournament)}
            >
              <LinearGradient colors={['#2962ff', '#448AFF']} style={styles.largeButtonGradient}>
                <Ionicons name="information-circle" size={18} color="#fff" />
                <Text style={styles.largeButtonText}>DETAILS</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.roomCodeButton}
              onPress={() => onRoomCode(tournament)}
            >
              <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.largeButtonGradient}>
                <Ionicons name="key" size={18} color="#fff" />
                <Text style={styles.largeButtonText}>ROOM ID</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Join/Registered Button */}
          {tournament.status === 'upcoming' && !tournament.registered && (
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={() => onJoin(tournament)}
            >
              <LinearGradient colors={['#FF5722', '#FF7043']} style={styles.joinButtonGradient}>
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

          {tournament.status === 'live' && (
            <TouchableOpacity 
              style={styles.liveJoinButton}
              onPress={() => onJoin(tournament)}
            >
              <LinearGradient colors={['#FF4444', '#FF6B6B']} style={styles.joinButtonGradient}>
                <Ionicons name="play-circle" size={18} color="#fff" />
                <Text style={styles.joinButtonText}>LIVE</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {tournament.status === 'completed' && (
            <View style={styles.completedBadge}>
              <Ionicons name="trophy" size={18} color="#FFD700" />
              <Text style={styles.completedText}>ENDED</Text>
            </View>
          )}
        </View>

        {/* Live Indicator */}
        {tournament.status === 'live' && (
          <View style={styles.liveIndicator}>
            <View style={styles.livePulse} />
            <Text style={styles.liveIndicatorText}>LIVE NOW</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

// Quick Join Modal Component
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}/>
        <Animated.View style={[styles.quickJoinModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🚀 Quick Join</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.quickJoinList}>
            {availableMatches.map((match, index) => (
              <TouchableOpacity 
                key={match._id || match.id}
                style={styles.quickJoinItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onJoin(match);
                  onClose();
                }}
              >
                <LinearGradient colors={['#2962ff', '#448AFF']} style={styles.quickJoinGradient}>
                  <View style={styles.quickJoinContent}>
                    <View style={styles.quickJoinInfo}>
                      <Text style={styles.quickJoinTitle}>{match.title}</Text>
                      <Text style={styles.quickJoinGame}>{getGameDisplayName(match.game)} • {match.matchType === 'tournament' ? 'Tournament' : 'Match'}</Text>
                      <View style={styles.quickJoinDetails}>
                        <Text style={styles.quickJoinPrize}>৳{match.prizePool}</Text>
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

// Main TournamentsScreen Component
const TournamentsScreen = ({ navigation }) => {
  const { tournaments, loading, error, refreshTournaments, joinTournament } = useTournaments();
  const [refreshing, setRefreshing] = useState(false);
  const [currentMainTab, setCurrentMainTab] = useState('all');
  const [currentGame, setCurrentGame] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickJoin, setShowQuickJoin] = useState(false);
  const { user: authUser } = useAuth();
  const { balance } = useWallet();

  const scrollY = useRef(new Animated.Value(0)).current;

  const games = [
    { id: 'all', name: 'All Games', icon: 'game-controller', color: '#ff8a00' },
    { id: 'freefire', name: 'Free Fire', icon: 'flame', color: '#FF6B00' },
    { id: 'pubg', name: 'PUBG Mobile', icon: 'target', color: '#4CAF50' },
    { id: 'cod', name: 'Call of Duty', icon: 'sports-esports', color: '#2196F3' },
    { id: 'ludo', name: 'Ludo King', icon: 'dice-five', color: '#9C27B0' }
  ];

  const mainTabs = [
    { id: 'all', name: 'All Events', icon: 'grid' },
    { id: 'matches', name: 'Matches', icon: 'flash' },
    { id: 'tournaments', name: 'Tournaments', icon: 'trophy' }
  ];

  // Get matches and tournaments from context
  const userMatches = tournaments.filter(t => t.matchType === 'match');
  const userTournaments = tournaments.filter(t => t.matchType === 'tournament');

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refreshTournaments();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Auto-refresh when screen focuses
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshTournaments();
    });
    return unsubscribe;
  }, [navigation]);

  const handleJoinPress = async (tournament) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (balance < tournament.entryFee) {
      Alert.alert(
        'Insufficient Balance',
        `You need ৳${tournament.entryFee} to join this tournament. Your current balance is ৳${balance}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Money', onPress: () => navigation.navigate('Wallet') }
        ]
      );
      return;
    }

    Alert.alert(
      'Join Tournament',
      `Join "${tournament.title}" for ৳${tournament.entryFee}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm Join', 
          onPress: async () => {
            const result = await joinTournament(tournament.id || tournament._id);
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.navigate('JoinMatch', { match: tournament });
            } else {
              Alert.alert('Error', result.error || 'Failed to join tournament');
            }
          }
        }
      ]
    );
  };

  const handleDetailsPress = (tournament) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('MatchDetails', { match: tournament });
  };

  const handleRoomCodePress = async (tournament) => {
    try {
      const roomInfo = `🎮 ${tournament.title}\n🔑 Room ID: ${tournament.roomId}\n🔒 Password: ${tournament.password}\n⏰ Time: ${new Date(tournament.scheduleTime).toLocaleString()}`;
      
      await Clipboard.setStringAsync(roomInfo);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Room Info Copied!', roomInfo, [{ text: 'OK' }]);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to copy room info');
    }
  };

  // Filtering logic
  const getFilteredData = () => {
    let data = [];
    
    // Main tab filtering
    if (currentMainTab === 'matches') {
      data = userMatches;
    } else if (currentMainTab === 'tournaments') {
      data = userTournaments;
    } else {
      data = tournaments;
    }
    
    // Game filtering
    if (currentGame !== 'all') {
      data = data.filter(match => match.game === currentGame);
    }
    
    // Search filtering
    if (searchQuery) {
      data = data.filter(match => 
        match.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Status filtering - show upcoming and live only
    data = data.filter(match => 
      match.status === 'upcoming' || match.status === 'live'
    );
    
    return data;
  };

  const filteredMatches = getFilteredData();

  // Sort by status and time
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (a.status !== 'live' && b.status === 'live') return 1;
    if (a.status === 'upcoming' && b.status === 'upcoming') {
      return new Date(a.scheduleTime) - new Date(b.scheduleTime);
    }
    return 0;
  });

  // Header animations
  const headerBackground = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: ['rgba(26, 35, 126, 1)', 'rgba(26, 35, 126, 0.95)'],
    extrapolate: 'clamp',
  });

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#1a237e" barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>Failed to load tournaments</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshTournaments}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (loading && tournaments.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#1a237e" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2962ff" />
          <Text style={styles.loadingText}>Loading tournaments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar backgroundColor="#1a237e" barStyle="light-content" />
      
      {/* Header */}
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
              {searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close" size={20} color="#b0b8ff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* User Status Bar */}
          <View style={styles.statusBar}>
            <View style={styles.userInfo}>
              <LinearGradient colors={['#2962ff', '#448AFF']} style={styles.userAvatar}>
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
          {sortedMatches.length} {currentMainTab === 'matches' ? 'matches' : 
                                   currentMainTab === 'tournaments' ? 'tournaments' : 'events'} found
          {currentGame !== 'all' && ` in ${getGameDisplayName(currentGame)}`}
        </Text>
      </View>

      {/* Game Filter Tabs - HEIGHT REDUCED */}
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
              <Ionicons 
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
            colors={['#2962ff']}
            tintColor="#2962ff"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.matchesContainer}>
          {sortedMatches.map((match, index) => (
            <TournamentCard
              key={match._id || match.id}
              tournament={match}
              onJoin={handleJoinPress}
              onDetails={handleDetailsPress}
              onRoomCode={handleRoomCodePress}
              index={index}
            />
          ))}
          
          {sortedMatches.length === 0 && !loading && (
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
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={refreshTournaments}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Quick Join Modal */}
      <QuickJoinModal
        visible={showQuickJoin}
        matches={userMatches}
        onClose={() => setShowQuickJoin(false)}
        onJoin={handleJoinPress}
      />

      {/* Floating Refresh Button */}
      <TouchableOpacity 
        style={styles.floatingRefresh}
        onPress={refreshTournaments}
      >
        <Ionicons name="refresh" size={20} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0c23',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#b0b8ff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2962ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  // Game Filter Tabs - HEIGHT REDUCED
  filterSection: {
    paddingVertical: 8, // Reduced from 12
    backgroundColor: 'rgba(255,255,255,0.02)',
    maxHeight: 50, // Reduced from 70
  },
  filterContainer: {
    paddingHorizontal: 15,
  },
  gameFilter: {
    marginRight: 8,
    borderRadius: 16,
    overflow: 'hidden',
    height: 36, // Reduced from 50
    minWidth: 90, // Reduced from 100
  },
  gameFilterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6, // Reduced from 8
    borderRadius: 16,
    height: '100%',
    gap: 6, // Reduced from 8
  },
  gameFilterText: {
    color: '#b0b8ff',
    fontSize: 11, // Reduced from 12
    fontWeight: 'bold',
    marginLeft: 4, // Reduced from 6
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
  matchTypeBadge: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
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
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
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
  liveJoinButton: {
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
  completedBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    maxWidth: 100,
  },
  completedText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: 'bold',
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveIndicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
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
  refreshButton: {
    backgroundColor: '#2962ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingRefresh: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2962ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
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
