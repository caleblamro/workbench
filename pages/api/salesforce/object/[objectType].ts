import type { NextApiRequest, NextApiResponse } from 'next';
import { getSalesforceConnection } from '../../../../lib/salesforce';
import { getObjectMetadataWithCache } from '../../../../lib/metadata-cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get Salesforce connection from cookies
  const connection = getSalesforceConnection(req);
  if (!connection) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { objectType } = req.query;

  if (!objectType || typeof objectType !== 'string') {
    return res.status(400).json({ message: 'Object type is required' });
  }

  try {
    const metadata = await getObjectMetadataWithCache(connection, objectType);
    
    // Add cache headers to indicate this response can be cached by the browser
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).json(metadata);
  } catch (error) {
    res.status(500).json({
      message: `Failed to fetch metadata for ${objectType}`,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
