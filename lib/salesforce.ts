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
      'Authorization': `Bearer ${connection.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response;
}

/**
 * Execute a SOQL query
 */
export async function executeQuery(
  connection: SalesforceConnection,
  query: string
): Promise<any> {
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
export async function listObjects(
  connection: SalesforceConnection
): Promise<any> {
  const response = await salesforceApiCall(
    connection,
    '/services/data/v58.0/sobjects/'
  );

  if (!response.ok) {
    throw new Error(`Failed to list objects: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get organization limits
 */
export async function getOrgLimits(
  connection: SalesforceConnection
): Promise<any> {
  const response = await salesforceApiCall(
    connection,
    '/services/data/v58.0/limits/'
  );

  if (!response.ok) {
    throw new Error(`Failed to get org limits: ${response.statusText}`);
  }

  return response.json();
}
