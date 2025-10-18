import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChange } from '../src/services/auth';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 Index: Starting app with authentication');
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChange((user) => {
      console.log('🔐 Auth state changed:', user ? 'User signed in' : 'No user');
      
      if (user) {
        console.log('✅ User authenticated, going to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('🔑 No user, going to auth');
        router.replace('/(auth)/sign-in');
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Show loading screen
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF9800" />
      <Text style={styles.loadingText}>Loading Plateful...</Text>
      <Text style={styles.debugText}>Checking authentication...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#212121',
    marginTop: 16,
  },
  debugText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
