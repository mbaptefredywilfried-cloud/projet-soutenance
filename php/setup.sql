-- ========================================
-- SCRIPT DE CRÉATION DE LA BASE NUMERA
-- ========================================

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS `numera` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `numera`;

-- ========================================
-- TABLE USERS
-- ========================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(10) NOT NULL PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE KEY,
  `password` VARCHAR(255) NOT NULL,
  `balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_income` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_expense` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_email (`email`),
  INDEX idx_username (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE CATEGORIES
-- ========================================
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE KEY,
  `description` TEXT,
  `icon` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE TRANSACTIONS
-- ========================================
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(10) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `category_id` INT UNSIGNED,
  `type` ENUM('income', 'expense') NOT NULL,
  `date` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (`user_id`),
  INDEX idx_category_id (`category_id`),
  INDEX idx_date (`date`),
  CONSTRAINT fk_transactions_user FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_category FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE BUDGETS
-- ========================================
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(10) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `limit_amount` DECIMAL(12, 2) NOT NULL,
  `category_id` INT UNSIGNED,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (`user_id`),
  INDEX idx_category_id (`category_id`),
  CONSTRAINT fk_budgets_user FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT fk_budgets_category FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- INSERTION DES CATÉGORIES PAR DÉFAUT
-- ========================================
INSERT IGNORE INTO `categories` (`name`, `description`, `icon`) VALUES
('Alimentation', 'Courses et restaurants', 'fa-utensils'),
('Transport', 'Essence, transport, parking', 'fa-car'),
('Loisirs', 'Divertissements et loisirs', 'fa-gamepad'),
('Santé', 'Médicaments et soins médicaux', 'fa-heartbeat'),
('Logement', 'Loyer, électricité, internet', 'fa-home'),
('Vêtements', 'Vêtements et accessoires', 'fa-shirt'),
('Éducation', 'Formation et études', 'fa-book'),
('Autres', 'Autres dépenses', 'fa-ellipsis-h'),
('Salaire', 'Revenu principal', 'fa-briefcase'),
('Bonus', 'Primes et bonus', 'fa-gift');
