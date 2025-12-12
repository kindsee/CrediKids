# CrediKids - Guía de Solución de Problemas

## 🚨 Problemas de Instalación

### ❌ Error: 'npm' is not recognized

**Síntoma:**
```
npm : The term 'npm' is not recognized as the name of a cmdlet...
```

**Causa:** Node.js no está instalado o no está en el PATH del sistema.

**Solución:**

#### Paso 1: Instalar Node.js
1. Ve a https://nodejs.org/
2. Descarga la versión **LTS (Long Term Support)** - actualmente v18.x o v20.x
3. Ejecuta el instalador `node-vXX.XX.X-x64.msi`
4. **IMPORTANTE**: Durante la instalación, asegúrate de que estas opciones estén marcadas:
   - ✅ Add to PATH
   - ✅ npm package manager
   - ✅ Tools for Native Modules (opcional pero recomendado)

#### Paso 2: Verificar Instalación
```powershell
# CIERRA todas las ventanas de PowerShell actuales
# Abre una NUEVA ventana de PowerShell

# Verifica Node.js
node --version
# Deberías ver: v18.19.0 (o similar)

# Verifica npm
npm --version
# Deberías ver: 10.2.3 (o similar)
```

#### Paso 3: Si aún no funciona
```powershell
# Verificar si Node.js está en el PATH
$env:Path -split ';' | Select-String -Pattern 'nodejs'

# Si no aparece nada, agregar manualmente:
# 1. Presiona Win + X → Sistema → Configuración avanzada del sistema
# 2. Click en "Variables de entorno"
# 3. En "Variables del sistema", encuentra "Path" y click "Editar"
# 4. Click "Nuevo" y agrega: C:\Program Files\nodejs\
# 5. Click "Aceptar" en todas las ventanas
# 6. REINICIA PowerShell
```

#### Paso 4: Verificación alternativa
```powershell
# Buscar node.exe en el sistema
Get-ChildItem -Path "C:\Program Files" -Filter node.exe -Recurse -ErrorAction SilentlyContinue

# Si lo encuentras, anota la ruta y agrégala al PATH manualmente
```

---

### ❌ Error: 'python' is not recognized

**Solución:**
1. Descargar Python desde https://www.python.org/downloads/
2. **IMPORTANTE**: Durante instalación, marca "Add Python to PATH"
3. Reinicia PowerShell
4. Verifica: `python --version`

---

### ❌ Error: 'mysql' is not recognized

**Solución:**
1. Instalar MariaDB desde https://mariadb.org/download/
2. Durante instalación, marca "Use MariaDB Connector/C"
3. Agregar al PATH: `C:\Program Files\MariaDB 10.x\bin`
4. Reinicia PowerShell
5. Verifica: `mysql --version`

---

## 🚨 Problemas del Backend

### ❌ Error: "No module named 'flask'"

**Solución:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### ❌ Error: "Can't connect to MySQL server"

**Síntomas:**
```
sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError) (2003, "Can't connect to MySQL server")
```

**Soluciones:**

#### 1. Verificar que MariaDB está corriendo
```powershell
# Ver servicios
Get-Service -Name "*maria*"

# Si no está corriendo, iniciarlo
Start-Service -Name "MariaDB"

# O desde Services.msc (Win + R → services.msc)
```

#### 2. Verificar credenciales en .env
```powershell
cd backend
notepad .env

# Verificar que coincidan con tu instalación:
DB_HOST=localhost
DB_PORT=3306
DB_USER=credikids_user
DB_PASSWORD=tu_password_real
DB_NAME=credikids_db
```

#### 3. Verificar que la base de datos existe
```powershell
mysql -u root -p
# Ingresar password de root

# Dentro de MySQL:
SHOW DATABASES;
# Debería aparecer 'credikids_db'

# Si no existe:
CREATE DATABASE credikids_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### 4. Verificar permisos del usuario
```powershell
mysql -u root -p

# Dentro de MySQL:
SHOW GRANTS FOR 'credikids_user'@'localhost';

# Si no tiene permisos:
GRANT ALL PRIVILEGES ON credikids_db.* TO 'credikids_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### ❌ Error: "ModuleNotFoundError: No module named 'pymysql'"

**Solución:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install PyMySQL
```

### ❌ Error: "Address already in use" (Puerto 5000)

**Solución:**
```powershell
# Ver qué está usando el puerto 5000
netstat -ano | findstr :5000

# Matar el proceso (reemplaza PID con el número que viste)
taskkill /PID <PID> /F

# O cambiar el puerto en app.py:
# app.run(host='0.0.0.0', port=5001, debug=True)
```

---

## 🚨 Problemas del Frontend

### ❌ Error: "Cannot find module 'react'"

**Solución:**
```powershell
cd frontend
npm install
```

### ❌ Error: "ENOENT: no such file or directory, open 'package.json'"

**Solución:**
```powershell
# Estás en el directorio equivocado
cd "D:\Git Repository\CrediKids\frontend"
npm install
```

### ❌ Error: "Port 3000 is already in use"

**Solución:**
```powershell
# Opción 1: Matar proceso en puerto 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Opción 2: Usar otro puerto
# Editar vite.config.js, cambiar:
server: {
  port: 3001,  // Cambiar puerto
  ...
}
```

### ❌ Error: "CORS policy" en el navegador

**Solución:**
```python
# Verificar en backend/app.py que CORS está habilitado:
from flask_cors import CORS

def create_app(config_name='development'):
    app = Flask(__name__)
    CORS(app)  # ← Debe estar aquí
    ...
```

---

## 🚨 Problemas de Base de Datos

### ❌ Error: "Table doesn't exist"

**Solución:**
```powershell
# Las tablas se crean automáticamente al iniciar app.py
cd backend
.\venv\Scripts\Activate.ps1
python app.py

# Si no se crean, forzar creación:
python
>>> from app import create_app, db
>>> app = create_app()
>>> with app.app_context():
...     db.create_all()
...     print("Tablas creadas!")
```

### ❌ Error: "Icon with id X not found" al hacer login

**Solución:**
```powershell
# Inicializar los 25 iconos
# Opción 1: Usar Postman/curl
curl -X POST http://localhost:5000/api/icons/seed

# Opción 2: Desde navegador (F12 console)
fetch('http://localhost:5000/api/icons/seed', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)

# Opción 3: Python
python
>>> from app import create_app
>>> from models import Icon, db
>>> app = create_app()
>>> with app.app_context():
...     # Verificar iconos
...     print(Icon.query.count())
...     # Si es 0, ejecutar seed desde routes/icons.py
```

---

## 🚨 Problemas de Autenticación

### ❌ Error: "Invalid credentials" al hacer login

**Posibles causas:**

1. **Nick incorrecto**
   - Verifica que el nick esté escrito exactamente como se creó
   - Case sensitive: 'Admin' ≠ 'admin'

2. **Iconos en orden incorrecto**
   ```python
   # El orden importa!
   [1, 2, 3, 4] ≠ [4, 3, 2, 1]
   
   # Verificar access_code del usuario:
   python
   >>> from app import create_app
   >>> from models import User
   >>> app = create_app()
   >>> with app.app_context():
   ...     user = User.query.filter_by(nick='admin').first()
   ...     print(user.get_access_code_icons())
   ```

3. **Usuario no existe**
   ```python
   # Listar todos los usuarios:
   python
   >>> from app import create_app
   >>> from models import User
   >>> app = create_app()
   >>> with app.app_context():
   ...     users = User.query.all()
   ...     for u in users:
   ...         print(f"{u.nick}: {u.get_access_code_icons()}")
   ```

### ❌ Error: "Token has expired"

**Solución:**
```javascript
// El token JWT expira después de cierto tiempo
// Simplemente vuelve a hacer login

// Para desarrollo, aumentar tiempo de expiración en config.py:
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
```

---

## 🚨 Comandos de Diagnóstico Útiles

### Verificar estado completo del sistema
```powershell
# Crear script de diagnóstico
$diagnostics = @"
========================================
CREDIKIDS - DIAGNÓSTICO DEL SISTEMA
========================================

Python:
$(python --version 2>&1)

Node.js:
$(node --version 2>&1)

npm:
$(npm --version 2>&1)

Git:
$(git --version 2>&1)

MariaDB/MySQL:
$(mysql --version 2>&1)

========================================
Puertos en uso:
5000: $(netstat -ano | findstr :5000)
3000: $(netstat -ano | findstr :3000)

========================================
Servicios MariaDB:
$(Get-Service -Name "*maria*" 2>&1 | Format-Table -AutoSize)

========================================
"@

Write-Output $diagnostics
$diagnostics | Out-File "diagnostics.txt"
Write-Host "`nDiagnóstico guardado en: diagnostics.txt" -ForegroundColor Green
```

### Reiniciar todo desde cero
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force venv -ErrorAction SilentlyContinue
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend
cd ..\frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install

# Base de datos
mysql -u root -p -e "DROP DATABASE IF EXISTS credikids_db; CREATE DATABASE credikids_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

## 📞 ¿Aún tienes problemas?

1. **Revisa los logs:**
   - Backend: Ver consola donde ejecutaste `python app.py`
   - Frontend: Ver consola donde ejecutaste `npm run dev`
   - Navegador: Abrir DevTools (F12) → Console

2. **Busca el error específico:**
   - Copia el mensaje de error completo
   - Busca en este documento
   - Revisa la documentación: README.md, SETUP.md

3. **Verifica paso a paso:**
   - [ ] Todos los requisitos instalados
   - [ ] Base de datos creada
   - [ ] Archivo .env configurado
   - [ ] Iconos inicializados
   - [ ] Usuario admin creado
   - [ ] Backend corriendo en puerto 5000
   - [ ] Frontend corriendo en puerto 3000

4. **Ejecuta diagnóstico:**
   - Usa el script de diagnóstico de arriba
   - Revisa cada sección

---

**🎯 Tip:** La mayoría de problemas se resuelven reiniciando la terminal PowerShell después de instalar software nuevo.
