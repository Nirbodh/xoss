// screens/AdminLoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
<<<<<<< HEAD
import config from '../config'; // Import config
import { apiFetch } from '../utils/api'; // Use apiFetch for consistency

const API_BASE_URL = config.BASE_URL; // Use API_BASE_URL from config
=======

const API = "https://zumu.onrender.com";
>>>>>>> dba15b004f4f9b449dd3446705c88b25d1981997

const AdminLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
<<<<<<< HEAD
      const data = await apiFetch(`/api/admin/login`, { // Use apiFetch
        method: "POST",
        body: { email, password },
      });

=======
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

>>>>>>> dba15b004f4f9b449dd3446705c88b25d1981997
      // Save token in AsyncStorage
      await AsyncStorage.setItem("adminToken", data.token);
      Alert.alert("✅ Success", "Admin logged in");

      // Navigate to AdminScreen
      navigation.replace("AdminScreen");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>👨‍💼 Admin Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#0a0c23" },
  heading: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#555",
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    color: "#fff",
  },
  button: {
    backgroundColor: "#ff8a00",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});

<<<<<<< HEAD
export default AdminLoginScreen;
=======
export default AdminLoginScreen;
>>>>>>> dba15b004f4f9b449dd3446705c88b25d1981997
