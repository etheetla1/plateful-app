import { parseIngredient } from './ingredient-parser';
import type { RecipeNutrition } from '../types/recipe';

/**
 * Extracts the number of portions from a portion string.
 * Examples: "4 servings" -> 4, "6" -> 6, "serves 8" -> 8
 */
export function extractPortionNumber(portions: string): number {
  if (!portions || typeof portions !== 'string') {
    return 4; // Default fallback
  }

  // Try to match numbers in the string
  const numberMatch = portions.match(/(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    const num = parseFloat(numberMatch[1]);
    if (!isNaN(num) && num > 0) {
      return Math.round(num);
    }
  }

  return 4; // Default fallback
}

/**
 * Calculates the scale factor between original and target portions.
 */
export function calculateScaleFactor(originalPortions: number, targetPortions: number): number {
  if (originalPortions <= 0 || targetPortions <= 0) {
    return 1;
  }
  return targetPortions / originalPortions;
}

/**
 * Rounds a measurement value to a reasonable cooking measurement.
 * Different units have different rounding rules.
 */
export function roundToReasonableMeasurement(value: number, unit: string): number {
  if (value <= 0 || isNaN(value)) {
    return value;
  }

  const normalizedUnit = unit.toLowerCase().trim();

  // Small volume measurements (tsp, tbsp) - round to fractions
  if (normalizedUnit === 'tsp' || normalizedUnit === 'teaspoon' || normalizedUnit === 'teaspoons' ||
      normalizedUnit === 'tbsp' || normalizedUnit === 'tablespoon' || normalizedUnit === 'tablespoons') {
    return roundToFraction(value, [0.25, 0.33, 0.5, 0.67, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0]);
  }

  // Medium volume (cups, fl oz) - round to 0.25 increments
  if (normalizedUnit === 'cups' || normalizedUnit === 'cup' ||
      normalizedUnit === 'fl oz' || normalizedUnit === 'fluid ounce' || normalizedUnit === 'fluid ounces') {
    return roundToIncrement(value, 0.25);
  }

  // Weight (g, oz, lb, kg) - round to 0.25 increments for small amounts, more precision for larger
  if (normalizedUnit === 'g' || normalizedUnit === 'gram' || normalizedUnit === 'grams' ||
      normalizedUnit === 'oz' || normalizedUnit === 'ounce' || normalizedUnit === 'ounces') {
    if (value < 10) {
      return roundToIncrement(value, 0.25);
    } else if (value < 100) {
      return roundToIncrement(value, 0.5);
    } else {
      return Math.round(value);
    }
  }

  if (normalizedUnit === 'lb' || normalizedUnit === 'lbs' || normalizedUnit === 'pound' || normalizedUnit === 'pounds') {
    return roundToIncrement(value, 0.25);
  }

  if (normalizedUnit === 'kg' || normalizedUnit === 'kilogram' || normalizedUnit === 'kilograms') {
    if (value < 1) {
      return roundToIncrement(value, 0.1);
    } else {
      return roundToIncrement(value, 0.25);
    }
  }

  // Count items (pieces, cloves, eggs) - always whole numbers
  if (normalizedUnit === 'pieces' || normalizedUnit === 'piece' ||
      normalizedUnit === 'cloves' || normalizedUnit === 'clove' ||
      normalizedUnit === 'eggs' || normalizedUnit === 'egg' ||
      normalizedUnit === 'strips' || normalizedUnit === 'strip' ||
      normalizedUnit === 'boxes' || normalizedUnit === 'box' ||
      normalizedUnit === 'cans' || normalizedUnit === 'can' ||
      normalizedUnit === 'bunches' || normalizedUnit === 'bunch') {
    return Math.round(value);
  }

  // Volume (ml, l) - similar to weight
  if (normalizedUnit === 'ml' || normalizedUnit === 'milliliter' || normalizedUnit === 'milliliters' ||
      normalizedUnit === 'millilitre' || normalizedUnit === 'millilitres') {
    if (value < 100) {
      return roundToIncrement(value, 5);
    } else {
      return Math.round(value);
    }
  }

  if (normalizedUnit === 'l' || normalizedUnit === 'liter' || normalizedUnit === 'liters' ||
      normalizedUnit === 'litre' || normalizedUnit === 'litres') {
    return roundToIncrement(value, 0.25);
  }

  // Default: round to 0.25 increments for small values, whole numbers for larger
  if (value < 1) {
    return roundToIncrement(value, 0.25);
  } else {
    return Math.round(value);
  }
}

/**
 * Rounds a value to the nearest value in a list of preferred values.
 */
function roundToFraction(value: number, preferredValues: number[]): number {
  let closest = preferredValues[0];
  let minDiff = Math.abs(value - closest);

  for (const pref of preferredValues) {
    const diff = Math.abs(value - pref);
    if (diff < minDiff) {
      minDiff = diff;
      closest = pref;
    }
  }

  return closest;
}

/**
 * Rounds a value to the nearest increment.
 */
function roundToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

/**
 * Formats a number as a fraction string (e.g., 0.5 -> "1/2", 0.33 -> "1/3").
 */
function formatAsFraction(value: number): string {
  const tolerance = 0.01;
  const fractions: Array<[number, string]> = [
    [0.125, '1/8'],
    [0.25, '1/4'],
    [0.33, '1/3'],
    [0.5, '1/2'],
    [0.67, '2/3'],
    [0.75, '3/4'],
  ];

  for (const [decimal, fraction] of fractions) {
    if (Math.abs(value - decimal) < tolerance) {
      return fraction;
    }
  }

  // Check for whole numbers with fractions
  const whole = Math.floor(value);
  const remainder = value - whole;
  if (whole > 0 && remainder > tolerance) {
    for (const [decimal, fraction] of fractions) {
      if (Math.abs(remainder - decimal) < tolerance) {
        return `${whole} ${fraction}`;
      }
    }
  }

  // Check for just whole numbers
  if (Math.abs(value - Math.round(value)) < tolerance) {
    return Math.round(value).toString();
  }

  return value.toString();
}

/**
 * Formats a scaled quantity for display.
 */
function formatQuantity(quantity: number, unit: string): string {
  const normalizedUnit = unit.toLowerCase().trim();

  // For tsp/tbsp, prefer fractions for small values
  if (normalizedUnit === 'tsp' || normalizedUnit === 'teaspoon' || normalizedUnit === 'teaspoons' ||
      normalizedUnit === 'tbsp' || normalizedUnit === 'tablespoon' || normalizedUnit === 'tablespoons') {
    if (quantity < 3) {
      return formatAsFraction(quantity);
    }
  }

  // For cups, prefer fractions for values less than 2
  if (normalizedUnit === 'cups' || normalizedUnit === 'cup') {
    if (quantity < 2) {
      return formatAsFraction(quantity);
    }
  }

  // For whole numbers, just return the number
  if (Math.abs(quantity - Math.round(quantity)) < 0.01) {
    return Math.round(quantity).toString();
  }

  // For decimals, show up to 2 decimal places, removing trailing zeros
  return quantity.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Scales an ingredient string based on portion changes.
 */
export function scaleIngredient(
  ingredient: string,
  originalPortions: number,
  targetPortions: number
): string {
  if (!ingredient || originalPortions <= 0 || targetPortions <= 0) {
    return ingredient;
  }

  // If portions are the same, return original
  if (originalPortions === targetPortions) {
    return ingredient;
  }

  // Parse the ingredient
  const parsed = parseIngredient(ingredient);

  // If we couldn't parse a quantity (still 1 with no unit), return original
  if (parsed.quantity === 1 && !parsed.unit && ingredient.trim() !== parsed.name) {
    // Might have a number but no standard unit - try to preserve it
    return ingredient;
  }

  // Calculate scale factor
  const scaleFactor = calculateScaleFactor(originalPortions, targetPortions);
  
  // Scale the quantity
  const scaledQuantity = parsed.quantity * scaleFactor;

  // Round to reasonable measurement
  const roundedQuantity = roundToReasonableMeasurement(scaledQuantity, parsed.unit);

  // Format the quantity
  const formattedQuantity = formatQuantity(roundedQuantity, parsed.unit);

  // Reconstruct the ingredient string
  let result = '';
  
  if (formattedQuantity && formattedQuantity !== '1' || parsed.unit) {
    result = `${formattedQuantity}${parsed.unit ? ` ${parsed.unit}` : ''}`;
  }
  
  if (parsed.name) {
    result = result ? `${result} ${parsed.name}` : parsed.name;
  }
  
  if (parsed.notes) {
    result = result ? `${result}, ${parsed.notes}` : parsed.notes;
  }

  return result.trim() || ingredient; // Fallback to original if result is empty
}

/**
 * Parses a nutrition value string (e.g., "38g" -> 38).
 */
function parseNutritionValue(value: string): number {
  if (!value || typeof value !== 'string') {
    return 0;
  }
  
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    return isNaN(num) ? 0 : num;
  }
  
  return 0;
}

/**
 * Formats a nutrition value back to string (e.g., 38 -> "38g").
 */
function formatNutritionValue(value: number, originalString: string): string {
  // Extract unit from original string if present
  const unitMatch = originalString.match(/\d+(?:\.\d+)?\s*(\w+)/);
  const unit = unitMatch ? unitMatch[1] : '';
  
  // Round appropriately
  const rounded = Math.round(value * 10) / 10;
  
  if (unit) {
    return `${rounded}${unit}`;
  }
  
  return rounded.toString();
}

/**
 * Scales nutrition values based on scale factor.
 * Note: calories_per_portion stays the same (it's per portion).
 * Other values (protein, carbs, fat) are scaled - assuming they represent totals or per portion.
 */
export function scaleNutrition(
  nutrition: RecipeNutrition,
  scaleFactor: number
): RecipeNutrition {
  if (scaleFactor === 1) {
    return nutrition;
  }

  const scaled: RecipeNutrition = {
    calories_per_portion: nutrition.calories_per_portion, // Per portion stays the same
  };

  // Scale other nutrition values - assuming they represent per portion values
  // User sees scaled total nutrition when portions are adjusted
  if (nutrition.protein) {
    const value = parseNutritionValue(nutrition.protein) * scaleFactor;
    scaled.protein = formatNutritionValue(value, nutrition.protein);
  }

  if (nutrition.carbs) {
    const value = parseNutritionValue(nutrition.carbs) * scaleFactor;
    scaled.carbs = formatNutritionValue(value, nutrition.carbs);
  }

  if (nutrition.fat) {
    const value = parseNutritionValue(nutrition.fat) * scaleFactor;
    scaled.fat = formatNutritionValue(value, nutrition.fat);
  }

  return scaled;
}

