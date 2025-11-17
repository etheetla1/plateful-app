import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { userID, action, listID, itemID } = req.query;

  try {
    // Handle user-specific grocery lists with query parameters
    if (req.method === 'GET' && userID && action === 'lists') {
      // Mock grocery lists for the user
      const mockLists = [
        {
          id: 'list-1',
          listID: 'list-1',
          name: 'Weekly Shopping',
          items: [
            {
              id: 'item-1',
              listID: 'list-1',
              name: 'Chicken Breast',
              quantity: 2,
              unit: 'lbs',
              category: 'Meat',
              notes: 'Organic preferred',
              completed: false,
              userID: userID,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'item-2',
              listID: 'list-1',
              name: 'Broccoli',
              quantity: 1,
              unit: 'bunch',
              category: 'Vegetables',
              notes: '',
              completed: false,
              userID: userID,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          itemCount: 2,
          userID: userID,
          sharedWith: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'list-2',
          listID: 'list-2',
          name: 'Party Supplies',
          items: [],
          itemCount: 0,
          userID: userID,
          sharedWith: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      return res.status(200).json({ lists: mockLists });
    }

    // Handle specific list with query parameters
    if (req.method === 'GET' && userID && action === 'list' && listID) {
      const mockList = {
        id: listID,
        listID: listID,
        name: 'Weekly Shopping',
        items: [
          {
            id: 'item-1',
            listID: listID,
            name: 'Chicken Breast',
            quantity: 2,
            unit: 'lbs',
            category: 'Meat',
            notes: 'Organic preferred',
            completed: false,
            userID: userID,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        itemCount: 1,
        userID: userID,
        sharedWith: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.status(200).json({ list: mockList });
    }

    // Handle POST to create lists with query parameters
    if (req.method === 'POST' && userID && action === 'createList') {
      const body = req.body;
      
      const newList = {
        id: `list-${Date.now()}`,
        listID: `list-${Date.now()}`,
        name: body.name || 'New List',
        items: [],
        itemCount: 0,
        userID: userID,
        sharedWith: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.status(201).json({ list: newList });
    }

    // Handle DELETE list with query parameters
    if (req.method === 'DELETE' && userID && action === 'deleteList' && listID) {
      return res.status(200).json({ success: true, message: 'List deleted successfully' });
    }

    // Handle PUT to update item with query parameters
    if (req.method === 'PUT' && userID && action === 'updateItem' && listID && itemID) {
      const body = req.body;
      const updatedItem = {
        id: itemID,
        listID: listID,
        name: body.name || 'Updated Item',
        quantity: body.quantity || 1,
        unit: body.unit || 'piece',
        category: body.category || 'Other',
        notes: body.notes || '',
        completed: body.completed || false,
        userID: userID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.status(200).json({ item: updatedItem });
    }

    // Handle POST to add items with query parameters
    if (req.method === 'POST' && userID && action === 'addItem' && listID) {
      const body = req.body;
      const newItem = {
        id: `item-${Date.now()}`,
        listID: listID,
        name: body.name || 'New Item',
        quantity: body.quantity || 1,
        unit: body.unit || 'piece',
        category: body.category || 'Other',
        notes: body.notes || '',
        completed: false,
        userID: userID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.status(201).json({ item: newItem });
    }

    // Handle DELETE item with query parameters
    if (req.method === 'DELETE' && userID && action === 'deleteItem' && listID && itemID) {
      return res.status(200).json({ success: true, message: 'Item deleted successfully' });
    }

    // Base endpoint for backward compatibility
    if (req.method === 'GET' && !userID) {
      // Mock grocery lists data
      const mockGroceryLists = [
        {
          id: 'list-1',
          listID: 'list-1',
          name: 'Weekly Shopping',
          items: [
            {
              id: 'item-1',
              listID: 'list-1',
              name: 'Chicken Breast',
              quantity: 2,
              unit: 'lbs',
              category: 'Meat',
              notes: 'Organic preferred',
              completed: false,
              userID: 'mock-user-id',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'item-2',
              listID: 'list-1',
              name: 'Broccoli',
              quantity: 1,
              unit: 'bunch',
              category: 'Vegetables',
              notes: '',
              completed: false,
              userID: 'mock-user-id',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          itemCount: 2,
          userID: 'mock-user-id',
          sharedWith: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'list-2',
          listID: 'list-2',
          name: 'Party Supplies',
          items: [],
          itemCount: 0,
          userID: 'mock-user-id',
          sharedWith: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      return res.status(200).json({ lists: mockGroceryLists });
    }

    return res.status(400).json({ 
      error: 'Invalid request parameters',
      availableActions: [
        'GET ?userID={id}&action=lists - Get user grocery lists',
        'GET ?userID={id}&action=list&listID={id} - Get specific list',
        'POST ?userID={id}&action=createList - Create new list',
        'DELETE ?userID={id}&action=deleteList&listID={id} - Delete list',
        'PUT ?userID={id}&action=updateItem&listID={id}&itemID={id} - Update item',
        'POST ?userID={id}&action=addItem&listID={id} - Add item to list',
        'DELETE ?userID={id}&action=deleteItem&listID={id}&itemID={id} - Delete item'
      ]
    });
  } catch (error) {
    console.error('Grocery API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process grocery request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}