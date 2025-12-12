# Script de Instalación Automatizada para CrediKids
# Ejecutar en PowerShell como administrador

Write-Host "🚀 Instalación de CrediKids" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# 1. Verificar Python
Write-Host "📦 Verificando Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version
    Write-Host "  ✅ $pythonVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Python no encontrado. Por favor instala Python 3.9+" -ForegroundColor Red
    exit 1
}

# 2. Verificar Node.js
Write-Host "`n📦 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js $nodeVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js no encontrado. Por favor instala Node.js 18+" -ForegroundColor Red
    exit 1
}

# 3. Verificar MariaDB/MySQL
Write-Host "`n📦 Verificando MariaDB/MySQL..." -ForegroundColor Yellow
try {
    $mysqlVersion = mysql --version
    Write-Host "  ✅ MySQL/MariaDB encontrado" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  MySQL/MariaDB no encontrado en PATH" -ForegroundColor Yellow
    Write-Host "     Asegúrate de tenerlo instalado" -ForegroundColor Yellow
}

# 4. Configurar Backend
Write-Host "`n🔧 Configurando Backend..." -ForegroundColor Yellow
Set-Location backend

# Crear entorno virtual
Write-Host "  Creando entorno virtual..." -ForegroundColor Gray
python -m venv venv

# Activar entorno virtual
Write-Host "  Activando entorno virtual..." -ForegroundColor Gray
& .\venv\Scripts\Activate.ps1

# Instalar dependencias
Write-Host "  Instalando dependencias de Python..." -ForegroundColor Gray
pip install -r requirements.txt

# Copiar .env si no existe
if (-not (Test-Path .env)) {
    Write-Host "  Creando archivo .env..." -ForegroundColor Gray
    Copy-Item .env.example .env
    Write-Host "  ⚠️  Por favor edita backend/.env con tus credenciales de base de datos" -ForegroundColor Yellow
}

Write-Host "  ✅ Backend configurado" -ForegroundColor Green

Set-Location ..

# 5. Configurar Frontend
Write-Host "`n🔧 Configurando Frontend..." -ForegroundColor Yellow
Set-Location frontend

# Instalar dependencias
Write-Host "  Instalando dependencias de Node..." -ForegroundColor Gray
npm install

# Copiar .env si no existe
if (-not (Test-Path .env)) {
    Write-Host "  Creando archivo .env..." -ForegroundColor Gray
    Copy-Item .env.example .env
}

Write-Host "  ✅ Frontend configurado" -ForegroundColor Green

Set-Location ..

# 6. Resumen
Write-Host "`n✨ ¡Instalación Completada!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Configurar Base de Datos:" -ForegroundColor Yellow
Write-Host "   mysql -u root -p" -ForegroundColor Gray
Write-Host "   CREATE DATABASE credikids_db;" -ForegroundColor Gray
Write-Host "   CREATE USER 'credikids_user'@'localhost' IDENTIFIED BY 'tu_password';" -ForegroundColor Gray
Write-Host "   GRANT ALL PRIVILEGES ON credikids_db.* TO 'credikids_user'@'localhost';" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Editar backend/.env con tus credenciales" -ForegroundColor Yellow
Write-Host ""
Write-Host "3️⃣  Iniciar Backend (Terminal 1):" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   python app.py" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  Inicializar iconos (navegador o Postman):" -ForegroundColor Yellow
Write-Host "   POST http://localhost:5000/api/icons/seed" -ForegroundColor Gray
Write-Host ""
Write-Host "5️⃣  Crear datos de prueba:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   python seed_data.py" -ForegroundColor Gray
Write-Host ""
Write-Host "6️⃣  Iniciar Frontend (Terminal 2):" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "7️⃣  Abrir navegador:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000" -ForegroundColor Gray
Write-Host "   Login: admin / iconos [1,2,3,4]" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Ver SETUP.md para más detalles" -ForegroundColor Cyan
