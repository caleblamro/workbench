import type { NextApiRequest, NextApiResponse } from 'next';
import { getSalesforceConnection, salesforceApiCall } from '../../../../../lib/salesforce';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const connection = getSalesforceConnection(req);
  if (!connection) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { objectType, recordId } = req.query;

  if (!objectType || typeof objectType !== 'string') {
    return res.status(400).json({ message: 'Object type is required' });
  }

  if (!recordId || typeof recordId !== 'string') {
    return res.status(400).json({ message: 'Record ID is required' });
  }

  try {
    // First, get the object metadata to determine available fields
    const metadataResponse = await salesforceApiCall(
      connection,
      `/services/data/v58.0/sobjects/${objectType}/describe/`
    );

    if (!metadataResponse.ok) {
      throw new Error(`Failed to get metadata for ${objectType}: ${metadataResponse.statusText}`);
    }

    const metadata = await metadataResponse.json();
    
    // Get all queryable fields
    const queryableFields = metadata.fields
      .filter((field: any) => !field.calculated && field.name !== 'CreatedDate' && field.name !== 'LastModifiedDate')
      .map((field: any) => field.name);

    // Always include essential fields
    const essentialFields = ['Id', 'CreatedDate', 'LastModifiedDate', 'CreatedBy.Name', 'LastModifiedBy.Name'];
    const allFields = [...new Set([...essentialFields, ...queryableFields])];

    // Build SOQL query
    const soqlQuery = `SELECT ${allFields.join(', ')} FROM ${objectType} WHERE Id = '${recordId}' LIMIT 1`;

    // Execute query
    const queryResponse = await salesforceApiCall(
      connection,
      `/services/data/v58.0/query/?q=${encodeURIComponent(soqlQuery)}`
    );

    if (!queryResponse.ok) {
      const errorData = await queryResponse.json();
      throw new Error(errorData.message || `Failed to fetch record: ${queryResponse.statusText}`);
    }

    const queryResult = await queryResponse.json();

    if (queryResult.totalSize === 0) {
      return res.status(404).json({ message: `Record not found: ${recordId}` });
    }

    const record = queryResult.records[0];

    // Return both the record data and metadata for field information
    res.status(200).json({
      record,
      metadata: {
        name: metadata.name,
        label: metadata.label,
        labelPlural: metadata.labelPlural,
        custom: metadata.custom,
        fields: metadata.fields
      }
    });
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({
      message: `Failed to fetch record ${recordId}`,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
