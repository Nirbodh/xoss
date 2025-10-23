// screens/ProfileControlScreen.js - Admin Edition (View + Edit in One File)
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";

export default function ProfileControlScreen({ navigation }) {
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    name: "Robert Fox",
    username: "proplayer123",
    email: "robert.fox@example.com",
    balance: 1250,
    role: "User",
    status: "Active",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  });
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const toggleMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(fadeAnim, {
      toValue: editMode ? 1 : 0.9,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setEditMode(!editMode));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProfile({ ...profile, avatar: result.assets[0].uri });
      Alert.alert("✅ সফল", "প্রোফাইল ছবি পরিবর্তন হয়েছে!");
    }
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("✅ সেভ সম্পন্ন", "ইউজারের তথ্য সফলভাবে আপডেট হয়েছে।");
    setEditMode(false);
  };

  const handleAction = (action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switch (action) {
      case "verify":
        Alert.alert("✔️ Verified", "অ্যাকাউন্ট ভেরিফাই সম্পন্ন হয়েছে!");
        break;
      case "ban":
        Alert.alert("🚫 Banned", "ইউজার ব্যান করা হয়েছে!");
        break;
      case "suspend":
        Alert.alert("⏸ Suspended", "ইউজার সাসপেন্ড করা হয়েছে!");
        break;
      case "reset":
        Alert.alert("🔁 Password Reset", "নতুন পাসওয়ার্ড পাঠানো হয়েছে!");
        break;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#1a237e", "#0a0c23"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editMode ? "Edit User Profile" : "User Profile Control"}
          </Text>
          <TouchableOpacity onPress={toggleMode}>
            <Ionicons
              name={editMode ? "eye" : "create"}
              size={22}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.View
        style={[styles.content, { opacity: fadeAnim }]}
      >
        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={!editMode ? null : pickImage}
        >
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          {editMode && (
            <View style={styles.editAvatar}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          )}
        </TouchableOpacity>

        {/* Info Section */}
        {editMode ? (
          <View style={styles.editForm}>
            <Input label="Full Name" value={profile.name} onChangeText={(v) => setProfile({ ...profile, name: v })} />
            <Input label="Username" value={profile.username} onChangeText={(v) => setProfile({ ...profile, username: v })} />
            <Input label="Email" value={profile.email} onChangeText={(v) => setProfile({ ...profile, email: v })} />
            <Input label="Role" value={profile.role} onChangeText={(v) => setProfile({ ...profile, role: v })} />
            <Input label="Status" value={profile.status} onChangeText={(v) => setProfile({ ...profile, status: v })} />
            <Input label="Balance (৳)" value={String(profile.balance)} onChangeText={(v) => setProfile({ ...profile, balance: v })} keyboardType="numeric" />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="save" color="white" size={18} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.viewSection}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="wallet" size={18} color="#00D4FF" />
              <Text style={styles.infoText}>Balance: ৳{profile.balance}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="person-circle" size={18} color="#FFD700" />
              <Text style={styles.infoText}>Role: {profile.role}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={18} color="#00FF88" />
              <Text style={styles.infoText}>Status: {profile.status}</Text>
            </View>

            <View style={styles.quickActions}>
              <ActionButton icon="checkmark-done" color="#00FF88" label="Verify" onPress={() => handleAction("verify")} />
              <ActionButton icon="pause" color="#FFB300" label="Suspend" onPress={() => handleAction("suspend")} />
              <ActionButton icon="ban" color="#FF3D00" label="Ban" onPress={() => handleAction("ban")} />
              <ActionButton icon="refresh" color="#00D4FF" label="Reset PW" onPress={() => handleAction("reset")} />
            </View>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

function Input({ label, value, onChangeText, keyboardType }) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#888"
        keyboardType={keyboardType || "default"}
      />
    </View>
  );
}

function ActionButton({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: `${color}30`, borderColor: color }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0c23" },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  content: { padding: 20 },
  avatarContainer: { alignItems: "center", marginTop: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  editAvatar: {
    position: "absolute",
    bottom: 0,
    right: "40%",
    backgroundColor: "#2962ff",
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#0a0c23",
  },
  name: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  email: {
    color: "#ccc",
    textAlign: "center",
    marginBottom: 20,
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoText: { color: "#ccc", marginLeft: 8 },
  quickActions: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionLabel: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "bold",
  },
  editForm: { marginTop: 20 },
  inputContainer: { marginBottom: 15 },
  inputLabel: { color: "#aaa", fontSize: 13, marginBottom: 5 },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "white",
  },
  saveBtn: {
    flexDirection: "row",
    backgroundColor: "#2962ff",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 6,
  },
  saveBtnText: { color: "white", fontWeight: "bold", fontSize: 14 },
  viewSection: { marginTop: 10 },
});
