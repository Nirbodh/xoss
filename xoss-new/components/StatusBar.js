import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const StatusBar = ({ username, balance }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.statusBar}>
      {/* 🔹 User Avatar + Username */}
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => navigation.navigate("Profile")}
      >
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {username ? username[0].toUpperCase() : "U"}
          </Text>
        </View>
        <Text style={styles.userName}>{username || "User"}</Text>
      </TouchableOpacity>

      {/* 🔹 Wallet Balance */}
      <View style={styles.walletBalance}>
        <Text style={styles.balanceText}>৳ {balance}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff8a00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userName: {
    color: '#ff8a00',
    fontWeight: 'bold',
    fontSize: 16,
  },
  walletBalance: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  balanceText: {
    color: '#ff8a00',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default StatusBar;
