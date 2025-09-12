# MonitorPro 🚀

**Système de surveillance de sites web en temps réel**

MonitorPro est une plateforme complète de monitoring qui vous permet de surveiller la disponibilité, les performances et la santé de vos sites web avec des alertes en temps réel.

## ✨ Fonctionnalités

### 🔍 Monitoring Avancé

- **Surveillance HTTP/HTTPS** : Vérification des codes de réponse et temps de réponse
- **Monitoring SSL** : Surveillance des certificats et alertes d'expiration
- **Vérifications personnalisables** : Intervalles et seuils configurables par site
- **Multi-protocoles** : Support HTTP, HTTPS avec gestion des redirections

### 📊 Dashboard Temps Réel

- **Interface moderne** : Dashboard responsive avec Tailwind CSS
- **Mises à jour temps réel** : WebSocket pour les notifications instantanées
- **Vues multiples** : Grille et liste avec filtrage et recherche
- **Statistiques détaillées** : Uptime, temps de réponse, historiques

### 🚨 Système d'Alertes

- **Multi-canaux** : Email, Slack, webhooks personnalisés
- **Alertes intelligentes** : Cooldown et évitement du spam
- **Escalade** : Niveaux de criticité et notifications ciblées
- **Incidents** : Gestion automatique des incidents avec résolution

### 👥 Gestion Multi-Utilisateurs

- **Authentification JWT** : Sécurisée avec refresh tokens
- **Rôles utilisateurs** : Admin, Manager, Technicien, Client
- **Multi-tenant** : Isolation des données par entreprise
- **Permissions** : Contrôle d'accès granulaire

### 📈 Rapports & Statistiques

- **Historiques** : Conservation des données avec nettoyage automatique
- **Rapports** : Génération automatique de rapports quotidiens
- **Métriques** : Uptime, temps de réponse, tendances
- **Export** : Données exportables pour analyse

## 🏗️ Architecture Technique

### Backend

- **Node.js** + Express.js
- **MySQL** + Sequelize ORM
- **Socket.io** pour temps réel
- **Node-cron** pour les tâches programmées
- **Nodemailer** pour les emails
- **Winston** pour les logs

### Frontend

- **React** avec Hooks
- **Tailwind CSS** pour le design
- **Recharts** pour les graphiques
- **Socket.io-client** pour temps réel

### Infrastructure

- **Docker** ready
- **PM2** pour la production
- **Nginx** comme reverse proxy
- **Rotation des logs** automatique

## 🚀 Installation Rapide

### Prérequis

- **Node.js** 16+
- **MySQL** 8.0+
- **npm** ou **yarn**

### Installation Automatique

1. **Cloner le repository**

```bash
git clone https://github.com/votre-username/monitorpro.git
cd monitorpro
```

2. **Lancer l'installation automatique**

```bash
chmod +x install.sh
./install.sh
```

Le script d'installation vous guidera à travers :

- Vérification des prérequis
- Configuration de la base de données
- Installation des dépendances
- Génération des clés de sécurité
- Création de l'utilisateur administrateur

### Installation Manuelle

<details>
<summary>Cliquez pour voir l'installation manuelle</summary>

#### 1. Configuration Backend

```bash
cd backend
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
nano .env
```

#### 2. Configuration Base de Données

```sql
CREATE DATABASE monitorpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
# Exécuter les migrations
mysql -u root -p monitorpro < migrations/001-initial-schema.sql
```

#### 3. Configuration Frontend

```bash
cd frontend
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
nano .env
```

#### 4. Build et Démarrage

```bash
# Backend
cd backend && npm run dev

# Frontend (nouveau terminal)
cd frontend && npm start
```

</details>

## ⚙️ Configuration

### Variables d'Environnement

#### Backend (.env)

```bash
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=monitorpro
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key

# SMTP pour les alertes
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
DEFAULT_CHECK_INTERVAL=300
DEFAULT_TIMEOUT=10000
MAX_CONCURRENT_CHECKS=50

# Alertes
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
COOLDOWN_PERIOD=600000
```

#### Frontend (.env)

```bash
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=http://localhost:3001
REACT_APP_APP_NAME=MonitorPro
```

### Configuration Email

Pour les alertes par email, configurez un compte SMTP :

**Gmail (recommandé)**

1. Activez l'authentification 2FA sur votre compte Google
2. Générez un mot de passe d'application
3. Utilisez ce mot de passe dans `SMTP_PASS`

**Autres fournisseurs**

- **Outlook** : smtp-mail.outlook.com:587
- **Yahoo** : smtp.mail.yahoo.com:587
- **Serveur personnalisé** : Vos paramètres SMTP

## 🎯 Utilisation

### 1. Première Connexion

Accédez à `http://localhost:3000` et connectez-vous avec le compte administrateur créé lors de l'installation.

### 2. Ajouter des Sites Web

1. Cliquez sur **"Ajouter un site"**
2. Remplissez les informations :
   - **Nom** : Nom du site (ex: "Site Corporate")
   - **URL** : URL complète (ex: "https://example.com")
   - **Client** : Nom du client (optionnel)
   - **Intervalle** : Fréquence de vérification (300s = 5min)
   - **Timeout** : Délai d'attente maximum (10s)
3. Activez la vérification SSL si nécessaire
4. Sauvegardez

### 3. Configurer les Alertes

1. Allez dans **Paramètres > Alertes**
2. Configurez les destinataires par rôle
3. Testez les alertes avec le bouton **"Test d'alerte"**

### 4. Gestion des Incidents

Les incidents sont créés automatiquement quand un site tombe en panne :

- **Ouverts** : Site inaccessible ou en erreur
- **Acquittés** : Pris en charge par un technicien
- **Résolus** : Site de nouveau opérationnel

## 🐳 Déploiement

### Avec Docker

```bash
# Construire les images
docker build -t monitorpro-backend ./backend
docker build -t monitorpro-frontend ./frontend

# Utiliser docker-compose
docker-compose up -d
```

### Avec PM2 (Production)

```bash
# Installer PM2
npm install -g pm2

# Démarrer avec PM2
pm2 start ecosystem.config.js

# Sauvegarder la configuration
pm2 startup
pm2 save
```

### Avec Nginx

Le script d'installation configure automatiquement Nginx pour :

- Servir le frontend React
- Proxy l'API backend
- Gestion des WebSockets
- Headers de sécurité

## 🔧 API Documentation

### Authentification

```bash
# Connexion
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password"
}

# Refresh token
POST /api/auth/refresh
{
  "refresh_token": "..."
}
```

### Sites Web

```bash
# Liste des sites
GET /api/websites

# Ajouter un site
POST /api/websites
{
  "name": "Mon Site",
  "url": "https://example.com",
  "check_interval": 300
}

# Forcer une vérification
POST /api/monitoring/sites/1/check
```

### Monitoring

```bash
# Dashboard
GET /api/monitoring/dashboard

# Statistiques
GET /api/monitoring/stats?period=24h

# Incidents
GET /api/monitoring/incidents
```

## 🔍 Monitoring du Système

### Logs

Les logs sont disponibles dans `logs/` :

- **app.log** : Tous les logs
- **error.log** : Erreurs uniquement

```bash
# Surveiller les logs en temps réel
tail -f logs/app.log

# Filtrer les erreurs
grep ERROR logs/app.log
```

### Métriques

Accès aux métriques système via `/api/system/stats` (admin seulement) :

- Uptime du processus
- Utilisation mémoire
- Statut des services

### Health Check

Endpoint de santé disponible sur `/health` :

```json
{
  "success": true,
  "message": "MonitorPro API is running",
  "uptime": 3600,
  "version": "1.0.0"
}
```

## 🛠️ Maintenance

### Nettoyage Automatique

Le système effectue automatiquement :

- **Nettoyage des données** : Suppression des anciens checks (30j+)
- **Rotation des logs** : Archivage automatique
- **Nettoyage des sessions** : Suppression des sessions expirées

### Sauvegardes

```bash
# Sauvegarde de la base de données
mysqldump -u root -p monitorpro > backup_$(date +%Y%m%d).sql

# Sauvegarde des logs
tar -czf logs_backup_$(date +%Y%m%d).tar.gz logs/
```

### Mise à Jour

```bash
# Arrêter les services
pm2 stop all

# Mettre à jour le code
git pull origin main

# Réinstaller les dépendances
cd backend && npm install
cd frontend && npm install && npm run build

# Redémarrer
pm2 restart all
```

## 🤝 Contribution

Nous accueillons les contributions ! Voici comment participer :

1. **Fork** le repository
2. Créez une **branche feature** (`git checkout -b feature/ma-feature`)
3. **Committez** vos changements (`git commit -m 'Ajout ma feature'`)
4. **Push** vers la branche (`git push origin feature/ma-feature`)
5. Ouvrez une **Pull Request**

### Standards de Code

- **ESLint** pour JavaScript
- **Prettier** pour le formatage
- Tests avec **Jest**
- Documentation des APIs

## 🐛 Résolution de Problèmes

### Problèmes Courants

<details>
<summary>Erreur de connexion à la base de données</summary>

```bash
# Vérifier MySQL
sudo systemctl status mysql

# Tester la connexion
mysql -u root -p -e "SELECT 1;"

# Vérifier les variables d'environnement
grep DB_ backend/.env
```

</details>

<details>
<summary>Les alertes email ne fonctionnent pas</summary>

```bash
# Tester la configuration SMTP
cd backend
node -e "require('./services/emailService').testEmailConfiguration('test@example.com')"

# Vérifier les logs
grep -i smtp logs/app.log
```

</details>

<details>
<summary>Sites non surveillés</summary>

```bash
# Vérifier les jobs cron
grep -i cron logs/app.log

# Redémarrer le service de monitoring
pm2 restart monitorpro-backend
```

</details>

### Support

- **Issues GitHub** : Pour les bugs et demandes de fonctionnalités
- **Documentation** : Wiki du repository
- **Email** : support@monitorpro.com

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📊 Roadmap

### Version 1.1

- [ ] Monitoring de bases de données
- [ ] Alertes SMS via Twilio
- [ ] API REST publique
- [ ] Thèmes sombres/clairs

### Version 1.2

- [ ] Monitoring de certificats SSL avancé
- [ ] Intégrations Zapier/IFTTT
- [ ] Application mobile
- [ ] Monitoring de performance (Core Web Vitals)

### Version 2.0

- [ ] Intelligence artificielle pour prédiction des pannes
- [ ] Clustering multi-serveurs
- [ ] Monitoring d'infrastructure (serveurs, containers)
- [ ] Marketplace de plugins

---

<div align="center">

**MonitorPro** - _Surveillez. Alertez. Réagissez._

Made with ❤️ by the MonitorPro Team

[Website](https://monitorpro.com) • [Documentation](https://docs.monitorpro.com) • [Support](mailto:support@monitorpro.com)

</div>
