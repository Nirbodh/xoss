// screens/SettingsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    vibration: true,
    autoJoin: false,
    darkMode: true,
    biometricLogin: false,
    dataSaver: false
  });

  const handleSettingToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const SettingItem = ({ icon, title, subtitle, type = 'toggle', value, onToggle, onPress, danger = false }) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={type === 'toggle' ? onToggle : onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={danger ? '#FF4444' : '#ff8a00'} 
        />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      {type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#767577', true: '#ff8a00' }}
          thumbColor={value ? '#fff' : '#f4f3f4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#666" />
      )}
    </TouchableOpacity>
  );

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => Alert.alert('Success', 'Cache cleared successfully')
        }
      ]
    );
  };

  const handleContactSupport = () => {
    Linking.openURL('https://wa.me/880123456789');
  };

  const handleRateApp = () => {
    // In a real app, this would open the app store
    Alert.alert('Rate App', 'Thank you for your feedback!');
  };

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Receive match updates and alerts"
            type="toggle"
            value={settings.notifications}
            onToggle={() => handleSettingToggle('notifications')}
          />
          <SettingItem
            icon="volume-high"
            title="Sound"
            subtitle="Play sounds for notifications"
            type="toggle"
            value={settings.sound}
            onToggle={() => handleSettingToggle('sound')}
          />
          <SettingItem
            icon="phone-vibrate"
            title="Vibration"
            subtitle="Vibrate on notifications"
            type="toggle"
            value={settings.vibration}
            onToggle={() => handleSettingToggle('vibration')}
          />
        </View>

        {/* Game Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Settings</Text>
          <SettingItem
            icon="game-controller"
            title="Auto Join"
            subtitle="Automatically join available matches"
            type="toggle"
            value={settings.autoJoin}
            onToggle={() => handleSettingToggle('autoJoin')}
          />
          <SettingItem
            icon="moon"
            title="Dark Mode"
            subtitle="Use dark theme"
            type="toggle"
            value={settings.darkMode}
            onToggle={() => handleSettingToggle('darkMode')}
          />
          <SettingItem
            icon="cellular"
            title="Data Saver"
            subtitle="Reduce data usage"
            type="toggle"
            value={settings.dataSaver}
            onToggle={() => handleSettingToggle('dataSaver')}
          />
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <SettingItem
            icon="finger-print"
            title="Biometric Login"
            subtitle="Use fingerprint or face ID"
            type="toggle"
            value={settings.biometricLogin}
            onToggle={() => handleSettingToggle('biometricLogin')}
          />
          <SettingItem
            icon="lock-closed"
            title="Change Password"
            subtitle="Update your account password"
            type="navigation"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingItem
            icon="shield-checkmark"
            title="Two-Factor Authentication"
            subtitle="Add extra security to your account"
            type="navigation"
            onPress={() => navigation.navigate('TwoFactorAuth')}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingItem
            icon="help-buoy"
            title="Help & Support"
            subtitle="Get help with the app"
            type="navigation"
            onPress={handleContactSupport}
          />
          <SettingItem
            icon="document-text"
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            type="navigation"
            onPress={() => navigation.navigate('Terms')}
          />
          <SettingItem
            icon="shield"
            title="Privacy Policy"
            subtitle="How we protect your data"
            type="navigation"
            onPress={() => navigation.navigate('Privacy')}
          />
          <SettingItem
            icon="star"
            title="Rate App"
            subtitle="Share your feedback"
            type="navigation"
            onPress={handleRateApp}
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <SettingItem
            icon="information-circle"
            title="App Version"
            subtitle="Version 1.0.0"
            type="navigation"
            onPress={() => {}}
          />
          <SettingItem
            icon="build"
            title="Clear Cache"
            subtitle="Free up storage space"
            type="navigation"
            onPress={handleClearCache}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerText]}>Danger Zone</Text>
          <SettingItem
            icon="log-out"
            title="Logout"
            subtitle="Sign out of your account"
            type="navigation"
            danger={true}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Logout', 
                    style: 'destructive',
                    onPress: () => navigation.replace('Login')
                  }
                ]
              );
            }}
          />
          <SettingItem
            icon="trash"
            title="Delete Account"
            subtitle="Permanently delete your account"
            type="navigation"
            danger={true}
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'This action cannot be undone. All your data will be permanently deleted.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => console.log('Account deletion requested')
                  }
                ]
              );
            }}
          />
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff8a00',
    marginBottom: 15,
    marginHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginBottom: 1,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    flex: 1,
    marginLeft: 15,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    color: '#ccc',
    fontSize: 12,
  },
  dangerText: {
    color: '#FF4444',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default SettingsScreen;
