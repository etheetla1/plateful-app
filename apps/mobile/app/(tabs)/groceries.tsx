import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { colors } from '../../theme/colors';
import Header from '../../src/components/Header';

// Mock data matching Figma design
const GROCERY_ITEMS = [
  { id: '1', name: 'Eggs', checked: false },
  { id: '2', name: 'Cheese', checked: true },
  { id: '3', name: 'Bread', checked: false },
];

const PANTRY_ITEMS = [
  { id: '4', name: 'Sugar', checked: false },
  { id: '5', name: 'Rice', checked: false },
  { id: '6', name: 'Apple', checked: false },
  { id: '7', name: 'Kiwi', checked: false },
];

type TabType = 'grocery' | 'pantry';

export default function Groceries() {
  const [activeTab, setActiveTab] = useState<TabType>('grocery');
  const [groceryItems, setGroceryItems] = useState(GROCERY_ITEMS);
  const [pantryItems, setPantryItems] = useState(PANTRY_ITEMS);

  const currentItems = activeTab === 'grocery' ? groceryItems : pantryItems;
  const setCurrentItems = activeTab === 'grocery' ? setGroceryItems : setPantryItems;

  const toggleItem = (id: string) => {
    setCurrentItems(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const renderItem = ({ item }: { item: typeof GROCERY_ITEMS[0] }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => toggleItem(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.itemText, item.checked && styles.itemTextChecked]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Your Ingredients" />
      {/* Tabs */}
      <View style={styles.tabContainerWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'grocery' && styles.tabActive]}
            onPress={() => setActiveTab('grocery')}
          >
            <Text style={[styles.tabText, activeTab === 'grocery' && styles.tabTextActive]}>
              Grocery List
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pantry' && styles.tabActive]}
            onPress={() => setActiveTab('pantry')}
          >
            <Text style={[styles.tabText, activeTab === 'pantry' && styles.tabTextActive]}>
              Pantry
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {currentItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items yet</Text>
          <Text style={styles.emptySubtext}>
            Tap + to add items to your {activeTab === 'grocery' ? 'grocery list' : 'pantry'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainerWrapper: {
    backgroundColor: colors.surface,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 16,
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
    flex: 1,
  },
  itemTextChecked: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
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
});
