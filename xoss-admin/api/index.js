import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

// ✅ FIXED: Changed 'xoss_token' to 'token' to match AuthContext
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.log('getToken error:', error);
    return null;
  }
};

// Fetch all tournaments
export const fetchTournaments = async () => {
  try {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}/tournaments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }
    
    const data = await res.json();
    return { data, success: true };
  } catch (error) {
    console.error('Fetch tournaments error:', error);
    return { 
      success: false, 
      data: { tournaments: [] }, 
      message: error.message 
    };
  }
};

// Create new tournament - FIXED VERSION
export const createTournament = async (tournamentData) => {
  try {
    const token = await getToken();
    
    // SIMPLIFIED: Use only required fields
    const payload = {
      title: tournamentData.title,
      game: tournamentData.game,
      entry_fee: Number(tournamentData.entry_fee) || 0,
      total_prize: Number(tournamentData.total_prize) || 0,
      max_participants: Number(tournamentData.max_participants) || 50,
      start_time: tournamentData.start_time,
      end_time: tournamentData.end_time,
      scheduleTime: tournamentData.scheduleTime,
      roomId: tournamentData.roomId || '',
      password: tournamentData.password || '',
      description: tournamentData.description || '',
      rules: tournamentData.rules || '',
      map: tournamentData.map || 'Bermuda',
      type: tournamentData.type || 'Solo',
      status: tournamentData.status || 'upcoming',
      matchType: tournamentData.matchType || 'match',
      created_by: tournamentData.created_by || 'admin',
      current_participants: 0
    };

    console.log('Sending tournament data to backend:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${BASE_URL}/tournaments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Backend Response:', data);

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    if (!data.success) {
      throw new Error(data.message || 'Tournament creation failed');
    }

    return { 
      data, 
      success: true,
      tournament: data.tournament 
    };
  } catch (error) {
    console.error('Create tournament error:', error);
    return { 
      success: false, 
      message: error.message,
      error: error.message
    };
  }
};

// Update tournament
export const updateTournament = async (id, data) => {
  try {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}/tournaments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    
    const responseData = await res.json();
    
    if (!res.ok) {
      throw new Error(responseData.message || `API Error: ${res.status}`);
    }
    
    return { data: responseData, success: true };
  } catch (error) {
    console.error('Update tournament error:', error);
    return { success: false, message: error.message };
  }
};

// Delete tournament
export const deleteTournament = async (id) => {
  try {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}/tournaments/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || `API Error: ${res.status}`);
    }
    
    return { data, success: true };
  } catch (error) {
    console.error('Delete tournament error:', error);
    return { success: false, message: error.message };
  }
};

// Export tournamentsAPI object with proper functions
export const tournamentsAPI = {
  getAll: fetchTournaments,
  create: createTournament,
  update: updateTournament,
  delete: deleteTournament
};

// Default export
export default {
  getToken,
  fetchTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  tournamentsAPI
};
