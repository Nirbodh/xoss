// App.js - COMPLETE XOSS GAMING ADMIN APP WITH PROPER NAVIGATOR
import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <>
      <StatusBar 
        backgroundColor="#1a237e" 
        barStyle="light-content" 
        translucent={false}
      />
      <AppNavigator />
    </>
  );
}
