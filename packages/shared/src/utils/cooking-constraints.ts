/**
 * Types for cooking constraint detection and warnings.
 */

export interface CookingConstraints {
  hasCapacityLimits: boolean;
  hasBaking: boolean;
  equipment: string[];
  confidence: number;
}

export interface ScalingWarning {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  category: 'capacity' | 'timing' | 'baking';
}

/**
 * Equipment keywords that indicate capacity limitations.
 */
const CAPACITY_LIMITED_EQUIPMENT = [
  'wok',
  'pan',
  'pot',
  'skillet',
  'air fryer',
  'airfryer',
  'frying pan',
  'saucepan',
  'sheet pan',
  'roasting pan',
  'baking dish',
  'baking pan',
  'casserole dish',
  'dutch oven',
  'sauté pan',
];

/**
 * Baking-related keywords.
 */
const BAKING_KEYWORDS = [
  'bake',
  'baking',
  'baked',
  'oven',
  'preheat',
  'temperature',
  'degrees',
  '350f',
  '400f',
  '450f',
  '350°f',
  '400°f',
  '450°f',
  '350 f',
  '400 f',
  '450 f',
];

/**
 * Constraint phrases that indicate capacity limitations.
 */
const CONSTRAINT_PHRASES = [
  'single layer',
  'in one',
  'fit in',
  'arrange in',
  'in a single',
  'one pan',
  'one pot',
  'batch',
  'batches',
  'capacity',
  'crowded',
  'overcrowded',
];

/**
 * Detects cooking constraints in recipe instructions, title, and description.
 */
export function detectCookingConstraints(
  instructions: string[],
  title?: string,
  description?: string
): CookingConstraints {
  // Combine all text sources for detection
  const allTexts: string[] = [];
  
  if (instructions && instructions.length > 0) {
    allTexts.push(instructions.join(' ').toLowerCase());
  }
  
  if (title) {
    allTexts.push(title.toLowerCase());
  }
  
  if (description) {
    allTexts.push(description.toLowerCase());
  }

  if (allTexts.length === 0) {
    return {
      hasCapacityLimits: false,
      hasBaking: false,
      equipment: [],
      confidence: 0,
    };
  }

  const allText = allTexts.join(' ');
  const equipment: string[] = [];
  let hasCapacityLimits = false;
  let hasBaking = false;

  // Check for capacity-limited equipment
  for (const eq of CAPACITY_LIMITED_EQUIPMENT) {
    if (allText.includes(eq)) {
      equipment.push(eq);
      hasCapacityLimits = true;
    }
  }

  // Check for constraint phrases
  for (const phrase of CONSTRAINT_PHRASES) {
    if (allText.includes(phrase)) {
      hasCapacityLimits = true;
      break;
    }
  }

  // Check for baking - ONLY flag if baked good name appears in title
  // This is the most reliable indicator and avoids false positives from generic oven terms
  const bakedGoodNames = ['cake', 'cakes', 'muffin', 'muffins', 'cookie', 'cookies', 'brownie', 'brownies', 'pie', 'pies', 'bread', 'loaf', 'loaves', 'pastry', 'pastries', 'scone', 'scones', 'biscuit', 'biscuits', 'tart', 'tarts', 'cupcake', 'cupcakes'];
  
  // Only check title - this is the most reliable indicator
  if (title) {
    const titleLower = title.toLowerCase();
    for (const name of bakedGoodNames) {
      if (titleLower.includes(name)) {
        hasBaking = true;
        break;
      }
    }
  }

  // Calculate confidence based on number of indicators
  let confidence = 0;
  if (equipment.length > 0) confidence += 0.3;
  if (hasBaking) confidence += 0.3; // Increased weight for baking detection
  // Check for constraint phrases
  const foundPhrases = CONSTRAINT_PHRASES.filter(p => allText.includes(p)).length;
  if (foundPhrases > 0) confidence += Math.min(foundPhrases * 0.2, 0.5);
  
  confidence = Math.min(confidence, 1.0);

  return {
    hasCapacityLimits,
    hasBaking,
    equipment: [...new Set(equipment)], // Remove duplicates
    confidence,
  };
}

/**
 * Generates scaling warnings based on constraints and portion changes.
 */
export function checkScalingConstraints(
  originalPortions: number,
  targetPortions: number,
  constraints: CookingConstraints
): ScalingWarning[] {
  const warnings: ScalingWarning[] = [];
  const scaleFactor = targetPortions / originalPortions;
  const isScalingUp = scaleFactor > 1;
  const isScalingDown = scaleFactor < 1;
  
  // Calculate percentage change
  const percentChange = Math.abs(scaleFactor - 1);
  // Show warnings for any significant change (20% or more, or at least 2 servings difference)
  const minServingsDiff = Math.abs(targetPortions - originalPortions);
  const isSignificantScaling = percentChange >= 0.2 || minServingsDiff >= 2;

  // Always show timing warning for ANY scaling change
  // This ensures users are aware of scaling considerations
  if (originalPortions !== targetPortions) {
    const changeText = isScalingUp 
      ? 'increase when scaling up, but not proportionally. For example, doubling portions doesn\'t mean double time.'
      : 'decrease when scaling down, but not proportionally.';
    
    warnings.push({
      severity: 'info',
      message: `Cooking times may ${changeText} Monitor food closely and adjust as needed.`,
      category: 'timing',
    });
  }

  // For significant scaling, also show capacity and baking warnings
  if (!isSignificantScaling) {
    return warnings; // Return with just timing warning for small changes
  }

  // Capacity constraint warning - show if equipment has capacity limits
  if (constraints.hasCapacityLimits) {
    if (isScalingUp) {
      warnings.push({
        severity: 'warning',
        message: 'This recipe uses equipment with limited capacity (wok, pan, air fryer, pot, baking dish, etc.). You may need to cook in batches or use larger cookware.',
        category: 'capacity',
      });
    } else if (isScalingDown) {
      warnings.push({
        severity: 'info',
        message: 'This recipe uses equipment with limited capacity. Smaller portions may require adjusted cookware sizes or cooking times.',
        category: 'capacity',
      });
    }
  }

  // Baking-specific warning - show if baking detected (up or down)
  if (constraints.hasBaking) {
    if (isScalingUp) {
      warnings.push({
        severity: 'warning',
        message: 'Baking especially requires careful consideration - pan sizes, heat distribution, and timing all matter. You may need multiple pans or larger bakeware.',
        category: 'baking',
      });
    } else if (isScalingDown) {
      warnings.push({
        severity: 'warning',
        message: 'Baking especially requires careful consideration - pan sizes, heat distribution, and timing all matter. Scaling down may require different pan sizes or adjusted baking times.',
        category: 'baking',
      });
    }
  }

  return warnings;
}

