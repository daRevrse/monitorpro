-- Migration 002 : champs métier supplémentaires sur les sites
-- Type de site, informations d'hébergement (saisie manuelle), notes

ALTER TABLE websites
  ADD COLUMN site_type VARCHAR(100) NULL AFTER client_name,
  ADD COLUMN hosting_provider VARCHAR(255) NULL AFTER site_type,
  ADD COLUMN hosting_expires_at DATETIME NULL AFTER hosting_provider,
  ADD COLUMN server_ip VARCHAR(100) NULL AFTER hosting_expires_at,
  ADD COLUMN notes TEXT NULL AFTER server_ip;
