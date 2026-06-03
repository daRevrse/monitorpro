-- Migration 003 : gestion des interventions sur les sites

CREATE TABLE IF NOT EXISTS interventions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  website_id INT NOT NULL,
  performed_by INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  intervention_type ENUM('maintenance','corrective','update','incident','other') NOT NULL DEFAULT 'maintenance',
  resolution ENUM('resolved','pending','follow_up','failed') NULL,
  state ENUM('in_progress','ended') NOT NULL DEFAULT 'in_progress',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_interventions_site_state (website_id, state),
  INDEX idx_interventions_started (started_at),
  CONSTRAINT fk_interventions_website FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
  CONSTRAINT fk_interventions_user FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
