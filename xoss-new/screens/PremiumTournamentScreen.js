// screens/PremiumTournamentScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const PremiumTournamentScreen = ({ navigation }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  
  const tournaments = [
    {
      id: '1',
      code: 'X055',
      title: 'FREE FIRE WEEKLY SHOWDOWN',
      game: 'FREE FIRE',
      type: 'SQUAD',
      entryFee: 50,
      prizePool: 5000,
      players: 48,
      registered: 32,
      date: 'Today 8:00 PM',
      status: 'live',
      color: '#FF6B35'
    },
    {
      id: '2',
      code: 'B123', 
      title: 'PUBG MOBILE ROYALE',
      game: 'PUBG MOBILE',
      type: 'DUO',
      entryFee: 100,
      prizePool: 10000,
      players: 100,
      registered: 78,
      date: 'Tomorrow 7:00 PM',
      status: 'upcoming',
      color: '#4ECDC4'
    },
    {
      id: '3',
      code: 'C456',
      title: 'BGMI CHAMPIONSHIP',
      game: 'BGMI',
      type: 'SOLO',
      entryFee: 25,
      prizePool: 2500,
      players: 50,
      registered: 45,
      date: 'In 2 hours',
      status: 'starting',
      color: '#45B7D1'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Games', icon: 'apps' },
    { id: 'ff', name: 'Free Fire', icon: 'flame' },
    { id: 'pubg', name: 'PUBG', icon: 'game-controller' },
    { id: 'bgmi', name: 'BGMI', icon: 'trophy' }
  ];

  const TournamentCard = ({ tournament }) => {
    const scaleAnim = new Animated.Value(1);
    
    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };
    
    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    return (
      <View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.tournamentCard, { borderLeftColor: tournament.color }]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => navigation.navigate('TournamentDetails', { tournament })}
        >
          {/* Tournament Header */}
          <View style={styles.cardHeader}>
            <View style={styles.tournamentCode}>
              <Text style={styles.codeText}>{tournament.code}</Text>
            </View>
            <View style={[styles.statusBadge, 
              tournament.status === 'live' && styles.liveBadge,
              tournament.status === 'upcoming' && styles.upcomingBadge,
              tournament.status === 'starting' && styles.startingBadge
            ]}>
              <Text style={styles.statusText}>
                {tournament.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Tournament Info */}
          <View style={styles.cardContent}>
            <Text style={styles.tournamentTitle}>{tournament.title}</Text>
            <Text style={styles.gameType}>{tournament.game} • {tournament.type}</Text>
            
            <View style={styles.prizeSection}>
              <View style={styles.prizeItem}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
                <Text style={styles.prizeText}>₹{tournament.prizePool}</Text>
              </View>
              <View style={styles.prizeItem}>
                <Ionicons name="people" size={20} color="#ff8a00" />
                <Text style={styles.prizeText}>
                  {tournament.registered}/{tournament.players}
                </Text>
              </View>
            </View>

            <View style={styles.timeSection}>
              <Ionicons name="time" size={16} color="#fff" />
              <Text style={styles.timeText}>{tournament.date}</Text>
            </View>
          </View>

          {/* Action Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.entryFee}>ENTRY: ₹{tournament.entryFee}</Text>
            <TouchableOpacity 
              style={[styles.joinButton, { backgroundColor: tournament.color }]}
              onPress={() => navigation.navigate('InteractiveJoin', { tournament })}
            >
              <Text style={styles.joinText}>JOIN NOW</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>TOURNAMENT</Text>
          <Text style={styles.headerSubtitle}>GAMING BASE</Text>
          <View style={styles.headerLine} />
        </View>
        
        <View style={styles.userSection}>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications" size={24} color="#fff" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              activeCategory === category.id && styles.activeCategory
            ]}
            onPress={() => setActiveCategory(category.id)}
          >
            <Ionicons 
              name={category.icon} 
              size={20} 
              color={activeCategory === category.id ? '#fff' : '#888'} 
            />
            <Text style={[
              styles.categoryText,
              activeCategory === category.id && styles.activeCategoryText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tournaments List */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.tournamentsContainer}>
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff8a00',
    letterSpacing: 3,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginTop: 5,
    letterSpacing: 1,
  },
  headerLine: {
    width: 80,
    height: 4,
    backgroundColor: '#ff8a00',
    marginTop: 10,
    borderRadius: 2,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    padding: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#ff4757',
    borderRadius: 4,
  },
  categoriesScroll: {
    maxHeight: 70,
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  activeCategory: {
    backgroundColor: '#ff8a00',
    borderColor: '#ff8a00',
  },
  categoryText: {
    color: '#888',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  activeCategoryText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  tournamentsContainer: {
    padding: 15,
  },
  tournamentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginBottom: 15,
    borderLeftWidth: 6,
    borderLeftColor: '#ff8a00',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  tournamentCode: {
    backgroundColor: '#252525',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  codeText: {
    color: '#ff8a00',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveBadge: {
    backgroundColor: '#ff4757',
  },
  upcomingBadge: {
    backgroundColor: '#3742fa',
  },
  startingBadge: {
    backgroundColor: '#2ed573',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 15,
  },
  tournamentTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    lineHeight: 24,
  },
  gameType: {
    color: '#ff8a00',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 15,
  },
  prizeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  prizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prizeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#252525',
  },
  entryFee: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff8a00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  joinText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
});

export default PremiumTournamentScreen;
