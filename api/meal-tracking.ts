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
      // Mock meal tracking data for streak and nutrition
      const mockMealData = {
        meals: [
          {
            id: 'meal-1',
            userID: 'mock-user-id',
            recipeID: 'recipe-1',
            date: new Date().toISOString().split('T')[0],
            portions: 1,
            nutrition: {
              calories: 450,
              protein: 25,
              carbs: 35,
              fat: 18
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        totals: {
          calories: 450,
          protein: 25,
          carbs: 35,
          fat: 18
        },
        date: new Date().toISOString().split('T')[0]
      };

      // Mock streak data
      const mockStreakData = {
        currentStreak: 3,
        longestStreak: 7,
        totalDays: 15,
        lastLoggedDate: new Date().toISOString().split('T')[0]
      };

      // Mock weekly nutrition data
      const mockWeeklyNutrition = {
        dailyData: {
          [new Date().toISOString().split('T')[0]]: {
            meals: mockMealData.meals,
            totals: mockMealData.totals
          }
        },
        startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };

      // Return different data based on query parameters
      const { userID } = req.query;
      if (req.url?.includes('/range')) {
        return res.status(200).json(mockWeeklyNutrition);
      } else if (req.url?.includes('/streak')) {
        return res.status(200).json(mockStreakData);
      } else {
        return res.status(200).json(mockMealData);
      }
    }

    if (req.method === 'POST') {
      // Mock meal creation
      const body = req.body;
      const mockMeal = {
        id: 'meal-' + Date.now(),
        userID: body.userID || 'mock-user-id',
        recipeID: body.recipeID || 'recipe-1',
        date: body.date || new Date().toISOString().split('T')[0],
        portions: body.portions || 1,
        nutrition: {
          calories: 450,
          protein: 25,
          carbs: 35,
          fat: 18
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.status(201).json({ meal: mockMeal });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Meal tracking API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process meal tracking request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}