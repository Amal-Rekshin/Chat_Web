// @ts-nocheck
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { WebSocketProvider } from '../context/WebSocketContext';
import { StatusBar } from 'expo-status-bar';
import { Platform, LogBox } from 'react-native';

if (Platform.OS === 'web') {
  LogBox.ignoreLogs([
    /Unknown event handler property/,
    'Unknown event handler property',
    /TouchableMixin is deprecated/,
    /shadow\* style props are deprecated/,
    /props.pointerEvents is deprecated/
  ]);
  
  // Keep the console.error override for browser console just in case LogBox doesn't catch all
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Unknown event handler property')) {
      return;
    }
    originalConsoleError(...args);
  };
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f172a' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="register" />
          <Stack.Screen name="admin/index" />
          <Stack.Screen name="admin/users" />
          <Stack.Screen name="admin/groups" />
          <Stack.Screen name="admin/announcements" />
          <Stack.Screen name="chat/index" />
          <Stack.Screen name="chat/[id]" />
        </Stack>
      </WebSocketProvider>
    </AuthProvider>
  );
}