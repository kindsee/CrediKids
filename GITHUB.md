# Guía Rápida: Subir CrediKids a GitHub

## 📝 Paso 1: Preparar el Repositorio Local

```powershell
# En el directorio CrediKids (D:\Git Repository\CrediKids)
cd "D:\Git Repository\CrediKids"

# Verificar que Git está inicializado
git status

# Si no está inicializado, ejecutar:
git init
git branch -M main
```

## 🌐 Paso 2: Crear Repositorio en GitHub

1. Ve a https://github.com
2. Click en el botón **"+"** (arriba derecha) → **"New repository"**
3. Nombre: `CrediKids`
4. Descripción: `Sistema gamificado de gestión de tareas para familias`
5. **NO marques** "Initialize this repository with a README"
6. Click en **"Create repository"**

## 📤 Paso 3: Subir el Código

```powershell
# Agregar todos los archivos (respetando .gitignore)
git add .

# Crear el primer commit
git commit -m "Initial commit: CrediKids - Sistema de gamificación familiar"

# Conectar con GitHub (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/CrediKids.git

# Subir el código
git push -u origin main
```

### Si te pide autenticación:
GitHub ya no acepta contraseñas, necesitas usar **Personal Access Token**:

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Nombre: `CrediKids Deploy`
4. Selecciona: `repo` (todos los permisos de repo)
5. Click "Generate token"
6. **Copia el token** (no podrás verlo de nuevo)
7. Cuando Git pida contraseña, pega el token

## 🖥️ Paso 4: Clonar en el Servidor

```bash
# Conectar al servidor por SSH
ssh usuario@IP_DEL_SERVIDOR

# Clonar el repositorio
cd /opt
sudo git clone https://github.com/TU_USUARIO/CrediKids.git
sudo chown -R $USER:$USER /opt/CrediKids
```

## 🚀 Paso 5: Seguir Guía de Despliegue

Ahora sigue los pasos del archivo `DEPLOY.md` para configurar el servidor.

## 🔄 Futuras Actualizaciones

### En Windows (después de hacer cambios):
```powershell
cd "D:\Git Repository\CrediKids"

# Ver cambios
git status

# Agregar cambios
git add .

# Commit con mensaje descriptivo
git commit -m "Descripción de los cambios realizados"

# Subir a GitHub
git push origin main
```

### En el Servidor:
```bash
cd /opt/CrediKids

# Actualizar código
git pull origin main

# Ejecutar script de actualización
chmod +x update.sh
./update.sh
```

O manualmente:
```bash
# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart credikids-backend

# Frontend
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

## 📋 Checklist Antes del Deploy

- [ ] Archivo `.env` configurado con credenciales de producción
- [ ] `FLASK_ENV=production` en el servidor
- [ ] Secret keys generadas aleatoriamente
- [ ] Base de datos creada y usuario configurado
- [ ] Firewall configurado (puertos 80, 443, SSH)
- [ ] SSL/HTTPS configurado con Let's Encrypt (opcional pero recomendado)
- [ ] Backups de base de datos configurados

## 🔐 Seguridad

### NO subir a GitHub:
- ❌ Archivos `.env` con credenciales reales
- ❌ Carpeta `venv/`
- ❌ Carpeta `node_modules/`
- ❌ Archivos de base de datos `.db`, `.sqlite`
- ❌ Logs con información sensible

### SÍ subir:
- ✅ Código fuente
- ✅ Archivos de configuración de ejemplo (`.env.example`)
- ✅ `requirements.txt`
- ✅ `package.json`
- ✅ Documentación

## 🆘 Problemas Comunes

### "Permission denied (publickey)"
Necesitas configurar SSH key o usar HTTPS con Personal Access Token.

### "fatal: remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/TU_USUARIO/CrediKids.git
```

### Conflictos al hacer git pull
```bash
# Guardar cambios locales
git stash

# Actualizar
git pull origin main

# Recuperar cambios
git stash pop
```

## 📞 Comandos Útiles de Git

```powershell
# Ver estado
git status

# Ver historial
git log --oneline

# Ver diferencias
git diff

# Deshacer cambios locales
git checkout -- archivo.txt

# Crear nueva rama
git checkout -b nombre-rama

# Cambiar de rama
git checkout main
```
