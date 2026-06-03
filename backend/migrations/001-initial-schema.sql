-- ========================================
-- backend/migrations/001-initial-schema.sql
-- ========================================
-- Création de la base de données
CREATE DATABASE IF NOT EXISTS monitorpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE monitorpro;

-- Table des entreprises
CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  subscription_plan ENUM('basic', 'pro', 'enterprise') DEFAULT 'basic',
  max_sites INT DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'manager', 'technician', 'client') DEFAULT 'technician',
  company_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_company_role (company_id, role)
);

-- Table des sessions utilisateur
CREATE TABLE user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  refresh_token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_token (user_id, refresh_token(100)),
  INDEX idx_expires (expires_at)
);

-- Table des sites web
CREATE TABLE websites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  company_id INT NOT NULL,
  client_name VARCHAR(255),
  check_interval INT DEFAULT 300,
  timeout_threshold INT DEFAULT 10000,
  status ENUM('up', 'down', 'warning', 'maintenance') DEFAULT 'up',
  is_active BOOLEAN DEFAULT TRUE,
  ssl_check BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_company_status (company_id, status),
  INDEX idx_active_sites (is_active, status)
);

-- Table des vérifications
CREATE TABLE website_checks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  website_id INT NOT NULL,
  status_code INT,
  response_time INT,
  status ENUM('up', 'down', 'warning') NOT NULL,
  error_message TEXT,
  ssl_valid BOOLEAN,
  ssl_expires_at TIMESTAMP NULL,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
  INDEX idx_website_time (website_id, checked_at),
  INDEX idx_status_time (status, checked_at)
);

-- Table des incidents
CREATE TABLE incidents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  website_id INT NOT NULL,
  status ENUM('open', 'acknowledged', 'resolved') DEFAULT 'open',
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  acknowledged_by INT NULL,
  resolved_by INT NULL,
  description TEXT,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
  FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_website_status (website_id, status),
  INDEX idx_severity_time (severity, started_at)
);

-- Société par défaut (mono-tenant)
INSERT INTO companies (name, slug, subscription_plan, max_sites) VALUES
('Administration', 'admin', 'enterprise', 1000);

-- NOTE : aucun administrateur n'est créé par défaut (sécurité).
-- Le premier admin se crée au déploiement :
--   cd backend && npm run create-admin -- <email> <password> <Prénom> <Nom> admin "Administration"
-- (En Docker : docker compose exec backend node scripts/createUser.js <email> <password> <Prénom> <Nom> admin "Administration")

