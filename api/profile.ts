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
    // For now, return mock data since we don't have Cosmos DB configured
    if (req.method === 'GET') {
      // Mock profile data
      const mockProfile = {
        id: 'mock-user-id',
        userID: 'mock-user-id',
        displayName: 'Demo User',
        timezone: 'America/New_York',
        cookingProficiency: 'intermediate',
        defaultServingSize: 2,
        likes: ['chicken', 'pasta', 'vegetables'],
        dislikes: ['mushrooms'],
        allergens: [],
        restrictions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return res.status(200).json({ profile: mockProfile });
    }

    if (req.method === 'PUT') {
      // Mock profile update
      const body = req.body;
      const mockProfile = {
        id: 'mock-user-id',
        userID: 'mock-user-id',
        ...body,
        updatedAt: new Date().toISOString(),
      };

      return res.status(200).json({ profile: mockProfile });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process profile request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}