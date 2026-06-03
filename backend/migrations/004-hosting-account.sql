-- Migration 004 : compte d'hébergement du site
-- Identifiant, panneau d'administration et email du compte (sans mot de passe)

ALTER TABLE websites
  ADD COLUMN hosting_account VARCHAR(255) NULL AFTER hosting_provider,
  ADD COLUMN hosting_panel_url VARCHAR(500) NULL AFTER hosting_account,
  ADD COLUMN hosting_account_email VARCHAR(255) NULL AFTER hosting_panel_url;
