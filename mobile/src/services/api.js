import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Adjust baseURL based on platform for local development
const getBaseUrl = () => {
  return 'http://localhost:8080/api';
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
