import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Button, Input } from '@plateful/ui';

// Mock data for UI testing
const MOCK_LISTS = [
  {
    id: '1',
    name: 'Weekly Groceries',
    items: [
      { id: '1', name: 'Milk', quantity: 2, checked: false },
      { id: '2', name: 'Bread', quantity: 1, checked: true },
      { id: '3', name: 'Eggs', quantity: 12, checked: false },
    ],
    createdAt: new Date('2025-10-10').toISOString(),
    ownerId: 'mock-user',
  },
  {
    id: '2',
    name: 'Party Supplies',
    items: [
      { id: '4', name: 'Chips', quantity: 3, checked: false },
      { id: '5', name: 'Soda', quantity: 6, checked: false },
    ],
    createdAt: new Date('2025-10-12').toISOString(),
    ownerId: 'mock-user',
  },
  {
    id: '3',
    name: 'Meal Prep - Chicken & Rice',
    items: [
      { id: '6', name: 'Chicken Breast', quantity: 2, checked: false },
      { id: '7', name: 'Brown Rice', quantity: 1, checked: false },
      { id: '8', name: 'Broccoli', quantity: 3, checked: true },
    ],
    createdAt: new Date('2025-10-13').toISOString(),
    ownerId: 'mock-user',
  },
];

export default function Groceries() {
  const [lists, setLists] = useState(MOCK_LISTS);
  const [newListName, setNewListName] = useState('');
  const [showAddList, setShowAddList] = useState(false);

  const handleCreateList = () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    const newList = {
      id: Date.now().toString(),
      name: newListName.trim(),
      items: [],
      createdAt: new Date().toISOString(),
      ownerId: 'mock-user',
    };

    setLists([newList, ...lists]);
    setNewListName('');
    setShowAddList(false);
    Alert.alert('Success', `Created "${newList.name}"!`);
  };

  const handleDeleteList = (listId: string, listName: string) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${listName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setLists(lists.filter(list => list.id !== listId));
            Alert.alert('Deleted', `"${listName}" has been removed`);
          },
        },
      ]
    );
  };

  const renderListItem = ({ item }: { item: typeof MOCK_LISTS[0] }) => {
    const completedItems = item.items.filter(i => i.checked).length;
    const totalItems = item.items.length;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
      <TouchableOpacity 
        style={styles.listItem}
        activeOpacity={0.7}
      >
        <View style={styles.listContent}>
          <Text style={styles.listName}>{item.name}</Text>
          <Text style={styles.listInfo}>
            {completedItems}/{totalItems} completed • {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          {totalItems > 0 && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteList(item.id, item.name)}
        >
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Grocery Lists</Text>
        <Button
          title={showAddList ? 'Cancel' : '+ New List'}
          onPress={() => setShowAddList(!showAddList)}
          variant={showAddList ? 'secondary' : 'primary'}
        />
      </View>

      {showAddList && (
        <View style={styles.addListContainer}>
          <Input
            value={newListName}
            onChangeText={setNewListName}
            placeholder="e.g., Weekly Groceries"
            label="List Name"
          />
          <Button
            title="Create List"
            onPress={handleCreateList}
            variant="primary"
          />
        </View>
      )}

      {lists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyText}>No grocery lists yet</Text>
          <Text style={styles.emptySubtext}>Tap "New List" to create your first grocery list!</Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
  },
  addListContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  listContainer: {
    padding: 20,
    gap: 16,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  listContent: {
    flex: 1,
    marginRight: 12,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 6,
  },
  listInfo: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
  },
});
