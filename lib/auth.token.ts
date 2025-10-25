// lib/auth.token.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Variables en memoria
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

// ==================== ACCESS TOKEN ====================
export async function setAccessToken(token: string | null): Promise<void> {
  _accessToken = token;
  if (token) {
    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving access token:', error);
    }
  } else {
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error deleting access token:', error);
    }
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (_accessToken) return _accessToken;
  
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) _accessToken = token;
    return token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

// ==================== REFRESH TOKEN ====================
export async function setRefreshToken(token: string | null): Promise<void> {
  _refreshToken = token;
  if (token) {
    try {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving refresh token:', error);
    }
  } else {
    try {
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error deleting refresh token:', error);
    }
  }
}

export async function getRefreshToken(): Promise<string | null> {
  if (_refreshToken) return _refreshToken;
  
  try {
    const token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (token) _refreshToken = token;
    return token;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
}

// ==================== HELPER METHODS ====================
export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await setAccessToken(accessToken);
  await setRefreshToken(refreshToken);
}

export async function clearTokens(): Promise<void> {
  await setAccessToken(null);
  await setRefreshToken(null);
  _accessToken = null;
  _refreshToken = null;
}

export async function hasTokens(): Promise<boolean> {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  return !!accessToken && !!refreshToken;
}