// screens/MatchDetailsScreen.js - BOOM BATTLE STYLE
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Clipboard,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MatchDetailsScreen = ({ route, navigation }) => {
  const { match } = route.params;

  const copyRoomInfo = async () => {
    try {
      await Clipboard.setString(`Room ID: ${match.roomId}\nPassword: ${match.roomPassword}`);
      Alert.alert('✅ Copied!', 'Room info copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy room info');
    }
  };

  const PrizeDistribution = () => (
    <View style={styles.prizeSection}>
      <Text style={styles.sectionTitle}>🏆 Prize Distribution</Text>
      <View style={styles.prizeGrid}>
        <View style={styles.prizeItem}>
          <Text style={styles.prizeRank}>1st</Text>
          <Text style={styles.prizeAmount}>৳{Math.round(match.totalPrize * 0.4)}</Text>
        </View>
        <View style={styles.prizeItem}>
          <Text style={styles.prizeRank}>2nd</Text>
          <Text style={styles.prizeAmount}>৳{Math.round(match.totalPrize * 0.3)}</Text>
        </View>
        <View style={styles.prizeItem}>
          <Text style={styles.prizeRank}>3rd</Text>
          <Text style={styles.prizeAmount}>৳{Math.round(match.totalPrize * 0.15)}</Text>
        </View>
        <View style={styles.prizeItem}>
          <Text style={styles.prizeRank}>4th-5th</Text>
          <Text style={styles.prizeAmount}>৳{Math.round(match.totalPrize * 0.075)}</Text>
        </View>
      </View>
      <View style={styles.perKillRow}>
        <Ionicons name="flash" size={16} color="#FF6B00" />
        <Text style={styles.perKillText}>Per Kill: ৳{match.perKill}</Text>
      </View>
    </View>
  );

  const MatchRules = () => (
    <View style={styles.rulesSection}>
      <Text style={styles.sectionTitle}>📜 Match Rules</Text>
      {[
        'No cheating or hacking allowed',
        'Screenshots must be submitted within 10 minutes after match',
        'Top 5 players will get cash prizes',
        'Per kill bonus will be added to final prize',
        'Room will be created 15 minutes before match time',
        'Late entry will not be accepted',
        'Decisions by admins will be final'
      ].map((rule, index) => (
        <View key={index} style={styles.ruleItem}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.ruleText}>{rule}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Match Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Match Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.matchTitle}>{match.title}</Text>
          <Text style={styles.matchType}>{match.type} • {match.map} Map</Text>
          
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.overviewValue}>৳{match.totalPrize}</Text>
              <Text style={styles.overviewLabel}>Total Prize</Text>
            </View>
            <View style={styles.overviewItem}>
              <Ionicons name="people" size={20} color="#2962ff" />
              <Text style={styles.overviewValue}>{match.participants}</Text>
              <Text style={styles.overviewLabel}>Players</Text>
            </View>
            <View style={styles.overviewItem}>
              <Ionicons name="cash" size={20} color="#4CAF50" />
              <Text style={styles.overviewValue}>৳{match.entryFee}</Text>
              <Text style={styles.overviewLabel}>Entry Fee</Text>
            </View>
          </View>
        </View>

        {/* Room Information */}
        <View style={styles.roomCard}>
          <Text style={styles.sectionTitle}>🔑 Room Information</Text>
          <View style={styles.roomInfo}>
            <View style={styles.roomItem}>
              <Text style={styles.roomLabel}>Room ID</Text>
              <Text style={styles.roomValue}>{match.roomId}</Text>
            </View>
            <View style={styles.roomItem}>
              <Text style={styles.roomLabel}>Password</Text>
              <Text style={styles.roomValue}>{match.roomPassword}</Text>
            </View>
            <View style={styles.roomItem}>
              <Text style={styles.roomLabel}>Match Time</Text>
              <Text style={styles.roomValue}>{match.schedule}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.copyButton} onPress={copyRoomInfo}>
            <Ionicons name="copy" size={18} color="#2962ff" />
            <Text style={styles.copyText}>Copy Room Info</Text>
          </TouchableOpacity>
        </View>

        {/* Prize Distribution */}
        <PrizeDistribution />

        {/* Match Rules */}
        <MatchRules />

        {/* Join Button */}
        <TouchableOpacity 
          style={styles.joinButton}
          onPress={() => navigation.navigate('JoinMatch', { match })}
        >
          <Ionicons name="enter" size={20} color="white" />
          <Text style={styles.joinButtonText}>Join Tournament - ৳{match.entryFee}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  overviewCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  matchType: {
    color: '#666',
    fontSize: 14,
    marginBottom: 20,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  overviewLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  roomCard: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  roomInfo: {
    gap: 12,
    marginBottom: 15,
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roomLabel: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  roomValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2962ff',
    gap: 8,
  },
  copyText: {
    color: '#2962ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  prizeSection: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prizeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  prizeItem: {
    alignItems: 'center',
    flex: 1,
  },
  prizeRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  prizeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  perKillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff8f0',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  perKillText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rulesSection: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  ruleText: {
    color: '#666',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2962ff',
    margin: 15,
    padding: 18,
    borderRadius: 12,
    shadowColor: '#2962ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MatchDetailsScreen;
