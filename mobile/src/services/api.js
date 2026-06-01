import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Adjust baseURL based on platform for local development
const getBaseUrl = () => {
  // If running on a physical device, you need to use your machine's local IP address (e.g., 'http://192.168.1.5:8080/api')
  if (__DEV__) {
    // If running on the web, always use localhost
    if (Platform.OS === 'web') {
      return 'http://localhost:8080/api';
    }

    // Dynamically resolve the IP of the machine running Expo Go
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
    if (hostUri) {
      const ipAddress = hostUri.split(':')[0];
      return `http://${ipAddress}:8080/api`;
    }
    
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8080/api';
    }
    return 'http://localhost:8080/api';
  }
  return 'https://your-production-url.com/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignore error for now
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
