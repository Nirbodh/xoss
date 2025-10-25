// xoss-new/utils/api.js (FINAL)
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Backend base URL (Render)
export const BASE_URL = 'https://xoss.onrender.com';

// Get token (if needed)
export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('xoss_token');
    return token;
  } catch (error) {
    console.log('getToken error:', error);
    return null;
  }
};

// ✅ Fetch all tournaments
export const fetchTournaments = async () => {
  try {
    const token = await getToken();
    const response = await fetch(`${BASE_URL}/api/tournaments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch tournaments error:', error);
    return {
      success: false,
      message: error.message,
      tournaments: [],
    };
  }
};

// ✅ Create new tournament
export const createTournament = async (tournamentData) => {
  try {
    const token = await getToken();
    const response = await fetch(`${BASE_URL}/api/tournaments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(tournamentData),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create tournament error:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// ✅ Update tournament
export const updateTournament = async (tournamentId, updates) => {
  try {
    const token = await getToken();
    const response = await fetch(`${BASE_URL}/api/tournaments/${tournamentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update tournament error:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};
