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
      // Mock tutorials data
      const mockTutorials = [
        {
          id: 'tutorial-1',
          title: 'How to Properly Season Food',
          description: 'Learn the fundamentals of seasoning to enhance the flavors in your cooking',
          videoUrl: 'https://www.youtube.com/watch?v=example1',
          thumbnailUrl: 'https://img.youtube.com/vi/example1/maxresdefault.jpg',
          duration: '8:45',
          difficulty: 'Beginner',
          category: 'Techniques',
          tags: ['seasoning', 'basics', 'flavor'],
          viewCount: 15420,
          rating: 4.8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'tutorial-2',
          title: 'Knife Skills: Basic Cuts',
          description: 'Master essential knife cuts including julienne, dice, and chiffonade',
          videoUrl: 'https://www.youtube.com/watch?v=example2',
          thumbnailUrl: 'https://img.youtube.com/vi/example2/maxresdefault.jpg',
          duration: '12:30',
          difficulty: 'Beginner',
          category: 'Techniques',
          tags: ['knife skills', 'prep', 'basics'],
          viewCount: 23150,
          rating: 4.9,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'tutorial-3',
          title: 'Perfect Pasta Every Time',
          description: 'Tips and techniques for cooking pasta to the perfect al dente texture',
          videoUrl: 'https://www.youtube.com/watch?v=example3',
          thumbnailUrl: 'https://img.youtube.com/vi/example3/maxresdefault.jpg',
          duration: '6:15',
          difficulty: 'Beginner',
          category: 'Cooking Methods',
          tags: ['pasta', 'italian', 'basics'],
          viewCount: 18750,
          rating: 4.7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'tutorial-4',
          title: 'Searing Meat Like a Pro',
          description: 'Learn the science and technique behind getting the perfect sear on meat',
          videoUrl: 'https://www.youtube.com/watch?v=example4',
          thumbnailUrl: 'https://img.youtube.com/vi/example4/maxresdefault.jpg',
          duration: '10:20',
          difficulty: 'Intermediate',
          category: 'Cooking Methods',
          tags: ['meat', 'searing', 'technique'],
          viewCount: 31200,
          rating: 4.9,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'tutorial-5',
          title: 'Homemade Bread Basics',
          description: 'Step-by-step guide to making your first loaf of homemade bread',
          videoUrl: 'https://www.youtube.com/watch?v=example5',
          thumbnailUrl: 'https://img.youtube.com/vi/example5/maxresdefault.jpg',
          duration: '15:45',
          difficulty: 'Intermediate',
          category: 'Baking',
          tags: ['bread', 'baking', 'yeast'],
          viewCount: 42300,
          rating: 4.8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Filter by category if provided
      const category = req.query.category as string;
      const filteredTutorials = category 
        ? mockTutorials.filter(t => t.category.toLowerCase() === category.toLowerCase())
        : mockTutorials;

      return res.status(200).json({ tutorials: filteredTutorials });
    }

    if (req.method === 'POST') {
      // Mock saving a tutorial
      const body = req.body;
      const savedTutorial = {
        id: body.tutorialId || 'tutorial-1',
        userID: body.userID || 'mock-user-id',
        savedAt: new Date().toISOString(),
        notes: body.notes || ''
      };

      return res.status(201).json({ 
        savedTutorial,
        message: 'Tutorial saved successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Tutorials API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process tutorials request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}