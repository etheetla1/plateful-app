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
}

export interface RecipeGenerateRequest {
  conversationID: string;
  userID: string;
}

export interface IntentExtractionResult {
  dish: string;
  searchQuery: string;
  status: 'decided' | 'still_deciding';
}

export interface RecipeSearchResult {
  title: string;
  url: string;
  snippet?: string;
}

