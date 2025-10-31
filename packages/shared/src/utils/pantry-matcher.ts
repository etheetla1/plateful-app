import type { PantryItem } from '../types/pantry';

export type PantryMatchResult = {
  item: PantryItem | null;
  matchType: 'exact' | 'fuzzy' | null;
};

/**
 * Normalizes a string for comparison by converting to lowercase and removing extra whitespace.
 */
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Finds if a grocery item name matches any pantry item.
 * 
 * Matching logic:
 * - Exact match: Normalized names are identical
 * - Fuzzy match: One name contains the other (e.g., "chicken" contains "chicken breast")
 * 
 * @param groceryItemName - Name of the grocery item to match
 * @param pantryItems - Array of pantry items to search
 * @returns Match result with pantry item and match type, or null if no match
 */
export function findPantryMatch(
  groceryItemName: string,
  pantryItems: PantryItem[]
): PantryMatchResult {
  if (!groceryItemName || !pantryItems || pantryItems.length === 0) {
    return { item: null, matchType: null };
  }

  const normalizedGrocery = normalizeName(groceryItemName);

  // Try exact match first
  for (const pantryItem of pantryItems) {
    const normalizedPantry = normalizeName(pantryItem.name);
    if (normalizedGrocery === normalizedPantry) {
      return {
        item: pantryItem,
        matchType: 'exact',
      };
    }
  }

  // Try fuzzy match (one contains the other)
  for (const pantryItem of pantryItems) {
    const normalizedPantry = normalizeName(pantryItem.name);
    
    // Check if grocery name contains pantry name or vice versa
    // Only consider it a match if one is substantially contained in the other
    // (avoid matches like "onion" matching "union")
    if (normalizedPantry.length >= 4 && normalizedGrocery.length >= 4) {
      if (normalizedGrocery.includes(normalizedPantry) || normalizedPantry.includes(normalizedGrocery)) {
        return {
          item: pantryItem,
          matchType: 'fuzzy',
        };
      }
    }
  }

  return { item: null, matchType: null };
}

/**
 * Checks if a grocery item exists in pantry (exact match only).
 * 
 * @param groceryItemName - Name of the grocery item
 * @param pantryItems - Array of pantry items
 * @returns True if exact match found, false otherwise
 */
export function hasExactPantryMatch(
  groceryItemName: string,
  pantryItems: PantryItem[]
): boolean {
  const match = findPantryMatch(groceryItemName, pantryItems);
  return match.matchType === 'exact';
}

/**
 * Checks if a grocery item has any match (exact or fuzzy) in pantry.
 * 
 * @param groceryItemName - Name of the grocery item
 * @param pantryItems - Array of pantry items
 * @returns True if any match found, false otherwise
 */
export function hasAnyPantryMatch(
  groceryItemName: string,
  pantryItems: PantryItem[]
): boolean {
  const match = findPantryMatch(groceryItemName, pantryItems);
  return match.matchType !== null;
}

