import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { auth } from '../../src/config/firebase';
import { getGroceryLists } from '../../src/services/firestore';
import { GroceryList } from '@plateful/shared';
import {
  palette,
  textVariants,
  radius,
  shadowPresets,
  layoutSpacing,
} from '../../src/theme';

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
    backgroundColor: palette.background,
  },
  content: {
    paddingBottom: layoutSpacing.screen,
  },
  header: {
    padding: layoutSpacing.screen,
    backgroundColor: palette.surface,
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
    ...shadowPresets.card,
  },
  greeting: {
    ...textVariants.headline,
    color: palette.textPrimary,
    marginBottom: layoutSpacing.small,
  },
  subtitle: {
    ...textVariants.body,
    color: palette.textSecondary,
  },
  section: {
    marginHorizontal: layoutSpacing.screen,
    marginTop: layoutSpacing.section,
    padding: layoutSpacing.cardPadding,
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    ...shadowPresets.card,
  },
  sectionTitle: {
    ...textVariants.sectionTitle,
    color: palette.textPrimary,
    marginBottom: layoutSpacing.cardGap,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: layoutSpacing.cardGap,
  },
  statCard: {
    flex: 1,
    padding: layoutSpacing.cardPadding,
    backgroundColor: palette.primary,
    borderRadius: radius.card,
    alignItems: 'center',
    ...shadowPresets.card,
  },
  statNumber: {
    ...textVariants.sectionTitle,
    color: palette.textOnPrimary,
    marginBottom: layoutSpacing.small,
  },
  statLabel: {
    ...textVariants.caption,
    color: palette.textOnPrimary,
  },
  listCard: {
    padding: layoutSpacing.cardPadding,
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    marginBottom: layoutSpacing.cardGap,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  listName: {
    ...textVariants.body,
    color: palette.textPrimary,
    fontWeight: '600',
    marginBottom: layoutSpacing.small / 2,
  },
  listCount: {
    ...textVariants.caption,
    color: palette.textSecondary,
  },
  emptyText: {
    ...textVariants.caption,
    color: palette.textSecondary,
    textAlign: 'center',
    paddingVertical: layoutSpacing.section,
  },
});
