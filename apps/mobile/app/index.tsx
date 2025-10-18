import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
// import { onAuthStateChange } from '../src/services/auth';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 Index: Starting app (auth temporarily disabled)');
    
    // Temporarily skip auth for testing
    const timer = setTimeout(() => {
      console.log('✅ Skipping auth, going to tabs');
      router.replace('/(tabs)');
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading screen
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF9800" />
      <Text style={styles.loadingText}>Loading Plateful...</Text>
      <Text style={styles.debugText}>Debug: Auth temporarily disabled</Text>
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
