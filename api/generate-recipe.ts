import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversationID, userID, servings = 4, dietaryRestrictions = [] } = req.body;

    if (!conversationID || !userID) {
      return res.status(400).json({ error: 'Missing required fields: conversationID, userID' });
    }

    console.log(`🔄 Generating recipe for user ${userID}, conversation ${conversationID}, servings: ${servings}`);

    // Enhanced recipe generation with serving size support and detailed nutrition
    const enhancedRecipes = [
      {
        title: 'Chicken and Broccoli Stir Fry',
        description: 'A quick and healthy stir fry with tender chicken and crisp broccoli, perfect for busy weeknights',
        prepTime: 15,
        cookTime: 20,
        servings: servings,
        difficulty: 'Easy',
        cuisine: 'Asian',
        ingredients: [
          { name: 'Chicken breast', amount: `${Math.round(servings * 0.25)} lb`, category: 'Meat' },
          { name: 'Broccoli florets', amount: `${Math.round(servings * 0.5)} cups`, category: 'Vegetables' },
          { name: 'Vegetable oil', amount: `${Math.round(servings * 0.5)} tbsp`, category: 'Oils' },
          { name: 'Garlic', amount: `${Math.round(servings * 0.75)} cloves`, category: 'Vegetables' },
          { name: 'Soy sauce', amount: `${Math.round(servings * 0.5)} tbsp`, category: 'Condiments' },
          { name: 'Oyster sauce', amount: `${Math.round(servings * 0.25)} tbsp`, category: 'Condiments' },
          { name: 'Cornstarch', amount: `${Math.round(servings * 0.25)} tsp`, category: 'Pantry' },
          { name: 'Salt and pepper', amount: 'to taste', category: 'Seasonings' }
        ],
        instructions: [
          'Slice chicken breast into thin, bite-sized pieces',
          'Heat oil in a large wok or skillet over high heat',
          'Add chicken and cook until golden brown, about 5-6 minutes',
          'Add minced garlic and cook for 30 seconds until fragrant',
          'Add broccoli florets and stir fry for 3-4 minutes until crisp-tender',
          'In a small bowl, mix soy sauce, oyster sauce, and cornstarch',
          'Pour sauce over chicken and broccoli, toss to coat evenly',
          'Cook for 1-2 minutes until sauce thickens and coats ingredients',
          'Season with salt and pepper to taste, serve immediately over rice'
        ],
        nutrition: {
          calories: Math.round(320 * (servings / 4)),
          protein: Math.round(35 * (servings / 4)),
          carbs: Math.round(12 * (servings / 4)),
          fat: Math.round(14 * (servings / 4)),
          fiber: Math.round(4 * (servings / 4)),
          sugar: Math.round(8 * (servings / 4))
        },
        tags: ['quick', 'healthy', 'asian', 'stir-fry', 'high-protein', 'low-carb'],
        imageUrl: null
      },
      {
        title: 'Creamy Chicken Alfredo Pasta',
        description: 'Rich and indulgent pasta with tender chicken in a velvety garlic parmesan sauce',
        prepTime: 10,
        cookTime: 25,
        servings: servings,
        difficulty: 'Medium',
        cuisine: 'Italian',
        ingredients: [
          { name: 'Fettuccine pasta', amount: `${Math.round(servings * 3)} oz`, category: 'Grains' },
          { name: 'Chicken breast', amount: `${Math.round(servings * 0.25)} lb`, category: 'Meat' },
          { name: 'Butter', amount: `${Math.round(servings * 1)} tbsp`, category: 'Dairy' },
          { name: 'Garlic', amount: `${Math.round(servings * 1)} cloves`, category: 'Vegetables' },
          { name: 'Heavy cream', amount: `${Math.round(servings * 0.5)} cups`, category: 'Dairy' },
          { name: 'Parmesan cheese', amount: `${Math.round(servings * 0.25)} cup`, category: 'Dairy' },
          { name: 'Olive oil', amount: `${Math.round(servings * 0.5)} tbsp`, category: 'Oils' },
          { name: 'Fresh parsley', amount: `${Math.round(servings * 0.5)} tbsp`, category: 'Herbs' },
          { name: 'Salt and pepper', amount: 'to taste', category: 'Seasonings' }
        ],
        instructions: [
          'Cook fettuccine pasta according to package directions until al dente',
          'While pasta cooks, season chicken with salt and pepper, then cube',
          'Heat olive oil in a large pan over medium-high heat',
          'Cook chicken until golden brown and cooked through, about 6-8 minutes',
          'Remove chicken from pan and set aside',
          'Add butter and minced garlic to the same pan, cook for 1 minute',
          'Pour in heavy cream and bring to a gentle simmer',
          'Gradually stir in grated parmesan cheese until melted and smooth',
          'Return chicken to pan and add drained pasta',
          'Toss everything together until well coated with sauce',
          'Garnish with fresh parsley and serve immediately'
        ],
        nutrition: {
          calories: Math.round(650 * (servings / 4)),
          protein: Math.round(28 * (servings / 4)),
          carbs: Math.round(45 * (servings / 4)),
          fat: Math.round(38 * (servings / 4)),
          fiber: Math.round(2 * (servings / 4)),
          sugar: Math.round(4 * (servings / 4))
        },
        tags: ['pasta', 'creamy', 'italian', 'comfort-food', 'indulgent'],
        imageUrl: null
      },
      {
        title: 'Mediterranean Quinoa Bowl',
        description: 'A nutritious and colorful bowl packed with fresh vegetables, quinoa, and Mediterranean flavors',
        prepTime: 20,
        cookTime: 15,
        servings: servings,
        difficulty: 'Easy',
        cuisine: 'Mediterranean',
        ingredients: [
          { name: 'Quinoa', amount: `${Math.round(servings * 0.25)} cups`, category: 'Grains' },
          { name: 'Cherry tomatoes', amount: `${Math.round(servings * 0.5)} cups`, category: 'Vegetables' },
          { name: 'Cucumber', amount: `${Math.round(servings * 0.5)} cups`, category: 'Vegetables' },
          { name: 'Red onion', amount: `${Math.round(servings * 0.25)} small`, category: 'Vegetables' },
          { name: 'Feta cheese', amount: `${Math.round(servings * 0.25)} cups`, category: 'Dairy' },
          { name: 'Kalamata olives', amount: `${Math.round(servings * 0.25)} cups`, category: 'Pantry' },
          { name: 'Olive oil', amount: `${Math.round(servings * 0.75)} tbsp`, category: 'Oils' },
          { name: 'Lemon juice', amount: `${Math.round(servings * 0.5)} tbsp`, category: 'Pantry' },
          { name: 'Fresh herbs', amount: `${Math.round(servings * 0.5)} tbsp`, category: 'Herbs' }
        ],
        instructions: [
          'Rinse quinoa and cook according to package directions',
          'While quinoa cooks, dice cucumber and halve cherry tomatoes',
          'Thinly slice red onion and crumble feta cheese',
          'Make dressing by whisking olive oil, lemon juice, salt, and pepper',
          'Let cooked quinoa cool slightly, then fluff with a fork',
          'Combine quinoa with vegetables, feta, and olives in a large bowl',
          'Drizzle with dressing and toss gently to combine',
          'Garnish with fresh herbs and serve at room temperature',
          'Can be refrigerated for up to 3 days'
        ],
        nutrition: {
          calories: Math.round(380 * (servings / 4)),
          protein: Math.round(12 * (servings / 4)),
          carbs: Math.round(45 * (servings / 4)),
          fat: Math.round(18 * (servings / 4)),
          fiber: Math.round(6 * (servings / 4)),
          sugar: Math.round(8 * (servings / 4))
        },
        tags: ['healthy', 'vegetarian', 'mediterranean', 'quinoa', 'fresh', 'meal-prep'],
        imageUrl: null
      }
    ];

    // Select a random recipe from the enhanced collection
    const selectedRecipe = enhancedRecipes[Math.floor(Math.random() * enhancedRecipes.length)];
    
    // Create the recipe object in the format expected by the recipe storage system
    const recipeData = {
      title: selectedRecipe.title,
      description: selectedRecipe.description,
      ingredients: selectedRecipe.ingredients,
      instructions: selectedRecipe.instructions,
      prepTime: selectedRecipe.prepTime,
      cookTime: selectedRecipe.cookTime,
      servings: selectedRecipe.servings,
      difficulty: selectedRecipe.difficulty,
      cuisine: selectedRecipe.cuisine,
      nutrition: selectedRecipe.nutrition,
      tags: selectedRecipe.tags,
      imageUrl: selectedRecipe.imageUrl
    };

    // Save the recipe to the recipe storage system
    console.log('💾 Saving generated recipe to storage...');
    try {
      const saveResponse = await fetch(`${req.headers.host?.includes('localhost') ? 'http://localhost:3000' : 'https://plateful-r73ybwu6f-elisha-theetlas-projects.vercel.app'}/api/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID: userID,
          ...recipeData
        }),
      });

      if (!saveResponse.ok) {
        console.error('❌ Failed to save recipe to storage:', saveResponse.status, saveResponse.statusText);
        // Continue anyway - we'll still return the recipe even if saving fails
      } else {
        const savedRecipe = await saveResponse.json();
        console.log('✅ Recipe saved to storage:', savedRecipe.recipe?.id);
      }
    } catch (saveError) {
      console.error('❌ Error saving recipe to storage:', saveError);
      // Continue anyway - we'll still return the recipe even if saving fails
    }

    // Create the response recipe object with a unique ID
    const responseRecipe = {
      id: `recipe-${Date.now()}`,
      ...recipeData,
      createdAt: new Date().toISOString()
    };

    // Mock intent that matches the recipe
    const intent = {
      dish: selectedRecipe.title,
      cuisine: selectedRecipe.cuisine,
      certaintyLevel: 'high',
      status: 'recipe_ready'
    };

    console.log('✅ Recipe generated successfully:', responseRecipe.title);

    return res.status(200).json({
      recipe: responseRecipe,
      intent: intent,
      success: true,
      message: `Recipe generated successfully for ${servings} serving${servings !== 1 ? 's' : ''}`
    });

  } catch (error) {
    console.error('❌ Generate recipe API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}