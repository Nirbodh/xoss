import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AnalyticsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const statsData = {
    week: {
      matchesPlayed: 24,
      wins: 18,
      winRate: 75,
      earnings: 1250,
      kills: 156,
      headshots: 42
    },
    month: {
      matchesPlayed: 89,
      wins: 67,
      winRate: 75.3,
      earnings: 4850,
      kills: 589,
      headshots: 156
    },
    allTime: {
      matchesPlayed: 456,
      wins: 342,
      winRate: 75,
      earnings: 21500,
      kills: 2896,
      headshots: 742
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={styles.statGradient}
      >
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: color }]}>
            <Ionicons name={icon} size={20} color="white" />
          </View>
          <Text style={styles.statValue}>{value}</Text>
        </View>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </View>
  );

  const PeriodButton = ({ title, value }) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === value && styles.periodButtonActive
      ]}
      onPress={() => setSelectedPeriod(value)}
    >
      <Text style={[
        styles.periodText,
        selectedPeriod === value && styles.periodTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const currentStats = statsData[selectedPeriod];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#2962ff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2962ff']}
            tintColor="#2962ff"
          />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <PeriodButton title="Week" value="week" />
          <PeriodButton title="Month" value="month" />
          <PeriodButton title="All Time" value="allTime" />
        </View>

        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Matches Played"
            value={currentStats.matchesPlayed}
            subtitle="Total games"
            icon="game-controller"
            color="#2962ff"
          />
          <StatCard
            title="Wins"
            value={currentStats.wins}
            subtitle="Victories"
            icon="trophy"
            color="#FFD700"
          />
          <StatCard
            title="Win Rate"
            value={currentStats.winRate + '%'}
            subtitle="Success rate"
            icon="trending-up"
            color="#4CAF50"
          />
          <StatCard
            title="Earnings"
            value={'৳' + currentStats.earnings}
            subtitle="Total won"
            icon="cash"
            color="#FF9800"
          />
          <StatCard
            title="Kills"
            value={currentStats.kills}
            subtitle="Eliminations"
            icon="skull"
            color="#F44336"
          />
          <StatCard
            title="Headshots"
            value={currentStats.headshots}
            subtitle="Precision kills"
            icon="target"
            color="#9C27B0"
          />
        </View>

        {/* Performance Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Performance Summary</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Best Game</Text>
            <Text style={styles.summaryValue}>18 kills</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Longest Win Streak</Text>
            <Text style={styles.summaryValue}>8 games</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Favorite Game</Text>
            <Text style={styles.summaryValue}>PUBG Mobile</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Avg. Kills/Game</Text>
            <Text style={styles.summaryValue}>6.5</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="trophy" size={16} color="#FFD700" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Won Daily Tournament</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
            <Text style={styles.activityEarnings}>+৳500</Text>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="game-controller" size={16} color="#2962ff" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Joined Squad Match</Text>
              <Text style={styles.activityTime}>5 hours ago</Text>
            </View>
            <Text style={styles.activityEarnings}>+৳150</Text>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="trending-up" size={16} color="#4CAF50" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Win Streak Bonus</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
            <Text style={styles.activityEarnings}>+৳100</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1a237e',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#2962ff',
  },
  periodText: {
    color: '#b0b8ff',
    fontSize: 14,
    fontWeight: '600',
  },
  periodTextActive: {
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
  },
  statGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statTitle: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#b0b8ff',
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#b0b8ff',
  },
  summaryValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#b0b8ff',
  },
  activityEarnings: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default AnalyticsScreen;
