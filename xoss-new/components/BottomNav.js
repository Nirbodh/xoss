import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BottomNav = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'tournaments', label: 'Tournaments', icon: 'trophy' },
    { id: 'mygame', label: 'MyGame', icon: 'game-controller' },
    { id: 'wallet', label: 'Wallet', icon: 'wallet' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <View style={styles.bottomNav}>
      {navItems.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.navItem}
          onPress={() => onNavigate(item.id)}
        >
          <Ionicons
            name={item.icon}
            size={24}
            color={currentScreen === item.id ? '#ff8a00' : '#ccc'}
          />
          <Text
            style={[
              styles.navText,
              currentScreen === item.id && styles.navTextActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#ff8a00',
    paddingVertical: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 3,
  },
  navTextActive: {
    color: '#ff8a00',
  },
});

export default BottomNav;
