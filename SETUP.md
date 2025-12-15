# CrediKids - Guía de Inicio Rápido

## 📦 Requisitos Previos

- **Python 3.9+** - [Descargar](https://www.python.org/downloads/)
- **Node.js 18+** - [Descargar](https://nodejs.org/) - ⚠️ **IMPORTANTE**: Selecciona la versión LTS
- **MariaDB 10.5+** - [Descargar](https://mariadb.org/download/)
- **Git** - [Descargar](https://git-scm.com/downloads)

### ⚠️ Verificar Instalaciones

Antes de continuar, verifica que todo está instalado correctamente:

```powershell
# Verificar Python
python --version
# Deberías ver: Python 3.9.x o superior

# Verificar Node.js
node --version
# Deberías ver: v18.x.x o superior

# Verificar npm
npm --version
# Deberías ver: 9.x.x o superior

# Verificar Git
git --version
# Deberías ver: git version 2.x.x

# Verificar MariaDB/MySQL
mysql --version
# Deberías ver: mysql Ver 10.x.x Distrib 10.5.x-MariaDB
```

**Si algún comando no funciona:**
1. Instala el software faltante desde los enlaces arriba
2. Asegúrate de marcar "Add to PATH" durante la instalación
3. Cierra y abre una nueva terminal PowerShell después de instalar
4. Vuelve a verificar con los comandos de arriba

## 🚀 Instalación Paso a Paso

### 1. Clonar el Repositorio
```powershell
git clone <repository-url>
cd CrediKids
```

### 2. Configurar Base de Datos
```powershell
# Abrir MySQL/MariaDB
mysql -u root -p

# Crear base de datos y usuario
CREATE DATABASE credikids_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'credikids_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON credikids_db.* TO 'credikids_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configurar Backend

```powershell
# Navegar a carpeta backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales
# Usar notepad, VS Code, o cualquier editor:
notepad .env
```

**Contenido de `.env` a configurar:**
```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=cambia-este-secreto-por-uno-aleatorio
JWT_SECRET_KEY=cambia-este-jwt-secreto-tambien

DB_HOST=localhost
DB_PORT=3306
DB_USER=credikids_user
DB_PASSWORD=tu_password_seguro
DB_NAME=credikids_db
```

### 4. Configurar Frontend

```powershell
# Abrir nueva terminal
cd frontend

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# No necesitas editar .env a menos que cambies el puerto del backend
```

### 5. Iniciar Aplicación

**Terminal 1 - Backend:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python app.py
```
Deberías ver: `Running on http://127.0.0.1:5000`

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```
Deberías ver: `Local: http://localhost:3000/`

### 6. Inicializar Iconos
Abre tu navegador en `http://localhost:3000` y ejecuta en la consola del navegador (F12):

```javascript
fetch('http://localhost:5000/api/icons/seed', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

O usa Postman/curl:
```powershell
curl -X POST http://localhost:5000/api/icons/seed
```

### 7. Crear Usuario Administrador

Usando Python (en terminal con backend activado):
```powershell
# Con el servidor backend corriendo, abre otra terminal
cd backend
.\venv\Scripts\Activate.ps1
python
```

Luego ejecuta:
```python
from app import create_app, db
from models import User

app = create_app()
with app.app_context():
    # Crear admin
    admin = User(nick='admin', figure='👨‍💼', role='admin', score=0)
    admin.set_access_code([1, 2, 3, 4])  # Iconos: Pato, Ancla, Vaso, Dinosaurio
    db.session.add(admin)
    
    # Crear usuario de prueba
    user = User(nick='usuario1', figure='👦', role='user', score=100)
    user.set_access_code([5, 6, 7, 8])  # Iconos: Estrella, Corazón, Árbol, Pelota
    db.session.add(user)
    
    db.session.commit()
    print("✅ Usuarios creados!")
    print("Admin: nick='admin', iconos=[1,2,3,4]")
    print("Usuario: nick='usuario1', iconos=[5,6,7,8]")
```

### 8. Iniciar Sesión

1. Abre `http://localhost:3000`
2. Ingresa nick: `admin`
3. Selecciona iconos en orden: **Pato (🦆), Ancla (⚓), Vaso (🥤), Dinosaurio (🦕)**
4. Click en "Ingresar"

¡Deberías estar dentro!

## 🧪 Verificar Instalación

### Probar Backend
```powershell
# Obtener iconos
curl http://localhost:5000/api/icons

# Login
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"nick": "admin", "icon_codes": [1,2,3,4]}'
```

### Probar Frontend
1. Login exitoso ✅
2. Ver Dashboard con créditos ✅
3. Navegar entre páginas ✅

## 🔧 Solución de Problemas

### Node.js/npm no encontrado
```powershell
# Error: 'npm' is not recognized...
# Solución:

# 1. Instalar Node.js desde https://nodejs.org/ (versión LTS)
# 2. Durante la instalación, asegurar que "Add to PATH" está marcado
# 3. Cerrar TODAS las ventanas de PowerShell
# 4. Abrir nueva terminal PowerShell
# 5. Verificar:
node --version
npm --version

# Si aún no funciona, agregar manualmente al PATH:
# - Abrir "Variables de entorno del sistema"
# - Agregar: C:\Program Files\nodejs\ a la variable PATH
# - Reiniciar terminal
```

### Backend no inicia
```powershell
# Verificar que MariaDB está corriendo
Get-Service -Name "MariaDB" | Select-Object Status

# Verificar conexión a base de datos
mysql -u credikids_user -p credikids_db
```

### Frontend no conecta con backend
```powershell
# Verificar que backend está en puerto 5000
netstat -ano | findstr :5000

# Verificar proxy en vite.config.js
```

### Error "Module not found"
```powershell
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Error de CORS
Verifica en `backend/app.py` que Flask-CORS está configurado:
```python
from flask_cors import CORS
CORS(app)
```

## 📝 Próximos Pasos

1. ✅ Crear más usuarios de prueba
2. ✅ Crear tareas (obligatorias, especiales)
3. ✅ Asignar tareas a usuarios
4. ✅ Completar y validar tareas
5. ✅ Crear premios
6. ✅ Probar canje de premios
7. ✅ Explorar propuestas de tareas

## 🎯 Funcionalidades Principales

- **Admin puede:**
  - Crear usuarios con código de 4 iconos
  - Crear y asignar tareas (obligatorias/especiales)
  - Validar tareas completadas (1/2/3 = 10%/60%/100% de créditos)
  - Revisar propuestas de usuarios
  - Crear premios

- **Usuario puede:**
  - Ver calendario de tareas
  - Completar tareas asignadas
  - Proponer nuevas tareas
  - Canjear premios con créditos
  - Ver historial de actividad

## 📚 Documentación Completa

Ver `README.md` para documentación detallada de:
- Arquitectura completa
- API endpoints
- Modelos de base de datos
- Convenciones de código

## 🚀 Despliegue en Producción

### 1. Compilar Frontend
```powershell
cd frontend
npm run build
# Los archivos compilados estarán en frontend/dist/
```

### 2. Configurar Servidor Web

**Para Apache:**
1. Copia los archivos de `frontend/dist/` a `/var/www/credikids/frontend/dist/`
2. Usa la configuración de `apache-example.conf` como referencia
3. Habilita módulos necesarios:
```bash
sudo a2enmod proxy proxy_http rewrite
sudo systemctl restart apache2
```

**Para Nginx:**
1. Copia los archivos de `frontend/dist/` a `/var/www/credikids/frontend/dist/`
2. Usa la configuración de `nginx-example.conf` como referencia
3. Reinicia Nginx:
```bash
sudo systemctl restart nginx
```

### 3. Configurar Backend en Producción
```bash
# Instalar gunicorn para producción
pip install gunicorn

# Ejecutar backend con gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### 4. Configurar como Servicio (systemd)
Crea `/etc/systemd/system/credikids-backend.service`:
```ini
[Unit]
Description=CrediKids Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/credikids/backend
Environment="PATH=/var/www/credikids/backend/venv/bin"
ExecStart=/var/www/credikids/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app

[Install]
WantedBy=multi-user.target
```

Habilitar e iniciar:
```bash
sudo systemctl enable credikids-backend
sudo systemctl start credikids-backend
sudo systemctl status credikids-backend
```

### 5. Verificar Conexiones
```bash
# Verificar backend responde
curl http://localhost:5000/api/icons

# Verificar frontend puede acceder al backend
# Abre tu-dominio.com en navegador y revisa consola de desarrollador
```

**⚠️ Importante para Producción:**
- Cambia `SECRET_KEY` y `JWT_SECRET_KEY` en `.env` a valores aleatorios seguros
- Configura `FLASK_ENV=production` en `.env`
- Configura SSL/HTTPS con Let's Encrypt (certbot)
- Ajusta permisos de archivos y carpetas apropiadamente

---

**¿Necesitas ayuda?** Revisa los logs de consola en backend y frontend para más detalles.

