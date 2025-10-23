// components/TempIcon.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

export const TempIcon = () => (
  <View style={styles.icon}>
    <View style={styles.iconInner}>
      <Text style={styles.iconText}>X</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  icon: {
    width: 1024,
    height: 1024,
    backgroundColor: '#0a0c23',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 200,
  },
  iconInner: {
    width: 800,
    height: 800,
    backgroundColor: '#2962ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 160,
  },
  iconText: {
    color: 'white',
    fontSize: 300,
    fontWeight: 'bold',
  },
});
