// screens/TransactionHistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TransactionHistoryScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = new Animated.Value(0);

  const sampleTransactions = [
    {
      id: 1,
      type: 'deposit',
      amount: 500,
      description: 'bKash Deposit',
      date: '05/Sept/2025 10:30 AM',
      status: 'completed',
      method: 'bkash',
      transactionId: 'TX123456'
    },
    {
      id: 2,
      type: 'withdraw',
      amount: -200,
      description: 'Withdrawal to 017XXXXXXX',
      date: '05/Sept/2025 11:45 AM',
      status: 'pending',
      method: 'bkash',
      transactionId: 'TX123457'
    },
    {
      id: 3,
      type: 'tournament_win',
      amount: 85,
      description: 'Free Fire Tournament Win',
      date: '05/Sept/2025 02:30 PM',
      status: 'completed',
      method: 'prize'
    },
    {
      id: 4,
      type: 'entry_fee',
      amount: -50,
      description: 'Tournament Entry Fee',
      date: '05/Sept/2025 03:15 PM',
      status: 'completed',
      method: 'tournament'
    },
    {
      id: 5,
      type: 'bonus',
      amount: 25,
      description: 'Referral Bonus',
      date: '04/Sept/2025 09:20 AM',
      status: 'completed',
      method: 'bonus'
    }
  ];

  useEffect(() => {
    loadTransactions();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadTransactions = async () => {
    try {
      const savedTransactions = await AsyncStorage.getItem('walletTransactions');
      setTransactions(savedTransactions ? JSON.parse(savedTransactions) : sampleTransactions);
    } catch (error) {
      setTransactions(sampleTransactions);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'deposit') return transaction.amount > 0;
    if (filter === 'withdraw') return transaction.amount < 0;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#FF4444';
      default: return '#666';
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return 'download';
      case 'withdraw': return 'arrow-up';
      case 'tournament_win': return 'trophy';
      case 'entry_fee': return 'game-controller';
      case 'bonus': return 'gift';
      default: return 'card';
    }
  };

  const TransactionItem = ({ item, index }) => (
    <View 
      style={[
        styles.transactionItem,
        { 
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })
          }]
        }
      ]}
    >
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons 
            name={getTransactionIcon(item.type)} 
            size={20} 
            color={getStatusColor(item.status)} 
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{item.description}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
          {item.transactionId && (
            <Text style={styles.transactionId}>ID: {item.transactionId}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: item.amount >= 0 ? '#4CAF50' : '#FF4444' }
        ]}>
          {item.amount >= 0 ? '+' : ''}৳ {Math.abs(item.amount)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  const FilterButton = ({ title, value }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive
      ]}
      onPress={() => setFilter(value)}
    >
      <Text style={[
        styles.filterText,
        filter === value && styles.filterTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterSection}>
        <FilterButton title="All" value="all" />
        <FilterButton title="Deposits" value="deposit" />
        <FilterButton title="Withdrawals" value="withdraw" />
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => <TransactionItem item={item} index={index} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff8a00']}
            tintColor="#ff8a00"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ff8a00" />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? "Your transactions will appear here" 
                : `No ${filter} transactions found`
              }
            </Text>
          </View>
        }
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  filterSection: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1a1a1a',
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255,138,0,0.2)',
    borderColor: '#ff8a00',
  },
  filterText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ff8a00',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionDate: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 2,
  },
  transactionId: {
    color: '#666',
    fontSize: 10,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#ff8a00',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptySubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
});

export default TransactionHistoryScreen;
