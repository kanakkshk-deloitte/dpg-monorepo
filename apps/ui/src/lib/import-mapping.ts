import type { RJSFSchema } from '@rjsf/utils';

interface FlattenedValue {
  path: string;
  key: string;
  value: unknown;
}

export interface ImportMappingResult {
  mergedData: Record<string, unknown>;
  mappedCount: number;
  skippedKeys: string[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

function toCamelCase(value: string): string {
  return toSnakeCase(value).replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function flattenObject(value: unknown, prefix = ''): FlattenedValue[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => flattenObject(entry, prefix ? `${prefix}.${index}` : String(index)));
  }

  if (!isPlainObject(value)) {
    if (!prefix) return [];
    const key = prefix.split('.').at(-1) ?? prefix;
    return [{ path: prefix, key, value }];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(nestedValue) || Array.isArray(nestedValue)) {
      return flattenObject(nestedValue, nextPrefix);
    }
    return [{ path: nextPrefix, key, value: nestedValue }];
  });
}

function addCandidate(map: Record<string, unknown>, key: string, value: unknown) {
  if (!key || value === undefined || value === null || value === '') return;
  if (!(key in map)) {
    map[key] = value;
  }
}

export function extractImportCandidates(value: unknown): Record<string, unknown> {
  const flattened = flattenObject(value);
  const candidates: Record<string, unknown> = {};

  for (const entry of flattened) {
    addCandidate(candidates, entry.path, entry.value);
    addCandidate(candidates, entry.key, entry.value);
    addCandidate(candidates, toSnakeCase(entry.key), entry.value);
    addCandidate(candidates, toCamelCase(entry.key), entry.value);
    addCandidate(candidates, normalizeKey(entry.key), entry.value);
  }

  return candidates;
}

function coerceImportedValue(value: unknown, propertySchema: RJSFSchema | undefined): unknown {
  if (!propertySchema) return value;
  if ((propertySchema.type === 'number' || propertySchema.type === 'integer') && typeof value === 'string') {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? value : numericValue;
  }
  if (propertySchema.type === 'string' && typeof value === 'number') {
    return String(value);
  }
  return value;
}

function getSchemaAliases(propertyName: string, propertySchema: RJSFSchema): string[] {
  const withExtensions = propertySchema as RJSFSchema & {
    'x-import-aliases'?: unknown;
    'x-import-paths'?: unknown;
    'x-wallet-aliases'?: unknown;
  };

  const aliases = [
    propertyName,
    toSnakeCase(propertyName),
    toCamelCase(propertyName),
    normalizeKey(propertyName),
  ];

  for (const extensionKey of ['x-import-aliases', 'x-import-paths', 'x-wallet-aliases'] as const) {
    const extensionValue = withExtensions[extensionKey];
    if (Array.isArray(extensionValue)) {
      for (const value of extensionValue) {
        if (typeof value === 'string' && value.trim()) {
          aliases.push(value.trim(), toSnakeCase(value), toCamelCase(value), normalizeKey(value));
        }
      }
    }
  }

  return [...new Set(aliases)];
}

export function mergeImportedDataIntoSchema(
  schema: RJSFSchema,
  currentData: Record<string, unknown> | null,
  importResult: {
    data: Record<string, unknown>;
    candidates?: Record<string, unknown>;
    rawPayload?: unknown;
  }
): ImportMappingResult {
  const propertyMap = (schema.properties ?? {}) as Record<string, RJSFSchema>;
  const mergedData: Record<string, unknown> = { ...(currentData ?? {}) };
  const skippedKeys = Object.keys(importResult.data);
  const rawCandidates = extractImportCandidates(importResult.rawPayload);
  const mergedCandidates = {
    ...rawCandidates,
    ...(importResult.candidates ?? {}),
    ...extractImportCandidates(importResult.data),
  };
  let mappedCount = 0;

  for (const [propertyName, propertySchema] of Object.entries(propertyMap)) {
    const aliases = getSchemaAliases(propertyName, propertySchema);
    const matchedAlias = aliases.find((alias) => alias in mergedCandidates);
    if (!matchedAlias) {
      continue;
    }

    mergedData[propertyName] = coerceImportedValue(mergedCandidates[matchedAlias], propertySchema);
    mappedCount += 1;

    for (const alias of aliases) {
      const skippedIndex = skippedKeys.indexOf(alias);
      if (skippedIndex >= 0) {
        skippedKeys.splice(skippedIndex, 1);
      }
    }
  }

  return {
    mergedData,
    mappedCount,
    skippedKeys,
  };
}
