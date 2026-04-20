/**
 * HANA Simulation — SQLite Database Configuration (sql.js / WASM)
 * Simulates SAP HANA persistence layer using sql.js (pure JS SQLite)
 * 
 * sql.js is WASM-based — no native compilation required.
 * The DB is persisted to disk on every write operation.
 */
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'fleet-monitor.db');

let db: SqlJsDatabase;

/**
 * Initialize database: load from disk or create new
 */
export async function initializeDatabase(): Promise<void> {
  // Ensure data directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  // Load existing DB file or create new
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('[HANA Sim] Database loaded from disk');
  } else {
    db = new SQL.Database();
    console.log('[HANA Sim] New database created');
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Run schema
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.run(schema);

  // Persist
  saveDatabase();
  console.log('[HANA Sim] Database schema initialized');
}

/**
 * Persist database to disk
 */
export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/**
 * Get the database instance
 */
export function getDb(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return db;
}

/**
 * Helper: Run a query and return all rows as objects
 */
export function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * Helper: Run a query and return the first row as object
 */
export function queryOne(sql: string, params: any[] = []): any | null {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Helper: Run an INSERT/UPDATE/DELETE and persist to disk
 */
export function execute(sql: string, params: any[] = []): void {
  db.run(sql, params);
  saveDatabase();
}

export default { getDb, queryAll, queryOne, execute, saveDatabase, initializeDatabase };
