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

  try {
    const objects = await listObjects(connection);
    res.status(200).json(objects);
  } catch (error) {
    console.error('Failed to list objects:', error);
    res.status(500).json({ 
      message: 'Failed to fetch objects',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
