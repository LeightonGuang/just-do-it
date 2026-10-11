// This file serves as an index point for the database schema.

// Re-export all schema tables and types from './schema' for easy consumption.
export * from "./schema"; 

/**
 * NOTE ON DB ACCESS:
 * The previous circular dependency on 'getDb' has been removed here.
 * If a global database connection function is needed, it should be defined in
 * this file or imported from a separate utility module without creating circular references.
 */