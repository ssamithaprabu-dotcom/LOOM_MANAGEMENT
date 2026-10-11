import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { initialLooms, defaultNotifications, defaultSettings } from '../src/data/mockData.js';

dotenv.config();

// Driver status: 'mysql' or 'sqlite'
let activeDriver = 'sqlite';

// MySQL Configuration from Environment Variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loomatrix',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// SQLite Fallback Configuration
const sqliteDbPath = path.resolve(
  process.cwd(),
  process.env.DATABASE_PATH || './server/database.sqlite'
);

let mysqlPool = null;
let sqliteDb = null;

// Initialize SQLite connection instance
try {
  const dir = path.dirname(sqliteDbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  sqlite3.verbose();
  sqliteDb = new sqlite3.Database(sqliteDbPath);
} catch (e) {
  console.warn('[Database] SQLite initialization notice:', e.message);
}

// Create MySQL pool instance (lazy connection)
try {
  mysqlPool = mysql.createPool(dbConfig);
} catch (e) {
  console.warn('[Database] MySQL pool creation notice:', e.message);
}

export const getActiveDriver = () => activeDriver;
export const pool = mysqlPool;

/**
 * Execute a query and return all matching rows.
 */
export const all = async (sql, params = []) => {
  if (activeDriver === 'mysql' && mysqlPool) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

/**
 * Execute a query and return the first matching row or null.
 */
export const get = async (sql, params = []) => {
  if (activeDriver === 'mysql' && mysqlPool) {
    const [rows] = await mysqlPool.query(sql, params);
    if (!rows || rows.length === 0) return null;
    return rows[0];
  }
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
};

/**
 * Execute an INSERT, UPDATE, or DELETE statement.
 */
export const run = async (sql, params = []) => {
  if (activeDriver === 'mysql' && mysqlPool) {
    const [result] = await mysqlPool.query(sql, params);
    return {
      lastID: result.insertId,
      insertId: result.insertId,
      changes: result.affectedRows,
      affectedRows: result.affectedRows,
    };
  }
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else {
        resolve({
          lastID: this.lastID,
          insertId: this.lastID,
          changes: this.changes,
          affectedRows: this.changes,
        });
      }
    });
  });
};

/**
 * Raw query executor.
 */
export const query = async (sql, params = []) => {
  if (activeDriver === 'mysql' && mysqlPool) {
    return mysqlPool.query(sql, params);
  }
  return all(sql, params);
};

/**
 * Transaction executor.
 */
export const transaction = async (callback) => {
  if (activeDriver === 'mysql' && mysqlPool) {
    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  return callback(sqliteDb);
};

/**
 * Test connectivity to MySQL database.
 */
export const testConnection = async () => {
  if (!mysqlPool) return false;
  try {
    const conn = await mysqlPool.getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch {
    return false;
  }
};

/**
 * Initialize database: tests MySQL first; falls back to SQLite if MySQL is offline.
 */
export async function initDatabase() {
  const mysqlAvailable = await testConnection();

  if (mysqlAvailable) {
    activeDriver = 'mysql';
    console.log('[Database] Connected to MySQL database.');

    // Create tables in MySQL if not exist
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Administrator',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS looms (
        id VARCHAR(64) PRIMARY KEY,
        loom_number INT NOT NULL,
        pic_number VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'STOPPED',
        current_set INT NOT NULL DEFAULT 1,
        current_meter INT NOT NULL DEFAULT 0,
        total_meter_run INT NOT NULL DEFAULT 0,
        total_meter_left INT NOT NULL DEFAULT 11000,
        total_meter_capacity INT NOT NULL DEFAULT 11000,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_looms_number (loom_number),
        INDEX idx_looms_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS loom_sets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loom_id VARCHAR(64) NOT NULL,
        set_number INT NOT NULL,
        takeup INT NOT NULL,
        meter INT NOT NULL,
        INDEX idx_loom_sets_loom (loom_id, set_number),
        CONSTRAINT fk_loom_sets_loom
          FOREIGN KEY (loom_id) REFERENCES looms (id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS loom_wifi (
        loom_id VARCHAR(64) PRIMARY KEY,
        ssid VARCHAR(128) NOT NULL,
        password VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        port INT NOT NULL DEFAULT 8080,
        connected TINYINT(1) NOT NULL DEFAULT 1,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_loom_wifi_loom
          FOREIGN KEY (loom_id) REFERENCES looms (id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS loom_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loom_id VARCHAR(64) NOT NULL,
        time VARCHAR(64) NOT NULL,
        action VARCHAR(100) NOT NULL,
        actor VARCHAR(100) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_loom_history_loom (loom_id, id),
        CONSTRAINT fk_loom_history_loom
          FOREIGN KEY (loom_id) REFERENCES looms (id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS loom_chart_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loom_id VARCHAR(64) NOT NULL,
        time VARCHAR(64) NOT NULL,
        meters INT NOT NULL,
        INDEX idx_loom_chart_loom (loom_id, id),
        CONSTRAINT fk_loom_chart_loom
          FOREIGN KEY (loom_id) REFERENCES looms (id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        time VARCHAR(64) NOT NULL,
        \`read\` TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notifications_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed defaults in MySQL if empty
    const userCount = await get(`SELECT COUNT(*) as count FROM users`);
    if (userCount && userCount.count === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      await run(
        `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
        ['admin', 'admin@example.com', passwordHash, 'Administrator']
      );
      console.log('[Database] Seeded default admin user in MySQL.');
    }
    return true;
  }

  // Fallback to SQLite
  activeDriver = 'sqlite';
  console.log(`[Database] MySQL is offline or not configured. Active engine: SQLite (${sqliteDbPath})`);

  // Ensure tables exist in SQLite
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Administrator',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS looms (
      id TEXT PRIMARY KEY,
      loom_number INTEGER NOT NULL,
      pic_number TEXT NOT NULL,
      status TEXT NOT NULL,
      current_set INTEGER NOT NULL DEFAULT 1,
      current_meter INTEGER NOT NULL DEFAULT 0,
      total_meter_run INTEGER NOT NULL DEFAULT 0,
      total_meter_left INTEGER NOT NULL DEFAULT 11000,
      total_meter_capacity INTEGER NOT NULL DEFAULT 11000,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS loom_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loom_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      takeup INTEGER NOT NULL,
      meter INTEGER NOT NULL,
      FOREIGN KEY (loom_id) REFERENCES looms (id) ON DELETE CASCADE
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS loom_wifi (
      loom_id TEXT PRIMARY KEY,
      ssid TEXT NOT NULL,
      password TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      port INTEGER NOT NULL,
      connected INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (loom_id) REFERENCES looms (id) ON DELETE CASCADE
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS loom_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loom_id TEXT NOT NULL,
      time TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (loom_id) REFERENCES looms (id) ON DELETE CASCADE
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS loom_chart_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loom_id TEXT NOT NULL,
      time TEXT NOT NULL,
      meters INTEGER NOT NULL,
      FOREIGN KEY (loom_id) REFERENCES looms (id) ON DELETE CASCADE
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      text TEXT NOT NULL,
      time TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure default Admin User exists in SQLite
  const userCount = await get(`SELECT COUNT(*) as count FROM users`);
  if (!userCount || userCount.count === 0) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    await run(
      `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['admin', 'admin@example.com', passwordHash, 'Administrator']
    );
    console.log('[Database] Seeded default admin user in SQLite (admin / admin123).');
  }

  return true;
}

export default { pool: mysqlPool, get, all, run, query, transaction, initDatabase, testConnection, getActiveDriver };
