import type { CommonIngredient } from '../types/pantry';

/**
 * Curated list of common ingredients grouped by category.
 * 
 * Items with requiresQuantity: true should prompt for quantity when adding.
 * Items with requiresQuantity: false are just marked as "in pantry" without quantity.
 */
export const COMMON_INGREDIENTS: CommonIngredient[] = [
  // Produce
  { name: 'Apples', category: 'produce', requiresQuantity: true, commonUnits: ['pieces', 'lb'] },
  { name: 'Bananas', category: 'produce', requiresQuantity: true, commonUnits: ['pieces'] },
  { name: 'Onions', category: 'produce', requiresQuantity: true, commonUnits: ['pieces', 'lb'] },
  { name: 'Garlic', category: 'produce', requiresQuantity: false },
  { name: 'Potatoes', category: 'produce', requiresQuantity: true, commonUnits: ['pieces', 'lb'] },
  { name: 'Carrots', category: 'produce', requiresQuantity: true, commonUnits: ['pieces', 'lb'] },
  { name: 'Tomatoes', category: 'produce', requiresQuantity: true, commonUnits: ['pieces', 'lb'] },
  { name: 'Lettuce', category: 'produce', requiresQuantity: false },
  { name: 'Spinach', category: 'produce', requiresQuantity: false },
  { name: 'Bell Peppers', category: 'produce', requiresQuantity: true, commonUnits: ['pieces'] },
  { name: 'Mushrooms', category: 'produce', requiresQuantity: false },
  { name: 'Avocados', category: 'produce', requiresQuantity: true, commonUnits: ['pieces'] },
  { name: 'Lemons', category: 'produce', requiresQuantity: true, commonUnits: ['pieces'] },
  { name: 'Limes', category: 'produce', requiresQuantity: true, commonUnits: ['pieces'] },

  // Dairy
  { name: 'Eggs', category: 'dairy', requiresQuantity: true, commonUnits: ['eggs'] },
  { name: 'Milk', category: 'dairy', requiresQuantity: true, commonUnits: ['cups', 'gal', 'oz'] },
  { name: 'Butter', category: 'dairy', requiresQuantity: true, commonUnits: ['sticks', 'tbsp', 'oz'] },
  { name: 'Cheese', category: 'dairy', requiresQuantity: true, commonUnits: ['oz', 'lb', 'cups'] },
  { name: 'Yogurt', category: 'dairy', requiresQuantity: true, commonUnits: ['cups', 'oz'] },
  { name: 'Sour Cream', category: 'dairy', requiresQuantity: true, commonUnits: ['cups', 'oz'] },
  { name: 'Heavy Cream', category: 'dairy', requiresQuantity: true, commonUnits: ['cups', 'oz'] },
  { name: 'Cream Cheese', category: 'dairy', requiresQuantity: true, commonUnits: ['oz'] },

  // Meat & Seafood
  { name: 'Chicken Breast', category: 'meat', requiresQuantity: true, commonUnits: ['lb', 'pieces'] },
  { name: 'Ground Beef', category: 'meat', requiresQuantity: true, commonUnits: ['lb'] },
  { name: 'Bacon', category: 'meat', requiresQuantity: true, commonUnits: ['strips', 'oz', 'lb'] },
  { name: 'Salmon', category: 'meat', requiresQuantity: true, commonUnits: ['lb', 'pieces'] },
  { name: 'Shrimp', category: 'meat', requiresQuantity: true, commonUnits: ['lb', 'oz'] },
  { name: 'Turkey', category: 'meat', requiresQuantity: true, commonUnits: ['lb'] },

  // Bakery
  { name: 'Bread', category: 'bakery', requiresQuantity: false },
  { name: 'Tortillas', category: 'bakery', requiresQuantity: true, commonUnits: ['pieces'] },
  { name: 'Bagels', category: 'bakery', requiresQuantity: true, commonUnits: ['pieces'] },

  // Pantry Staples
  { name: 'Flour', category: 'pantry', requiresQuantity: true, commonUnits: ['cups', 'lb'] },
  { name: 'Sugar', category: 'pantry', requiresQuantity: true, commonUnits: ['cups', 'lb'] },
  { name: 'Brown Sugar', category: 'pantry', requiresQuantity: true, commonUnits: ['cups', 'lb'] },
  { name: 'Rice', category: 'pantry', requiresQuantity: true, commonUnits: ['cups', 'lb'] },
  { name: 'Pasta', category: 'pantry', requiresQuantity: true, commonUnits: ['oz', 'lb', 'boxes'] },
  { name: 'Olive Oil', category: 'pantry', requiresQuantity: false },
  { name: 'Vegetable Oil', category: 'pantry', requiresQuantity: false },
  { name: 'Chicken Broth', category: 'pantry', requiresQuantity: true, commonUnits: ['cups', 'cans'] },
  { name: 'Beef Broth', category: 'pantry', requiresQuantity: true, commonUnits: ['cups', 'cans'] },
  { name: 'Canned Tomatoes', category: 'pantry', requiresQuantity: true, commonUnits: ['cans', 'oz'] },
  { name: 'Black Beans', category: 'pantry', requiresQuantity: true, commonUnits: ['cans', 'oz'] },
  { name: 'Kidney Beans', category: 'pantry', requiresQuantity: true, commonUnits: ['cans', 'oz'] },
  { name: 'Chickpeas', category: 'pantry', requiresQuantity: true, commonUnits: ['cans', 'oz'] },

  // Spices & Seasonings (typically don't need quantities)
  { name: 'Salt', category: 'spices', requiresQuantity: false },
  { name: 'Black Pepper', category: 'spices', requiresQuantity: false },
  { name: 'Garlic Powder', category: 'spices', requiresQuantity: false },
  { name: 'Onion Powder', category: 'spices', requiresQuantity: false },
  { name: 'Paprika', category: 'spices', requiresQuantity: false },
  { name: 'Cumin', category: 'spices', requiresQuantity: false },
  { name: 'Oregano', category: 'spices', requiresQuantity: false },
  { name: 'Basil', category: 'spices', requiresQuantity: false },
  { name: 'Thyme', category: 'spices', requiresQuantity: false },
  { name: 'Rosemary', category: 'spices', requiresQuantity: false },
  { name: 'Cinnamon', category: 'spices', requiresQuantity: false },
  { name: 'Chili Powder', category: 'spices', requiresQuantity: false },
  { name: 'Bay Leaves', category: 'spices', requiresQuantity: false },
  { name: 'Red Pepper Flakes', category: 'spices', requiresQuantity: false },

  // Condiments
  { name: 'Ketchup', category: 'condiments', requiresQuantity: false },
  { name: 'Mustard', category: 'condiments', requiresQuantity: false },
  { name: 'Mayonnaise', category: 'condiments', requiresQuantity: false },
  { name: 'Soy Sauce', category: 'condiments', requiresQuantity: false },
  { name: 'Hot Sauce', category: 'condiments', requiresQuantity: false },
  { name: 'Worcestershire Sauce', category: 'condiments', requiresQuantity: false },
  { name: 'Balsamic Vinegar', category: 'condiments', requiresQuantity: false },
  { name: 'Honey', category: 'condiments', requiresQuantity: false },

  // Frozen
  { name: 'Frozen Vegetables', category: 'frozen', requiresQuantity: true, commonUnits: ['bags', 'oz'] },
  { name: 'Ice Cream', category: 'frozen', requiresQuantity: true, commonUnits: ['pints', 'quarts'] },
  { name: 'Frozen Pizza', category: 'frozen', requiresQuantity: true, commonUnits: ['pieces'] },

  // Beverages
  { name: 'Orange Juice', category: 'beverages', requiresQuantity: true, commonUnits: ['cups', 'oz'] },
  { name: 'Coffee', category: 'beverages', requiresQuantity: false },
  { name: 'Tea', category: 'beverages', requiresQuantity: false },

  // Snacks
  { name: 'Chips', category: 'snacks', requiresQuantity: true, commonUnits: ['bags'] },
  { name: 'Crackers', category: 'snacks', requiresQuantity: false },
];

/**
 * Get ingredients grouped by category
 */
export function getIngredientsByCategory(): Record<string, CommonIngredient[]> {
  const grouped: Record<string, CommonIngredient[]> = {};
  
  COMMON_INGREDIENTS.forEach(ingredient => {
    if (!grouped[ingredient.category]) {
      grouped[ingredient.category] = [];
    }
    grouped[ingredient.category].push(ingredient);
  });
  
  return grouped;
}

/**
 * Category display names
 */
export const CATEGORY_NAMES: Record<string, string> = {
  produce: 'Produce',
  dairy: 'Dairy',
  meat: 'Meat & Seafood',
  bakery: 'Bakery',
  pantry: 'Pantry Staples',
  frozen: 'Frozen',
  beverages: 'Beverages',
  snacks: 'Snacks',
  spices: 'Spices & Herbs',
  condiments: 'Condiments',
  other: 'Other',
};

