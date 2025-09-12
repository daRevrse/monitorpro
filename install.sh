#!/bin/bash

# Script d'installation MonitorPro
# Version: 1.0
# Description: Installation complète du système de monitoring

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction d'affichage des messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction de vérification des prérequis
check_requirements() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé. Veuillez installer Node.js 16+ avant de continuer."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_error "Node.js version 16+ requis. Version actuelle: $(node -v)"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé."
        exit 1
    fi
    
    # Vérifier MySQL
    if ! command -v mysql &> /dev/null; then
        log_warning "MySQL n'est pas installé. Vous devrez l'installer manuellement."
    fi
    
    log_success "Prérequis vérifiés"
}

# Fonction de création de la structure du projet
create_project_structure() {
    log_info "Création de la structure du projet..."
    
    # Créer les dossiers principaux
    mkdir -p backend/{config,models,routes,services,middleware,jobs,utils,migrations}
    mkdir -p frontend/{src/{components/{common,auth,dashboard,sites,monitoring},contexts,pages,services,utils},public}
    mkdir -p logs
    mkdir -p data/backups
    
    log_success "Structure du projet créée"
}

# Fonction d'initialisation du backend
setup_backend() {
    log_info "Configuration du backend..."
    
    cd backend
    
    # Initialiser package.json si il n'existe pas
    if [ ! -f "package.json" ]; then
        npm init -y
    fi
    
    # Installer les dépendances
    log_info "Installation des dépendances backend..."
    npm install express mysql2 sequelize bcrypt jsonwebtoken express-validator cors dotenv helmet express-rate-limit
    npm install nodemailer axios node-cron winston socket.io
    npm install --save-dev nodemon sequelize-cli
    
    # Créer le fichier .env.example
    cat > .env.example << EOL
# Base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=monitorpro
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_REFRESH_SECRET=your_super_secret_refresh_key_at_least_32_characters_long

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Monitoring
DEFAULT_CHECK_INTERVAL=300
DEFAULT_TIMEOUT=10000
MAX_CONCURRENT_CHECKS=50

# Alertes
SLACK_WEBHOOK_URL=
COOLDOWN_PERIOD=600000

# Logs
LOG_LEVEL=info
LOG_FILE=logs/app.log
EOL
    
    # Copier .env.example vers .env si il n'existe pas
    if [ ! -f ".env" ]; then
        cp .env.example .env
        log_warning "Fichier .env créé. Veuillez le configurer avant de démarrer l'application."
    fi
    
    cd ..
    log_success "Backend configuré"
}

# Fonction d'initialisation du frontend
setup_frontend() {
    log_info "Configuration du frontend..."
    
    cd frontend
    
    # Créer l'application React si elle n'existe pas
    if [ ! -f "package.json" ]; then
        npx create-react-app . --template typescript
        
        # Installer les dépendances supplémentaires
        log_info "Installation des dépendances frontend..."
        npm install axios react-router-dom socket.io-client
        npm install @headlessui/react @heroicons/react
        npm install recharts lucide-react
        npm install --save-dev tailwindcss postcss autoprefixer
        
        # Initialiser Tailwind CSS
        npx tailwindcss init -p
        
        # Configuration Tailwind
        cat > tailwind.config.js << EOL
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOL
        
        # Créer le fichier CSS principal avec Tailwind
        cat > src/index.css << EOL
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}
EOL
        
    fi
    
    # Créer le fichier .env.example
    cat > .env.example << EOL
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=http://localhost:3001
REACT_APP_APP_NAME=MonitorPro
EOL
    
    # Copier .env.example vers .env si il n'existe pas
    if [ ! -f ".env" ]; then
        cp .env.example .env
    fi
    
    cd ..
    log_success "Frontend configuré"
}

# Fonction de création de la base de données
setup_database() {
    log_info "Configuration de la base de données..."
    
    # Demander les informations de connexion MySQL
    read -p "Nom d'utilisateur MySQL (root): " DB_USER
    DB_USER=${DB_USER:-root}
    
    read -s -p "Mot de passe MySQL: " DB_PASSWORD
    echo
    
    read -p "Nom de la base de données (monitorpro): " DB_NAME
    DB_NAME=${DB_NAME:-monitorpro}
    
    # Créer la base de données
    mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Base de données '$DB_NAME' créée"
        
        # Mettre à jour le fichier .env
        sed -i "s/DB_USER=/DB_USER=$DB_USER/" backend/.env
        sed -i "s/DB_PASSWORD=/DB_PASSWORD=$DB_PASSWORD/" backend/.env
        sed -i "s/DB_NAME=monitorpro/DB_NAME=$DB_NAME/" backend/.env
        
        # Exécuter les migrations
        log_info "Exécution des migrations..."
        mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < backend/migrations/001-initial-schema.sql 2>/dev/null
        
        if [ $? -eq 0 ]; then
            log_success "Migrations exécutées avec succès"
        else
            log_warning "Erreur lors des migrations - vous devrez les exécuter manuellement"
        fi
    else
        log_error "Impossible de créer la base de données. Vérifiez vos identifiants."
        exit 1
    fi
}

# Fonction de génération des clés JWT
generate_jwt_secrets() {
    log_info "Génération des clés JWT..."
    
    # Générer des clés aléatooires sécurisées
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-32)
    
    # Mettre à jour le fichier .env
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" backend/.env
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" backend/.env
    
    log_success "Clés JWT générées et configurées"
}

# Fonction de création des services systemd
create_systemd_services() {
    if [ "$EUID" -ne 0 ]; then
        log_warning "Les services systemd nécessitent les droits root. Ignoré."
        return
    fi
    
    log_info "Création des services systemd..."
    
    # Service pour le backend
    cat > /etc/systemd/system/monitorpro-backend.service << EOL
[Unit]
Description=MonitorPro Backend API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=monitorpro-backend

[Install]
WantedBy=multi-user.target
EOL

    # Service pour le frontend (si build)
    if [ -d "frontend/build" ]; then
        cat > /etc/systemd/system/monitorpro-frontend.service << EOL
[Unit]
Description=MonitorPro Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)/frontend
ExecStart=/usr/bin/serve -s build -l 3000
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=monitorpro-frontend

[Install]
WantedBy=multi-user.target
EOL
    fi
    
    # Recharger systemd
    systemctl daemon-reload
    
    log_success "Services systemd créés"
}

# Fonction de configuration PM2 (alternative à systemd)
setup_pm2() {
    log_info "Configuration PM2..."
    
    # Installer PM2 globalement si pas déjà installé
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    # Créer le fichier ecosystem.config.js
    cat > ecosystem.config.js << EOL
module.exports = {
  apps: [
    {
      name: 'monitorpro-backend',
      script: 'backend/server.js',
      cwd: '$(pwd)',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000
    }
  ]
};
EOL
    
    log_success "PM2 configuré"
}

# Fonction de configuration nginx
setup_nginx() {
    if [ "$EUID" -ne 0 ]; then
        log_warning "La configuration nginx nécessite les droits root. Ignoré."
        return
    fi
    
    log_info "Configuration nginx..."
    
    # Créer la configuration nginx
    cat > /etc/nginx/sites-available/monitorpro << EOL
server {
    listen 80;
    server_name localhost;
    
    # Frontend React
    location / {
        root $(pwd)/frontend/build;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
        
        # Headers de sécurité
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket pour temps réel
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
    
    # Assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOL
    
    # Activer le site
    ln -sf /etc/nginx/sites-available/monitorpro /etc/nginx/sites-enabled/
    
    # Tester la configuration
    nginx -t
    
    if [ $? -eq 0 ]; then
        systemctl reload nginx
        log_success "Nginx configuré et rechargé"
    else
        log_error "Erreur de configuration nginx"
    fi
}

# Fonction de build du frontend
build_frontend() {
    log_info "Build du frontend..."
    
    cd frontend
    
    if [ -f "package.json" ]; then
        npm run build
        
        if [ $? -eq 0 ]; then
            log_success "Frontend buildé avec succès"
        else
            log_error "Erreur lors du build du frontend"
            exit 1
        fi
    else
        log_warning "Package.json du frontend non trouvé. Ignoré."
    fi
    
    cd ..
}

# Fonction de création des logs rotatifs
setup_log_rotation() {
    if [ "$EUID" -ne 0 ]; then
        log_warning "La rotation des logs nécessite les droits root. Ignoré."
        return
    fi
    
    log_info "Configuration de la rotation des logs..."
    
    cat > /etc/logrotate.d/monitorpro << EOL
$(pwd)/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 www-data www-data
    postrotate
        if [ -f /var/run/monitorpro-backend.pid ]; then
            kill -USR1 \$(cat /var/run/monitorpro-backend.pid)
        fi
    endscript
}
EOL
    
    log_success "Rotation des logs configurée"
}

# Fonction de test de l'installation
test_installation() {
    log_info "Test de l'installation..."
    
    # Tester la connexion à la base de données
    cd backend
    
    cat > test-db.js << EOL
const sequelize = require('./config/database');

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connexion à la base de données réussie');
        process.exit(0);
    } catch (error) {
        console.error('✗ Impossible de se connecter à la base de données:', error.message);
        process.exit(1);
    }
}

testConnection();
EOL
    
    node test-db.js
    
    if [ $? -eq 0 ]; then
        log_success "Test de base de données réussi"
        rm test-db.js
    else
        log_error "Échec du test de base de données"
        rm test-db.js
        exit 1
    fi
    
    cd ..
}

# Fonction de création d'un utilisateur admin
create_admin_user() {
    log_info "Création d'un utilisateur administrateur..."
    
    read -p "Email de l'administrateur: " ADMIN_EMAIL
    read -s -p "Mot de passe: " ADMIN_PASSWORD
    echo
    
    cd backend
    
    cat > create-admin.js << EOL
const bcrypt = require('bcrypt');
const { User, Company } = require('./models');
const sequelize = require('./config/database');

async function createAdmin() {
    try {
        await sequelize.sync();
        
        // Créer une entreprise par défaut
        const company = await Company.findOrCreate({
            where: { slug: 'default' },
            defaults: {
                name: 'Administration',
                slug: 'default',
                subscription_plan: 'enterprise',
                max_sites: 1000
            }
        });
        
        // Hasher le mot de passe
        const passwordHash = await bcrypt.hash('$ADMIN_PASSWORD', 12);
        
        // Créer l'utilisateur admin
        const admin = await User.findOrCreate({
            where: { email: '$ADMIN_EMAIL' },
            defaults: {
                email: '$ADMIN_EMAIL',
                password_hash: passwordHash,
                first_name: 'Admin',
                last_name: 'System',
                role: 'admin',
                company_id: company[0].id,
                is_active: true,
                email_verified: true
            }
        });
        
        if (admin[1]) {
            console.log('✓ Utilisateur administrateur créé avec succès');
        } else {
            console.log('! Utilisateur administrateur existe déjà');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('✗ Erreur lors de la création de l\'administrateur:', error.message);
        process.exit(1);
    }
}

createAdmin();
EOL
    
    node create-admin.js
    
    if [ $? -eq 0 ]; then
        log_success "Administrateur créé"
        rm create-admin.js
    else
        log_error "Échec de création de l'administrateur"
        rm create-admin.js
    fi
    
    cd ..
}

# Fonction d'affichage du résumé final
show_summary() {
    echo
    echo "======================================"
    echo "     Installation MonitorPro"
    echo "======================================"
    echo
    log_success "Installation terminée avec succès !"
    echo
    echo "Configuration:"
    echo "  - Backend: http://localhost:3001"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Base de données: MySQL configurée"
    echo
    echo "Pour démarrer l'application:"
    echo
    echo "  # Démarrer le backend"
    echo "  cd backend && npm run dev"
    echo
    echo "  # Démarrer le frontend (nouveau terminal)"
    echo "  cd frontend && npm start"
    echo
    echo "  # Ou utiliser PM2 pour la production"
    echo "  pm2 start ecosystem.config.js"
    echo
    echo "Prochaines étapes:"
    echo "  1. Configurer les paramètres SMTP dans backend/.env"
    echo "  2. Tester la connexion avec l'utilisateur admin créé"
    echo "  3. Ajouter vos premiers sites web à surveiller"
    echo
    log_info "Documentation: README.md"
    echo
}

# Menu d'installation
show_menu() {
    echo "======================================"
    echo "   Installation MonitorPro v1.0"
    echo "======================================"
    echo
    echo "Choisissez le type d'installation:"
    echo
    echo "1) Installation complète (recommandée)"
    echo "2) Installation backend seulement"
    echo "3) Installation frontend seulement"
    echo "4) Configuration production (nginx + PM2)"
    echo "5) Test de l'installation existante"
    echo "6) Quitter"
    echo
}

# Fonction principale
main() {
    while true; do
        show_menu
        read -p "Votre choix [1-6]: " choice
        
        case $choice in
            1)
                log_info "Installation complète démarrée..."
                check_requirements
                create_project_structure
                setup_backend
                setup_frontend
                setup_database
                generate_jwt_secrets
                build_frontend
                setup_pm2
                test_installation
                create_admin_user
                show_summary
                break
                ;;
            2)
                log_info "Installation backend seulement..."
                check_requirements
                create_project_structure
                setup_backend
                setup_database
                generate_jwt_secrets
                test_installation
                create_admin_user
                log_success "Backend installé avec succès"
                break
                ;;
            3)
                log_info "Installation frontend seulement..."
                check_requirements
                setup_frontend
                build_frontend
                log_success "Frontend installé avec succès"
                break
                ;;
            4)
                log_info "Configuration production..."
                setup_pm2
                create_systemd_services
                setup_nginx
                setup_log_rotation
                log_success "Configuration production terminée"
                break
                ;;
            5)
                log_info "Test de l'installation..."
                test_installation
                log_success "Tests réussis"
                break
                ;;
            6)
                log_info "Installation annulée"
                exit 0
                ;;
            *)
                log_error "Option invalide. Choisissez entre 1 et 6."
                ;;
        esac
    done
}

# Vérifier si le script est exécuté directement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi