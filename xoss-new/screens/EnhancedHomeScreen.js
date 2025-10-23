// EnhancedHomeScreen.js - COMPLETE FILE WITH ALL STYLES
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Animated, Dimensions,
  StatusBar, Alert, RefreshControl, Modal, Easing, LayoutAnimation, UIManager, Platform,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useChat } from '../context/ChatContext';
import { useWallet } from '../context/WalletContext';
import { useLeaderboard } from '../context/LeaderboardContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import NotificationBell from '../components/NotificationBell';

// LayoutAnimation enable for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

// 🎮 Game images from assets
const gameImages = {
  'pubg': require('../assets/games/pubg-banner.jpg'),
  'freefire': require('../assets/games/free-fire-banner.jpg'),
  'cod': require('../assets/games/cod-banner.jpg'),
  'ludo': require('../assets/games/ludo-banner.jpg'),
  'fortnite': require('../assets/games/fortnite-banner.jpg'),
  'valorant': require('../assets/games/valorant-banner.jpg'),
};

// Import available icons
const availableIcons = {
  wallet: require('../assets/icons/wallet-premium.png'),
  trophy: require('../assets/icons/trophy-gradient.png'),
};

// 🎯 Game data
const games = [
  { id: 'pubg', name: 'PUBG Mobile', players: '2.4M', color: '#FF6B35' },
  { id: 'freefire', name: 'Free Fire', players: '1.8M', color: '#2962ff' },
  { id: 'cod', name: 'COD Mobile', players: '1.2M', color: '#4CAF50' },
  { id: 'ludo', name: 'Ludo King', players: '980K', color: '#9C27B0' },
  { id: 'fortnite', name: 'Fortnite', players: '850K', color: '#FF9800' },
  { id: 'valorant', name: 'Valorant', players: '720K', color: '#FF4444' },
];

// Skeleton Loader Component
const SkeletonLoader = () => (
  <View style={styles.skeletonContainer}>
    {[1, 2, 3].map((item) => (
      <View key={item} style={styles.skeletonItem}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonTextContainer}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: '60%' }]} />
        </View>
      </View>
    ))}
  </View>
);

// 🆕 Enhanced Image Game Button Component with Parallax Effect
const ImageGameButton = ({ game, onPress, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity 
      style={styles.imageGameButton}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[
        styles.imageGameContainer, 
        { 
          transform: [{ scale: scaleAnim }]
        }
      ]}>
        <Image 
          source={gameImages[game.id]}
          style={styles.gameImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gameImageOverlay}
        />
        <View style={styles.gameContent}>
          <Text style={styles.gameImageText}>{game.name}</Text>
          <View style={styles.gameStats}>
            <Ionicons name="people" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.gamePlayers}>{game.players}</Text>
          </View>
        </View>
        <View style={[styles.gameTag, { backgroundColor: game.color }]}>
          <Text style={styles.gameTagText}>TRENDING</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// 🆕 Enhanced Quick Action Button with Ripple Effect
const QuickActionButton = ({ icon, title, onPress, color, badge, isNew }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity 
      style={styles.quickAction} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[styles.quickActionContent, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.actionIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={24} color="white" />
          {badge && (
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{badge}</Text>
            </View>
          )}
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// 🆕 Animated Progress Bar
const AnimatedProgressBar = ({ progress, color, label }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressPercentage}>{progress}%</Text>
      </View>
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
    </View>
  );
};

// 🆕 Enhanced Leaderboard Preview with Animation
const LeaderboardPreview = ({ leaderboard, userRank, onPress, loading }) => {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Sample data if no leaderboard provided
  const displayLeaderboard = leaderboard && leaderboard.length > 0 ? leaderboard : [
    { id: 1, username: 'ProPlayer', earnings: 2500, change: 12, level: 25 },
    { id: 2, username: 'GameMaster', earnings: 1800, change: 8, level: 22 },
    { id: 3, username: 'TournamentKing', earnings: 1500, change: 5, level: 20 },
    { id: 4, username: 'XOSS Warrior', earnings: 1200, change: 3, level: 18 },
    { id: 5, username: 'EliteGamer', earnings: 900, change: 2, level: 16 },
    { id: 6, username: 'BattleHero', earnings: 800, change: 1, level: 15 }
  ];

  const topThree = displayLeaderboard.slice(0, 3);
  const nextThree = expanded ? displayLeaderboard.slice(3, 6) : [];

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
    
    Animated.spring(rotateAnim, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: true,
    }).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  if (loading) {
    return (
      <View style={styles.leaderboardPreview}>
        <SkeletonLoader />
      </View>
    );
  }

  return (
    <View style={styles.leaderboardPreview}>
      <View style={styles.previewHeader}>
        <View style={styles.previewTitleContainer}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
          <Text style={styles.previewTitle}>Live Leaderboard</Text>
        </View>
        <TouchableOpacity onPress={toggleExpand}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={20} color="#2962ff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.topPlayers}>
        {topThree.map((player, index) => (
          <View key={player.id} style={styles.playerRank}>
            <View style={styles.rankInfo}>
              <View style={[
                styles.rankCircle,
                { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }
              ]}>
                <Ionicons 
                  name={index === 0 ? "trophy" : "medal"} 
                  size={16} 
                  color="white" 
                />
              </View>
              <View style={styles.playerDetails}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.username}
                </Text>
                <Text style={styles.playerLevel}>Level {player.level}</Text>
              </View>
            </View>
            <View style={styles.earningsContainer}>
              <Text style={styles.playerEarnings}>৳{player.earnings}</Text>
              <Text style={styles.playerChange}>+{player.change}%</Text>
            </View>
          </View>
        ))}
      </View>

      {expanded && (
        <View style={styles.expandedPlayers}>
          {nextThree.map((player, index) => (
            <View key={player.id} style={styles.playerRank}>
              <View style={styles.rankInfo}>
                <View style={styles.rankNumber}>
                  <Text style={styles.rankNumberText}>{index + 4}</Text>
                </View>
                <View style={styles.playerDetails}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.username}
                  </Text>
                  <Text style={styles.playerLevel}>Level {player.level}</Text>
                </View>
              </View>
              <Text style={styles.playerEarnings}>৳{player.earnings}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.userRankContainer}>
        <View style={styles.yourRankInfo}>
          <Text style={styles.yourRankLabel}>Your Position</Text>
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>#{userRank || 7}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.viewAllButton} onPress={onPress}>
          <Text style={styles.viewAllText}>View Full Leaderboard</Text>
          <Ionicons name="arrow-forward" size={16} color="#2962ff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 🆕 Enhanced Stats Section with Progress Bars
const StatsSection = () => {
  const stats = [
    { number: '25', label: 'Wins', icon: 'trophy', color: '#FFD700', progress: 75 },
    { number: '87%', label: 'Win Rate', icon: 'trending-up', color: '#4CAF50', progress: 87 },
    { number: '৳5.2K', label: 'Earnings', icon: 'cash', color: '#2962ff', progress: 62 },
  ];

  return (
    <View style={styles.statsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Performance Stats</Text>
        <TouchableOpacity>
          <Text style={styles.seeDetailsText}>Details</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon} size={20} color="white" />
              </View>
              <Text style={styles.statNumber}>{stat.number}</Text>
            </View>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <AnimatedProgressBar 
              progress={stat.progress} 
              color={stat.color}
              label="Progress"
            />
          </View>
        ))}
      </View>
    </View>
  );
};

// 🆕 Live Tournament Card
const LiveTournamentCard = ({ tournament, onJoin, onChat }) => {
  // Safe fallback for tournament data
  const safeTournament = tournament || {
    title: 'DAILY ROYALE TOURNAMENT',
    prize: '৳5,000',
    participants: 48,
    maxParticipants: 100,
    entryFee: '৳50'
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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
  }, []);

  return (
    <View style={styles.liveTournamentCard}>
      <View style={styles.liveHeader}>
        <View style={styles.liveIndicator}>
          <Animated.View 
            style={[
              styles.livePulse,
              { transform: [{ scale: pulseAnim }] }
            ]} 
          />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.timeRemaining}>2H 30M LEFT</Text>
      </View>

      <View style={styles.tournamentContent}>
        <Text style={styles.tournamentTitle}>{safeTournament.title}</Text>
        <View style={styles.tournamentDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="trophy" size={16} color="#FFD700" />
            <Text style={styles.detailText}>{safeTournament.prize}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={16} color="#2962ff" />
            <Text style={styles.detailText}>
              {safeTournament.participants}/{safeTournament.maxParticipants}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash" size={16} color="#4CAF50" />
            <Text style={styles.detailText}>{safeTournament.entryFee}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${(safeTournament.participants / safeTournament.maxParticipants) * 100}%`,
                  backgroundColor: '#ff8a00'
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {safeTournament.maxParticipants - safeTournament.participants} spots left
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.joinButton}
            onPress={onJoin}
          >
            <Ionicons name="game-controller" size={18} color="white" />
            <Text style={styles.joinButtonText}>Join Now</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={onChat}
          >
            <Ionicons name="chatbubbles" size={18} color="#2962ff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// 🆕 Achievement Badge Component with Unlock Animation
const AchievementBadge = ({ badge, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      badge.unlocked && Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      )
    ]).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1]
  });

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.achievementContainer}>
        <Animated.View 
          style={[
            styles.achievementGlow,
            {
              opacity: glowOpacity,
              backgroundColor: badge.unlocked ? '#FFD700' : '#666',
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.achievementBadge,
            { 
              transform: [{ scale: scaleAnim }],
              borderColor: badge.unlocked ? '#FFD700' : '#666',
            }
          ]}
        >
          <LinearGradient
            colors={badge.unlocked ? ['#FFD700', '#FFA000'] : ['#666', '#444']}
            style={styles.badgeIcon}
          >
            <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
            {!badge.unlocked && (
              <Ionicons name="lock-closed" size={16} color="white" style={styles.lockIcon} />
            )}
          </LinearGradient>
          <Text style={[
            styles.badgeName,
            { color: badge.unlocked ? '#FFD700' : '#666' }
          ]}>
            {badge.name}
          </Text>
          <Text style={styles.badgeDescription}>{badge.description}</Text>
          <View style={[
            styles.badgeStatus,
            { backgroundColor: badge.unlocked ? '#4CAF50' : '#666' }
          ]}>
            <Text style={styles.badgeStatusText}>
              {badge.unlocked ? 'UNLOCKED' : 'LOCKED'}
            </Text>
          </View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

// 🆕 Main EnhancedHomeScreen Component
const EnhancedHomeScreen = ({ navigation }) => {
  // Use real contexts
  const { user: authUser } = useAuth();
  const notificationContext = useNotification();
  const chatContext = useChat();
  const walletContext = useWallet();
  const leaderboardContext = useLeaderboard();

  // Local state
  const [user, setUser] = useState(null);
  const [featuredTournaments, setFeaturedTournaments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [achievements, setAchievements] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const isFocused = useIsFocused();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Copy to clipboard function
  const copyToClipboard = async (text) => {
    if (navigator && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied!', `XOSS ID: ${text} copied to clipboard`);
  };

  // Enhanced user data loading
  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else if (authUser) {
        setUser(authUser);
      }
    } catch (err) { 
      if (authUser) setUser(authUser); 
    }
  };

  // Enhanced tournaments loading
  const fetchFeaturedTournaments = async () => {
    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      const mockTournaments = [
        { 
          id:'1', 
          title:'DAILY ROYALE TOURNAMENT', 
          game:'Free Fire', 
          prize:'৳5,000', 
          participants:48, 
          maxParticipants: 100,
          entryFee:'৳50', 
          status:'upcoming', 
          registered:true, 
          featured:true,
          startTime: oneHourLater.toISOString()
        },
        { 
          id:'2', 
          title:'WEEKEND SHOWDOWN', 
          game:'PUBG Mobile', 
          prize:'৳10,000', 
          participants:85, 
          maxParticipants: 100,
          entryFee:'৳100', 
          status:'live', 
          registered:false, 
          featured:true,
          startTime: now.toISOString()
        },
      ];
      
      setFeaturedTournaments(mockTournaments);
    } catch (err) {
      console.error('Fetch tournaments error:', err);
    }
  };

  // Enhanced achievements loading
  const fetchAchievements = async () => {
    const mockAchievements = [
      { id: '1', name: 'First Win', emoji: '🥇', description: 'Win your first tournament', unlocked: true },
      { id: '2', name: '5 Wins Streak', emoji: '🔥', description: 'Win 5 tournaments in a row', unlocked: true },
      { id: '3', name: 'High Roller', emoji: '💎', description: 'Join a ৳10,000+ tournament', unlocked: false },
      { id: '4', name: 'Team Player', emoji: '👥', description: 'Win 10 team matches', unlocked: true },
      { id: '5', name: 'Night Owl', emoji: '🌙', description: 'Play 20 matches after midnight', unlocked: false },
    ];
    setAchievements(mockAchievements);
  };

  // Enhanced data loading
  const loadBackendData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUser(),
        fetchFeaturedTournaments(),
        fetchAchievements(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await loadBackendData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setRefreshing(false);
  };

  // Enhanced notification handler
  const handleNotificationPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    notificationContext.markAsRead?.('all');
    navigation.navigate('Notifications');
  };

  // Enhanced game press handler
  const handleGamePress = (game) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Tournament', { 
      screen: 'TournamentsMain',
      params: { game: game.name }
    });
  };

  // FIXED: Profile navigation handler
  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Profile');
  };

  // FIXED: Chat navigation handler
  const handleChatPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Chat Feature', 'Tournament chat feature coming soon!');
  };

  // Initialize
  useEffect(() => {
    if (isFocused) {
      loadBackendData();
      notificationContext.registerForPushNotifications?.();
    }
  }, [isFocused]);

  // Enhanced header animations
  const headerBackground = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: ['rgba(26, 35, 126, 1)', 'rgba(26, 35, 126, 0.95)'],
    extrapolate: 'clamp',
  });

  // Enhanced Quick Actions
  const quickActions = [
    { 
      icon: 'game-controller', 
      title: 'Join Match', 
      color: '#2962ff',
      onPress: () => navigation.navigate('Tournament')
    },
    { 
      icon: 'people', 
      title: 'My Team', 
      color: '#FF6B35',
      onPress: () => navigation.navigate('MyTeam')
    },
    { 
      icon: 'wallet', 
      title: 'Wallet', 
      color: '#4CAF50',
      badge: walletContext.transactions?.length > 0 ? '!' : null,
      onPress: () => navigation.navigate('Wallet')
    },
    { 
      icon: 'trophy', 
      title: 'Leaderboard', 
      color: '#9C27B0',
      onPress: () => navigation.navigate('Leaderboard')
    },
    { 
      icon: 'person-add', 
      title: 'Invite', 
      color: '#FF9800',
      onPress: () => navigation.navigate('Invite')
    },
    { 
      icon: 'star', 
      title: 'Achievements', 
      color: '#FFD700',
      badge: achievements.filter(a => a.unlocked).length,
      onPress: () => setShowAchievements(true)
    },
    { 
      icon: 'shield-checkmark', 
      title: 'Practice', 
      color: '#00BCD4',
      isNew: true,
      onPress: () => Alert.alert('Practice Mode', 'Coming soon!')
    },
    { 
      icon: 'stats-chart', 
      title: 'Analytics', 
      color: '#E91E63',
      onPress: () => navigation.navigate('Analytics')
    },
  ];

  return (
    <View style={styles.backgroundImage}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar backgroundColor="#1a237e" barStyle="light-content" />
        
        {/* UPDATED HEADER TO MATCH TOURNAMENTS SCREEN WITH NOTIFICATION */}
        <Animated.View style={[styles.header, { backgroundColor: headerBackground }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>XOSS</Text>
                <Text style={styles.logoSubtitle}>HOME</Text>
              </View>
              
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.headerActionButton}
                  onPress={() => navigation.navigate('CreateMatch')}
                >
                  <FontAwesome name="plus-square" size={22} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerActionButton}
                  onPress={() => setShowSearch(!showSearch)}
                >
                  <Ionicons name="search" size={22} color="white" />
                </TouchableOpacity>
                {/* NOTIFICATION BELL */}
                <TouchableOpacity 
                  style={styles.headerActionButton}
                  onPress={handleNotificationPress}
                >
                  <NotificationBell />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerActionButton}
                  onPress={handleChatPress}
                >
                  <Ionicons name="chatbubbles" size={22} color="white" />
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

            {/* User Status Bar - UPDATED WITH USER ID */}
            <View style={styles.statusBar}>
              <TouchableOpacity 
                style={styles.userInfo}
                onPress={handleProfilePress}
              >
                <LinearGradient
                  colors={['#2962ff', '#448AFF']}
                  style={styles.userAvatar}
                >
                  <FontAwesome name="user" size={20} color="white" />
                </LinearGradient>
                <View>
                  <Text style={styles.userName}>{user?.username || authUser?.username || 'Player123'}</Text>
                  <Text style={styles.userLevel}>Pro Player</Text>
                  
                  {/* USER ID SECTION */}
                  <TouchableOpacity 
                    style={styles.userIdContainer}
                    onPress={() => copyToClipboard(user?.id || 'XOSS_789123')}
                  >
                    <View style={styles.userIdInfo}>
                      <Ionicons name="id-card" size={12} color="#ff8a00" />
                      <Text style={styles.userIdLabel}>XOSS ID: {user?.id || 'XOSS_789123'}</Text>
                    </View>
                    <Ionicons name="copy-outline" size={14} color="#ff8a00" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.walletBalance}
                onPress={() => navigation.navigate('Wallet')}
              >
                <Image source={availableIcons.wallet} style={styles.walletIcon} resizeMode="contain" />
                <Text style={styles.balanceText}>৳ {walletContext.balance || user?.walletBalance || '1,250'}</Text>
              </TouchableOpacity>
            </View>

            {/* Greeting Message */}
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>{getGreeting()}, {user?.username || authUser?.username || 'Player'}! 👋</Text>
              <Text style={styles.subtitle}>Ready for your next victory?</Text>
            </View>
          </View>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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

          {/* Live Tournament Section */}
          <View style={styles.liveSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="flash" size={24} color="#FF4444" />
                <Text style={styles.sectionTitle}>Live Tournaments</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <LiveTournamentCard 
              tournament={featuredTournaments[1]}
              onJoin={() => Alert.alert('Join Tournament', 'Feature coming soon!')}
              onChat={handleChatPress}
            />
          </View>

          {/* Enhanced Leaderboard Preview */}
          <LeaderboardPreview 
            leaderboard={leaderboardContext.leaderboard || []}
            userRank={leaderboardContext.userRank || 7}
            onPress={() => navigation.navigate('Leaderboard')}
            loading={loading}
          />

          {/* Enhanced Stats Section */}
          <StatsSection />

          {/* Enhanced Quick Actions */}
          <View style={styles.quickActionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>More</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actionsGrid}>
              {quickActions.map((action, index) => (
                <QuickActionButton key={index} {...action} />
              ))}
            </View>
          </View>

          {/* Enhanced Games Section */}
          <View style={styles.gamesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎮 Popular Games</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>All Games</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.gamesScrollView}
              contentContainerStyle={styles.gamesScrollContent}
            >
              {games.map((game, index) => (
                <ImageGameButton 
                  key={game.id}
                  game={game}
                  index={index}
                  onPress={() => handleGamePress(game)}
                />
              ))}
            </ScrollView>
          </View>

        </ScrollView>

        {/* Enhanced Achievements Modal */}
        <Modal
          visible={showAchievements}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAchievements(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <Text style={styles.modalTitle}>Your Achievements</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAchievements(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.achievementsStats}>
              <View style={styles.achievementStat}>
                <Text style={styles.achievementStatNumber}>
                  {achievements.filter(a => a.unlocked).length}
                </Text>
                <Text style={styles.achievementStatLabel}>Unlocked</Text>
              </View>
              <View style={styles.achievementStat}>
                <Text style={styles.achievementStatNumber}>
                  {achievements.length}
                </Text>
                <Text style={styles.achievementStatLabel}>Total</Text>
              </View>
              <View style={styles.achievementStat}>
                <Text style={styles.achievementStatNumber}>
                  {Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)}%
                </Text>
                <Text style={styles.achievementStatLabel}>Progress</Text>
              </View>
            </View>

            <ScrollView style={styles.achievementsList}>
              <View style={styles.achievementsGrid}>
                {achievements.map((achievement) => (
                  <AchievementBadge 
                    key={achievement.id}
                    badge={achievement}
                    onPress={() => {
                      Alert.alert(
                        achievement.name, 
                        achievement.description,
                        [{ text: 'OK' }]
                      );
                    }}
                  />
                ))}
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

// 🎨 COMPLETE STYLES SECTION
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0c23',
  },
  safeArea: { 
    flex: 1, 
    backgroundColor: '#0a0c23' 
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
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userLevel: {
    color: '#b0b8ff',
    fontSize: 12,
    marginBottom: 4,
  },
  userIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,138,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#ff8a00',
    marginTop: 4,
  },
  userIdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIdLabel: {
    color: '#ff8a00',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  walletBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  walletIcon: {
    width: 16,
    height: 16,
  },
  balanceText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  greetingContainer: {
    marginTop: 10,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#b0b8ff',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 30 },

  // Section Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  seeAllText: {
    color: '#2962ff',
    fontSize: 14,
    fontWeight: '600',
  },
  seeDetailsText: {
    color: '#ff8a00',
    fontSize: 14,
    fontWeight: '600',
  },

  // Live Tournament Section
  liveSection: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  liveTournamentCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.3)',
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,68,68,0.1)',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginRight: 8,
  },
  liveText: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeRemaining: {
    color: '#b0b8ff',
    fontSize: 12,
    fontWeight: '600',
  },
  tournamentContent: {
    padding: 16,
  },
  tournamentTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tournamentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    color: '#b0b8ff',
    fontSize: 12,
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: '#b0b8ff',
    fontSize: 12,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff8a00',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chatButton: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(41,98,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2962ff',
  },

  // Enhanced Leaderboard Preview
  leaderboardPreview: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(41, 98, 255, 0.2)'
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  topPlayers: {
    marginBottom: 8,
  },
  expandedPlayers: {
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
  },
  playerRank: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginBottom: 2,
  },
  playerLevel: {
    fontSize: 12,
    color: '#b0b8ff',
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  playerEarnings: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 2,
  },
  playerChange: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  userRankContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yourRankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yourRankLabel: {
    fontSize: 14,
    color: '#b0b8ff',
    marginRight: 8,
  },
  rankBadge: {
    backgroundColor: '#2962ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#2962ff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },

  // Enhanced Stats Section
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(41, 98, 255, 0.2)'
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: '#b0b8ff',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10,
    color: '#b0b8ff',
  },
  progressPercentage: {
    fontSize: 10,
    color: '#b0b8ff',
    fontWeight: '600',
  },

  // Enhanced Quick Actions
  quickActionsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionContent: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a0c23',
  },
  actionBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  newBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  actionTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Enhanced Image Game Buttons
  gamesSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  gamesScrollView: {
    marginHorizontal: -16,
  },
  gamesScrollContent: {
    paddingHorizontal: 16,
  },
  imageGameButton: {
    width: 160,
    marginRight: 12,
    marginBottom: 12,
  },
  imageGameContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 120,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  gameImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  gameContent: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  gameImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gamePlayers: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 4,
  },
  gameTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gameTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Enhanced Achievements Modal
  modalContainer: { flex: 1, backgroundColor: '#0a0c23' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: 'white',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  achievementsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  achievementStat: {
    alignItems: 'center',
  },
  achievementStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  achievementStatLabel: {
    fontSize: 12,
    color: '#b0b8ff',
  },
  achievementsList: { flex: 1 },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  achievementContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  achievementGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    opacity: 0.3,
  },
  achievementBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    width: 160,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  badgeEmoji: { fontSize: 24 },
  lockIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  badgeName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeDescription: {
    color: '#b0b8ff',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Skeleton Loader Styles
  skeletonContainer: {
    padding: 16,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
    borderRadius: 6,
  },
});

export default EnhancedHomeScreen;
