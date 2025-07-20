import type { SalesforceConnection } from '../types/salesforce';
import { salesforceApiCall } from './salesforce';

export interface ObjectMetadata {
  name: string;
  label: string;
  labelPlural: string;
  keyPrefix: string;
  custom: boolean;
  createable: boolean;
  deletable: boolean;
  queryable: boolean;
  searchable: boolean;
  updateable: boolean;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    length: number;
    precision: number;
    scale: number;
    nillable: boolean;
    unique: boolean;
    calculated: boolean;
    custom: boolean;
    createable: boolean;
    updateable: boolean;
    externalId: boolean;
    idLookup: boolean;
    picklistValues: Array<{ label: string; value: string; active: boolean }>;
    relationshipName: string;
    referenceTo: string[];
    dependentPicklist: boolean;
    controllerName: string;
    soapType: string;
  }>;
  childRelationships: Array<{
    childSObject: string;
    field: string;
    relationshipName: string;
  }>;
  recordTypeInfos: Array<{
    name: string;
    recordTypeId: string;
    active: boolean;
  }>;
}

export interface CachedMetadata {
  data: ObjectMetadata;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// In-memory cache for metadata
const metadataCache = new Map<string, CachedMetadata>();

// Cache TTL: 10 minutes
const DEFAULT_TTL = 10 * 60 * 1000;

/**
 * Generate cache key for metadata
 */
function getCacheKey(instanceUrl: string, objectType: string): string {
  return `${instanceUrl}:${objectType}`;
}

/**
 * Check if cached metadata is still valid
 */
function isValidCacheEntry(entry: CachedMetadata): boolean {
  return Date.now() - entry.timestamp < entry.ttl;
}

/**
 * Get cached metadata if available and valid
 */
export function getCachedMetadata(instanceUrl: string, objectType: string): ObjectMetadata | null {
  const cacheKey = getCacheKey(instanceUrl, objectType);
  const cached = metadataCache.get(cacheKey);

  if (cached && isValidCacheEntry(cached)) {
    return cached.data;
  }

  // Remove expired entry
  if (cached) {
    metadataCache.delete(cacheKey);
  }

  return null;
}

/**
 * Cache metadata with TTL
 */
export function setCachedMetadata(
  instanceUrl: string,
  objectType: string,
  metadata: ObjectMetadata,
  ttl: number = DEFAULT_TTL
): void {
  const cacheKey = getCacheKey(instanceUrl, objectType);
  metadataCache.set(cacheKey, {
    data: metadata,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Get object metadata with caching
 */
export async function getObjectMetadataWithCache(
  connection: SalesforceConnection,
  objectType: string
): Promise<ObjectMetadata> {
  // Check cache first
  const cached = getCachedMetadata(connection.instanceUrl, objectType);
  if (cached) {
    return cached;
  }

  // Fetch from Salesforce API
  const response = await salesforceApiCall(
    connection,
    `/services/data/v58.0/sobjects/${objectType}/describe/`
  );

  if (!response.ok) {
    throw new Error(`Failed to get metadata for ${objectType}: ${response.statusText}`);
  }

  const metadata = await response.json();

  // Cache the result
  setCachedMetadata(connection.instanceUrl, objectType, metadata);

  return metadata;
}

/**
 * Clear all cached metadata
 */
export function clearMetadataCache(): void {
  metadataCache.clear();
}

/**
 * Clear cached metadata for specific instance
 */
export function clearInstanceCache(instanceUrl: string): void {
  metadataCache.forEach((_value, key) => {
    if (key.startsWith(`${instanceUrl}:`)) {
      metadataCache.delete(key);
    }
  });
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  let validEntries = 0;
  let expiredEntries = 0;

  metadataCache.forEach((v) => {
    if (isValidCacheEntry(v)) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  });

  return {
    total: metadataCache.size,
    valid: validEntries,
    expired: expiredEntries,
  };
}
