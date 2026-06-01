// @ts-nocheck
// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MessageSquare } from 'lucide-react-native';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });
      await login(response.data.token, {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role
      });
      
      if (response.data.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/chat');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  const acc = [
    { id: 1, name: 'Rekshin', password: 'rekshin' },
    { id: 2, name: 'Hari', password: 'hari' },
    { id: 3, name: 'Barani', password: 'barani' },
    { id: 4, name: 'Roriri', password: 'roriri' },
  ];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MessageSquare color="white" size={40} />
          </View>
          <Text style={styles.title}>Sign in to RoririConnect</Text>
        </View>

        <View style={styles.card}>
          {!!error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{typeof error === 'object' ? JSON.stringify(error) : error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign in</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickLoginContainer}>
          {acc.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.quickLoginButton}
              onPress={() => {
                setUsername(item.name);
                setPassword(item.password);
              }}
            >
              <Text style={styles.quickLoginText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.footerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // slate-900
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    backgroundColor: '#6366f1', // indigo-500
    padding: 16,
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e293b', // slate-800
    padding: 24,
    borderRadius: 20,
    borderColor: '#334155', // slate-700
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  errorContainer: {
    backgroundColor: 'rgba(127, 29, 29, 0.3)', // red-900/30
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#f87171', // red-400
    textAlign: 'center',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1', // slate-300
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a', // slate-900
    borderColor: '#475569', // slate-600
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#4f46e5', // indigo-600
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickLoginContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 30,
    gap: 10,
  },
  quickLoginButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  quickLoginText: {
    color: '#000000',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#94a3b8', // slate-400
    fontSize: 14,
  },
  footerLink: {
    color: '#818cf8', // indigo-400
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Login;
