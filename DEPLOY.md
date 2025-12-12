# Guía de Despliegue en Servidor Linux

## 📋 Requisitos del Servidor

- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **Python**: 3.9+
- **Node.js**: 18+ LTS
- **MariaDB/MySQL**: 10.5+
- **Nginx**: Para servir el frontend y proxy al backend
- **Git**: Para clonar el repositorio

## 🚀 Pasos de Instalación en Servidor

### 1. Actualizar el Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Dependencias del Sistema

```bash
# Python y herramientas
sudo apt install python3 python3-pip python3-venv -y

# Node.js (usar NodeSource para versión LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install nodejs -y

# MariaDB
sudo apt install mariadb-server mariadb-client -y

# Nginx
sudo apt install nginx -y

# Git
sudo apt install git -y
```

### 3. Configurar MariaDB

```bash
# Iniciar y habilitar MariaDB
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Configuración segura
sudo mysql_secure_installation

# Crear base de datos y usuario
sudo mysql -u root -p
```

En el prompt de MySQL:
```sql
CREATE DATABASE credikids_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'credikids_user'@'localhost' IDENTIFIED BY 'TuPasswordSeguro123!';
GRANT ALL PRIVILEGES ON credikids_db.* TO 'credikids_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Clonar el Repositorio

```bash
cd /opt
sudo git clone https://github.com/TU_USUARIO/CrediKids.git
sudo chown -R $USER:$USER /opt/CrediKids
cd /opt/CrediKids
```

### 5. Configurar Backend

```bash
cd backend

# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp ../.env.example .env
nano .env
```

Edita `.env` con tus credenciales de producción:
```env
FLASK_ENV=production
SECRET_KEY=genera-una-clave-aleatoria-larga-aqui
JWT_SECRET_KEY=genera-otra-clave-aleatoria-diferente
DB_HOST=localhost
DB_PORT=3306
DB_USER=credikids_user
DB_PASSWORD=TuPasswordSeguro123!
DB_NAME=credikids_db
```

Genera claves secretas seguras:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 6. Inicializar Base de Datos

```bash
# Asegúrate de estar en el directorio backend con venv activado
python3 << EOF
from app import create_app, db
from models import User

app = create_app('production')
with app.app_context():
    db.create_all()
    print("✅ Tablas creadas!")
EOF

# Seed iconos
python3 << EOF
from app import create_app, db
from routes.icons import seed_icons_data

app = create_app('production')
with app.app_context():
    seed_icons_data()
    print("✅ Iconos inicializados!")
EOF

# Crear usuario administrador
python3 << EOF
from app import create_app, db
from models import User

app = create_app('production')
with app.app_context():
    admin = User(nick='admin', figure='👨‍💼', role='admin', score=0)
    admin.set_access_code([1, 2, 3, 4])
    db.session.add(admin)
    db.session.commit()
    print("✅ Usuario admin creado con PIN: 1,2,3,4")
EOF
```

### 7. Configurar Backend con Gunicorn

```bash
# Instalar Gunicorn
pip install gunicorn

# Crear archivo de servicio systemd
sudo nano /etc/systemd/system/credikids-backend.service
```

Contenido del archivo:
```ini
[Unit]
Description=CrediKids Flask Backend
After=network.target mariadb.service

[Service]
Type=notify
User=tu-usuario
WorkingDirectory=/opt/CrediKids/backend
Environment="PATH=/opt/CrediKids/backend/venv/bin"
ExecStart=/opt/CrediKids/backend/venv/bin/gunicorn --bind 127.0.0.1:5001 --workers 4 --timeout 120 app:app

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Reemplaza `tu-usuario` con tu usuario de Linux.

```bash
# Habilitar e iniciar el servicio
sudo systemctl daemon-reload
sudo systemctl enable credikids-backend
sudo systemctl start credikids-backend

# Verificar estado
sudo systemctl status credikids-backend
```

### 8. Configurar Frontend

```bash
cd /opt/CrediKids/frontend

# Instalar dependencias
npm install

# Configurar variables de entorno para producción
nano .env.production
```

Contenido de `.env.production`:
```env
VITE_API_URL=http://TU_SERVIDOR_IP:5001/api
```

```bash
# Build para producción
npm run build
```

### 9. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/credikids
```

Contenido del archivo:
```nginx
server {
    listen 80;
    server_name TU_DOMINIO_O_IP;

    # Frontend (archivos estáticos)
    location / {
        root /opt/CrediKids/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/credikids /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 10. Configurar Firewall (opcional pero recomendado)

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## 🔄 Actualizar la Aplicación

Cuando hagas cambios en GitHub:

```bash
cd /opt/CrediKids

# Pull cambios
git pull origin main

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

## 📝 Comandos Útiles

```bash
# Ver logs del backend
sudo journalctl -u credikids-backend -f

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Reiniciar servicios
sudo systemctl restart credikids-backend
sudo systemctl restart nginx

# Estado de servicios
sudo systemctl status credikids-backend
sudo systemctl status nginx
```

## 🔒 Seguridad Adicional (Recomendado)

### SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com
```

### Configurar Variables de Entorno Seguras

Asegúrate de:
- ✅ Usar contraseñas fuertes para la base de datos
- ✅ Generar SECRET_KEY y JWT_SECRET_KEY aleatorios
- ✅ Cambiar `FLASK_ENV=production`
- ✅ Nunca subir archivos `.env` a GitHub

## 🆘 Troubleshooting

### Backend no inicia
```bash
sudo journalctl -u credikids-backend -n 50
```

### Error de conexión a base de datos
```bash
mysql -u credikids_user -p credikids_db
```

### Frontend no carga
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Permisos
```bash
sudo chown -R www-data:www-data /opt/CrediKids/frontend/dist
```
