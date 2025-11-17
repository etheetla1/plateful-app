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
    const { conversationID, userID } = req.body;

    if (!conversationID || !userID) {
      return res.status(400).json({ error: 'Missing required fields: conversationID, userID' });
    }

    // Mock intent extraction - in a real app this would analyze the conversation
    const mockIntents = [
      {
        dish: 'Chicken Stir Fry',
        cuisine: 'Asian',
        certaintyLevel: 'high',
        status: 'recipe_ready',
        explanation: 'I can see you want to make a chicken stir fry with vegetables'
      },
      {
        dish: 'Pasta Dish',
        cuisine: 'Italian',
        certaintyLevel: 'medium',
        status: 'recipe_ready',
        explanation: 'It looks like you\'re interested in making a pasta dish'
      },
      {
        dish: 'Healthy Meal',
        cuisine: 'General',
        certaintyLevel: 'low',
        status: 'recipe_ready',
        explanation: 'You mentioned wanting something healthy - let me suggest some options'
      }
    ];

    // Return a random mock intent
    const randomIntent = mockIntents[Math.floor(Math.random() * mockIntents.length)];

    return res.status(200).json(randomIntent);

  } catch (error) {
    console.error('Extract intent API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}