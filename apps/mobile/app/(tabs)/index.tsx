import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { auth } from '../../src/config/firebase';
import { getGroceryLists } from '../../src/services/firestore';
import { GroceryList } from '@plateful/shared';

export default function Home() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const groceryLists = await getGroceryLists(user.uid);
        setLists(groceryLists);
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Welcome, {auth.currentUser?.displayName || auth.currentUser?.email}!
        </Text>
        <Text style={styles.subtitle}>Your grocery management hub</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{lists.length}</Text>
            <Text style={styles.statLabel}>Lists</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {lists.reduce((acc, list) => acc + list.items.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Lists</Text>
        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : lists.length === 0 ? (
          <Text style={styles.emptyText}>
            No grocery lists yet. Create one in the Groceries tab!
          </Text>
        ) : (
          lists.slice(0, 3).map((list) => (
            <View key={list.id} style={styles.listCard}>
              <Text style={styles.listName}>{list.name}</Text>
              <Text style={styles.listCount}>{list.items.length} items</Text>
            </View>
          ))
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
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 24,
    marginTop: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  listCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  listCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
