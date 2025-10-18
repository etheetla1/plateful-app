import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Recipe } from '@plateful/shared';

const API_BASE = 'http://10.0.2.2:3000'; // Android emulator host IP
const MOCK_USER_ID = 'user-dev-001';

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/generate-recipe/user/${MOCK_USER_ID}`);
      
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
    try {
      const response = await fetch(`${API_BASE}/api/generate-recipe/${recipe.recipeID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID: MOCK_USER_ID,
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
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
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => toggleSaveRecipe(selectedRecipe)}
          >
            <Ionicons
              name={selectedRecipe.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color="#4CAF50"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.recipeDetail}>
          {selectedRecipe.recipeData.description && (
            <Text style={styles.description}>{selectedRecipe.recipeData.description}</Text>
          )}

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={16} color="#757575" />
              <Text style={styles.metaText}>{selectedRecipe.recipeData.portions}</Text>
            </View>
            {selectedRecipe.recipeData.nutrition?.calories_per_portion && (
              <View style={styles.metaItem}>
                <Ionicons name="flame" size={16} color="#757575" />
                <Text style={styles.metaText}>
                  {selectedRecipe.recipeData.nutrition.calories_per_portion}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="list" size={20} color="#4CAF50" /> Ingredients
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
              <Ionicons name="receipt" size={20} color="#4CAF50" /> Instructions
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
                <Ionicons name="nutrition" size={20} color="#4CAF50" /> Nutrition
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
              <Ionicons name="link" size={16} color="#007AFF" />
              <Text style={styles.sourceButtonText}>View Original Recipe</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Recipes</Text>
        <Text style={styles.subtitle}>
          {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={64} color="#9E9E9E" />
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
              <View style={styles.recipeCardHeader}>
                <Text style={styles.recipeCardTitle}>{recipe.recipeData.title}</Text>
                <TouchableOpacity onPress={() => toggleSaveRecipe(recipe)}>
                  <Ionicons
                    name={recipe.isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={24}
                    color="#4CAF50"
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
                  <Ionicons name="people" size={14} color="#757575" />
                  <Text style={styles.recipeCardMetaText}>{recipe.recipeData.portions}</Text>
                </View>
                {recipe.recipeData.nutrition?.calories_per_portion && (
                  <View style={styles.recipeCardMetaItem}>
                    <Ionicons name="flame" size={14} color="#757575" />
                    <Text style={styles.recipeCardMetaText}>
                      {recipe.recipeData.nutrition.calories_per_portion}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9E9E9E',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 8,
  },
  recipeList: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  recipeCardDescription: {
    fontSize: 14,
    color: '#757575',
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
  },
  recipeCardMetaText: {
    fontSize: 12,
    color: '#757575',
  },
  recipeDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  recipeDetailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  saveButton: {
    padding: 4,
    marginLeft: 12,
  },
  recipeDetail: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#424242',
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#757575',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#424242',
    marginRight: 8,
    marginTop: 2,
  },
  ingredientText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#424242',
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
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#424242',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 8,
  },
  sourceButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
});

