@echo off
REM ============================================================
REM  MonitorPro - Demarrage local en un clic (backend + frontend)
REM  Double-cliquez sur ce fichier pour tout lancer.
REM ============================================================
cd /d "%~dp0"

echo Demarrage de MonitorPro...
echo.

REM Installer les dependances si elles manquent
if not exist "backend\node_modules" (
  echo Installation des dependances backend...
  cd backend && call npm install && cd ..
)
if not exist "frontend\node_modules" (
  echo Installation des dependances frontend...
  cd frontend && call npm install && cd ..
)

REM Lancer le backend (port 3001) dans sa propre fenetre
start "MonitorPro - Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

REM Lancer le frontend (port 3000) dans sa propre fenetre
start "MonitorPro - Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo Backend  : http://localhost:3001/health
echo Frontend : http://localhost:3000
echo.
echo Deux fenetres se sont ouvertes. Fermez-les pour arreter les services.
timeout /t 5 >nul
