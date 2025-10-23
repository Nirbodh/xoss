// screens/MatchListScreen.js - ENHANCED WITH 3D EFFECTS & ADVANCED FEATURES
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, 
  Dimensions, RefreshControl, StatusBar, Animated,
  TextInput, ActivityIndicator, Modal, Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';

const { width, height } = Dimensions.get('window');

// 🆕 3D Button Component with Advanced Effects
const ThreeDButton = ({ 
  title, 
  onPress, 
  icon, 
  type = 'primary',
  size = 'medium',
  disabled = false,
  gradient = ['#2962ff', '#448AFF'],
  style 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 2,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        useNativeDriver: true,
      })
    ]).start();
  };

  const getButtonColors = () => {
    switch (type) {
      case 'primary': return ['#2962ff', '#448AFF'];
      case 'secondary': return ['#6B7280', '#9CA3AF'];
      case 'success': return ['#10B981', '#34D399'];
      case 'danger': return ['#EF4444', '#F87171'];
      case 'warning': return ['#F59E0B', '#FBBF24'];
      default: return gradient;
    }
  };

  return (
    <Animated.View style={[
      styles.button3DContainer,
      {
        transform: [
          { scale: scaleAnim },
          { translateY: translateYAnim }
        ]
      },
      style
    ]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={0.9}
        disabled={disabled}
      >
        <LinearGradient
          colors={disabled ? ['#6B7280', '#9CA3AF'] : getButtonColors()}
          style={[
            styles.button3DGradient,
            size === 'large' && styles.button3DLarge,
            size === 'small' && styles.button3DSmall
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* 3D Top Shine Effect */}
          <View style={styles.button3DShine} />
          
          <View style={styles.button3DContent}>
            {icon && (
              <Ionicons 
                name={icon} 
                size={size === 'large' ? 20 : size === 'small' ? 14 : 16} 
                color="white" 
                style={styles.button3DIcon}
              />
            )}
            <Text style={[
              styles.button3DText,
              size === 'large' && styles.button3DTextLarge,
              size === 'small' && styles.button3DTextSmall
            ]}>
              {title}
            </Text>
          </View>

          {/* 3D Bottom Shadow */}
          <View style={styles.button3DShadow} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// 🆕 Enhanced Tournament Card with 3D Effects
const TournamentCard = ({ tournament, onJoin, onDetails, onRoomCode, index }) => {
  const cardAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getGameGradient = (gameName) => {
    const gradientMap = {
      'Free Fire': ['#FF6B00', '#FF8A00'],
      'PUBG Mobile': ['#4CAF50', '#66BB6A'],
      'Ludo King': ['#9C27B0', '#BA68C8'],
      'Call of Duty': ['#2196F3', '#42A5F5'],
      'BGMI': ['#FF4444', '#FF6B6B']
    };
    return gradientMap[gameName] || ['#2962ff', '#448AFF'];
  };

  const CountdownTimer = ({ startTime }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(startTime));
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft(startTime));
      }, 1000);

      // Pulse animation for live matches
      if (timeLeft.total <= 0) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      return () => clearInterval(timer);
    }, [startTime]);

    function calculateTimeLeft(targetTime) {
      const difference = new Date(targetTime) - new Date();
      return {
        total: difference,
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }

    if (timeLeft.total <= 0) {
      return (
        <Animated.View style={[styles.liveBadge, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.livePulse} />
          <Text style={styles.liveText}>LIVE NOW</Text>
        </Animated.View>
      );
    }

    return (
      <View style={styles.timerContainer}>
        <Ionicons name="time-outline" size={14} color="white" />
        <Text style={styles.timerText}>
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </Text>
      </View>
    );
  };

  const ProgressBar = ({ progress, total, color }) => {
    const percentage = (progress / total) * 100;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(progressAnim, {
        toValue: percentage,
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }, [percentage]);

    const widthInterpolated = progressAnim.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: widthInterpolated,
                backgroundColor: color
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {progress}/{total} spots filled • {Math.round(percentage)}%
        </Text>
      </View>
    );
  };

  return (
    <Animated.View style={[
      styles.tournamentCard,
      {
        opacity: cardAnim,
        transform: [
          { scale: cardAnim },
          { 
            translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }
        ]
      }
    ]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {/* Game Banner Header with 3D Effect */}
          <LinearGradient 
            colors={getGameGradient(tournament.game)} 
            style={styles.gameBannerContainer}
          >
            <View style={styles.bannerContent}>
              <View style={styles.gameInfo}>
                <View style={styles.gameBadge}>
                  <Text style={styles.gameBadgeText}>{tournament.game}</Text>
                </View>
                <View style={styles.matchType}>
                  <Ionicons name="people" size={12} color="white" />
                  <Text style={styles.matchTypeText}>{tournament.type}</Text>
                </View>
              </View>
              
              <View style={styles.prizeSection}>
                <MaterialIcons name="emoji-events" size={20} color="#FFD700" />
                <Text style={styles.prizeText}>৳{tournament.totalPrize}</Text>
              </View>
            </View>
            
            {/* Status Badge */}
            <View style={styles.statusBadgeContainer}>
              {tournament.status === 'live' ? (
                <View style={styles.liveBadgeAbsolute}>
                  <View style={styles.livePulse} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              ) : (
                <View style={styles.timerBadgeAbsolute}>
                  <CountdownTimer startTime={tournament.startTime} />
                </View>
              )}
            </View>

            {/* Registered Badge */}
            {tournament.registered && (
              <View style={styles.registeredBadgeAbsolute}>
                <Ionicons name="checkmark" size={12} color="white" />
                <Text style={styles.registeredText}>REGISTERED</Text>
              </View>
            )}
          </LinearGradient>

          {/* Tournament Info */}
          <View style={styles.tournamentInfo}>
            <View style={styles.matchHeader}>
              <Text style={styles.matchTitle}>{tournament.title}</Text>
            </View>

            {/* Match Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="map-outline" size={14} color="#ff8a00" />
                <Text style={styles.detailText}>{tournament.map}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={14} color="#4CAF50" />
                <Text style={styles.detailText}>৳{tournament.perKill}/Kill</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="enter-outline" size={14} color="#2962ff" />
                <Text style={styles.detailText}>৳{tournament.entryFee} Entry</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="trophy-outline" size={14} color="#FFD700" />
                <Text style={styles.detailText}>৳{tournament.prizeDetails?.first || '150'} 1st</Text>
              </View>
            </View>

            {/* Enhanced Progress Bar */}
            <ProgressBar 
              progress={tournament.currentParticipants} 
              total={tournament.maxParticipants} 
              color={getGameGradient(tournament.game)[0]}
            />

            {/* 3D Action Buttons */}
            <View style={styles.actionButtons3D}>
              <ThreeDButton
                title="DETAILS"
                onPress={() => onDetails(tournament)}
                type="secondary"
                size="small"
                icon="information-circle-outline"
                style={styles.actionButton3D}
              />
              
              <ThreeDButton
                title="ROOM CODE"
                onPress={() => onRoomCode(tournament)}
                type="warning"
                size="small"
                icon="key-outline"
                style={styles.actionButton3D}
              />
              
              <ThreeDButton
                title={tournament.registered ? 'JOINED' : tournament.status === 'live' ? 'JOIN LIVE' : 'JOIN NOW'}
                onPress={() => onJoin(tournament)}
                type={tournament.registered ? 'success' : tournament.status === 'live' ? 'danger' : 'primary'}
                size="small"
                icon={tournament.registered ? 'checkmark' : tournament.status === 'live' ? 'play' : 'enter-outline'}
                disabled={tournament.registered}
                style={styles.actionButton3D}
              />
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// 🆕 Quick Join Modal
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
                      <Text style={styles.quickJoinGame}>{match.game}</Text>
                      <View style={styles.quickJoinDetails}>
                        <Text style={styles.quickJoinPrize}>৳{match.totalPrize}</Text>
                        <Text style={styles.quickJoinFee}>Entry: ৳{match.entryFee}</Text>
                        <Text style={styles.quickJoinSpots}>{match.spotsLeft} spots left</Text>
                      </View>
                    </View>
                    <View style={styles.quickJoinAction}>
                      <ThreeDButton
                        title="JOIN"
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          onJoin(match);
                          onClose();
                        }}
                        type="success"
                        size="small"
                        icon="rocket"
                      />
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

// Main Enhanced Component
const MatchListScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentGame, setCurrentGame] = useState('all');
  const [currentMatchTab, setCurrentMatchTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickJoin, setShowQuickJoin] = useState(false);
  const { user: authUser } = useAuth();
  const { balance, refreshBalance } = useWallet();

  const scrollY = useRef(new Animated.Value(0)).current;

  const games = [
    { id: 'all', name: 'All Games', icon: 'game-controller', color: '#ff8a00' },
    { id: 'freefire', name: 'Free Fire', icon: 'flame', color: '#FF6B00' },
    { id: 'pubg', name: 'PUBG Mobile', icon: 'target', color: '#4CAF50' },
    { id: 'cod', name: 'Call of Duty', icon: 'sports-esports', color: '#2196F3' },
    { id: 'ludo', name: 'Ludo King', icon: 'dice-five', color: '#9C27B0' }
  ];

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const mockMatches = [
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
          game: 'Free Fire',
          registered: false,
          spotsLeft: 32,
          skillLevel: 3
        },
        {
          _id: 2,
          title: "DUO SHOWDOWN | 3:30 PM",
          startTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
          totalPrize: 800,
          perKill: 10,
          entryFee: 20,
          type: "Duo",
          version: "Mobile",
          map: "Bermuda",
          currentParticipants: 38,
          maxParticipants: 50,
          roomId: "7890AB",
          roomPassword: "5678",
          roomCode: "456789",
          prizeDetails: { first: 300, second: 200, third: 150, fourth: 100 },
          status: 'upcoming',
          game: 'Free Fire',
          registered: true,
          spotsLeft: 12,
          skillLevel: 4
        },
        {
          _id: 3,
          title: "SQUAD BATTLE | LIVE NOW",
          startTime: new Date(Date.now() - 30 * 60 * 1000),
          totalPrize: 1200,
          perKill: 8,
          entryFee: 25,
          type: "Squad",
          version: "Mobile",
          map: "Erangel",
          currentParticipants: 42,
          maxParticipants: 48,
          roomId: "1234CD",
          roomPassword: "abcd",
          roomCode: "123456",
          prizeDetails: { first: 500, second: 300, third: 200, fourth: 150 },
          status: 'live',
          game: 'PUBG Mobile',
          registered: false,
          spotsLeft: 6,
          skillLevel: 5
        }
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

  const filteredMatches = matches.filter(match => {
    if (currentGame !== 'all' && match.game !== currentGame) return false;
    if (currentMatchTab === 'live' && match.status !== 'live') return false;
    if (currentMatchTab === 'upcoming' && match.status !== 'upcoming') return false;
    if (searchQuery && !match.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Header animations
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
          <Text style={styles.loadingText}>Loading matches...</Text>
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
                placeholder="Search matches..."
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
              <Ionicons 
                name={game.icon} 
                size={18} 
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

      {/* Match Type Tabs */}
      <View style={styles.matchTypeSection}>
        <View style={styles.matchTypeTabs}>
          {['upcoming', 'live'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.matchTypeTab,
                currentMatchTab === tab && styles.matchTypeTabActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCurrentMatchTab(tab);
              }}
            >
              <Text style={[
                styles.matchTypeTabText,
                currentMatchTab === tab && styles.matchTypeTabTextActive
              ]}>
                {tab === 'live' ? '🔴 LIVE' : '⏰ UPCOMING'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.matchesCount}>
          {filteredMatches.length} matches found
        </Text>
      </View>

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
              <Text style={styles.noMatchesText}>No matches found</Text>
              <Text style={styles.noMatchesSubtext}>
                {searchQuery ? 'Try a different search' : 'Check back later for new tournaments'}
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
  filterSection: {
    paddingVertical: 15,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  filterContainer: {
    paddingHorizontal: 15,
  },
  gameFilter: {
    marginRight: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gameFilterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  gameFilterText: {
    color: '#b0b8ff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
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
  matchTypeSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  matchTypeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  matchTypeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  matchTypeTabActive: {
    backgroundColor: '#2962ff',
  },
  matchTypeTabText: {
    color: '#b0b8ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchTypeTabTextActive: {
    color: 'white',
  },
  matchesCount: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  matchesContainer: {
    padding: 16,
  },
  tournamentCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  gameBannerContainer: {
    padding: 16,
    position: 'relative',
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gameBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gameBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchTypeText: {
    color: 'white',
    fontSize: 10,
  },
  prizeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prizeText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  liveBadgeAbsolute: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  timerBadgeAbsolute: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  registeredBadgeAbsolute: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  registeredText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tournamentInfo: {
    padding: 16,
  },
  matchHeader: {
    marginBottom: 12,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: '#b0b8ff',
    fontSize: 12,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 6,
    height: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressText: {
    color: '#b0b8ff',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButtons3D: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton3D: {
    flex: 1,
  },
  // 3D Button Styles
  button3DContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  button3DGradient: {
    borderRadius: 12,
    paddingVertical: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  button3DLarge: {
    paddingVertical: 16,
  },
  button3DSmall: {
    paddingVertical: 10,
  },
  button3DShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  button3DContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  button3DIcon: {
    marginRight: 6,
  },
  button3DText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  button3DTextLarge: {
    fontSize: 16,
  },
  button3DTextSmall: {
    fontSize: 10,
  },
  button3DShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  // Modal Styles
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
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0c23',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
  },
  noMatchesFound: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});

export default MatchListScreen;
