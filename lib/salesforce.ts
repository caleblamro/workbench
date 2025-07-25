import type { NextApiRequest } from 'next';
import { parse } from 'cookie';
import type { SalesforceConnection } from '../types/salesforce';

/**
 * Extract Salesforce connection details from request cookies
 */
export function getSalesforceConnection(req: NextApiRequest): SalesforceConnection | null {
  const cookies = parse(req.headers.cookie || '');

  const accessToken = cookies.sf_access_token;
  const instanceUrl = cookies.sf_instance_url;
  const refreshToken = cookies.sf_refresh_token;

  if (!accessToken || !instanceUrl) {
    return null;
  }

  return {
    accessToken,
    instanceUrl,
    refreshToken,
  };
}

/**
 * Make an authenticated API call to Salesforce
 */
export async function salesforceApiCall(
  connection: SalesforceConnection,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${connection.instanceUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response;
}

/**
 * Execute a SOQL query
 */
export async function executeQuery(connection: SalesforceConnection, query: string): Promise<any> {
  const encodedQuery = encodeURIComponent(query);
  const response = await salesforceApiCall(
    connection,
    `/services/data/v58.0/query/?q=${encodedQuery}`
  );

  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get Salesforce object metadata
 */
export async function getObjectMetadata(
  connection: SalesforceConnection,
  objectType: string
): Promise<any> {
  const response = await salesforceApiCall(
    connection,
    `/services/data/v58.0/sobjects/${objectType}/describe/`
  );

  if (!response.ok) {
    throw new Error(`Failed to get metadata for ${objectType}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List all available Salesforce objects
 */
export async function listObjects(connection: SalesforceConnection): Promise<any> {
  const response = await salesforceApiCall(connection, '/services/data/v58.0/sobjects/');

  if (!response.ok) {
    throw new Error(`Failed to list objects: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get organization limits
 */
export async function getOrgLimits(connection: SalesforceConnection): Promise<any> {
  const response = await salesforceApiCall(connection, '/services/data/v58.0/limits/');

  if (!response.ok) {
    throw new Error(`Failed to get org limits: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Execute a SOQL query using Bulk API
 */
export async function executeBulkQuery(
  connection: SalesforceConnection,
  query: string
): Promise<any> {
  // Step 1: Create a bulk job
  const jobResponse = await salesforceApiCall(connection, '/services/data/v58.0/jobs/query', {
    method: 'POST',
    body: JSON.stringify({
      operation: 'query',
      query,
      contentType: 'CSV',
      lineEnding: 'LF',
    }),
  });

  if (!jobResponse.ok) {
    throw new Error(`Failed to create bulk job: ${jobResponse.statusText}`);
  }

  const job = await jobResponse.json();
  const jobId = job.id;

  // Step 2: Poll for job completion
  let jobStatus = 'InProgress';
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max wait time

  while (jobStatus === 'InProgress' && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

    const statusResponse = await salesforceApiCall(
      connection,
      `/services/data/v58.0/jobs/query/${jobId}`
    );

    if (!statusResponse.ok) {
      throw new Error(`Failed to check job status: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();
    jobStatus = statusData.state;
    attempts++;

    if (jobStatus === 'Failed') {
      throw new Error(`Bulk job failed: ${statusData.stateMessage || 'Unknown error'}`);
    }
  }

  if (jobStatus !== 'JobComplete') {
    throw new Error('Bulk job did not complete within the expected time');
  }

  // Step 3: Get job results
  const resultsResponse = await salesforceApiCall(
    connection,
    `/services/data/v58.0/jobs/query/${jobId}/results`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (!resultsResponse.ok) {
    throw new Error(`Failed to get job results: ${resultsResponse.statusText}`);
  }

  const resultsText = await resultsResponse.text();

  // Step 4: Parse CSV results and convert to regular query format
  const records = parseCSVToRecords(resultsText);

  // Return in the same format as regular query API
  return {
    totalSize: records.length,
    done: true,
    records,
  };
}

/**
 * Parse CSV results from Bulk API into record format
 */
function parseCSVToRecords(csvText: string): Array<Record<string, any>> {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) {
    return [];
  }

  // Parse header line
  const headers = lines[0].split(',').map(
    (header) => header.replace(/^"|"$/g, '') // Remove surrounding quotes
  );

  // Parse data lines
  const records: Array<Record<string, any>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }

    const values = parseCSVLine(line);
    const record: Record<string, any> = {};

    headers.forEach((header, index) => {
      let value: string | boolean | number | null = values[index] || null;

      // Convert empty strings to null
      if (value === '') {
        value = null;
      }
      // Try to parse numbers and booleans
      else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (value && !isNaN(Number(value)) && !isNaN(parseFloat(value))) {
        // Only convert to number if it's clearly numeric
        const num = parseFloat(value);
        if (num.toString() === value || `${num.toString()}.0` === value) {
          value = num;
        }
      }

      record[header] = value;
    });

    records.push(record);
  }

  return records;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  values.push(current);

  return values;
}
