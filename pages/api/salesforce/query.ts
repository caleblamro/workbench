import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery, getSalesforceConnection } from '../../../lib/salesforce';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get Salesforce connection from cookies
  const connection = getSalesforceConnection(req);
  if (!connection) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Query is required' });
  }

  try {
    const result = await executeQuery(connection, query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: 'Query execution failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
