import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
<<<<<<< HEAD
import config from '../config'; // Import config
import { apiFetch } from '../utils/api'; // Use apiFetch for consistency

const API_BASE_URL = config.BASE_URL; // Use API_BASE_URL from config
=======

const API = "https://zumu.onrender.com";
>>>>>>> dba15b004f4f9b449dd3446705c88b25d1981997

const AdminScreen = () => {
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedGame, setSelectedGame] = useState("freefire");
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(false);

  const [newMatch, setNewMatch] = useState({
    title: "",
    game: "freefire",
    entryFee: "",
    totalPrize: "",
    perKill: "",
    maxParticipants: "100",
    startTime: "",
    roomCode: "",
    roomPassword: "",
    type: "solo",
    version: "mobile",
    map: "bermuda"
  });

  const games = [
    { id: "freefire", name: "Free Fire", icon: "game-controller" },
    { id: "pubg", name: "PUBG Mobile", icon: "game-controller" },
    { id: "cod", name: "Call of Duty", icon: "game-controller" },
    { id: "ludo", name: "Ludo King", icon: "dice" },
    { id: "bgmi", name: "BGMI", icon: "game-controller" },
  ];

  useEffect(() => {
    fetchMatches();
    fetchUsers();
  }, []);

  const getToken = async () => {
    return await AsyncStorage.getItem("adminToken");
  };

  const fetchMatches = async () => {
    try {
<<<<<<< HEAD
      const data = await apiFetch(`/api/admin/matches`); // Use apiFetch
=======
      const token = await getToken();
      const res = await fetch(`${API}/api/admin/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Failed to fetch matches");
      
      const data = await res.json();
>>>>>>> dba15b004f4f9b449dd3446705c88b25d1981997
      setMatches(data);
    } catch (err) {
      console.error("Fetch matches error:", err);
      Alert.alert("Error", "Failed to fetch matches");
    }
  };

  const fetchUsers = async () => {
    try {
<<<<<<< HEAD
      const data = await apiFetch(`/api/admin/users`); // Use apiFetch
=======
      const token = await getToken();
      const res = await fetch(`${API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Failed to fetch users");
      
      const data = await res.json();
>>>>>>> dba15b004f4f9b449dd3446705c88b25d1981997
      setUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  const createMatch = async () => {
    try {
      setLoading(true);
<<<<<<< HEAD
      const data = await apiFetch(`/api/admin/matches`, { // Use apiFetch
        method: "POST",
        body: newMatch,
      });

=======
      const token = await getToken();
      const res = await fetch(`${API}/api/admin/matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMatch),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create match");

>>>>>>> dba15b004f4f9b449dd3446705c88b25d1981997
      Alert.alert("✅ Success", "Match created successfully");
      setModalVisible(false);
      setNewMatch({
        title: "",
        game: "freefire",
        entryFee: "",
        totalPrize: "",
        perKill: "",
        maxParticipants: "100",
        startTime: "",
        roomCode: "",
        roomPassword: "",
        type: "solo",
        version: "mobile",
        map: "bermuda"
      });
      fetchMatches();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteMatch = async (matchId) => {
    try {
<<<<<<< HEAD
      await apiFetch(`/api/admin/matches/${matchId}`, { // Use apiFetch
        method: "DELETE",
      });

=======
      const token = await getToken();
      const res = await fetch(`${API}/api/admin/matches/${matchId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete match");

>>>>>>> dba15b004f4f9b449dd3446705c88b25d1981997
      Alert.alert("✅ Success", "Match deleted successfully");
      setDeleteModalVisible(false);
      fetchMatches();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const updateMatchStatus = async (matchId, status) => {
    try {
<<<<<<< HEAD
      const data = await apiFetch(`/api/admin/matches/${matchId}`, { // Use apiFetch
        method: "PUT",
        body: { status },
      });

=======
      const token = await getToken();
      const res = await fetch(`${API}/api/admin/matches/${matchId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

>>>>>>> dba15b004f4f9b449dd3446705c88b25d1981997
      Alert.alert("✅ Success", `Match status updated to ${status}`);
      fetchMatches();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleUserStatus = async (userId, suspended) => {
    try {
<<<<<<< HEAD
      const data = await apiFetch(`/api/admin/users/${userId}/suspend`, { // Use apiFetch
        method: "POST",
        body: { suspended },
      });

=======
      const token = await getToken();
      const res = await fetch(`${API}/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ suspended }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");

>>>>>>> dba15b004f4f9b449dd3446705c88b25d1981997
      Alert.alert("✅ Success", `User ${suspended ? "suspended" : "activated"}`);
      fetchUsers();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const confirmDelete = (match) => {
    setSelectedMatch(match);
    setDeleteModalVisible(true);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>⚙️ Admin Panel</Text>

      {/* Game Selection */}
      <Text style={styles.subheading}>Select Game</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gameScroll}>
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[
              styles.gameBtn,
              selectedGame === game.id && styles.gameBtnActive,
            ]}
            onPress={() => setSelectedGame(game.id)}
          >
            <Ionicons
              name={game.icon}
              size={20}
              color={selectedGame === game.id ? "#ff8a00" : "#ccc"}
            />
            <Text
              style={[
                styles.gameBtnText,
                selectedGame === game.id && styles.gameBtnTextActive,
              ]}
            >
              {game.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create Match Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create {games.find(g => g.id === selectedGame)?.name} Match</Text>
      </TouchableOpacity>

      {/* Matches List */}
      <Text style={styles.subheading}>🎮 Matches ({selectedGame})</Text>
      {matches.filter(m => m.game === selectedGame).map((match) => (
        <View key={match._id} style={styles.matchCard}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchTitle}>{match.title}</Text>
            <Text style={styles.matchStatus}>{match.status}</Text>
          </View>
          
          <Text style={styles.matchInfo}>
            Entry: ₹{match.entryFee} | Prize: ₹{match.totalPrize} | Players: {match.currentParticipants}/{match.maxParticipants}
          </Text>
          
          <Text style={styles.matchTime}>
            {new Date(match.startTime).toLocaleString()}
          </Text>
          
          <View style={styles.matchActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.statusBtn]}
              onPress={() => updateMatchStatus(match._id, match.status === "live" ? "completed" : "live")}
            >
              <Text style={styles.actionBtnText}>
                {match.status === "live" ? "Complete" : "Make Live"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => confirmDelete(match)}
            >
              <Ionicons name="trash" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Users List */}
      <Text style={styles.subheading}>👥 Users</Text>
      {users.slice(0, 5).map((user) => (
        <View key={user._id} style={styles.userCard}>
          <View>
            <Text style={styles.userName}>{user.username}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userBalance}>Balance: ₹{user.walletBalance}</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.userActionBtn, user.suspended && styles.activateBtn]}
            onPress={() => handleUserStatus(user._id, !user.suspended)}
          >
            <Text style={styles.userActionText}>
              {user.suspended ? "Activate" : "Suspend"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Create Match Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Match</Text>
            
            <ScrollView>
              <Text style={styles.inputLabel}>Game</Text>
              <View style={styles.gameSelect}>
                {games.map((game) => (
                  <TouchableOpacity
                    key={game.id}
                    style={[
                      styles.gameOption,
                      newMatch.game === game.id && styles.gameOptionActive,
                    ]}
                    onPress={() => setNewMatch({...newMatch, game: game.id})}
                  >
                    <Text style={[
                      styles.gameOptionText,
                      newMatch.game === game.id && styles.gameOptionTextActive
                    ]}>
                      {game.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Match Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter match title"
                value={newMatch.title}
                onChangeText={(text) => setNewMatch({...newMatch, title: text})}
              />
              
              <Text style={styles.inputLabel}>Entry Fee</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter entry fee"
                keyboardType="numeric"
                value={newMatch.entryFee}
                onChangeText={(text) => setNewMatch({...newMatch, entryFee: text})}
              />
              
              <Text style={styles.inputLabel}>Total Prize</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter total prize"
                keyboardType="numeric"
                value={newMatch.totalPrize}
                onChangeText={(text) => setNewMatch({...newMatch, totalPrize: text})}
              />
              
              <Text style={styles.inputLabel}>Per Kill Prize</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter per kill prize"
                keyboardType="numeric"
                value={newMatch.perKill}
                onChangeText={(text) => setNewMatch({...newMatch, perKill: text})}
              />
              
              <Text style={styles.inputLabel}>Max Participants</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter max participants"
                keyboardType="numeric"
                value={newMatch.maxParticipants}
                onChangeText={(text) => setNewMatch({...newMatch, maxParticipants: text})}
              />
              
              <Text style={styles.inputLabel}>Start Time</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD HH:MM"
                value={newMatch.startTime}
                onChangeText={(text) => setNewMatch({...newMatch, startTime: text})}
              />
              
              <Text style={styles.inputLabel}>Room Code (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter room code"
                value={newMatch.roomCode}
                onChangeText={(text) => setNewMatch({...newMatch, roomCode: text})}
              />
              
              <Text style={styles.inputLabel}>Room Password (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter room password"
                value={newMatch.roomPassword}
                onChangeText={(text) => setNewMatch({...newMatch, roomPassword: text})}
              />
              
              <Text style={styles.inputLabel}>Match Type</Text>
              <View style={styles.typeSelect}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newMatch.type === "solo" && styles.typeOptionActive,
                  ]}
                  onPress={() => setNewMatch({...newMatch, type: "solo"})}
                >
                  <Text style={[
                    styles.typeOptionText,
                    newMatch.type === "solo" && styles.typeOptionTextActive
                  ]}>
                    Solo
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newMatch.type === "duo" && styles.typeOptionActive,
                  ]}
                  onPress={() => setNewMatch({...newMatch, type: "duo"})}
                >
                  <Text style={[
                    styles.typeOptionText,
                    newMatch.type === "duo" && styles.typeOptionTextActive
                  ]}>
                    Duo
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newMatch.type === "squad" && styles.typeOptionActive,
                  ]}
                  onPress={() => setNewMatch({...newMatch, type: "squad"})}
                >
                  <Text style={[
                    styles.typeOptionText,
                    newMatch.type === "squad" && styles.typeOptionTextActive
                  ]}>
                    Squad
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalBtn, styles.createModalBtn]}
                onPress={createMatch}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createBtnText}>Create Match</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalContainer}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Match</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{selectedMatch?.title}"?
            </Text>
            
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalBtn, styles.deleteModalBtn]}
                onPress={() => deleteMatch(selectedMatch?._id)}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0c23", padding: 15 },
  heading: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  subheading: { fontSize: 18, fontWeight: "bold", color: "#ff8a00", marginVertical: 10 },
  
  // Game selection
  gameScroll: { marginBottom: 15 },
  gameBtn: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', 
    padding: 10, 
    borderRadius: 8, 
    marginRight: 10 
  },
  gameBtnActive: { backgroundColor: '#ff8a00' },
  gameBtnText: { color: '#ccc', marginLeft: 5 },
  gameBtnTextActive: { color: '#fff' },
  
  // Create button
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff8a00',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    justifyContent: 'center'
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10
  },
  
  // Match card
  matchCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  matchTitle: {
    color: '#ff8a00',
    fontWeight: 'bold',
    fontSize: 16
  },
  matchStatus: {
    color: '#ccc',
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12
  },
  matchInfo: {
    color: '#ddd',
    marginBottom: 5
  },
  matchTime: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 10
  },
  matchActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center'
  },
  statusBtn: {
    backgroundColor: '#28a745'
  },
  deleteBtn: {
    backgroundColor: '#dc3545'
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5
  },
  
  // User card
  userCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  userName: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5
  },
  userEmail: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 5
  },
  userBalance: {
    color: '#ff8a00',
    fontSize: 12
  },
  userActionBtn: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 6
  },
  activateBtn: {
    backgroundColor: '#28a745'
  },
  userActionText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  modalContent: {
    backgroundColor: '#1c1e3c',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%'
  },
  modalTitle: {
    color: '#ff8a00',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  inputLabel: {
    color: '#ccc',
    marginBottom: 5
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    marginBottom: 15
  },
  gameSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15
  },
  gameOption: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 6,
    marginRight: 10,
    marginBottom: 10
  },
  gameOptionActive: {
    backgroundColor: '#ff8a00'
  },
  gameOptionText: {
    color: '#ccc'
  },
  gameOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold'
  },
  typeSelect: {
    flexDirection: 'row',
    marginBottom: 20
  },
  typeOption: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 6,
    marginRight: 10,
    flex: 1
  },
  typeOptionActive: {
    backgroundColor: '#ff8a00'
  },
  typeOptionText: {
    color: '#ccc',
    textAlign: 'center'
  },
  typeOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalBtn: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  cancelBtn: {
    backgroundColor: '#6c757d'
  },
  cancelBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  createModalBtn: {
    backgroundColor: '#ff8a00'
  },
  createBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  
  // Delete modal
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  deleteModalContent: {
    backgroundColor: '#1c1e3c',
    borderRadius: 10,
    padding: 20,
    width: '80%'
  },
  deleteModalTitle: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  deleteModalText: {
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20
  },
  deleteModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  deleteModalBtn: {
    backgroundColor: '#dc3545'
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});

export default AdminScreen;