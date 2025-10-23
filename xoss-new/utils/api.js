import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = "http://192.168.0.100:5000"; // Your backend URL

// Save token to storage
export async function saveToken(token) {
  try {
    await AsyncStorage.setItem('jwtToken', token);
  } catch (error) {
    console.error('Failed to save token', error);
  }
}

// Get token from storage
export async function getToken() {
  try {
    return await AsyncStorage.getItem('jwtToken');
  } catch (error) {
    console.error('Failed to get token', error);
    return null;
  }
}

// Remove token from storage (logout)
export async function removeToken() {
  try {
    await AsyncStorage.removeItem('jwtToken');
  } catch (error) {
    console.error('Failed to remove token', error);
  }
}

// Internal helper: generic request with auth header
async function request(path, options = {}) {
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || 'API request failed';
    throw new Error(message);
  }

  return response.json();
}

// This is your new named export for generic API calls
export async function api(path, options = {}) {
  return request(path, options);
}

// Specific API function: login user
export async function loginUser(email, password) {
  const data = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (data.token) {
    await saveToken(data.token);
  }

  return data;
}

// Specific API function: logout user
export async function logoutUser() {
  await removeToken();
}

// Specific API function: fetch users (requires auth)
export async function fetchUsers() {
  return request('/api/users', {
    method: 'GET',
  });
}

// Default export (optional, but useful)
export default {
  api,
  loginUser,
  logoutUser,
  fetchUsers,
  saveToken,
  getToken,
  removeToken,
};