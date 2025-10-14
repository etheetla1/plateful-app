import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { db } from '../../src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Button } from '@plateful/ui';

interface TestResult {
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function FirebaseTest() {
  const [tests, setTests] = useState<{
    config: TestResult;
    firestore: TestResult;
  }>({
    config: { status: 'pending', message: 'Checking configuration...' },
    firestore: { status: 'pending', message: 'Testing Firestore connection...' },
  });

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    // Test 1: Check Firebase Configuration
    const configTest = checkConfig();
    setTests(prev => ({ ...prev, config: configTest }));

    // Test 2: Test Firestore Connection
    if (configTest.status === 'success') {
      const firestoreTest = await testFirestore();
      setTests(prev => ({ ...prev, firestore: firestoreTest }));
    }
  };

  const checkConfig = (): TestResult => {
    const requiredVars = [
      'EXPO_PUBLIC_FIREBASE_API_KEY',
      'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
      'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'EXPO_PUBLIC_FIREBASE_APP_ID',
    ];

    const missing: string[] = [];
    const values: Record<string, string> = {};

    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (!value || value === 'your_api_key_here' || value.includes('your_')) {
        missing.push(varName);
      } else {
        values[varName] = value;
      }
    });

    if (missing.length > 0) {
      return {
        status: 'error',
        message: `Missing or invalid environment variables: ${missing.join(', ')}`,
        details: { missing, values },
      };
    }

    return {
      status: 'success',
      message: '✅ All Firebase config variables are set',
      details: {
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      },
    };
  };

  const testFirestore = async (): Promise<TestResult> => {
    try {
      // Test: Query a collection (even if it doesn't exist)
      const testCollection = collection(db, 'recipes');
      const snapshot = await getDocs(testCollection);
      
      return {
        status: 'success',
        message: `✅ Firestore connected successfully`,
        details: {
          collectionName: 'recipes',
          documentCount: snapshot.size,
          isEmpty: snapshot.empty,
        },
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `❌ Firestore connection failed: ${error.message}`,
        details: error,
      };
    }
  };

  const getStatusEmoji = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return '#999';
      case 'success':
        return '#34C759';
      case 'error':
        return '#FF3B30';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔥 Firebase Connection Test</Text>
        <Text style={styles.subtitle}>Verifying Firebase configuration and connectivity</Text>
        <Button
          title="Re-run Tests"
          onPress={runTests}
          variant="outline"
        />
      </View>

      {/* Test 1: Configuration */}
      <View style={styles.testCard}>
        <View style={styles.testHeader}>
          <Text style={styles.testTitle}>
            {getStatusEmoji(tests.config.status)} Configuration Check
          </Text>
        </View>
        <Text style={[styles.testMessage, { color: getStatusColor(tests.config.status) }]}>
          {tests.config.message}
        </Text>
        {tests.config.details && (
          <View style={styles.details}>
            <Text style={styles.detailsText}>
              {JSON.stringify(tests.config.details, null, 2)}
            </Text>
          </View>
        )}
      </View>

      {/* Test 2: Firestore */}
      <View style={styles.testCard}>
        <View style={styles.testHeader}>
          <Text style={styles.testTitle}>
            {getStatusEmoji(tests.firestore.status)} Firestore Connection
          </Text>
          {tests.firestore.status === 'pending' && (
            <ActivityIndicator size="small" color="#007AFF" />
          )}
        </View>
        <Text style={[styles.testMessage, { color: getStatusColor(tests.firestore.status) }]}>
          {tests.firestore.message}
        </Text>
        {tests.firestore.details && (
          <View style={styles.details}>
            <Text style={styles.detailsText}>
              {JSON.stringify(tests.firestore.details, null, 2)}
            </Text>
          </View>
        )}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Summary</Text>
        {tests.config.status === 'success' && tests.firestore.status === 'success' ? (
          <Text style={[styles.summaryText, { color: '#34C759' }]}>
            ✅ Firebase is properly configured and connected!
          </Text>
        ) : (
          <Text style={[styles.summaryText, { color: '#FF3B30' }]}>
            ⚠️ Issues detected. Please review the test results above.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  testCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  testMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  details: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  detailsText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#666',
  },
  summary: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
