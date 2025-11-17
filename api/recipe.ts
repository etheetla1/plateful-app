import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Mock recipes data
      const mockRecipes = [
        {
          id: 'recipe-1',
          recipeID: 'recipe-1',
          userID: 'mock-user-id',
          recipeData: {
            title: 'Chicken Stir Fry',
            description: 'A quick and healthy chicken stir fry with vegetables',
            ingredients: [
              { name: 'Chicken breast', amount: '1 lb', category: 'Meat' },
              { name: 'Broccoli', amount: '2 cups', category: 'Vegetables' },
              { name: 'Bell pepper', amount: '1', category: 'Vegetables' },
              { name: 'Soy sauce', amount: '3 tbsp', category: 'Condiments' },
              { name: 'Garlic', amount: '2 cloves', category: 'Vegetables' }
            ],
            instructions: [
              'Cut chicken into bite-sized pieces',
              'Heat oil in a large pan or wok',
              'Cook chicken until golden brown',
              'Add vegetables and stir fry for 3-4 minutes',
              'Add soy sauce and garlic, cook for 1 minute',
              'Serve hot over rice'
            ],
            prepTime: 15,
            cookTime: 10,
            servings: 4,
            difficulty: 'Easy',
            cuisine: 'Asian',
            nutrition: {
              calories: 320,
              protein: 35,
              carbs: 12,
              fat: 14,
              fiber: 4,
              sugar: 8
            },
            tags: ['healthy', 'quick', 'protein'],
            imageUrl: null
          },
          source: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'recipe-2',
          recipeID: 'recipe-2',
          userID: 'mock-user-id',
          recipeData: {
            title: 'Pasta Primavera',
            description: 'Fresh vegetables tossed with pasta in a light cream sauce',
            ingredients: [
              { name: 'Pasta', amount: '12 oz', category: 'Grains' },
              { name: 'Zucchini', amount: '1', category: 'Vegetables' },
              { name: 'Cherry tomatoes', amount: '1 cup', category: 'Vegetables' },
              { name: 'Heavy cream', amount: '1/2 cup', category: 'Dairy' },
              { name: 'Parmesan cheese', amount: '1/2 cup', category: 'Dairy' }
            ],
            instructions: [
              'Cook pasta according to package directions',
              'Sauté vegetables in olive oil',
              'Add cream and simmer',
              'Toss with pasta and cheese',
              'Season with salt and pepper'
            ],
            prepTime: 10,
            cookTime: 20,
            servings: 4,
            difficulty: 'Medium',
            cuisine: 'Italian',
            nutrition: {
              calories: 450,
              protein: 15,
              carbs: 65,
              fat: 16,
              fiber: 3,
              sugar: 6
            },
            tags: ['vegetarian', 'pasta', 'comfort'],
            imageUrl: null
          },
          source: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      return res.status(200).json({ recipes: mockRecipes });
    }

    if (req.method === 'POST') {
      // Mock recipe creation
      const body = req.body;
      const mockRecipe = {
        id: 'recipe-' + Date.now(),
        recipeID: 'recipe-' + Date.now(),
        userID: body.userID || 'mock-user-id',
        recipeData: {
          title: body.title || 'New Recipe',
          description: body.description || '',
          ingredients: body.ingredients || [],
          instructions: body.instructions || [],
          prepTime: body.prepTime || 0,
          cookTime: body.cookTime || 0,
          servings: body.servings || 1,
          difficulty: body.difficulty || 'Easy',
          cuisine: body.cuisine || '',
          nutrition: body.nutrition || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0
          },
          tags: body.tags || [],
          imageUrl: body.imageUrl || null
        },
        source: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.status(201).json({ recipe: mockRecipe });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Recipe API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process recipe request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}