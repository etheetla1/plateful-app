import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button, Input } from '@plateful/ui';
import { auth } from '../../src/config/firebase';
import {
  getGroceryLists,
  createGroceryList,
  deleteGroceryList,
} from '../../src/services/firestore';
import { GroceryList } from '@plateful/shared';

export default function Groceries() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [showAddList, setShowAddList] = useState(false);

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
      Alert.alert('Error', 'Failed to load grocery lists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        await createGroceryList(newListName.trim(), user.uid);
        setNewListName('');
        setShowAddList(false);
        await loadLists();
        Alert.alert('Success', 'List created successfully');
      }
    } catch (error) {
      console.error('Error creating list:', error);
      Alert.alert('Error', 'Failed to create list');
    }
  };

  const handleDeleteList = async (listId: string, listName: string) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${listName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroceryList(listId);
              await loadLists();
              Alert.alert('Success', 'List deleted successfully');
            } catch (error) {
              console.error('Error deleting list:', error);
              Alert.alert('Error', 'Failed to delete list');
            }
          },
        },
      ]
    );
  };

  const renderListItem = ({ item }: { item: GroceryList }) => (
    <View style={styles.listItem}>
      <View style={styles.listContent}>
        <Text style={styles.listName}>{item.name}</Text>
        <Text style={styles.listInfo}>
          {item.items.length} items • Created {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteList(item.id, item.name)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title={showAddList ? 'Cancel' : 'New List'}
          onPress={() => setShowAddList(!showAddList)}
          variant={showAddList ? 'outline' : 'primary'}
        />
      </View>

      {showAddList && (
        <View style={styles.addListContainer}>
          <Input
            value={newListName}
            onChangeText={setNewListName}
            placeholder="Enter list name"
            label="List Name"
          />
          <Button
            title="Create List"
            onPress={handleCreateList}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : lists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No grocery lists yet</Text>
          <Text style={styles.emptySubtext}>Create your first list to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  addListContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  listContainer: {
    padding: 16,
  },
  listItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listContent: {
    flex: 1,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  listInfo: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
