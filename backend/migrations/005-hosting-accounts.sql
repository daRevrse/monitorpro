-- Migration 005 : comptes d'hébergement réutilisables (un compte porte N sites)

CREATE TABLE IF NOT EXISTS hosting_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NULL,
  login VARCHAR(255) NULL,
  panel_url VARCHAR(500) NULL,
  account_email VARCHAR(255) NULL,
  expires_at DATETIME NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hosting_accounts_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE websites
  ADD COLUMN hosting_account_id INT NULL AFTER client_name,
  ADD CONSTRAINT fk_websites_hosting_account FOREIGN KEY (hosting_account_id) REFERENCES hosting_accounts(id) ON DELETE SET NULL;
