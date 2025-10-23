import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PrivacySecurityScreen = ({ navigation }) => {
  const privacyItems = [
    {
      icon: 'lock-closed',
      title: 'Change Password',
      subtitle: 'Update your account password',
      onPress: () => Alert.alert('Coming Soon', 'Password change feature coming soon!'),
      color: '#FF6B6B'
    },
    {
      icon: 'eye-off',
      title: 'Privacy Settings',
      subtitle: 'Control who can see your profile',
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings coming soon!'),
      color: '#00D4FF'
    },
    {
      icon: 'shield-checkmark',
      title: 'Two-Factor Authentication',
      subtitle: 'Add extra security to your account',
      onPress: () => Alert.alert('Coming Soon', '2FA feature coming soon!'),
      color: '#00FF88'
    },
    {
      icon: 'trash',
      title: 'Delete Account',
      subtitle: 'Permanently delete your account',
      onPress: () => Alert.alert(
        'Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => Alert.alert('Coming Soon', 'Account deletion feature coming soon!')
          }
        ]
      ),
      color: '#E74C3C'
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Security Settings</Text>
        
        <View style={styles.menuList}>
          {privacyItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={40} color="#00FF88" />
          <Text style={styles.securityTitle}>Your Security is Our Priority</Text>
          <Text style={styles.securityText}>
            We use industry-standard encryption to protect your personal information and transactions. Your data is always safe with us.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1A1F3C',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  menuList: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  securityInfo: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  securityTitle: {
    color: '#00FF88',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  securityText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PrivacySecurityScreen;
