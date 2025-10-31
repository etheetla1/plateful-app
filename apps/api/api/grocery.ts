import { Hono } from 'hono';
import { getContainer, isCosmosAvailable, generateId } from '../lib/cosmos';
import type { GroceryList, GroceryItem } from '@plateful/shared';

const app = new Hono();

// Cosmos DB structure:
// - Container: grocery-lists (partition key: /userID)
// - Container: grocery-items (partition key: /listID)
// Items are stored separately and linked by listID

/**
 * Health check for grocery route
 * GET /grocery
 */
app.get('/', async (c) => {
  return c.json({ status: 'ok', service: 'grocery' });
});

/**
 * Get all grocery lists for a user
 * GET /grocery/:userID/lists
 */
app.get('/:userID/lists', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Grocery service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const container = getContainer('groceryLists');
    
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Query all lists for this user
    const { resources } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.userID = @userID ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userID', value: userID }],
      })
      .fetchAll();

    const itemsContainer = getContainer('groceryItems');
    
    // Convert to GroceryList format and count items for each list
    const lists = await Promise.all((resources || []).map(async (doc: any) => {
      // Count items for this list
      let itemCount = 0;
      if (itemsContainer) {
        try {
          const { resources: itemResources } = await itemsContainer.items
            .query({
              query: 'SELECT * FROM c WHERE c.listID = @listID',
              parameters: [{ name: '@listID', value: doc.id }],
            })
            .fetchAll();
          
          // Count the items
          itemCount = itemResources?.length ?? 0;
        } catch (error) {
          console.error(`Error counting items for list ${doc.id}:`, error);
          // Fallback to 0 if count fails
          itemCount = 0;
        }
      }

      return {
        id: doc.id,
        name: doc.name,
        items: [], // Items stored separately, fetch via /lists/:listID/items
        itemCount, // Add item count for display
        userID: doc.userID,
        sharedWith: doc.sharedWith || [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    }));

    return c.json({ lists });
  } catch (error: any) {
    console.error('Error fetching grocery lists:', error);
    
    if (error?.code === 404 || error?.statusCode === 404 || error?.message?.includes('NotFound')) {
      console.log('Grocery lists container does not exist yet - returning empty array');
      return c.json({ lists: [] });
    }
    
    return c.json({ 
      error: 'Failed to fetch grocery lists',
      details: error?.message || 'Unknown error'
    }, 500);
  }
});

/**
 * Get a single grocery list with all its items
 * GET /grocery/:userID/lists/:listID
 */
app.get('/:userID/lists/:listID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Grocery service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const listID = c.req.param('listID');
    
    const listsContainer = getContainer('groceryLists');
    const itemsContainer = getContainer('groceryItems');
    
    if (!listsContainer || !itemsContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Get the list - query by userID (partition key) and filter by listID
    let listDoc: any;
    try {
      const { resources } = await listsContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @listID AND c.userID = @userID',
          parameters: [
            { name: '@listID', value: listID },
            { name: '@userID', value: userID }
          ],
        })
        .fetchAll();

      if (!resources || resources.length === 0) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      listDoc = resources[0];
    } catch (error: any) {
      console.error('Error fetching list:', error);
      if (error?.code === 404 || error?.statusCode === 404) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      throw error;
    }

    // Verify ownership
    if (listDoc.userID !== userID) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Get all items for this list
    const { resources: itemDocs } = await itemsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.listID = @listID ORDER BY c.createdAt ASC',
        parameters: [{ name: '@listID', value: listID }],
      })
      .fetchAll();

    const items = (itemDocs || []).map((doc: any) => ({
      id: doc.id,
      listID: doc.listID,
      name: doc.name,
      quantity: doc.quantity,
      unit: doc.unit,
      category: doc.category,
      notes: doc.notes,
      completed: doc.completed || false,
      userID: doc.userID,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    const list: GroceryList = {
      id: listDoc.id,
      name: listDoc.name,
      items,
      userID: listDoc.userID,
      sharedWith: listDoc.sharedWith || [],
      createdAt: listDoc.createdAt,
      updatedAt: listDoc.updatedAt,
    };

    return c.json({ list });
  } catch (error: any) {
    console.error('Error fetching grocery list:', error);
    return c.json({ 
      error: 'Failed to fetch grocery list',
      details: error?.message || 'Unknown error'
    }, 500);
  }
});

/**
 * Create a new grocery list
 * POST /grocery/:userID/lists
 * Body: { name: string }
 */
app.post('/:userID/lists', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Grocery service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const body = await c.req.json<{ name: string }>();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return c.json({ error: 'List name is required' }, 400);
    }

    const container = getContainer('groceryLists');
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const now = new Date().toISOString();
    const list: GroceryList = {
      id: generateId('grocery-list'),
      name: name.trim(),
      items: [],
      userID: userID,
      sharedWith: [],
      createdAt: now,
      updatedAt: now,
    };

    await container.items.create(list);

    return c.json({ list }, 201);
  } catch (error: any) {
    console.error('Error creating grocery list:', error);
    
    if (error?.message?.includes('NotFound') || error?.code === 404) {
      return c.json({ 
        error: 'Grocery lists container does not exist. Please create the "grocery-lists" container in Cosmos DB with partition key /userID.',
        details: error?.message
      }, 503);
    }
    
    return c.json({ 
      error: 'Failed to create grocery list',
      details: error?.message || 'Unknown error'
    }, 500);
  }
});

/**
 * Update a grocery list
 * PUT /grocery/:userID/lists/:listID
 * Body: { name?: string, sharedWith?: string[] }
 */
app.put('/:userID/lists/:listID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Grocery service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const listID = c.req.param('listID');
    const body = await c.req.json<Partial<Pick<GroceryList, 'name' | 'sharedWith'>>>();
    
    const container = getContainer('groceryLists');
    if (!container) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Get existing list to verify ownership
    let existingList: any;
    try {
      const { resource } = await container.item(listID, userID).read<GroceryList>();
      if (!resource) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      existingList = resource;
    } catch (error: any) {
      if (error?.code === 404 || error?.statusCode === 404) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      throw error;
    }

    // Verify ownership
    if (existingList.userID !== userID) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Update list
    const updatedList: GroceryList = {
      ...existingList,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await container.items.upsert(updatedList);

    return c.json({ list: updatedList });
  } catch (error) {
    console.error('Error updating grocery list:', error);
    return c.json({ error: 'Failed to update grocery list' }, 500);
  }
});

/**
 * Delete a grocery list and all its items
 * DELETE /grocery/:userID/lists/:listID
 */
app.delete('/:userID/lists/:listID', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Grocery service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const listID = c.req.param('listID');
    
    const listsContainer = getContainer('groceryLists');
    const itemsContainer = getContainer('groceryItems');
    
    if (!listsContainer || !itemsContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Verify ownership before deleting - query by userID (partition key)
    try {
      const { resources } = await listsContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @listID AND c.userID = @userID',
          parameters: [
            { name: '@listID', value: listID },
            { name: '@userID', value: userID }
          ],
        })
        .fetchAll();

      if (!resources || resources.length === 0) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      if (resources[0].userID !== userID) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    } catch (error: any) {
      console.error('Error fetching list:', error);
      if (error?.code === 404 || error?.statusCode === 404) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      throw error;
    }

    // Delete all items for this list
    const { resources: items } = await itemsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.listID = @listID',
        parameters: [{ name: '@listID', value: listID }],
      })
      .fetchAll();

    await Promise.all(
      items.map((item: any) => itemsContainer.item(item.id, listID).delete())
    );

    // Delete the list - query first to get the document, then delete
    const { resources: listToDelete } = await listsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @listID AND c.userID = @userID',
        parameters: [
          { name: '@listID', value: listID },
          { name: '@userID', value: userID }
        ],
      })
      .fetchAll();

    if (listToDelete && listToDelete.length > 0) {
      await listsContainer.item(listToDelete[0].id, userID).delete();
    }

    return c.json({ message: 'Grocery list deleted successfully' });
  } catch (error) {
    console.error('Error deleting grocery list:', error);
    return c.json({ error: 'Failed to delete grocery list' }, 500);
  }
});

/**
 * Get all items for a grocery list
 * GET /grocery/:userID/lists/:listID/items
 */
app.get('/:userID/lists/:listID/items', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Grocery service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const listID = c.req.param('listID');
    
    const listsContainer = getContainer('groceryLists');
    const itemsContainer = getContainer('groceryItems');
    
    if (!listsContainer || !itemsContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Verify list ownership - query by userID (partition key)
    try {
      const { resources } = await listsContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @listID AND c.userID = @userID',
          parameters: [
            { name: '@listID', value: listID },
            { name: '@userID', value: userID }
          ],
        })
        .fetchAll();

      if (!resources || resources.length === 0) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      if (resources[0].userID !== userID) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    } catch (error: any) {
      console.error('Error fetching list:', error);
      if (error?.code === 404 || error?.statusCode === 404) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      throw error;
    }

    // Get all items for this list
    const { resources } = await itemsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.listID = @listID ORDER BY c.createdAt ASC',
        parameters: [{ name: '@listID', value: listID }],
      })
      .fetchAll();

    const items = (resources || []).map((doc: any) => ({
      id: doc.id,
      listID: doc.listID,
      name: doc.name,
      quantity: doc.quantity,
      unit: doc.unit,
      category: doc.category,
      notes: doc.notes,
      completed: doc.completed || false,
      userID: doc.userID,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return c.json({ items });
  } catch (error: any) {
    console.error('Error fetching grocery items:', error);
    return c.json({ 
      error: 'Failed to fetch grocery items',
      details: error?.message || 'Unknown error'
    }, 500);
  }
});

/**
 * Add items to a grocery list
 * POST /grocery/:userID/lists/:listID/items
 * Body: { items: Array<Omit<GroceryItem, 'id' | 'userID' | 'createdAt' | 'updatedAt'>> }
 */
app.post('/:userID/lists/:listID/items', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Grocery service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const listID = c.req.param('listID');
    const body = await c.req.json<{ items: Array<Omit<GroceryItem, 'id' | 'userID' | 'createdAt' | 'updatedAt' | 'completed'>> }>();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Items array is required and cannot be empty' }, 400);
    }

    const listsContainer = getContainer('groceryLists');
    const itemsContainer = getContainer('groceryItems');
    
    if (!listsContainer || !itemsContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Verify list ownership - query by userID (partition key)
    try {
      const { resources } = await listsContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @listID AND c.userID = @userID',
          parameters: [
            { name: '@listID', value: listID },
            { name: '@userID', value: userID }
          ],
        })
        .fetchAll();

      if (!resources || resources.length === 0) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      if (resources[0].userID !== userID) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    } catch (error: any) {
      console.error('Error fetching list:', error);
      if (error?.code === 404 || error?.statusCode === 404) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      throw error;
    }

    const now = new Date().toISOString();
    const groceryItems: GroceryItem[] = items.map(item => ({
      id: generateId('grocery-item'),
      listID, // Required for Cosmos DB partitioning
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || '',
      category: item.category,
      notes: item.notes || '',
      completed: false,
      userID: userID,
      createdAt: now,
      updatedAt: now,
    }));

    // Insert items
    await Promise.all(groceryItems.map(item => itemsContainer.items.create(item)));

    // Update list updatedAt - query again to get the list document
    const { resources: listResources } = await listsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @listID AND c.userID = @userID',
        parameters: [
          { name: '@listID', value: listID },
          { name: '@userID', value: userID }
        ],
      })
      .fetchAll();

    if (listResources && listResources.length > 0) {
      const listDoc = listResources[0];
      await listsContainer.items.upsert({
        ...listDoc,
        updatedAt: now,
      });
    }

    return c.json({
      items: groceryItems,
      message: `Added ${groceryItems.length} item(s) successfully.`
    }, 201);
  } catch (error: any) {
    console.error('Error adding grocery items:', error);
    
    if (error?.message?.includes('NotFound') || error?.code === 404) {
      return c.json({ 
        error: 'Grocery items container does not exist. Please create the "grocery-items" container in Cosmos DB with partition key /listID.',
        details: error?.message
      }, 503);
    }
    
    return c.json({ 
      error: 'Failed to add grocery items',
      details: error?.message || 'Unknown error'
    }, 500);
  }
});

/**
 * Update a grocery item
 * PUT /grocery/:userID/lists/:listID/items/:itemId
 * Body: Partial<GroceryItem>
 */
app.put('/:userID/lists/:listID/items/:itemId', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Grocery service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const listID = c.req.param('listID');
    const itemId = c.req.param('itemId');
    const body = await c.req.json<Partial<Omit<GroceryItem, 'id' | 'userID' | 'listID' | 'createdAt'>>>();
    
    const itemsContainer = getContainer('groceryItems');
    const listsContainer = getContainer('groceryLists');
    
    if (!itemsContainer || !listsContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Verify list ownership - query by userID (partition key)
    try {
      const { resources } = await listsContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @listID AND c.userID = @userID',
          parameters: [
            { name: '@listID', value: listID },
            { name: '@userID', value: userID }
          ],
        })
        .fetchAll();

      if (!resources || resources.length === 0) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      if (resources[0].userID !== userID) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    } catch (error: any) {
      console.error('Error fetching list:', error);
      if (error?.code === 404 || error?.statusCode === 404) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      throw error;
    }

    // Get existing item - query by listID (partition key)
    let existingItem: any;
    try {
      const { resources } = await itemsContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @itemId AND c.listID = @listID',
          parameters: [
            { name: '@itemId', value: itemId },
            { name: '@listID', value: listID }
          ],
        })
        .fetchAll();

      if (!resources || resources.length === 0) {
        return c.json({ error: 'Grocery item not found' }, 404);
      }
      existingItem = resources[0];
    } catch (error: any) {
      console.error('Error fetching item:', error);
      if (error?.code === 404 || error?.statusCode === 404) {
        return c.json({ error: 'Grocery item not found' }, 404);
      }
      throw error;
    }

    // Verify ownership
    if (existingItem.userID !== userID) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Update item
    const updatedItem: GroceryItem = {
      ...existingItem,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await itemsContainer.items.upsert(updatedItem);

    return c.json({ item: updatedItem });
  } catch (error) {
    console.error('Error updating grocery item:', error);
    return c.json({ error: 'Failed to update grocery item' }, 500);
  }
});

/**
 * Delete a grocery item
 * DELETE /grocery/:userID/lists/:listID/items/:itemId
 */
app.delete('/:userID/lists/:listID/items/:itemId', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Grocery service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const listID = c.req.param('listID');
    const itemId = c.req.param('itemId');
    
    const itemsContainer = getContainer('groceryItems');
    const listsContainer = getContainer('groceryLists');
    
    if (!itemsContainer || !listsContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Verify list ownership - query by userID (partition key)
    try {
      const { resources: listResources } = await listsContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @listID AND c.userID = @userID',
          parameters: [
            { name: '@listID', value: listID },
            { name: '@userID', value: userID }
          ],
        })
        .fetchAll();

      if (!listResources || listResources.length === 0) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      if (listResources[0].userID !== userID) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    } catch (error: any) {
      console.error('Error fetching list:', error);
      if (error?.code === 404 || error?.statusCode === 404) {
        return c.json({ error: 'Grocery list not found' }, 404);
      }
      throw error;
    }

    // Verify item ownership before deleting - query by listID (partition key)
    try {
      const { resources: itemResources } = await itemsContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @itemId AND c.listID = @listID',
          parameters: [
            { name: '@itemId', value: itemId },
            { name: '@listID', value: listID }
          ],
        })
        .fetchAll();

      if (!itemResources || itemResources.length === 0) {
        return c.json({ error: 'Grocery item not found' }, 404);
      }
      if (itemResources[0].userID !== userID) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    } catch (error: any) {
      console.error('Error fetching item:', error);
      if (error?.code === 404 || error?.statusCode === 404) {
        return c.json({ error: 'Grocery item not found' }, 404);
      }
      throw error;
    }

    await itemsContainer.item(itemId, listID).delete();

    return c.json({ message: 'Grocery item deleted successfully' });
  } catch (error) {
    console.error('Error deleting grocery item:', error);
    return c.json({ error: 'Failed to delete grocery item' }, 500);
  }
});

/**
 * Merge multiple grocery lists into one
 * POST /grocery/:userID/merge
 * Body: { listIDs: string[], targetListID?: string, name?: string }
 * 
 * Merges items from multiple lists into a target list (or creates new list).
 * If targetListID is provided, items are added to that list.
 * If not, a new list is created with the provided name (or auto-generated name).
 * Duplicate items (same name) are consolidated (quantities summed if possible).
 */
app.post('/:userID/merge', async (c) => {
  if (!isCosmosAvailable()) {
    return c.json({ error: 'Grocery service not available' }, 503);
  }

  try {
    const userID = c.req.param('userID');
    const body = await c.req.json<{ 
      listIDs: string[], 
      targetListID?: string, 
      name?: string 
    }>();
    const { listIDs, targetListID, name } = body;

    if (!Array.isArray(listIDs) || listIDs.length < 2) {
      return c.json({ error: 'At least 2 list IDs are required to merge' }, 400);
    }

    const listsContainer = getContainer('groceryLists');
    const itemsContainer = getContainer('groceryItems');
    
    if (!listsContainer || !itemsContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    // Verify all source lists exist and belong to user - query by userID (partition key)
    const sourceLists: any[] = [];
    for (const listID of listIDs) {
      try {
        const { resources } = await listsContainer.items
          .query({
            query: 'SELECT * FROM c WHERE c.id = @listID AND c.userID = @userID',
            parameters: [
              { name: '@listID', value: listID },
              { name: '@userID', value: userID }
            ],
          })
          .fetchAll();

        if (!resources || resources.length === 0) {
          return c.json({ error: `List ${listID} not found` }, 404);
        }
        const resource = resources[0];
        if (resource.userID !== userID) {
          return c.json({ error: `Unauthorized access to list ${listID}` }, 403);
        }
        sourceLists.push(resource);
      } catch (error: any) {
        console.error(`Error fetching list ${listID}:`, error);
        if (error?.code === 404 || error?.statusCode === 404) {
          return c.json({ error: `List ${listID} not found` }, 404);
        }
        throw error;
      }
    }

    // Get or create target list - query by userID (partition key)
    let targetList: any;
    let targetListIDFinal: string;
    
    if (targetListID) {
      // Use existing target list
      const { resources } = await listsContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @listID AND c.userID = @userID',
          parameters: [
            { name: '@listID', value: targetListID },
            { name: '@userID', value: userID }
          ],
        })
        .fetchAll();

      if (!resources || resources.length === 0) {
        return c.json({ error: 'Target list not found' }, 404);
      }
      const resource = resources[0];
      if (resource.userID !== userID) {
        return c.json({ error: 'Unauthorized access to target list' }, 403);
      }
      targetList = resource;
      targetListIDFinal = targetListID;
    } else {
      // Create new merged list
      const listName = name || `Merged List (${new Date().toLocaleDateString()})`;
      const now = new Date().toISOString();
      targetList = {
        id: generateId('grocery-list'),
        name: listName.trim(),
        items: [],
        userID: userID,
        sharedWith: [],
        createdAt: now,
        updatedAt: now,
      };
      await listsContainer.items.create(targetList);
      targetListIDFinal = targetList.id;
    }

    // Collect all items from source lists
    const allItems: any[] = [];
    for (const listID of listIDs) {
      const { resources } = await itemsContainer.items
        .query({
          query: 'SELECT * FROM c WHERE c.listID = @listID',
          parameters: [{ name: '@listID', value: listID }],
        })
        .fetchAll();
      allItems.push(...(resources || []));
    }

    // Deduplicate and merge items with same name
    const itemMap = new Map<string, any>();
    
    for (const item of allItems) {
      const key = item.name.toLowerCase().trim();
      const existing = itemMap.get(key);
      
      if (existing) {
        // Merge quantities if units match, otherwise keep separate
        if (existing.unit === item.unit && existing.unit !== '') {
          existing.quantity = (existing.quantity || 0) + (item.quantity || 0);
          // Merge notes
          if (item.notes && existing.notes) {
            existing.notes = `${existing.notes}; ${item.notes}`;
          } else if (item.notes) {
            existing.notes = item.notes;
          }
          // Keep completed status if either is completed
          existing.completed = existing.completed || item.completed;
        } else {
          // Different units or no units - create separate item with suffix
          const newItem = {
            ...item,
            name: `${item.name} (${item.unit || '1'})`,
            id: generateId('grocery-item'),
          };
          itemMap.set(`${key}_${itemMap.size}`, newItem);
        }
      } else {
        // New item, add to map
        itemMap.set(key, { ...item });
      }
    }

    // Create merged items in target list
    const now = new Date().toISOString();
    const mergedItems: GroceryItem[] = Array.from(itemMap.values()).map(item => ({
      id: generateId('grocery-item'),
      listID: targetListIDFinal,
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || '',
      category: item.category,
      notes: item.notes || '',
      completed: item.completed || false,
      userID: userID,
      createdAt: now,
      updatedAt: now,
    }));

    // Insert merged items
    if (mergedItems.length > 0) {
      await Promise.all(mergedItems.map(item => itemsContainer.items.create(item)));
    }

    // Update target list
    await listsContainer.items.upsert({
      ...targetList,
      updatedAt: now,
    });

    return c.json({
      list: {
        ...targetList,
        updatedAt: now,
      },
      items: mergedItems,
      mergedFrom: listIDs,
      message: `Merged ${listIDs.length} list(s) into "${targetList.name}" with ${mergedItems.length} item(s)`
    }, 201);
  } catch (error: any) {
    console.error('Error merging grocery lists:', error);
    return c.json({ 
      error: 'Failed to merge grocery lists',
      details: error?.message || 'Unknown error'
    }, 500);
  }
});

export default app;

