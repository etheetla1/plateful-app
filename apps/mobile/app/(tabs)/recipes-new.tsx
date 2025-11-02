import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
  Image,
  Alert,
  Animated,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Recipe, GroceryList, PantryItem, FoodProfile, ScalingWarning } from '@plateful/shared';
import { colors, semanticColors, parseIngredients, findPantryMatch, extractPortionNumber, scaleIngredient, scaleNutrition, detectCookingConstraints, checkScalingConstraints } from '@plateful/shared';
import { auth } from '../../src/config/firebase';
import Header from '../../src/components/Header';
import PortionSelector from '../../src/components/PortionSelector';
import ScalingWarningsModal from '../../src/components/ScalingWarningsModal';
import { useRouter } from 'expo-router';

interface IngredientItem {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  notes?: string;
  checked: boolean; // User approval
  pantryMatch?: {
    item: PantryItem | null;
    matchType: 'exact' | 'fuzzy' | null;
  };
}

interface AddToGroceryModalProps {
  visible: boolean;
  recipe: Recipe | null;
  onClose: () => void;
  onSuccess?: () => void;
}

function AddToGroceryModal({ visible, recipe, onClose, onSuccess }: AddToGroceryModalProps) {
  // API endpoint - platform aware
  const API_BASE = Platform.select({
    web: 'http://localhost:3001',
    android: 'http://10.0.2.2:3001',
    ios: 'http://localhost:3001',
    default: 'http://localhost:3001',
  });

  const [lists, setLists] = useState<GroceryList[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [selectedListID, setSelectedListID] = useState<string | null>(null);
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(true);

  useEffect(() => {
    if (visible && recipe && auth.currentUser) {
      loadLists();
      loadPantryItems();
    }
  }, [visible, recipe]);

  useEffect(() => {
    if (visible && recipe && pantryItems.length >= 0) {
      parseRecipeIngredients();
    }
  }, [visible, recipe, pantryItems]);

  const loadLists = async () => {
    if (!auth.currentUser) return;

    try {
      setLoadingLists(true);
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
      setLoadingLists(false);
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

  const parseRecipeIngredients = () => {
    if (!recipe) return;

    const parsed = parseIngredients(recipe.recipeData.ingredients);
    
    const ingredientItems: IngredientItem[] = parsed.map(item => {
      const pantryMatch = findPantryMatch(item.name, pantryItems);
      return {
        ...item,
        checked: pantryMatch.matchType === 'exact' ? true : true, // Default all checked, exact matches auto-checked
        pantryMatch,
      };
    });

    setIngredients(ingredientItems);
  };

  const toggleIngredient = (index: number) => {
    setIngredients(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const createListAndAdd = async () => {
    if (!auth.currentUser || !newListName.trim()) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/grocery/${auth.currentUser.uid}/lists`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newListName.trim() }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create list');
      }

      const data = await response.json();
      await loadLists();
      setSelectedListID(data.list.id);
      setShowCreateList(false);
      setNewListName('');
    } catch (error) {
      console.error('Failed to create list:', error);
      Alert.alert('Error', 'Failed to create list');
    }
  };

  const handleAddToGroceryList = async () => {
    if (!auth.currentUser || !selectedListID) {
      Alert.alert('Select List', 'Please select a grocery list');
      return;
    }

    const selectedIngredients = ingredients.filter(ing => ing.checked);
    if (selectedIngredients.length === 0) {
      Alert.alert('No Items', 'Please select at least one ingredient to add');
      return;
    }

    setLoading(true);
    try {
      const itemsToAdd = selectedIngredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        category: ing.category,
        notes: ing.notes,
      }));

      const response = await fetch(
        `${API_BASE}/api/grocery/${auth.currentUser.uid}/lists/${selectedListID}/items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: itemsToAdd }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add items');
      }

      const data = await response.json();
      const createdItems = data.items || [];
      
      // Mark exact pantry matches as completed (crossed out)
      const exactMatches = selectedIngredients.filter(
        ing => ing.pantryMatch?.matchType === 'exact'
      );

      if (exactMatches.length > 0) {
        // Update exact matches to completed
        for (const item of createdItems) {
          const ingredient = selectedIngredients.find(
            ing => ing.name.toLowerCase() === item.name.toLowerCase()
          );
          if (ingredient?.pantryMatch?.matchType === 'exact') {
            await fetch(
              `${API_BASE}/api/grocery/${auth.currentUser.uid}/lists/${selectedListID}/items/${item.id}`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: true }),
              }
            ).catch(err => console.error('Failed to mark item completed:', err));
          }
        }
      }

      Alert.alert('Success', `Added ${selectedIngredients.length} item(s) to your grocery list`);
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Failed to add items:', error);
      Alert.alert('Error', error.message || 'Failed to add items to grocery list');
    } finally {
      setLoading(false);
    }
  };

  if (!recipe) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={addGroceryStyles.modalBackdrop}>
        <View style={addGroceryStyles.modalContent}>
          <View style={addGroceryStyles.modalHeader}>
            <Text style={addGroceryStyles.modalTitle}>Add to Grocery List</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={addGroceryStyles.recipeTitle}>{recipe.recipeData.title}</Text>

          {loadingLists ? (
            <View style={addGroceryStyles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <>
              {/* List Selection */}
              <Text style={addGroceryStyles.sectionTitle}>Select Grocery List</Text>
              {showCreateList ? (
                <View style={addGroceryStyles.createListContainer}>
                  <TextInput
                    style={addGroceryStyles.listInput}
                    placeholder="New list name"
                    value={newListName}
                    onChangeText={setNewListName}
                    autoFocus
                  />
                  <View style={addGroceryStyles.createListButtons}>
                    <TouchableOpacity
                      style={addGroceryStyles.cancelButton}
                      onPress={() => {
                        setShowCreateList(false);
                        setNewListName('');
                      }}
                    >
                      <Text style={addGroceryStyles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[addGroceryStyles.createButton, !newListName.trim() && addGroceryStyles.createButtonDisabled]}
                      onPress={createListAndAdd}
                      disabled={!newListName.trim()}
                    >
                      <Text style={addGroceryStyles.createButtonText}>Create</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <FlatList
                    data={lists}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          addGroceryStyles.listItem,
                          selectedListID === item.id && addGroceryStyles.listItemSelected,
                        ]}
                        onPress={() => setSelectedListID(item.id)}
                      >
                        <View style={[
                          addGroceryStyles.radioButton,
                          selectedListID === item.id && addGroceryStyles.radioButtonSelected,
                        ]}>
                          {selectedListID === item.id && (
                            <View style={addGroceryStyles.radioButtonInner} />
                          )}
                        </View>
                        <Text style={addGroceryStyles.listItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                    style={addGroceryStyles.listsList}
                    nestedScrollEnabled
                  />
                  <TouchableOpacity
                    style={addGroceryStyles.newListButton}
                    onPress={() => setShowCreateList(true)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                    <Text style={addGroceryStyles.newListButtonText}>Create New List</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Ingredients Selection */}
              <Text style={addGroceryStyles.sectionTitle}>Select Ingredients</Text>
              <FlatList
                data={ingredients}
                keyExtractor={(item, index) => `${item.name}-${index}`}
                renderItem={({ item, index }) => {
                  const isExactMatch = item.pantryMatch?.matchType === 'exact';
                  const isFuzzyMatch = item.pantryMatch?.matchType === 'fuzzy';

                  return (
                    <TouchableOpacity
                      style={[
                        addGroceryStyles.ingredientItem,
                        isFuzzyMatch && addGroceryStyles.ingredientItemFuzzy,
                        isExactMatch && addGroceryStyles.ingredientItemExact,
                      ]}
                      onPress={() => toggleIngredient(index)}
                    >
                      <View style={[
                        addGroceryStyles.checkbox,
                        item.checked && addGroceryStyles.checkboxChecked,
                        isExactMatch && addGroceryStyles.checkboxExactMatch,
                      ]}>
                        {item.checked && (
                          <Ionicons name="checkmark" size={16} color={colors.surface} />
                        )}
                      </View>
                      <View style={addGroceryStyles.ingredientContent}>
                        <Text style={[
                          addGroceryStyles.ingredientName,
                          isExactMatch && addGroceryStyles.ingredientNameExact,
                        ]}>
                          {item.name}
                        </Text>
                        {item.quantity > 1 && (
                          <Text style={addGroceryStyles.ingredientQuantity}>
                            {item.quantity} {item.unit}
                          </Text>
                        )}
                        {isFuzzyMatch && item.pantryMatch?.item && (
                          <Text style={addGroceryStyles.fuzzyMatchText}>
                            Similar to: {item.pantryMatch.item.name}
                          </Text>
                        )}
                        {isExactMatch && (
                          <Text style={addGroceryStyles.exactMatchText}>
                            ✓ In pantry
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                style={addGroceryStyles.ingredientsList}
                nestedScrollEnabled
              />

              {/* Action Buttons */}
              <View style={addGroceryStyles.actionButtons}>
                <TouchableOpacity
                  style={[addGroceryStyles.cancelActionButton]}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={addGroceryStyles.cancelActionButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    addGroceryStyles.addButton,
                    (!selectedListID || loading) && addGroceryStyles.addButtonDisabled,
                  ]}
                  onPress={handleAddToGroceryList}
                  disabled={!selectedListID || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.surface} />
                  ) : (
                    <Text style={addGroceryStyles.addButtonText}>
                      Add {ingredients.filter(i => i.checked).length} Item(s)
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// Edited Banner Inline Component with Sparkle Animation
function EditedBannerInline() {
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createSparkleAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(800),
        ])
      );
    };

    createSparkleAnimation(sparkle1, 0).start();
    createSparkleAnimation(sparkle2, 150).start();
    createSparkleAnimation(sparkle3, 300).start();
  }, []);

  return (
    <View style={styles.editedBannerInline}>
      <Text style={styles.editedBannerInlineText}>Edited</Text>
      <View style={styles.inlineBannerSparkleContainer}>
        <Animated.View
          style={[
            styles.inlineBannerSparkleDot,
            styles.inlineBannerSparkle1,
            {
              opacity: sparkle1,
              transform: [{
                scale: sparkle1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1.2],
                }),
              }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.inlineBannerSparkleDot,
            styles.inlineBannerSparkle2,
            {
              opacity: sparkle2,
              transform: [{
                scale: sparkle2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1.2],
                }),
              }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.inlineBannerSparkleDot,
            styles.inlineBannerSparkle3,
            {
              opacity: sparkle3,
              transform: [{
                scale: sparkle3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1.2],
                }),
              }],
            },
          ]}
        />
      </View>
    </View>
  );
}

// Edited Banner Component with Sparkle Animation
function EditedBanner() {
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createSparkleAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(800),
        ])
      );
    };

    createSparkleAnimation(sparkle1, 0).start();
    createSparkleAnimation(sparkle2, 150).start();
    createSparkleAnimation(sparkle3, 300).start();
  }, []);

  return (
    <View style={styles.editedBanner}>
      <Text style={styles.editedBannerText}>✨ Edited</Text>
      <View style={styles.bannerSparkleContainer}>
        <Animated.View
          style={[
            styles.bannerSparkleDot,
            styles.bannerSparkle1,
            {
              opacity: sparkle1,
              transform: [{
                scale: sparkle1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1.5],
                }),
              }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.bannerSparkleDot,
            styles.bannerSparkle2,
            {
              opacity: sparkle2,
              transform: [{
                scale: sparkle2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1.5],
                }),
              }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.bannerSparkleDot,
            styles.bannerSparkle3,
            {
              opacity: sparkle3,
              transform: [{
                scale: sparkle3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1.5],
                }),
              }],
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function RecipesScreen() {
  // API endpoint - platform aware
  const API_BASE = Platform.select({
    web: 'http://localhost:3001',
    android: 'http://10.0.2.2:3001',
    ios: 'http://localhost:3001',
    default: 'http://localhost:3001',
  });
  const router = useRouter();
  const [recipeFilter, setRecipeFilter] = useState<'all' | 'saved'>('all');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddToGrocery, setShowAddToGrocery] = useState(false);
  const [recipeForGrocery, setRecipeForGrocery] = useState<Recipe | null>(null);
  const [userProfile, setUserProfile] = useState<FoodProfile | null>(null);
  const [currentPortionSize, setCurrentPortionSize] = useState<number | null>(null);
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const [currentWarnings, setCurrentWarnings] = useState<ScalingWarning[]>([]);
  const warningsShownRef = useRef<string | null>(null);
  
  // Sparkle animations for edited recipes
  const sparkleAnims = useRef<{ [key: string]: Animated.Value[] }>({});

  useEffect(() => {
    if (auth.currentUser) {
      loadRecipes();
      loadUserProfile();
    }
  }, [recipeFilter]);

  useEffect(() => {
    if (selectedRecipe) {
      // Calculate initial portion size: userPortionSize || defaultServingSize || originalPortions
      const originalPortions = extractPortionNumber(selectedRecipe.recipeData.portions);
      const initialPortions = selectedRecipe.userPortionSize || 
                             userProfile?.defaultServingSize || 
                             originalPortions;
      setCurrentPortionSize(initialPortions);
      
      // Reset warnings shown flag ONLY when entering a completely different recipe
      const currentRecipeID = selectedRecipe.recipeID;
      if (warningsShownRef.current !== currentRecipeID) {
        warningsShownRef.current = null; // Reset for new recipe
        setShowWarningsModal(false);
      }
      
      // Don't auto-show on initial load - let user trigger it by adjusting portions
    } else {
      setCurrentPortionSize(null);
      setShowWarningsModal(false);
      setCurrentWarnings([]);
      warningsShownRef.current = null;
    }
  }, [selectedRecipe?.recipeID, userProfile?.defaultServingSize]); // Trigger when recipeID changes or profile loads

  const loadRecipes = async () => {
    if (!auth.currentUser) return;

    try {
      const url = recipeFilter === 'saved' 
        ? `${API_BASE}/api/generate-recipe/user/${auth.currentUser.uid}?saved=true`
        : `${API_BASE}/api/generate-recipe/user/${auth.currentUser.uid}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to load recipes');
      }

      const data = await response.json();
      setRecipes(data.recipes || []);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecipes();
  };

  const loadUserProfile = async () => {
    if (!auth.currentUser) return;

    try {
      const response = await fetch(`${API_BASE}/api/profile/${auth.currentUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile || null);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUserProfile(null);
    }
  };

  const handlePortionSizeChange = async (newPortions: number) => {
    if (!selectedRecipe || !auth.currentUser) return;

    setCurrentPortionSize(newPortions);

    // Check for warnings when portion size changes
    const originalPortions = extractPortionNumber(selectedRecipe.recipeData.portions);
    const constraints = detectCookingConstraints(
      selectedRecipe.recipeData.instructions,
      selectedRecipe.recipeData.title,
      selectedRecipe.recipeData.description
    );
    const warnings = checkScalingConstraints(originalPortions, newPortions, constraints);
    
    
    if (warnings.length > 0) {
      setCurrentWarnings(warnings);
      // Only show modal if we haven't shown it for this recipe yet in this session
      if (warningsShownRef.current !== selectedRecipe.recipeID) {
        setShowWarningsModal(true);
        warningsShownRef.current = selectedRecipe.recipeID; // Mark as shown
      }
    } else {
      setShowWarningsModal(false);
      setCurrentWarnings([]);
    }

    // Save to backend
    try {
      const response = await fetch(`${API_BASE}/api/generate-recipe/${selectedRecipe.recipeID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID: auth.currentUser.uid,
          userPortionSize: newPortions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setRecipes(prev =>
          prev.map(r => (r.recipeID === selectedRecipe.recipeID ? data.recipe : r))
        );
        setSelectedRecipe(data.recipe);
      }
    } catch (error) {
      console.error('Failed to save portion size:', error);
    }
  };

  const toggleSaveRecipe = async (recipe: Recipe) => {
    if (!auth.currentUser) return;

    try {
      const response = await fetch(`${API_BASE}/api/generate-recipe/${recipe.recipeID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID: auth.currentUser.uid,
          isSaved: !recipe.isSaved,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }

      const data = await response.json();
      
      // Update local state
      setRecipes(prev =>
        prev.map(r => (r.recipeID === recipe.recipeID ? data.recipe : r))
      );
      
      if (selectedRecipe?.recipeID === recipe.recipeID) {
        setSelectedRecipe(data.recipe);
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  };

  const deleteRecipe = async (recipe: Recipe) => {
    if (!auth.currentUser) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/generate-recipe/${recipe.recipeID}?userID=${auth.currentUser.uid}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      // Remove from local state
      setRecipes(prev => prev.filter(r => r.recipeID !== recipe.recipeID));
      
      // If deleted recipe was selected, go back to list
      if (selectedRecipe?.recipeID === recipe.recipeID) {
        setSelectedRecipe(null);
      }
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      Alert.alert('Error', 'Failed to delete recipe. Please try again.');
    }
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.recipeData.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRecipe(recipe),
        },
      ]
    );
  };

  const handleEditInChat = async (recipe: Recipe) => {
    if (!auth.currentUser) return;

    try {
      // Create a new conversation
      const convResponse = await fetch(`${API_BASE}/api/chat/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID: auth.currentUser.uid }),
      });

      if (!convResponse.ok) {
        throw new Error('Failed to create conversation');
      }

      const convData = await convResponse.json();
      const conversationID = convData.conversation.conversationID;

      // Load recipe into chat
      const loadResponse = await fetch(`${API_BASE}/api/chat/load-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationID,
          recipeID: recipe.recipeID,
          userID: auth.currentUser.uid,
        }),
      });

      if (!loadResponse.ok) {
        throw new Error('Failed to load recipe into chat');
      }

      // Store conversationID temporarily and navigate to chat tab
      // The chat screen will detect editing mode and load this conversation
      // Use navigation params to pass conversationID
      router.push({
        pathname: '/(tabs)/chat',
        params: { editingConversationID: conversationID },
      });
    } catch (error) {
      console.error('Failed to edit recipe in chat:', error);
      Alert.alert('Error', 'Failed to load recipe into chat. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  if (selectedRecipe) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.recipeDetailHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedRecipe(null)}
          >
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.recipeDetailTitle}>{selectedRecipe.recipeData.title}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => toggleSaveRecipe(selectedRecipe)}
            >
            <Ionicons
              name={selectedRecipe.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={colors.primary}
            />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => handleDeleteRecipe(selectedRecipe)}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color={semanticColors.error}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recipeDetail}>
          {selectedRecipe.recipeData.imageUrl ? (
            <View style={styles.recipeImageContainer}>
              <Image
                source={{ uri: selectedRecipe.recipeData.imageUrl }}
                style={styles.recipeImage}
                resizeMode="cover"
              />
              {selectedRecipe.isEdited && (
                <EditedBanner />
              )}
            </View>
          ) : (
            <View style={styles.recipeImagePlaceholder}>
              <Ionicons name="restaurant" size={48} color={colors.textSecondary} />
            </View>
          )}
          
          {selectedRecipe.recipeData.description && (
            <Text style={styles.description}>{selectedRecipe.recipeData.description}</Text>
          )}

          {currentPortionSize !== null && (
            <PortionSelector
              portions={currentPortionSize}
              originalPortions={extractPortionNumber(selectedRecipe.recipeData.portions)}
              defaultPortions={userProfile?.defaultServingSize}
              onPortionsChange={handlePortionSizeChange}
            />
          )}

          {selectedRecipe.recipeData.nutrition?.calories_per_portion && (
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Ionicons name="flame" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {selectedRecipe.recipeData.nutrition.calories_per_portion}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="list" size={20} color={colors.primary} /> Ingredients
            </Text>
            {currentPortionSize !== null && (() => {
              const originalPortions = extractPortionNumber(selectedRecipe.recipeData.portions);
              const isScaled = currentPortionSize !== originalPortions;
              
              return (
                <>
                  {isScaled && (
                    <Text style={styles.scalingNote}>
                      Original: {selectedRecipe.recipeData.portions}
                    </Text>
                  )}
                  {selectedRecipe.recipeData.ingredients.map((ingredient, index) => {
                    const scaledIngredient = isScaled
                      ? scaleIngredient(ingredient, originalPortions, currentPortionSize)
                      : ingredient;
                    return (
                      <View key={index} style={styles.ingredientItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.ingredientText}>{scaledIngredient}</Text>
                      </View>
                    );
                  })}
                </>
              );
            })()}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="receipt" size={20} color={colors.primary} /> Instructions
            </Text>
            {selectedRecipe.recipeData.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>

          {selectedRecipe.recipeData.nutrition && currentPortionSize !== null && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="nutrition" size={20} color={colors.primary} /> Nutrition
              </Text>
              {(() => {
                const originalPortions = extractPortionNumber(selectedRecipe.recipeData.portions);
                const scaleFactor = currentPortionSize / originalPortions;
                const scaledNutrition = scaleFactor !== 1
                  ? scaleNutrition(selectedRecipe.recipeData.nutrition, scaleFactor)
                  : selectedRecipe.recipeData.nutrition;
                
                return (
                  <View style={styles.nutritionGrid}>
                    {scaledNutrition.protein && (
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionLabel}>Protein</Text>
                        <Text style={styles.nutritionValue}>
                          {scaledNutrition.protein}
                        </Text>
                      </View>
                    )}
                    {scaledNutrition.carbs && (
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionLabel}>Carbs</Text>
                        <Text style={styles.nutritionValue}>
                          {scaledNutrition.carbs}
                        </Text>
                      </View>
                    )}
                    {scaledNutrition.fat && (
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionLabel}>Fat</Text>
                        <Text style={styles.nutritionValue}>
                          {scaledNutrition.fat}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
          )}

          {selectedRecipe.recipeData.sourceUrl && (
            <TouchableOpacity 
              style={styles.sourceButton}
              onPress={() => Linking.openURL(selectedRecipe.recipeData.sourceUrl)}
            >
              <Ionicons name="link" size={16} color={colors.accent} />
              <Text style={styles.sourceButtonText}>View Original Recipe</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.accent} />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEditInChat(selectedRecipe)}
          >
            <Ionicons name="chatbubbles" size={20} color={colors.surface} />
            <Text style={styles.editButtonText}>Edit in Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.addToGroceryButton}
            onPress={() => {
              setRecipeForGrocery(selectedRecipe);
              setShowAddToGrocery(true);
            }}
          >
            <Ionicons name="cart" size={20} color={colors.surface} />
            <Text style={styles.addToGroceryButtonText}>Add to Grocery List</Text>
          </TouchableOpacity>
        </View>

        <AddToGroceryModal
          visible={showAddToGrocery}
          recipe={recipeForGrocery}
          onClose={() => {
            setShowAddToGrocery(false);
            setRecipeForGrocery(null);
          }}
        />

        <ScalingWarningsModal
          visible={showWarningsModal}
          warnings={currentWarnings}
          onClose={() => setShowWarningsModal(false)}
        />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="My Recipes" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabButton, recipeFilter === 'all' && styles.tabButtonActive]}
            onPress={() => setRecipeFilter('all')}
          >
            <Text style={[styles.tabButtonText, recipeFilter === 'all' && styles.tabButtonTextActive]}>
              All Recipes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, recipeFilter === 'saved' && styles.tabButtonActive]}
            onPress={() => setRecipeFilter('saved')}
          >
            <Ionicons 
              name="bookmark" 
              size={16} 
              color={recipeFilter === 'saved' ? colors.surface : colors.textSecondary} 
            />
            <Text style={[styles.tabButtonText, recipeFilter === 'saved' && styles.tabButtonTextActive]}>
              Saved Recipes
            </Text>
          </TouchableOpacity>
        </View>

      {recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            {recipeFilter === 'saved' ? 'No saved recipes yet' : 'No recipes yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {recipeFilter === 'saved' 
              ? 'Bookmark recipes you like to view them here'
              : 'Chat with the AI to discover and save recipes!'}
          </Text>
        </View>
      ) : (
        <View style={styles.recipeList}>
          {recipes.map(recipe => (
            <TouchableOpacity
              key={recipe.recipeID}
              style={styles.recipeCard}
              onPress={() => setSelectedRecipe(recipe)}
            >
              <View style={styles.recipeCardContent}>
                <View style={styles.recipeCardImageWrapper}>
                  {recipe.recipeData.imageUrl ? (
                    <View style={styles.recipeCardImageContainer}>
                      <Image
                        source={{ uri: recipe.recipeData.imageUrl }}
                        style={styles.recipeCardImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View style={styles.recipeCardImagePlaceholder}>
                      <Ionicons name="restaurant" size={24} color={colors.textSecondary} />
                    </View>
                  )}
                  {recipe.isEdited && (
                    <EditedBannerInline />
                  )}
                </View>
                <View style={styles.recipeCardText}>
                  <View style={styles.recipeCardHeader}>
                    <Text style={styles.recipeCardTitle} numberOfLines={2}>{recipe.recipeData.title}</Text>
                    <View style={styles.recipeCardHeaderActions}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          setRecipeForGrocery(recipe);
                          setShowAddToGrocery(true);
                        }}
                        style={styles.cardActionButton}
                      >
                        <Ionicons name="cart-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleSaveRecipe(recipe);
                        }}
                        style={styles.cardActionButton}
                      >
                        <Ionicons
                          name={recipe.isSaved ? 'bookmark' : 'bookmark-outline'}
                          size={24}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {recipe.recipeData.description && (
                    <Text style={styles.recipeCardDescription} numberOfLines={2}>
                      {recipe.recipeData.description}
                    </Text>
                  )}
                  <View style={styles.recipeCardMeta}>
                    <View style={styles.recipeCardMetaItem}>
                      <Ionicons name="people" size={14} color={colors.textSecondary} />
                      <Text style={styles.recipeCardMetaText} numberOfLines={1}>{recipe.recipeData.portions}</Text>
                    </View>
                    {recipe.recipeData.nutrition?.calories_per_portion && (
                      <View style={styles.recipeCardMetaItem}>
                        <Ionicons name="flame" size={14} color={colors.textSecondary} />
                        <Text style={styles.recipeCardMetaText} numberOfLines={1}>
                          {recipe.recipeData.nutrition.calories_per_portion}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      </ScrollView>

      <AddToGroceryModal
        visible={showAddToGrocery}
        recipe={recipeForGrocery}
        onClose={() => {
          setShowAddToGrocery(false);
          setRecipeForGrocery(null);
        }}
      />

      <ScalingWarningsModal
        visible={showWarningsModal}
        warnings={currentWarnings}
        onClose={() => setShowWarningsModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.surface,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  recipeList: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeCardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  recipeCardImageWrapper: {
    width: 100,
    alignItems: 'center',
  },
  recipeCardImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  recipeCardImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  editedBannerInline: {
    marginTop: 6,
    width: 100, // Span full width of image
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.85)', // Gold color with transparency
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  editedBannerInlineText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1A1A1A', // Dark text for contrast on gold
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inlineBannerSparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineBannerSparkleDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 1.5,
  },
  inlineBannerSparkle1: {
    top: '25%',
    left: '20%',
  },
  inlineBannerSparkle2: {
    top: '30%',
    right: '25%',
  },
  inlineBannerSparkle3: {
    bottom: '30%',
    left: '50%',
  },
  recipeCardImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeCardText: {
    flex: 1,
    flexShrink: 1,
  },
  recipeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
    flexShrink: 1,
  },
  recipeCardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  recipeCardMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  recipeCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    flexShrink: 1,
  },
  recipeCardMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    flexShrink: 1,
  },
  recipeDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  recipeDetailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  saveButton: {
    padding: 4,
    marginLeft: 12,
  },
  recipeDetail: {
    padding: 20,
  },
  recipeImageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  editedBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.85)', // Gold with transparency
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.secondary, // Theme grey border below banner
  },
  editedBannerText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bannerSparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerSparkleDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 2.5,
  },
  bannerSparkle1: {
    top: '20%',
    left: '15%',
  },
  bannerSparkle2: {
    top: '25%',
    right: '20%',
  },
  bannerSparkle3: {
    top: '30%',
    left: '50%',
  },
  recipeImagePlaceholder: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scalingNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    color: colors.textPrimary,
    marginRight: 8,
    marginTop: 2,
  },
  ingredientText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    flex: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  nutritionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  sourceButtonText: {
    flex: 1,
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  addToGroceryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  addToGroceryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  recipeCardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardActionButton: {
    padding: 4,
  },
});

const addGroceryStyles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 12,
  },
  listsList: {
    maxHeight: 150,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginBottom: 8,
  },
  listItemSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  listItemText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  newListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    gap: 8,
  },
  newListButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  createListContainer: {
    marginBottom: 12,
  },
  listInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: 12,
  },
  createListButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  createButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    color: colors.surface,
    fontWeight: '600',
  },
  ingredientsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginBottom: 8,
  },
  ingredientItemFuzzy: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    paddingLeft: 16,
  },
  ingredientItemExact: {
    backgroundColor: colors.primary + '15',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxExactMatch: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  ingredientNameExact: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  ingredientQuantity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fuzzyMatchText: {
    fontSize: 11,
    color: colors.accent,
    fontStyle: 'italic',
    marginTop: 4,
  },
  exactMatchText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  cancelActionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  cancelActionButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  addButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
});

