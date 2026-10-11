# Loomatrix MySQL Migration Guide

This guide describes how to complete the migration from SQLite to MySQL for the Loomatrix project.

---

## 1. Prerequisites

1. Ensure MySQL (version 8.0+ or MariaDB 10.4+) is installed and running on your system or server.
2. Ensure you have access to a MySQL user account with privileges to create databases and tables.

---

## 2. Create the Database

Log in to your MySQL terminal or GUI (MySQL Workbench / phpMyAdmin / DBeaver) and run:

```sql
CREATE DATABASE IF NOT EXISTS loomatrix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 3. Apply the MySQL Schema (Optional / Manual)

You can apply the schema manually:

```bash
mysql -u your_username -p loomatrix < server/schema.sql
```

*(Note: If you skip this manual step, the Loomatrix backend server's `initDatabase()` function will automatically create all missing tables upon first connection).*

---

## 4. Configure Environment Variables

Edit your `.env` file (or copy from `.env.example`) and fill in your MySQL credentials:

```dotenv
PORT=5000
JWT_SECRET=loom_super_secret_jwt_key_2026

# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=loomatrix
DB_CONNECTION_LIMIT=10

# SQLite Backup Reference
DATABASE_PATH=./server/database.sqlite
```

---

## 5. Preview & Execute Data Migration

### Step 5a: Dry-Run Inspection
Verify that your existing SQLite records are readable without writing anything to MySQL:

```bash
npm run migrate:dry-run
```

### Step 5b: Execute Data Transfer
Once MySQL is running and your `.env` has your valid credentials, execute the migration:

```bash
npm run migrate:sqlite-to-mysql
```

This will safely transfer all records from `server/database.sqlite` into MySQL inside an isolated transaction.

---

## 6. Start the Backend Server

Start the backend server:

```bash
npm run server
```

The server will connect via the `mysql2` pool, initialize tables if not already present, seed defaults if empty, and serve API requests.
