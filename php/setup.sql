-- Création de la base de données
CREATE DATABASE IF NOT EXISTS numera
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE numera;

-- Table des utilisateurs
CREATE TABLE users (
    id VARCHAR(8) NOT NULL PRIMARY KEY, -- Format AD_XXXXX
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- L'identifiant est généré automatiquement via un trigger
    CONSTRAINT chk_id_format CHECK (id REGEXP '^AD_[0-9]{5}$')
) ENGINE=InnoDB COMMENT='Utilisateurs de l’application';

-- Table des catégories (revenus/dépenses)
CREATE TABLE categories (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(8) NOT NULL,
    name VARCHAR(50) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uc_user_category UNIQUE (user_id, name, type)
) ENGINE=InnoDB COMMENT='Catégories personnalisées par utilisateur';

-- Table des transactions
CREATE TABLE transactions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(8) NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description VARCHAR(255),
    transaction_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, transaction_date)
) ENGINE=InnoDB COMMENT='Transactions financières des utilisateurs';

-- Table des budgets mensuels
CREATE TABLE budgets (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(8) NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    month CHAR(7) NOT NULL, -- Format YYYY-MM
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_budgets_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    CONSTRAINT uc_budget UNIQUE (user_id, category_id, month)
) ENGINE=InnoDB COMMENT='Budgets mensuels par catégorie et utilisateur';

-- Trigger pour générer automatiquement l’ID utilisateur au format AD_XXXXX
DELIMITER $$
CREATE TRIGGER before_insert_users
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    DECLARE new_id VARCHAR(8);
    DECLARE try_count INT DEFAULT 0;
    REPEAT
        SET new_id = CONCAT('AD_', LPAD(FLOOR(RAND() * 100000), 5, '0'));
        SET try_count = try_count + 1;
    UNTIL (SELECT COUNT(*) FROM users WHERE id = new_id) = 0 OR try_count > 10
    END REPEAT;
    SET NEW.id = new_id;
END$$
DELIMITER ;

-- Exemple d’insertion d’un utilisateur
INSERT INTO users (username, email, password_hash)
VALUES ('alice', 'alice@email.com', 'hash_de_mot_de_passe');

-- Exemple de requête pour vérifier un dépassement de budget
-- (Liste les budgets dépassés pour un utilisateur donné et un mois donné)
SELECT
    b.user_id,
    b.category_id,
    c.name AS category_name,
    b.month,
    b.amount AS budget_amount,
    IFNULL(SUM(t.amount), 0) AS total_spent
FROM budgets b
LEFT JOIN transactions t
    ON b.user_id = t.user_id
    AND b.category_id = t.category_id
    AND t.type = 'expense'
    AND DATE_FORMAT(t.transaction_date, '%Y-%m') = b.month
JOIN categories c ON b.category_id = c.id
WHERE b.user_id = 'AD_XXXXX' -- Remplacer par l’ID réel de l’utilisateur
  AND b.month = '2026-02'
GROUP BY b.id
HAVING total_spent > b.amount;

-- Fin du script