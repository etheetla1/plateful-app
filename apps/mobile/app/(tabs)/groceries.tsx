import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, semanticColors } from '@plateful/shared';
import type { GroceryList, GroceryItem, PantryItem } from '@plateful/shared';
import { findPantryMatch } from '@plateful/shared';
import Header from '../../src/components/Header';
import { auth } from '../../src/config/firebase';

// API endpoint - platform aware
const API_BASE = Platform.select({
  web: 'http://localhost:3001',
  android: 'http://10.0.2.2:3001',
  ios: 'http://localhost:3001',
  default: 'http://localhost:3001',
});

type ViewMode = 'lists' | 'items';

export default function Groceries() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('lists');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedListIDs, setSelectedListIDs] = useState<Set<string>>(new Set());
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeListName, setMergeListName] = useState('');
  const [loadingMerge, setLoadingMerge] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      loadLists();
      loadPantryItems();
    }
  }, []);

  // Reload lists when screen comes into focus (e.g., after adding items from recipe)
  useFocusEffect(
    useCallback(() => {
      if (auth.currentUser && viewMode === 'lists') {
        loadLists();
      }
    }, [viewMode])
  );

  const loadLists = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/grocery/${auth.currentUser.uid}/lists`);
      
      if (!response.ok) {
        throw new Error('Failed to load grocery lists');
      }

      const data = await response.json();
      setLists(data.lists || []);
    } catch (error) {
      console.error('Failed to load grocery lists:', error);
      Alert.alert('Error', 'Failed to load grocery lists');
    } finally {
      setLoading(false);
    }
  };

  const loadPantryItems = async () => {
    if (!auth.currentUser) return;

    try {
      const response = await fetch(`${API_BASE}/api/pantry/${auth.currentUser.uid}`);
      
      if (!response.ok) {
        throw new Error('Failed to load pantry items');
      }

      const data = await response.json();
      setPantryItems(data.items || []);
    } catch (error) {
      console.error('Failed to load pantry items:', error);
    }
  };

  const loadListItems = async (listID: string) => {
    if (!auth.currentUser) return;

    try {
      const response = await fetch(`${API_BASE}/api/grocery/${auth.currentUser.uid}/lists/${listID}`);
      
      if (!response.ok) {
        throw new Error('Failed to load list items');
      }

      const data = await response.json();
      const fullList: GroceryList = data.list;
      setSelectedList(fullList);
      setViewMode('items');
    } catch (error) {
      console.error('Failed to load list items:', error);
      Alert.alert('Error', 'Failed to load list items');
    }
  };

  const toggleItemCompletion = async (item: GroceryItem) => {
    if (!auth.currentUser || !selectedList) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/grocery/${auth.currentUser.uid}/lists/${selectedList.id}/items/${item.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            completed: !item.completed,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const data = await response.json();
      
      // Update local state
      if (selectedList) {
        const updatedItems = selectedList.items.map(i => 
          i.id === item.id ? data.item : i
        );
        setSelectedList({ ...selectedList, items: updatedItems });
      }
    } catch (error) {
      console.error('Failed to toggle item:', error);
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const deleteList = async (listID: string) => {
    if (!auth.currentUser) return;

    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this list? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
      if (!auth.currentUser) return;
      const response = await fetch(
        `${API_BASE}/api/grocery/${auth.currentUser.uid}/lists/${listID}`,
        { method: 'DELETE' }
      );

              if (!response.ok) {
                throw new Error('Failed to delete list');
              }

              await loadLists();
              if (selectedList?.id === listID) {
                setSelectedList(null);
                setViewMode('lists');
              }
            } catch (error) {
              console.error('Failed to delete list:', error);
              Alert.alert('Error', 'Failed to delete list');
            }
          },
        },
      ]
    );
  };

  const createList = async (name: string) => {
    if (!auth.currentUser || !name.trim()) return;

    setLoadingCreate(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/grocery/${auth.currentUser.uid}/lists`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create list');
      }

      await loadLists();
      setShowCreateModal(false);
      setNewListName('');
    } catch (error: any) {
      console.error('Failed to create list:', error);
      Alert.alert('Error', error.message || 'Failed to create list');
    } finally {
      setLoadingCreate(false);
    }
  };

  const toggleListSelection = (listID: string) => {
    const newSelection = new Set(selectedListIDs);
    if (newSelection.has(listID)) {
      newSelection.delete(listID);
    } else {
      newSelection.add(listID);
    }
    setSelectedListIDs(newSelection);
  };

  const handleMergeLists = async () => {
    if (!auth.currentUser || selectedListIDs.size < 2) return;

    setLoadingMerge(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/grocery/${auth.currentUser.uid}/merge`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listIDs: Array.from(selectedListIDs),
            name: mergeListName.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to merge lists');
      }

      const data = await response.json();
      
      Alert.alert('Success', data.message || 'Lists merged successfully');
      
      // Reset selection and reload
      setMultiSelectMode(false);
      setSelectedListIDs(new Set());
      setShowMergeModal(false);
      setMergeListName('');
      await loadLists();
      
      // Open the merged list
      if (data.list) {
        await loadListItems(data.list.id);
      }
    } catch (error: any) {
      console.error('Failed to merge lists:', error);
      Alert.alert('Error', error.message || 'Failed to merge lists');
    } finally {
      setLoadingMerge(false);
    }
  };

  const handleCreateList = () => {
    setShowCreateModal(true);
  };

  const handleCreateConfirm = () => {
    if (newListName.trim()) {
      createList(newListName.trim());
    } else {
      Alert.alert('Invalid Name', 'Please enter a name for your list');
    }
  };

  const renderListItem = ({ item }: { item: GroceryList }) => {
    const isSelected = selectedListIDs.has(item.id);
    const itemCount = item.itemCount ?? item.items?.length ?? 0;

    return (
      <TouchableOpacity
        style={[
          styles.listCard,
          multiSelectMode && isSelected && styles.listCardSelected,
        ]}
        onPress={() => {
          if (multiSelectMode) {
            toggleListSelection(item.id);
          } else {
            loadListItems(item.id);
          }
        }}
        onLongPress={() => {
          if (!multiSelectMode) {
            setMultiSelectMode(true);
            setSelectedListIDs(new Set([item.id]));
          }
        }}
      >
        <View style={styles.listCardContent}>
          {multiSelectMode && (
            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          )}
          <View style={styles.listCardText}>
            <Text style={styles.listCardTitle}>{item.name}</Text>
            <Text style={styles.listCardSubtitle}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
          {!multiSelectMode && (
            <View style={styles.listCardActions}>
              <TouchableOpacity
                onPress={() => deleteList(item.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color={semanticColors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroceryItem = ({ item }: { item: GroceryItem }) => {
    const pantryMatch = findPantryMatch(item.name, pantryItems);
    const isFuzzyMatch = pantryMatch.matchType === 'fuzzy';
    const isExactMatch = pantryMatch.matchType === 'exact';

    return (
      <TouchableOpacity
        style={[
          styles.listItem,
          isFuzzyMatch && styles.listItemFuzzyMatch,
          isExactMatch && item.completed && styles.listItemCompleted,
        ]}
        onPress={() => toggleItemCompletion(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemText, item.completed && styles.itemTextChecked]}>
            {item.name}
          </Text>
          {item.quantity > 1 && (
            <Text style={styles.itemQuantity}>
              {item.quantity} {item.unit}
            </Text>
          )}
          {isFuzzyMatch && pantryMatch.item && (
            <Text style={styles.fuzzyMatchHint}>
              Similar to: {pantryMatch.item.name}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Grocery Lists" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading lists...</Text>
        </View>
      </View>
    );
  }

  if (viewMode === 'items' && selectedList) {
    return (
      <View style={styles.container}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity
          onPress={() => {
            setViewMode('lists');
            setSelectedList(null);
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Header title={selectedList.name} />
      </View>
        {selectedList.items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items yet</Text>
            <Text style={styles.emptySubtext}>
              Tap + to add items to this list
            </Text>
          </View>
        ) : (
          <FlatList
            data={selectedList.items}
            renderItem={renderGroceryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Grocery Lists" />
      
      {multiSelectMode && (
        <View style={styles.multiSelectBar}>
          <TouchableOpacity
            onPress={() => {
              setMultiSelectMode(false);
              setSelectedListIDs(new Set());
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectCount}>
            {selectedListIDs.size} selected
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (selectedListIDs.size >= 2) {
                setShowMergeModal(true);
              } else {
                Alert.alert('Select Lists', 'Please select at least 2 lists to merge');
              }
            }}
            disabled={selectedListIDs.size < 2}
          >
            <Text
              style={[
                styles.mergeText,
                selectedListIDs.size < 2 && styles.mergeTextDisabled,
              ]}
            >
              Merge
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {lists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No lists yet</Text>
          <Text style={styles.emptySubtext}>
            Tap + to create your first grocery list
          </Text>
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

      {/* Create List Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowCreateModal(false);
          setNewListName('');
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Grocery List</Text>
            <Text style={styles.modalSubtitle}>
              Enter a name for your new list
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="List name"
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
              onSubmitEditing={handleCreateConfirm}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewListName('');
                }}
                disabled={loadingCreate}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleCreateConfirm}
                disabled={loadingCreate || !newListName.trim()}
              >
                {loadingCreate ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.modalButtonTextConfirm}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Merge Modal */}
      <Modal
        visible={showMergeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMergeModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Merge Lists</Text>
            <Text style={styles.modalSubtitle}>
              Merging {selectedListIDs.size} list(s)
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Name for merged list (optional)"
              value={mergeListName}
              onChangeText={setMergeListName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowMergeModal(false);
                  setMergeListName('');
                }}
                disabled={loadingMerge}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleMergeLists}
                disabled={loadingMerge}
              >
                {loadingMerge ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.modalButtonTextConfirm}>Merge</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Button */}
      {!multiSelectMode && (
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={handleCreateList}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  multiSelectBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  selectCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  mergeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  mergeTextDisabled: {
    color: colors.textSecondary,
    opacity: 0.5,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  listCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listCardText: {
    flex: 1,
    marginLeft: 12,
  },
  listCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  listCardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  listCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  listItemFuzzyMatch: {
    backgroundColor: colors.background,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    paddingLeft: 12,
  },
  listItemCompleted: {
    opacity: 0.6,
  },
  itemContent: {
    flex: 1,
    marginLeft: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  itemTextChecked: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  itemQuantity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fuzzyMatchHint: {
    fontSize: 11,
    color: colors.accent,
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
});
