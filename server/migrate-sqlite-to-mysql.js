/**
 * ============================================================================
 * Loomatrix: SQLite to MySQL Data Migration Script
 * ============================================================================
 * 
 * Transfers all existing data from SQLite (server/database.sqlite) to MySQL.
 * 
 * Preserves:
 *  - Primary keys & UUID/string IDs
 *  - Relational integrity across all tables
 *  - Telemetry, chart points, and audit logs
 *  - Wi-Fi credentials & settings
 *  - Timestamps and boolean states
 * 
 * Usage:
 *   1. Dry Run (Inspect SQLite data only, no MySQL writes):
 *      node server/migrate-sqlite-to-mysql.js --dry-run
 * 
 *   2. Execute Migration:
 *      node server/migrate-sqlite-to-mysql.js
 * ============================================================================
 */

import sqlite3 from 'sqlite3';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const isDryRun = process.argv.includes('--dry-run');

const sqliteDbPath = path.resolve(
  process.cwd(),
  process.env.DATABASE_PATH || './server/database.sqlite'
);

const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loomatrix',
  multipleStatements: true,
};

// Helper to query SQLite with promises
function querySqlite(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function runMigration() {
  console.log('====================================================');
  console.log(' Loomatrix: SQLite -> MySQL Data Migration Tool');
  console.log('====================================================');

  if (isDryRun) {
    console.log('>>> RUNNING IN DRY-RUN MODE: NO WRITES TO MYSQL <<<');
  }

  // 1. Verify SQLite database file exists
  if (!fs.existsSync(sqliteDbPath)) {
    console.error(`\n[Error] SQLite database not found at: ${sqliteDbPath}`);
    process.exit(1);
  }
  console.log(`\n[1/4] Found SQLite source database at: ${sqliteDbPath}`);

  const sqlite = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY);

  let mysqlConn = null;

  try {
    // 2. Read records from SQLite
    console.log('\n[2/4] Reading data from SQLite...');
    const users = await querySqlite(sqlite, 'SELECT * FROM users');
    const looms = await querySqlite(sqlite, 'SELECT * FROM looms');
    const loomSets = await querySqlite(sqlite, 'SELECT * FROM loom_sets');
    const loomWifi = await querySqlite(sqlite, 'SELECT * FROM loom_wifi');
    const loomHistory = await querySqlite(sqlite, 'SELECT * FROM loom_history');
    const loomChartData = await querySqlite(sqlite, 'SELECT * FROM loom_chart_data');
    const notifications = await querySqlite(sqlite, 'SELECT * FROM notifications');
    const settings = await querySqlite(sqlite, 'SELECT * FROM settings');

    console.log(`  - users:           ${users.length} row(s)`);
    console.log(`  - looms:           ${looms.length} row(s)`);
    console.log(`  - loom_sets:       ${loomSets.length} row(s)`);
    console.log(`  - loom_wifi:       ${loomWifi.length} row(s)`);
    console.log(`  - loom_history:    ${loomHistory.length} row(s)`);
    console.log(`  - loom_chart_data: ${loomChartData.length} row(s)`);
    console.log(`  - notifications:   ${notifications.length} row(s)`);
    console.log(`  - settings:        ${settings.length} row(s)`);

    if (isDryRun) {
      console.log('\n[Dry Run Complete] All SQLite data read successfully. No changes made to MySQL.');
      return;
    }

    // 3. Connect to MySQL
    console.log(`\n[3/4] Connecting to MySQL database "${mysqlConfig.database}" at ${mysqlConfig.host}:${mysqlConfig.port}...`);
    mysqlConn = await mysql.createConnection(mysqlConfig);
    console.log('Connected to MySQL successfully.');

    // 4. Migrate Data with Transaction and Disabled Foreign Key Checks
    console.log('\n[4/4] Inserting records into MySQL...');
    await mysqlConn.beginTransaction();
    await mysqlConn.query('SET FOREIGN_KEY_CHECKS = 0;');

    // 4.1 users
    for (const u of users) {
      await mysqlConn.execute(
        `INSERT INTO users (id, username, email, password_hash, role, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE email = VALUES(email), role = VALUES(role)`,
        [u.id, u.username, u.email, u.password_hash, u.role || 'Administrator', u.created_at || new Date()]
      );
    }
    console.log(`  ✔ users migrated (${users.length})`);

    // 4.2 looms
    for (const l of looms) {
      await mysqlConn.execute(
        `INSERT INTO looms (id, loom_number, pic_number, status, current_set, current_meter, total_meter_run, total_meter_left, total_meter_capacity, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          current_set = VALUES(current_set),
          current_meter = VALUES(current_meter),
          total_meter_run = VALUES(total_meter_run),
          total_meter_left = VALUES(total_meter_left)`,
        [
          l.id,
          l.loom_number,
          l.pic_number,
          l.status,
          l.current_set,
          l.current_meter,
          l.total_meter_run,
          l.total_meter_left,
          l.total_meter_capacity,
          l.created_at || new Date(),
          l.updated_at || new Date(),
        ]
      );
    }
    console.log(`  ✔ looms migrated (${looms.length})`);

    // 4.3 loom_sets
    for (const s of loomSets) {
      await mysqlConn.execute(
        `INSERT INTO loom_sets (id, loom_id, set_number, takeup, meter)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE takeup = VALUES(takeup), meter = VALUES(meter)`,
        [s.id, s.loom_id, s.set_number, s.takeup, s.meter]
      );
    }
    console.log(`  ✔ loom_sets migrated (${loomSets.length})`);

    // 4.4 loom_wifi
    for (const w of loomWifi) {
      await mysqlConn.execute(
        `INSERT INTO loom_wifi (loom_id, ssid, password, ip_address, port, connected, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE ssid = VALUES(ssid), password = VALUES(password), ip_address = VALUES(ip_address), port = VALUES(port), connected = VALUES(connected)`,
        [w.loom_id, w.ssid, w.password, w.ip_address, w.port, w.connected ? 1 : 0, w.updated_at || new Date()]
      );
    }
    console.log(`  ✔ loom_wifi migrated (${loomWifi.length})`);

    // 4.5 loom_history
    for (const h of loomHistory) {
      await mysqlConn.execute(
        `INSERT INTO loom_history (id, loom_id, time, action, actor, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE action = VALUES(action)`,
        [h.id, h.loom_id, h.time, h.action, h.actor, h.created_at || new Date()]
      );
    }
    console.log(`  ✔ loom_history migrated (${loomHistory.length})`);

    // 4.6 loom_chart_data
    for (const c of loomChartData) {
      await mysqlConn.execute(
        `INSERT INTO loom_chart_data (id, loom_id, time, meters)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE meters = VALUES(meters)`,
        [c.id, c.loom_id, c.time, c.meters]
      );
    }
    console.log(`  ✔ loom_chart_data migrated (${loomChartData.length})`);

    // 4.7 notifications (escaping reserved `read` column)
    for (const n of notifications) {
      await mysqlConn.execute(
        `INSERT INTO notifications (id, type, text, time, \`read\`, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE \`read\` = VALUES(\`read\`)`,
        [n.id, n.type, n.text, n.time, n.read ? 1 : 0, n.created_at || new Date()]
      );
    }
    console.log(`  ✔ notifications migrated (${notifications.length})`);

    // 4.8 settings
    for (const st of settings) {
      await mysqlConn.execute(
        `INSERT INTO settings (id, username, email, updated_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE username = VALUES(username), email = VALUES(email)`,
        [st.id, st.username, st.email, st.updated_at || new Date()]
      );
    }
    console.log(`  ✔ settings migrated (${settings.length})`);

    await mysqlConn.query('SET FOREIGN_KEY_CHECKS = 1;');
    await mysqlConn.commit();

    console.log('\n====================================================');
    console.log(' Migration to MySQL Finished Successfully!');
    console.log(' All tables and records were transferred.');
    console.log('====================================================\n');
  } catch (error) {
    if (mysqlConn) {
      try {
        await mysqlConn.rollback();
      } catch (rbErr) {}
    }
    console.error('\n[Migration Error]:', error.message);
    process.exit(1);
  } finally {
    sqlite.close();
    if (mysqlConn) {
      await mysqlConn.end();
    }
  }
}

runMigration();
