import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Share, 
  Alert, 
  ScrollView,
  Clipboard,
  Platform,
  Linking
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../context/AuthContext";

export default function InviteScreen({ navigation }) {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState(user?.id ? `XOSS${user.id}` : "XOSS2024");

  const shareInvite = async () => {
    try {
      const message = `🎮 **Join XOSS Gaming & Get ৳100 Bonus!** 🎯\n\nUse my referral code: **${referralCode}**\n\nDownload now and start earning real money by playing tournaments!\n\n✨ **Features:**\n• Play Free Fire, PUBG, Ludo & more\n• Win real money tournaments\n• Instant withdrawals\n• 24/7 support\n\n🚀 **Download Link:** https://xossgaming.com/download\n\nUse my code: ${referralCode}`;

      const result = await Share.share({
        message: message,
        title: 'Join XOSS Gaming - Win Real Money! 🎮'
      });

      if (result.action === Share.sharedAction) {
        // Track successful share
        console.log('Share was successful');
      }
    } catch (error) {
      console.log('Share error:', error);
      Alert.alert('Share Failed', 'Please try again later.');
    }
  };

  const copyReferralCode = async () => {
    try {
      await Clipboard.setString(referralCode);
      Alert.alert('Copied!', `Referral code "${referralCode}" copied to clipboard`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy referral code');
    }
  };

  const shareOnWhatsApp = async () => {
    const message = `Join XOSS Gaming using my code: ${referralCode}. Download: https://xossgaming.com/download`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'WhatsApp is not installed');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Invite Friends</Text>
        <Text style={styles.subtitle}>Earn ৳100 for each friend who joins</Text>
      </View>

      {/* Referral Card */}
      <View style={styles.referralCard}>
        <View style={styles.rewardBadge}>
          <Ionicons name="gift" size={20} color="#FFD700" />
          <Text style={styles.rewardText}>৳100 Bonus</Text>
        </View>
        
        <Text style={styles.referralLabel}>Your Referral Code</Text>
        <TouchableOpacity style={styles.codeContainer} onPress={copyReferralCode}>
          <Text style={styles.referralCode}>{referralCode}</Text>
          <Ionicons name="copy" size={20} color="#2962ff" />
        </TouchableOpacity>
        <Text style={styles.hintText}>Tap to copy your code</Text>
      </View>

      {/* Share Buttons */}
      <View style={styles.shareButtons}>
        <TouchableOpacity style={styles.shareButton} onPress={shareInvite}>
          <Ionicons name="share-social" size={24} color="white" />
          <Text style={styles.shareButtonText}>Share Invitation</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.shareButton, styles.whatsappButton]} onPress={shareOnWhatsApp}>
          <Ionicons name="logo-whatsapp" size={24} color="white" />
          <Text style={styles.shareButtonText}>Share on WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Friends Joined</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>৳500</Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>৳200</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>🎯 How It Works:</Text>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Share Your Code</Text>
            <Text style={styles.stepDescription}>Share your referral code with friends via WhatsApp, Facebook, or any social media</Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Friend Signs Up</Text>
            <Text style={styles.stepDescription}>Your friend signs up using your referral code</Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>You Get ৳100</Text>
            <Text style={styles.stepDescription}>You instantly receive ৳100 when they complete registration</Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Additional ৳50</Text>
            <Text style={styles.stepDescription}>Get another ৳50 when they play their first tournament</Text>
          </View>
        </View>
      </View>

      {/* Terms */}
      <View style={styles.terms}>
        <Text style={styles.termsTitle}>📝 Terms & Conditions:</Text>
        <Text style={styles.term}>• Minimum withdrawal: ৳200</Text>
        <Text style={styles.term}>• Referral bonus valid for 30 days</Text>
        <Text style={styles.term}>• No fake accounts allowed</Text>
        <Text style={styles.term}>• Management decision will be final</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c23',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff8a00',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#2962ff',
    textAlign: 'center',
  },
  referralCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#2962ff20',
    position: 'relative',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'absolute',
    top: -15,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  rewardText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  referralLabel: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 15,
    marginTop: 10,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41, 98, 255, 0.1)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#2962ff',
    marginBottom: 10,
    gap: 10,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2962ff',
    letterSpacing: 2,
  },
  hintText: {
    color: '#666',
    fontSize: 12,
  },
  shareButtons: {
    gap: 12,
    marginBottom: 30,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2962ff',
    padding: 18,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#2962ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    shadowColor: '#25D366',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff8a00',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  instructions: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  instructionsTitle: {
    color: '#ff8a00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2962ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDescription: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  terms: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 30,
  },
  termsTitle: {
    color: '#ff8a00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  term: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
});
