-- =====================================================================
-- Loomatrix MySQL Schema Definition
-- Compatible with MySQL 8.0+ and MariaDB 10.4+
-- Character set: utf8mb4 | Engine: InnoDB
-- =====================================================================

-- Create database if not exists (optional, uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS `loomatrix` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `loomatrix`;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. Table: users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'Administrator',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Table: looms
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `looms` (
  `id` VARCHAR(64) PRIMARY KEY,
  `loom_number` INT NOT NULL,
  `pic_number` VARCHAR(64) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'STOPPED',
  `current_set` INT NOT NULL DEFAULT 1,
  `current_meter` INT NOT NULL DEFAULT 0,
  `total_meter_run` INT NOT NULL DEFAULT 0,
  `total_meter_left` INT NOT NULL DEFAULT 11000,
  `total_meter_capacity` INT NOT NULL DEFAULT 11000,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_looms_number` (`loom_number`),
  INDEX `idx_looms_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Table: loom_sets
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `loom_sets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `loom_id` VARCHAR(64) NOT NULL,
  `set_number` INT NOT NULL,
  `takeup` INT NOT NULL,
  `meter` INT NOT NULL,
  INDEX `idx_loom_sets_loom` (`loom_id`, `set_number`),
  CONSTRAINT `fk_loom_sets_loom`
    FOREIGN KEY (`loom_id`) REFERENCES `looms` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Table: loom_wifi
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `loom_wifi` (
  `loom_id` VARCHAR(64) PRIMARY KEY,
  `ssid` VARCHAR(128) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `port` INT NOT NULL DEFAULT 8080,
  `connected` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_loom_wifi_loom`
    FOREIGN KEY (`loom_id`) REFERENCES `looms` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Table: loom_history
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `loom_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `loom_id` VARCHAR(64) NOT NULL,
  `time` VARCHAR(64) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `actor` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_loom_history_loom` (`loom_id`, `id`),
  CONSTRAINT `fk_loom_history_loom`
    FOREIGN KEY (`loom_id`) REFERENCES `looms` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Table: loom_chart_data
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `loom_chart_data` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `loom_id` VARCHAR(64) NOT NULL,
  `time` VARCHAR(64) NOT NULL,
  `meters` INT NOT NULL,
  INDEX `idx_loom_chart_loom` (`loom_id`, `id`),
  CONSTRAINT `fk_loom_chart_loom`
    FOREIGN KEY (`loom_id`) REFERENCES `looms` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Table: notifications
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(64) PRIMARY KEY,
  `type` VARCHAR(50) NOT NULL,
  `text` TEXT NOT NULL,
  `time` VARCHAR(64) NOT NULL,
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notifications_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. Table: settings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
