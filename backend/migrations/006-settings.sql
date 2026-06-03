-- Migration 006 : table de configuration applicative (ligne unique)

CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  smtp_host VARCHAR(255) NULL,
  smtp_port INT NULL,
  smtp_secure TINYINT(1) NOT NULL DEFAULT 0,
  smtp_user VARCHAR(255) NULL,
  smtp_pass VARCHAR(255) NULL,
  smtp_from VARCHAR(255) NULL,
  slack_webhook_url VARCHAR(500) NULL,
  alert_cooldown INT NOT NULL DEFAULT 600000,
  default_check_interval INT NOT NULL DEFAULT 300,
  default_timeout INT NOT NULL DEFAULT 10000,
  default_ssl_check TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO app_settings (id) VALUES (1)
  ON DUPLICATE KEY UPDATE id = id;
