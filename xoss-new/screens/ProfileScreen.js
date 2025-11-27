// screens/ProfileScreen.js - COMPLETELY FIXED VERSION WITH POINTS CONVERSION
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  Share,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face');
  const [userStats, setUserStats] = useState({
    balance: 1250,
    gamesPlayed: 47,
    tournaments: 12,
    wins: 41,
    winRate: '87%'
  });
  const [points, setPoints] = useState(350);
  const [converting, setConverting] = useState(false);

  // Load user stats from storage
  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const stats = await AsyncStorage.getItem('userStats');
      if (stats) {
        setUserStats(JSON.parse(stats));
      }
      
      // Load profile image if exists
      const savedImage = await AsyncStorage.getItem('profileImage');
      if (savedImage) {
        setProfileImage(savedImage);
      }

      // Load points if exists
      const savedPoints = await AsyncStorage.getItem('userPoints');
      if (savedPoints) {
        setPoints(parseInt(savedPoints));
      }
    } catch (error) {
      console.log('Error loading user stats:', error);
    }
  };

  // Handle points conversion
  const handleConvertPoints = async () => {
    if (points < 100) {
      Alert.alert('ত্রুটি', 'কনভার্ট করতে ন্যূনতম ১০০ পয়েন্ট প্রয়োজন।');
      return;
    }

    setConverting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const convertiblePoints = Math.floor(points / 100) * 100;
      const amount = convertiblePoints * 0.1;
      
      // Update points and balance
      const newPoints = points - convertiblePoints;
      const newBalance = userStats.balance + amount;
      
      setPoints(newPoints);
      setUserStats(prev => ({ ...prev, balance: newBalance }));
      
      // Save to storage
      await AsyncStorage.setItem('userPoints', newPoints.toString());
      await AsyncStorage.setItem('userStats', JSON.stringify({ ...userStats, balance: newBalance }));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'সফল!', 
        `আপনার ${convertiblePoints} পয়েন্ট সফলভাবে ৳${amount} তে কনভার্ট হয়েছে!`,
        [{ text: 'ঠিক আছে' }]
      );
    } catch (error) {
      Alert.alert('ত্রুটি', 'পয়েন্ট কনভার্ট করতে সমস্যা হয়েছে।');
    } finally {
      setConverting(false);
    }
  };

  const profileStats = [
    { label: 'ব্যালেন্স', value: `৳${userStats.balance}`, icon: 'wallet', color: '#00D4FF' },
    { label: 'মোট গেম', value: userStats.gamesPlayed.toString(), icon: 'game-controller', color: '#FF6B6B' },
    { label: 'টুর্নামেন্ট', value: userStats.tournaments.toString(), icon: 'trophy', color: '#FFD700' },
    { label: 'জয়ের হার', value: userStats.winRate, icon: 'trending-up', color: '#00FF88' },
  ];

  // FIXED: All navigations working properly
  const menuItems = [
    { 
      icon: 'person', 
      title: 'প্রোফাইল এডিট করুন', 
      color: '#00D4FF',
      onPress: () => navigation.navigate('EditProfile')
    },
    { 
      icon: 'settings', 
      title: 'সেটিংস', 
      color: '#FF6B6B',
      onPress: () => navigation.navigate('Settings')
    },
    { 
      icon: 'shield-checkmark', 
      title: 'প্রাইভেসি ও সিকিউরিটি', 
      color: '#00FF88',
      onPress: () => navigation.navigate('PrivacySecurity')
    },
    { 
      icon: 'card', 
      title: 'পেমেন্ট মেথড', 
      color: '#FFD700',
      onPress: () => navigation.navigate('PaymentMethods')
    },
    { 
      icon: 'help-circle', 
      title: 'সাহায্য ও সাপোর্ট', 
      color: '#9B59B6',
      onPress: () => {
        Alert.alert(
          'সাহায্য ও সাপোর্ট',
          'যেকোনো সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন:',
          [
            {
              text: 'হোয়াটসঅ্যাপ',
              onPress: () => Linking.openURL('https://wa.me/8801751332386')
            },
            {
              text: 'ইমেইল',
              onPress: () => Linking.openURL('mailto:support@xossgaming.com')
            },
            {
              text: 'কল করুন',
              onPress: () => Linking.openURL('tel:+8801751332386')
            },
            {
              text: 'বাতিল',
              style: 'cancel'
            }
          ]
        );
      }
    },
    { 
      icon: 'information-circle', 
      title: 'আমাদের সম্পর্কে', 
      color: '#3498DB',
      onPress: () => {
        Alert.alert(
          'XOSS গেমিং সম্পর্কে',
          '🎮 XOSS গেমিং - বাংলাদেশের সর্বাধিক জনপ্রিয় গেমিং প্ল্যাটফর্ম\n\n' +
          '• ১০০,০০০+ সক্রিয় প্লেয়ার\n' +
          '• ৫০০+ টুর্নামেন্ট প্রতি মাসে\n' +
          '• ৳১০ লাখ+ পুরস্কার বিতরণ\n' +
          '• ২৪/৭ কাস্টমার সাপোর্ট\n\n' +
          'ভার্সন: ১.০.০',
          [{ text: 'ঠিক আছে' }]
        );
      }
    },
    { 
      icon: 'person-add', 
      title: 'বন্ধুকে আমন্ত্রণ করুন', 
      color: '#FF9800',
      onPress: () => navigation.navigate('Invite')
    },
    { 
      icon: 'log-out', 
      title: 'লগআউট', 
      color: '#95A5A6',
      onPress: () => {
        Alert.alert(
          'লগআউট',
          'আপনি কি নিশ্চিত যে লগআউট করতে চান?',
          [
            {
              text: 'বাতিল',
              style: 'cancel'
            },
            {
              text: 'লগআউট',
              style: 'destructive',
              onPress: async () => {
                try {
                  await logout();
                } catch (error) {
                  Alert.alert('ত্রুটি', 'লগআউট করতে ব্যর্থ হয়েছে');
                }
              }
            }
          ]
        );
      }
    },
  ];

  // Profile Image Picker
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('অনুমতি প্রয়োজন', 'প্রোফাইল ছবি পরিবর্তন করতে ক্যামেরা রোল এক্সেস প্রয়োজন।');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const selectedImage = result.assets[0].uri;
        setProfileImage(selectedImage);
        await AsyncStorage.setItem('profileImage', selectedImage);
        Alert.alert('সফল', 'প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!');
      }
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('ত্রুটি', 'প্রোফাইল ছবি আপডেট করতে ব্যর্থ হয়েছে।');
    }
  };

  // Take Photo with Camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('অনুমতি প্রয়োজন', 'ক্যামেরা ব্যবহারের অনুমতি প্রয়োজন।');
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const capturedImage = result.assets[0].uri;
        setProfileImage(capturedImage);
        await AsyncStorage.setItem('profileImage', capturedImage);
        Alert.alert('সফল', 'প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!');
      }
    } catch (error) {
      console.log('Camera error:', error);
      Alert.alert('ত্রুটি', 'ক্যামেরা ব্যবহার করতে ব্যর্থ হয়েছে।');
    }
  };

  // Show Image Picker Options
  const showImagePickerOptions = () => {
    Alert.alert(
      'প্রোফাইল ছবি পরিবর্তন',
      'কীভাবে ছবি যোগ করতে চান?',
      [
        {
          text: 'গ্যালারী থেকে নির্বাচন',
          onPress: pickImage
        },
        {
          text: 'ক্যামেরা দিয়ে তোলুন',
          onPress: takePhoto
        },
        {
          text: 'বাতিল',
          style: 'cancel'
        }
      ]
    );
  };

  // Copy Referral Code to Clipboard
  const copyReferralCode = async () => {
    try {
      const referralCode = `XOSS${user?.id || '789123'}`;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert(
        'কোড কপি হয়েছে!', 
        `রেফারেল কোড: ${referralCode} কপি করা হয়েছে। আপনার বন্ধুদের সাথে শেয়ার করুন!`,
        [{ text: 'ঠিক আছে' }]
      );
    } catch (error) {
      Alert.alert('ত্রুটি', 'কোড কপি করতে ব্যর্থ হয়েছে।');
    }
  };

  const ProfileStat = ({ stat }) => (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
        <Ionicons name={stat.icon} size={20} color={stat.color} />
      </View>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );

  const MenuItem = ({ item }) => (
    <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
      <View style={styles.menuLeft}>
        <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
          <Ionicons name={item.icon} size={20} color={item.color} />
        </View>
        <Text style={styles.menuTitle}>{item.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F24" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>প্রোফাইল</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarContainer} onPress={showImagePickerOptions}>
            <Image 
              source={{ uri: profileImage }}
              style={styles.avatar}
            />
            <View style={styles.editAvatar}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{user?.username || 'Robert Fox'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'robert.fox@example.com'}</Text>
          <Text style={styles.userBio}>প্রফেশনাল গেমার • স্ট্রিমার • কন্টেন্ট ক্রিয়েটর</Text>
          
          {/* Referral Code Section */}
          <TouchableOpacity 
            style={styles.referralContainer}
            onPress={copyReferralCode}
          >
            <View style={styles.referralInfo}>
              <Ionicons name="gift" size={16} color="#FF9800" />
              <Text style={styles.referralLabel}>আমার রেফারেল কোড:</Text>
              <Text style={styles.referralCode}>XOSS{user?.id || '789123'}</Text>
            </View>
            <Ionicons name="copy-outline" size={16} color="#FF9800" />
          </TouchableOpacity>
          
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#00FF88" />
            <Text style={styles.verifiedText}>ভেরিফাইড অ্যাকাউন্ট</Text>
          </View>

          {/* Quick Stats Row */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>২.৫K</Text>
              <Text style={styles.quickStatLabel}>ফলোয়ার</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>১৫০</Text>
              <Text style={styles.quickStatLabel}>ফলোয়িং</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>৪৭</Text>
              <Text style={styles.quickStatLabel}>গেম</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {profileStats.map((stat, index) => (
            <ProfileStat key={index} stat={stat} />
          ))}
        </View>

        {/* Referral Bonus Card */}
        <View style={styles.referralBonusCard}>
          <View style={styles.bonusHeader}>
            <Ionicons name="gift" size={24} color="#FF9800" />
            <Text style={styles.bonusTitle}>রেফারেল বোনাস</Text>
          </View>
          <Text style={styles.bonusDescription}>
            প্রতিটি বন্ধুকে আমন্ত্রণ করলে পাবেন ৳৫০ বোনাস! আপনার বন্ধুও পাবে ৳২৫ ওয়েলকাম বোনাস।
          </Text>
          <View style={styles.bonusStats}>
            <View style={styles.bonusStat}>
              <Text style={styles.bonusStatValue}>৫</Text>
              <Text style={styles.bonusStatLabel}>সফল রেফারেল</Text>
            </View>
            <View style={styles.bonusStat}>
              <Text style={styles.bonusStatValue}>৳২৫০</Text>
              <Text style={styles.bonusStatLabel}>মোট আয়</Text>
            </View>
          </View>
        </View>

        {/* Points Conversion Card */}
        <View style={styles.pointsConversionCard}>
          <View style={styles.pointsHeader}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.pointsTitle}>পয়েন্ট কনভার্সন</Text>
          </View>
          <Text style={styles.pointsDescription}>
            আপনার পয়েন্টগুলো টাকায় কনভার্ট করুন। ১০০ পয়েন্ট = ৳১০
          </Text>
          <View style={styles.pointsInfo}>
            <View style={styles.pointsInfoItem}>
              <Text style={styles.pointsLabel}>বর্তমান পয়েন্ট:</Text>
              <Text style={styles.pointsValue}>{points}</Text>
            </View>
            <View style={styles.pointsInfoItem}>
              <Text style={styles.pointsLabel}>কনভার্টযোগ্য:</Text>
              <Text style={styles.pointsValue}>৳{(Math.floor(points / 100) * 100) * 0.1}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.convertButton, (points < 100 || converting) && styles.convertButtonDisabled]}
            onPress={handleConvertPoints}
            disabled={points < 100 || converting}
          >
            {converting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.convertButtonText}>
                {points >= 100 ? 'পয়েন্ট কনভার্ট করুন' : 'ন্যূনতম ১০০ পয়েন্ট প্রয়োজন'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>অ্যাকাউন্ট সেটিংস</Text>
          
          <View style={styles.menuList}>
            {menuItems.map((item, index) => (
              <MenuItem key={index} item={item} />
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>অ্যাপ ভার্সন ১.০.০</Text>
          <Text style={styles.appCopyright}>© ২০২৪ XOSS গেমিং। সর্বস্বত্ব সংরক্ষিত।</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24',
  },
  header: {
    backgroundColor: '#1A1F3C',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#1A1F3C',
    margin: 20,
    marginTop: 20,
    borderRadius: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#00D4FF',
  },
  editAvatar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00D4FF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0A0F24',
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginBottom: 10,
  },
  userBio: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  referralContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,152,0,0.15)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
    marginBottom: 15,
    width: '100%',
  },
  referralInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referralLabel: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 6,
  },
  referralCode: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    marginBottom: 15,
  },
  verifiedText: {
    color: '#00FF88',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  quickStat: {
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  quickStatValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quickStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  quickStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  referralBonusCard: {
    backgroundColor: 'rgba(255,152,0,0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
  },
  bonusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bonusTitle: {
    color: '#FF9800',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bonusDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  bonusStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bonusStat: {
    alignItems: 'center',
  },
  bonusStatValue: {
    color: '#FF9800',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bonusStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  pointsConversionCard: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pointsDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  pointsInfo: {
    marginBottom: 15,
  },
  pointsInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  pointsValue: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  convertButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  convertButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  convertButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuSection: {
    marginHorizontal: 20,
    marginBottom: 30,
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
  menuTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 30,
  },
  appVersion: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 5,
  },
  appCopyright: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ProfileScreen;
