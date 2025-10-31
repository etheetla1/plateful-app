import type { GroceryItem } from '../types/grocery';

/**
 * Parses a recipe ingredient string into structured grocery item data.
 * 
 * Handles formats like:
 * - "500g chicken breast"
 * - "2 cups flour"
 * - "1 lb ground beef"
 * - "3 eggs"
 * - "1 onion, finely chopped"
 * - "2 tbsp olive oil"
 * 
 * @param ingredientString - Raw ingredient string from recipe
 * @returns Parsed ingredient data (without id, userID, listID, completed, timestamps)
 */
export function parseIngredient(
  ingredientString: string
): Omit<GroceryItem, 'id' | 'userID' | 'listID' | 'completed' | 'createdAt' | 'updatedAt'> {
  if (!ingredientString || typeof ingredientString !== 'string') {
    return {
      name: ingredientString || 'Unknown',
      quantity: 1,
      unit: '',
      category: undefined,
      notes: '',
    };
  }

  const trimmed = ingredientString.trim();
  if (!trimmed) {
    return {
      name: 'Unknown',
      quantity: 1,
      unit: '',
      category: undefined,
      notes: '',
    };
  }

  // Common unit patterns (order matters - longer/more specific first)
  const unitPatterns = [
    /(\d+(?:\.\d+)?)\s*(tbsp|tablespoon|tablespoons|T|Tbsp)\b/i,
    /(\d+(?:\.\d+)?)\s*(tsp|teaspoon|teaspoons|t|Tsp)\b/i,
    /(\d+(?:\.\d+)?)\s*(cups?|cup)\b/i,
    /(\d+(?:\.\d+)?)\s*(fl\s*oz|fluid\s*ounce|fluid\s*ounces)\b/i,
    /(\d+(?:\.\d+)?)\s*(oz|ounce|ounces)\b/i,
    /(\d+(?:\.\d+)?)\s*(lb|lbs|pound|pounds)\b/i,
    /(\d+(?:\.\d+)?)\s*(kg|kilogram|kilograms)\b/i,
    /(\d+(?:\.\d+)?)\s*(g|gram|grams)\b/i,
    /(\d+(?:\.\d+)?)\s*(ml|milliliter|milliliters|millilitre|millilitres)\b/i,
    /(\d+(?:\.\d+)?)\s*(l|liter|liters|litre|litres)\b/i,
    /(\d+(?:\.\d+)?)\s*(pieces?|piece)\b/i,
    /(\d+(?:\.\d+)?)\s*(cloves?|clove)\b/i,
    /(\d+(?:\.\d+)?)\s*(strips?|strip)\b/i,
    /(\d+(?:\.\d+)?)\s*(boxes?|box)\b/i,
    /(\d+(?:\.\d+)?)\s*(cans?|can)\b/i,
    /(\d+(?:\.\d+)?)\s*(bunches?|bunch)\b/i,
  ];

  // Try to match unit patterns
  let quantity = 1;
  let unit = '';
  let name = trimmed;
  let notes = '';

  for (const pattern of unitPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const qty = parseFloat(match[1]);
      if (!isNaN(qty) && qty > 0) {
        quantity = qty;
        unit = match[2].toLowerCase();
        // Normalize common variations
        if (unit === 'tablespoon' || unit === 'tablespoons' || unit === 't' || unit === 'tbsp') {
          unit = 'tbsp';
        } else if (unit === 'teaspoon' || unit === 'teaspoons' || unit === 'tsp') {
          unit = 'tsp';
        } else if (unit === 'cup' || unit === 'cups') {
          unit = 'cups';
        } else if (unit === 'ounce' || unit === 'ounces') {
          unit = 'oz';
        } else if (unit === 'pound' || unit === 'pounds' || unit === 'lbs') {
          unit = 'lb';
        } else if (unit === 'gram' || unit === 'grams') {
          unit = 'g';
        } else if (unit === 'kilogram' || unit === 'kilograms') {
          unit = 'kg';
        } else if (unit === 'milliliter' || unit === 'milliliters' || unit === 'millilitre' || unit === 'millilitres') {
          unit = 'ml';
        } else if (unit === 'liter' || unit === 'liters' || unit === 'litre' || unit === 'litres') {
          unit = 'l';
        } else if (unit === 'piece' || unit === 'pieces') {
          unit = 'pieces';
        } else if (unit === 'clove' || unit === 'cloves') {
          unit = 'cloves';
        } else if (unit === 'strip' || unit === 'strips') {
          unit = 'strips';
        } else if (unit === 'box' || unit === 'boxes') {
          unit = 'boxes';
        } else if (unit === 'can' || unit === 'cans') {
          unit = 'cans';
        } else if (unit === 'bunch' || unit === 'bunches') {
          unit = 'bunches';
        }
        // Remove the matched part from the string
        name = trimmed.replace(pattern, '').trim();
        break;
      }
    }
  }

  // If no unit pattern matched, try to find a number at the start
  if (quantity === 1 && unit === '') {
    const numberMatch = trimmed.match(/^(\d+(?:\/\d+)?(?:\.\d+)?)\s+/);
    if (numberMatch) {
      const fractionOrNumber = numberMatch[1];
      if (fractionOrNumber.includes('/')) {
        const [num, den] = fractionOrNumber.split('/').map(Number);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
          quantity = num / den;
        } else {
          quantity = parseFloat(fractionOrNumber) || 1;
        }
      } else {
        quantity = parseFloat(fractionOrNumber) || 1;
      }
      name = trimmed.replace(numberMatch[0], '').trim();
    }
  }

  // Extract notes (after comma or parentheses)
  const commaIndex = name.indexOf(',');
  const parenMatch = name.match(/^([^(]+)\s*\(([^)]+)\)/);
  
  if (parenMatch) {
    notes = parenMatch[2].trim();
    name = parenMatch[1].trim();
  } else if (commaIndex > 0) {
    const parts = name.split(',').map(p => p.trim());
    name = parts[0];
    notes = parts.slice(1).join(', ');
  }

  // Clean up name - remove extra whitespace, trailing commas
  name = name.replace(/\s+/g, ' ').trim().replace(/,$/, '');

  // If name is empty after parsing, use the original string as name
  if (!name) {
    name = trimmed;
    quantity = 1;
    unit = '';
  }

  return {
    name,
    quantity,
    unit,
    category: undefined, // Category will be determined later or by user
    notes: notes || '',
  };
}

/**
 * Parses multiple ingredient strings into grocery items.
 * 
 * @param ingredientStrings - Array of ingredient strings
 * @returns Array of parsed ingredient data
 */
export function parseIngredients(
  ingredientStrings: string[]
): Array<Omit<GroceryItem, 'id' | 'userID' | 'listID' | 'completed' | 'createdAt' | 'updatedAt'>> {
  return ingredientStrings.map(parseIngredient);
}

