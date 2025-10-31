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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Recipe } from '@plateful/shared';
import { colors, semanticColors } from '@plateful/shared';
import { auth } from '../../src/config/firebase';
import Header from '../../src/components/Header';
import { useRouter } from 'expo-router';

// Edited Badge Component with Sparkle Animation
function EditedBadge({ recipeID }: { recipeID: string }) {
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
    <View style={styles.editedBadgeWrapper}>
      <View style={styles.editedBadge}>
        <Text style={styles.editedBadgeText}>✨</Text>
      </View>
      <View style={styles.badgeSparkleContainer}>
        <Animated.View
          style={[
            styles.badgeSparkleDot,
            styles.badgeSparkle1,
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
            styles.badgeSparkleDot,
            styles.badgeSparkle2,
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
            styles.badgeSparkleDot,
            styles.badgeSparkle3,
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

// API endpoint - platform aware
const API_BASE = Platform.select({
  web: 'http://localhost:3001',
  android: 'http://10.0.2.2:3001',
  ios: 'http://localhost:3001',
  default: 'http://localhost:3001',
});

export default function RecipesScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Sparkle animations for edited recipes
  const sparkleAnims = useRef<{ [key: string]: Animated.Value[] }>({});

  useEffect(() => {
    if (auth.currentUser) {
      loadRecipes();
    }
  }, []);

  const loadRecipes = async () => {
    if (!auth.currentUser) return;

    try {
      const response = await fetch(`${API_BASE}/api/generate-recipe/user/${auth.currentUser.uid}`);
      
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

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{selectedRecipe.recipeData.portions}</Text>
            </View>
            {selectedRecipe.recipeData.nutrition?.calories_per_portion && (
              <View style={styles.metaItem}>
                <Ionicons name="flame" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {selectedRecipe.recipeData.nutrition.calories_per_portion}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="list" size={20} color={colors.primary} /> Ingredients
            </Text>
            {selectedRecipe.recipeData.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
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

          {selectedRecipe.recipeData.nutrition && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="nutrition" size={20} color={colors.primary} /> Nutrition
              </Text>
              <View style={styles.nutritionGrid}>
                {selectedRecipe.recipeData.nutrition.protein && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                    <Text style={styles.nutritionValue}>
                      {selectedRecipe.recipeData.nutrition.protein}
                    </Text>
                  </View>
                )}
                {selectedRecipe.recipeData.nutrition.carbs && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                    <Text style={styles.nutritionValue}>
                      {selectedRecipe.recipeData.nutrition.carbs}
                    </Text>
                  </View>
                )}
                {selectedRecipe.recipeData.nutrition.fat && (
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                    <Text style={styles.nutritionValue}>
                      {selectedRecipe.recipeData.nutrition.fat}
                    </Text>
                  </View>
                )}
              </View>
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
        </View>
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

      {recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No recipes yet</Text>
          <Text style={styles.emptySubtext}>
            Chat with the AI to discover and save recipes!
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
                {recipe.recipeData.imageUrl ? (
                  <View style={styles.recipeCardImageContainer}>
                    <Image
                      source={{ uri: recipe.recipeData.imageUrl }}
                      style={styles.recipeCardImage}
                      resizeMode="cover"
                    />
                    {recipe.isEdited && (
                      <EditedBadge recipeID={recipe.recipeID} />
                    )}
                  </View>
                ) : (
                  <View style={styles.recipeCardImagePlaceholder}>
                    <Ionicons name="restaurant" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.recipeCardText}>
                  <View style={styles.recipeCardHeader}>
                    <Text style={styles.recipeCardTitle} numberOfLines={2}>{recipe.recipeData.title}</Text>
                    <TouchableOpacity onPress={() => toggleSaveRecipe(recipe)}>
                      <Ionicons
                        name={recipe.isSaved ? 'bookmark' : 'bookmark-outline'}
                        size={24}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
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
  recipeCardImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  recipeCardImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  editedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.85)', // Gold with transparency
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.secondary, // Theme grey border for contrast
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  editedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  editedBadgeWrapper: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
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
  badgeSparkleContainer: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeSparkleDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 2,
  },
  badgeSparkle1: {
    top: '10%',
    left: '10%',
  },
  badgeSparkle2: {
    top: '20%',
    right: '10%',
  },
  badgeSparkle3: {
    bottom: '10%',
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
});

