export interface RecipeNutrition {
  calories_per_portion: string;
  protein?: string;
  carbs?: string;
  fat?: string;
}

export interface RecipeData {
  title: string;
  description: string;
  portions: string;
  ingredients: string[];
  instructions: string[];
  nutrition: RecipeNutrition;
  sourceUrl: string;
  imageUrl?: string;
}

export interface Recipe {
  id: string;
  userID: string;
  recipeID: string;
  recipeNameLower: string;
  sourceUrlLower: string;
  conversationID?: string;
  recipeData: RecipeData;
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
  isEdited?: boolean; // Flag to indicate this recipe was edited from an original
  originalRecipeID?: string; // ID of the original recipe if this was edited
  userPortionSize?: number; // User's preferred serving count for this recipe
}

export interface RecipeGenerateRequest {
  conversationID: string;
  userID: string;
}

export interface IntentExtractionResult {
  dish: string;
  searchQuery: string;
  status: 'off_topic' | 'kitchen_utility' | 'broad_category' | 'dish_type' | 'specific_dish' | 'fully_refined';
  certaintyLevel: 'low' | 'medium' | 'high';
  explanation?: string; // What the AI currently understands
}

export interface RecipeSearchResult {
  title: string;
  url: string;
  snippet?: string;
}

