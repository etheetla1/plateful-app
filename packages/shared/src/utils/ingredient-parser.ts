import type { GroceryItem } from '../types/grocery';

/**
 * Common ingredient keywords to help identify the main ingredient name.
 * These are typically nouns that appear in ingredient lists.
 */
const COMMON_INGREDIENT_KEYWORDS = [
  // Meats
  'chicken', 'beef', 'pork', 'turkey', 'lamb', 'duck', 'ham', 'bacon', 'sausage',
  'breast', 'thigh', 'wing', 'drumstick', 'leg', 'steak', 'chop', 'roast',
  'ground', 'minced', 'sliced', 'diced', 'cubed',
  // Seafood
  'salmon', 'tuna', 'cod', 'shrimp', 'prawn', 'crab', 'lobster', 'scallop', 'mussel',
  'fish', 'seafood',
  // Produce
  'onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'pepper', 'peppers',
  'mushroom', 'lettuce', 'spinach', 'kale', 'cabbage', 'broccoli', 'cauliflower',
  'zucchini', 'squash', 'eggplant', 'cucumber', 'avocado', 'corn',
  'apple', 'banana', 'orange', 'lemon', 'lime', 'berry', 'berries',
  // Dairy
  'milk', 'cream', 'cheese', 'butter', 'yogurt', 'sour cream', 'eggs', 'egg',
  // Pantry
  'flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'soy sauce', 'rice', 'pasta',
  'noodle', 'bread', 'tortilla', 'cracker', 'chip',
  // Herbs & Spices
  'basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro', 'dill', 'mint',
  'paprika', 'cumin', 'coriander', 'turmeric', 'cinnamon', 'nutmeg', 'ginger',
];

/**
 * Common descriptor words that typically come before the ingredient name.
 * These are adjectives/adverbs that describe the ingredient.
 */
const COMMON_DESCRIPTORS = [
  'boneless', 'skinless', 'bone-in', 'skin-on', 'trimmed', 'untrimmed',
  'fresh', 'frozen', 'dried', 'canned', 'jarred', 'packed',
  'whole', 'chopped', 'diced', 'sliced', 'minced', 'grated', 'shredded', 'julienned',
  'finely', 'roughly', 'coarsely', 'thinly', 'thickly',
  'large', 'small', 'medium', 'extra large', 'extra-small',
  'organic', 'conventional',
];

/**
 * Normalizes a unit string to a standard format.
 */
function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase();
  if (lower === 'tablespoon' || lower === 'tablespoons' || lower === 't' || lower === 'tbsp') {
    return 'tbsp';
  } else if (lower === 'teaspoon' || lower === 'teaspoons' || lower === 'tsp') {
    return 'tsp';
  } else if (lower === 'cup' || lower === 'cups') {
    return 'cups';
  } else if (lower === 'ounce' || lower === 'ounces') {
    return 'oz';
  } else if (lower === 'pound' || lower === 'pounds' || lower === 'lbs') {
    return 'lb';
  } else if (lower === 'gram' || lower === 'grams') {
    return 'g';
  } else if (lower === 'kilogram' || lower === 'kilograms') {
    return 'kg';
  } else if (lower === 'milliliter' || lower === 'milliliters' || lower === 'millilitre' || lower === 'millilitres') {
    return 'ml';
  } else if (lower === 'liter' || lower === 'liters' || lower === 'litre' || lower === 'litres') {
    return 'l';
  } else if (lower === 'piece' || lower === 'pieces') {
    return 'pieces';
  } else if (lower === 'clove' || lower === 'cloves') {
    return 'cloves';
  } else if (lower === 'strip' || lower === 'strips') {
    return 'strips';
  } else if (lower === 'box' || lower === 'boxes') {
    return 'boxes';
  } else if (lower === 'can' || lower === 'cans') {
    return 'cans';
  } else if (lower === 'bunch' || lower === 'bunches') {
    return 'bunches';
  } else if (lower === 'inch' || lower === 'inches' || lower === 'in') {
    return 'inch';
  } else if (lower === 'knob' || lower === 'knobs') {
    return 'knob';
  }
  return lower;
}

/**
 * Attempts to identify the main ingredient name from a string that may contain descriptors.
 * Uses heuristics to find the core ingredient noun.
 */
function extractIngredientName(text: string): { name: string; descriptors: string[] } {
  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/);
  
  // First, check for comma-separated format: "descriptors, ingredient name"
  // This is common in recipes: "bone-in, skin-on, chicken thighs"
  const commaIndex = text.indexOf(',');
  if (commaIndex > 0 && commaIndex < text.length - 5) {
    const beforeComma = text.substring(0, commaIndex).trim();
    const afterComma = text.substring(commaIndex + 1).trim();
    
    // Check if after comma has ingredient keywords
    const afterLower = afterComma.toLowerCase();
    const hasIngredientKeyword = COMMON_INGREDIENT_KEYWORDS.some(k => afterLower.includes(k));
    
    if (hasIngredientKeyword) {
      // Before comma are descriptors, after comma is ingredient name
      const descriptors = beforeComma.split(/\s*,\s*/)
        .map(d => d.trim())
        .filter(d => d.length > 0 && !d.match(/^\d+$/)); // Filter out standalone numbers
      
      // Extract just the ingredient name from after comma (might have multiple commas)
      const afterCommaParts = afterComma.split(',').map(p => p.trim());
      const ingredientPart = afterCommaParts.find(part => 
        COMMON_INGREDIENT_KEYWORDS.some(k => part.toLowerCase().includes(k))
      ) || afterCommaParts[afterCommaParts.length - 1];
      
      // Add any additional descriptors after the first comma
      const additionalDescriptors = afterCommaParts
        .filter(p => p !== ingredientPart)
        .filter(d => d.length > 0);
      
      return {
        name: ingredientPart.trim(),
        descriptors: [...descriptors, ...additionalDescriptors],
      };
    }
  }
  
  // Find the last significant word/phrase that matches ingredient keywords
  let ingredientEndIndex = -1;
  let ingredientKeyword = '';
  
  // Look for ingredient keywords from right to left (ingredients often come last)
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i].toLowerCase().replace(/[,()]/g, '');
    // Check if this word or a phrase ending with it matches an ingredient keyword
    for (const keyword of COMMON_INGREDIENT_KEYWORDS) {
      if (word.includes(keyword) || keyword.includes(word)) {
        ingredientEndIndex = i;
        ingredientKeyword = keyword;
        break;
      }
    }
    if (ingredientEndIndex !== -1) break;
  }
  
  // If we found an ingredient keyword, extract everything after the last descriptor
  if (ingredientEndIndex !== -1) {
    // Find where descriptors end and ingredient name begins
    // Look for commas or known descriptors before the ingredient keyword
    let nameStartIndex = 0;
    let foundComma = false;
    
    for (let i = 0; i <= ingredientEndIndex; i++) {
      const word = words[i].toLowerCase().replace(/[,()]/g, '');
      
      // If we find a comma before the ingredient, everything before is likely descriptors
      if (words[i].includes(',') && i < ingredientEndIndex) {
        foundComma = true;
        nameStartIndex = i + 1;
        // Continue to find the actual ingredient start
        continue;
      }
      
      // Check if this word is a known descriptor
      const isDescriptor = COMMON_DESCRIPTORS.some(d => 
        d.includes(word) || word.includes(d) || 
        word.match(/^(bone|skin)-(in|on)$/) // Handle "bone-in", "skin-on" etc.
      );
      
      // If we found a comma earlier and this isn't a descriptor, we're in the ingredient name
      if (foundComma && !isDescriptor) {
        nameStartIndex = Math.min(nameStartIndex, i);
        break;
      }
    }
    
    // Extract ingredient name (typically the last 1-3 words containing the keyword)
    const nameWords = words.slice(Math.max(nameStartIndex, ingredientEndIndex - 2), ingredientEndIndex + 1);
    const name = nameWords.join(' ').replace(/[,()]/g, '').trim();
    
    // Everything before the ingredient name is descriptors
    const descriptorWords = words.slice(0, Math.max(nameStartIndex, ingredientEndIndex - 2));
    const descriptorText = descriptorWords.join(' ').replace(/[,()]/g, '').trim();
    const descriptors = descriptorText
      ? descriptorText.split(/\s*,\s*/)
          .map(d => d.trim())
          .filter(d => d.length > 0 && !d.match(/^\d+$/))
      : [];
    
    return { name: name || text, descriptors };
  }
  
  // Last resort: use the whole text as name
  return { name: text, descriptors: [] };
}

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
 * - "1 boneless, skinless, chicken thigh"
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

  // Normalize Unicode fraction characters to regular fractions (e.g., "½" → "1/2")
  let normalizedText = trimmed
    .replace(/½/g, '1/2')
    .replace(/⅓/g, '1/3')
    .replace(/⅔/g, '2/3')
    .replace(/¼/g, '1/4')
    .replace(/¾/g, '3/4')
    .replace(/⅕/g, '1/5')
    .replace(/⅖/g, '2/5')
    .replace(/⅗/g, '3/5')
    .replace(/⅘/g, '4/5')
    .replace(/⅙/g, '1/6')
    .replace(/⅚/g, '5/6')
    .replace(/⅛/g, '1/8')
    .replace(/⅜/g, '3/8')
    .replace(/⅝/g, '5/8')
    .replace(/⅞/g, '7/8');

  // Normalize quantity ranges (e.g., "3-4 tablespoons" → "3.5 tablespoons")
  // Use average of the range, but prefer the first value if it's a simple case
  normalizedText = normalizedText.replace(/(\d+)\s*-\s*(\d+)/g, (match, first, second) => {
    const firstNum = parseInt(first, 10);
    const secondNum = parseInt(second, 10);
    if (!isNaN(firstNum) && !isNaN(secondNum) && firstNum < secondNum) {
      // Use average for ranges
      const avg = (firstNum + secondNum) / 2;
      // Round to reasonable precision (0.25 increments for small values, whole numbers for larger)
      if (avg < 5) {
        return String(Math.round(avg * 4) / 4);
      } else {
        return String(Math.round(avg));
      }
    }
    return match; // Return original if parsing fails
  });

  // Helper function to parse quantity from match (handles mixed fractions and plain numbers)
  const parseQuantityFromMatch = (qtyMatch: string): number => {
    // Handle mixed fractions like "2 1/2"
    const mixedFractionMatch = qtyMatch.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedFractionMatch) {
      const whole = parseInt(mixedFractionMatch[1], 10);
      const num = parseInt(mixedFractionMatch[2], 10);
      const den = parseInt(mixedFractionMatch[3], 10);
      if (!isNaN(whole) && !isNaN(num) && !isNaN(den) && den !== 0) {
        return whole + (num / den);
      }
    }
    
    // Handle simple fractions like "1/4"
    if (qtyMatch.includes('/')) {
      const [num, den] = qtyMatch.split('/').map(Number);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    }
    
    // Handle plain numbers
    return parseFloat(qtyMatch) || 1;
  };

  // Common unit patterns (order matters - longer/more specific first)
  // Updated to handle fractions (1/4, 1/2) and mixed fractions (2 1/2) before units
  const unitPatterns = [
    // Pattern matches: whole numbers, decimals, fractions (1/4), or mixed fractions (2 1/2)
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(tbsp|tablespoon|tablespoons|T|Tbsp)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(tsp|teaspoon|teaspoons|t|Tsp)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(cups?|cup)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(fl\s*oz|fluid\s*ounce|fluid\s*ounces)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(oz|ounce|ounces)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(lb|lbs|pound|pounds)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(kg|kilogram|kilograms)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(g|gram|grams)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(ml|milliliter|milliliters|millilitre|millilitres)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(l|liter|liters|litre|litres)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(pieces?|piece)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(cloves?|clove)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(strips?|strip)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(boxes?|box)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(cans?|can)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(bunches?|bunch)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(inch|inches|in)\b/i,
    /((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(knobs?|knob)\b/i,
  ];

  // Try to match unit patterns
  let quantity = 1;
  let unit = '';
  let remainingText = normalizedText;
  let notes = '';

  for (const pattern of unitPatterns) {
    const match = remainingText.match(pattern);
    if (match) {
      const qty = parseQuantityFromMatch(match[1]);
      if (!isNaN(qty) && qty > 0) {
        quantity = qty;
        unit = normalizeUnit(match[2]);
        remainingText = remainingText.replace(pattern, '').trim();
        break;
      }
    }
  }

  // If no unit pattern matched, try to find a number, fraction, or mixed fraction at the start
  if (quantity === 1 && unit === '') {
    // Try mixed fraction first (e.g., "2 1/2")
    const mixedFractionMatch = remainingText.match(/^(\d+)\s+(\d+)\/(\d+)\s+/);
    if (mixedFractionMatch) {
      const whole = parseInt(mixedFractionMatch[1], 10);
      const num = parseInt(mixedFractionMatch[2], 10);
      const den = parseInt(mixedFractionMatch[3], 10);
      if (!isNaN(whole) && !isNaN(num) && !isNaN(den) && den !== 0) {
        quantity = whole + (num / den);
        remainingText = remainingText.replace(mixedFractionMatch[0], '').trim();
        
        // Check for units after the mixed fraction
        for (const pattern of unitPatterns) {
          const match = remainingText.match(pattern);
          if (match) {
            const unitMatch = match[2].toLowerCase();
            unit = normalizeUnit(unitMatch);
            remainingText = remainingText.replace(pattern, '').trim();
            break;
          }
        }
      }
    } else {
      // Try simple fraction or number
      const numberMatch = remainingText.match(/^(\d+(?:\/\d+)?(?:\.\d+)?)\s+/);
      if (numberMatch) {
        quantity = parseQuantityFromMatch(numberMatch[1]);
        remainingText = remainingText.replace(numberMatch[0], '').trim();
        
        // After extracting a fraction/number, check again for units in the remaining text
        for (const pattern of unitPatterns) {
          const match = remainingText.match(pattern);
          if (match) {
            // Found a unit after the fraction - use it
            const unitMatch = match[2].toLowerCase();
            unit = normalizeUnit(unitMatch);
            remainingText = remainingText.replace(pattern, '').trim();
            break;
          }
        }
      }
    }
  }

  // Aggressively clean up leftover numeric fragments (3-, 1/, 1-, etc.)
  // These are artifacts from incomplete parsing that should be removed
  remainingText = remainingText
    .replace(/^\d+\s*[-/]\s*/g, '') // Remove patterns like "3-", "1/" at start
    .replace(/\s+\d+\s*[-/]\s*/g, ' ') // Remove patterns like " 3-", " 1/" in middle
    .replace(/\s*[-/]\s*\d+\s*/g, ' ') // Remove patterns like "- 3", "/ 4"
    .replace(/\d+\/\s+/g, '') // Remove incomplete fractions like "1/ "
    .replace(/\d+-\s+/g, '') // Remove incomplete ranges like "3- "
    .trim();

  // Handle parentheses (typically contain notes/preparation instructions)
  const parenMatch = remainingText.match(/^([^(]+)\s*\(([^)]+)\)/);
  if (parenMatch) {
    const parenNotes = parenMatch[2].trim();
    remainingText = parenMatch[1].trim();
    if (parenNotes) {
      notes = parenNotes;
    }
  }

  // Extract ingredient name and descriptors using smart parsing
  const { name: extractedName, descriptors } = extractIngredientName(remainingText);
  
  // Combine descriptors with existing notes
  const allDescriptors = [...descriptors];
  if (notes) {
    allDescriptors.push(notes);
  }
  
  // Final notes should be all descriptors/prep instructions
  const finalNotes = allDescriptors.join(', ');
  
  // Clean up the ingredient name
  let finalName = extractedName
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/,$/, '')
    .replace(/^,\s*/, '');

  // Remove any leftover numbers from the name that match the parsed quantity
  // This prevents "3 cloves" from showing as "0.75 3 cloves" when scaled
  if (quantity > 0 && unit) {
    // Remove standalone numbers that match the quantity (with some tolerance for rounding)
    const quantityStr = quantity.toString();
    const quantityInt = Math.round(quantity);
    
    // Remove patterns like "3 " or " 3 " that match the quantity
    finalName = finalName
      .replace(new RegExp(`^${quantityInt}\\s+`, 'i'), '') // Remove at start
      .replace(new RegExp(`\\s+${quantityInt}\\s+`, 'i'), ' ') // Remove in middle
      .replace(new RegExp(`\\s+${quantityInt}$`, 'i'), ''); // Remove at end
  }

  // If name is empty after parsing, use the original string as name
  if (!finalName) {
    finalName = trimmed;
    quantity = 1;
    unit = '';
  }

  return {
    name: finalName,
    quantity,
    unit,
    category: undefined, // Category will be determined later or by user
    notes: finalNotes || '',
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

