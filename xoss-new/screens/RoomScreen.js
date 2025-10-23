import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import api from "../utils/api"; // ✅ fixed import

export default function RoomScreen({ route }) {
  const { matchId } = route.params;
  const [room, setRoom] = useState(null);

  useEffect(() => {
    fetchRoom();
  }, []);

  const fetchRoom = async () => {
    try {
      const res = await api.get(`/matches/${matchId}/room`);
      setRoom(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!room) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room Details</Text>
      <Text>Room ID: {room.roomId}</Text>
      <Text>Password: {room.password}</Text>
      <Button title="Refresh" onPress={fetchRoom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 8 }
});
