import type { NextApiRequest, NextApiResponse } from 'next';
import { getSalesforceConnection, listObjects } from '../../../lib/salesforce';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get Salesforce connection from cookies
  const connection = getSalesforceConnection(req);
  if (!connection) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Get pagination parameters
  const { limit = '50', offset = '0' } = req.query;
  const limitNum = parseInt(limit as string, 10);
  const offsetNum = parseInt(offset as string, 10);

  try {
    const objects = await listObjects(connection);
    
    // Apply pagination
    const allObjects = objects.sobjects || [];
    const paginatedObjects = allObjects.slice(offsetNum, offsetNum + limitNum);
    
    res.status(200).json({
      sobjects: paginatedObjects,
      totalCount: allObjects.length,
      hasMore: offsetNum + limitNum < allObjects.length,
      nextOffset: offsetNum + limitNum
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch objects',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
