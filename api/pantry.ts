import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { userID, itemId } = req.query;

  try {
    // Handle user-specific pantry items with query parameters
    if (req.method === 'GET' && userID) {
      // Mock pantry items for the user
      const mockPantryItems = [
        {
          id: 'pantry-1',
          userID: userID,
          name: 'Rice',
          category: 'Grains',
          quantity: 2,
          unit: 'cups',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'pantry-2',
          userID: userID,
          name: 'Olive Oil',
          category: 'Oils',
          quantity: 1,
          unit: 'bottle',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'pantry-3',
          userID: userID,
          name: 'Canned Tomatoes',
          category: 'Canned Goods',
          quantity: 3,
          unit: 'cans',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'pantry-4',
          userID: userID,
          name: 'Garlic',
          category: 'Vegetables',
          quantity: 1,
          unit: 'bulb',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      return res.status(200).json({ items: mockPantryItems });
    }

    // Handle POST to add pantry items with query parameters
    if (req.method === 'POST' && userID) {
      const body = req.body;
      const items = body.items || [];
      
      const mockItems = items.map((item: any, index: number) => ({
        id: 'pantry-' + Date.now() + '-' + index,
        userID: userID,
        name: item.name,
        category: item.category,
        quantity: item.quantity || 1,
        unit: item.unit || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      return res.status(201).json({ 
        items: mockItems,
        message: `Added ${mockItems.length} item(s) successfully.`
      });
    }

    // Handle DELETE specific pantry item with query parameters
    if (req.method === 'DELETE' && userID && itemId) {
      return res.status(200).json({ 
        success: true,
        message: `Pantry item ${itemId} deleted successfully for user ${userID}` 
      });
    }

    // Handle PUT to update pantry item with query parameters
    if (req.method === 'PUT' && userID && itemId) {
      const body = req.body;
      
      const mockItem = {
        id: itemId,
        userID: userID,
        name: body.name || 'Updated Item',
        category: body.category || 'General',
        quantity: body.quantity || 1,
        unit: body.unit || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.status(200).json({ item: mockItem });
    }

    // Base endpoint for backward compatibility
    if (req.method === 'GET' && !userID) {
      // Mock pantry items data
      const mockPantryItems = [
        {
          id: 'pantry-1',
          userID: 'mock-user-id',
          name: 'Rice',
          category: 'Grains',
          quantity: 2,
          unit: 'cups',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'pantry-2',
          userID: 'mock-user-id',
          name: 'Olive Oil',
          category: 'Oils',
          quantity: 1,
          unit: 'bottle',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'pantry-3',
          userID: 'mock-user-id',
          name: 'Canned Tomatoes',
          category: 'Canned Goods',
          quantity: 3,
          unit: 'cans',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'pantry-4',
          userID: 'mock-user-id',
          name: 'Garlic',
          category: 'Vegetables',
          quantity: 1,
          unit: 'bulb',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      return res.status(200).json({ items: mockPantryItems });
    }

    return res.status(400).json({ 
      error: 'Invalid request parameters',
      availableActions: [
        'GET ?userID={id} - Get user pantry items',
        'POST ?userID={id} - Add pantry items',
        'PUT ?userID={id}&itemId={id} - Update pantry item',
        'DELETE ?userID={id}&itemId={id} - Delete pantry item'
      ]
    });
  } catch (error) {
    console.error('Pantry API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process pantry request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}