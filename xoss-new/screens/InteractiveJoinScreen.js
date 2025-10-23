import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InteractiveJoinScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Interactive Join Screen</Text>
      <Text style={styles.subtext}>Simple version - No animations</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#ff8a00',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtext: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
});
