import type { NextApiRequest, NextApiResponse } from 'next';
import { getSalesforceConnection, salesforceApiCall } from '../../../lib/salesforce';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const connection = getSalesforceConnection(req);
  if (!connection) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { search, limit = '50', offset = '0', filter = 'all' } = req.query;

  try {
    const response = await salesforceApiCall(connection, '/services/data/v58.0/sobjects/');

    if (!response.ok) {
      throw new Error(`Failed to fetch objects: ${response.statusText}`);
    }

    const data = await response.json();
    let objects = data.sobjects || [];

    // Apply search filter
    if (search && typeof search === 'string') {
      const searchTerm = search.toLowerCase();
      objects = objects.filter(
        (obj: any) =>
          obj.name.toLowerCase().includes(searchTerm) ||
          obj.label.toLowerCase().includes(searchTerm) ||
          obj.labelPlural.toLowerCase().includes(searchTerm)
      );
    }

    // Apply type filter
    if (filter && typeof filter === 'string' && filter !== 'all') {
      switch (filter) {
        case 'custom':
          objects = objects.filter((obj: any) => obj.custom);
          break;
        case 'standard':
          objects = objects.filter((obj: any) => !obj.custom);
          break;
        case 'queryable':
          objects = objects.filter((obj: any) => obj.queryable);
          break;
        case 'createable':
          objects = objects.filter((obj: any) => obj.createable);
          break;
      }
    }

    // Sort results: exact matches first, then by relevance
    if (search && typeof search === 'string') {
      const searchTerm = search.toLowerCase();
      objects.sort((a: any, b: any) => {
        const aExact = a.name.toLowerCase() === searchTerm || a.label.toLowerCase() === searchTerm;
        const bExact = b.name.toLowerCase() === searchTerm || b.label.toLowerCase() === searchTerm;

        if (aExact && !bExact) {
          return -1;
        }
        if (!aExact && bExact) {
          return 1;
        }

        const aStartsWith =
          a.name.toLowerCase().startsWith(searchTerm) ||
          a.label.toLowerCase().startsWith(searchTerm);
        const bStartsWith =
          b.name.toLowerCase().startsWith(searchTerm) ||
          b.label.toLowerCase().startsWith(searchTerm);

        if (aStartsWith && !bStartsWith) {
          return -1;
        }
        if (!aStartsWith && bStartsWith) {
          return 1;
        }

        return a.label.localeCompare(b.label);
      });
    } else {
      // Default sort by label
      objects.sort((a: any, b: any) => a.label.localeCompare(b.label));
    }

    const totalCount = objects.length;
    const offsetNum = parseInt(offset as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const paginatedObjects = objects.slice(offsetNum, offsetNum + limitNum);
    const hasMore = offsetNum + limitNum < totalCount;
    const nextOffset = hasMore ? offsetNum + limitNum : offsetNum;

    res.status(200).json({
      sobjects: paginatedObjects,
      totalCount,
      hasMore,
      nextOffset,
      searchTerm: search || null,
    });
  } catch (error) {
    console.error('Error searching objects:', error);
    res.status(500).json({
      message: 'Failed to search objects',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
