# Inicialización de Base de Datos - CrediKids

Este directorio contiene scripts para inicializar la base de datos de CrediKids en cualquier servidor.

## 📋 Contenido

- **`init_database.sql`**: Script SQL completo para crear la estructura de base de datos
- **`init_db.py`**: Script Python interactivo para inicialización completa

## 🚀 Métodos de Inicialización

### Método 1: Script SQL Directo (Recomendado para producción)

**Cuándo usar:** Despliegue en servidor nuevo, migración, o cuando prefieres control total sobre la base de datos.

```bash
# En el servidor, con MariaDB/MySQL instalado
mysql -u root -p < backend/init_database.sql

# O si ya tienes la base de datos creada
mysql -u credikids_user -p credikids_db < backend/init_database.sql
```

**Ventajas:**
- ✅ Rápido y directo
- ✅ No requiere Python configurado
- ✅ Fácil de versionar y auditar
- ✅ Incluye índices y optimizaciones
- ✅ Seed automático de 25 iconos

**Después del SQL, crea el usuario admin:**
```bash
cd backend
python init_db.py  # Solo creará el admin si las tablas ya existen
```

---

### Método 2: Script Python Interactivo (Recomendado para desarrollo)

**Cuándo usar:** Primer setup local, desarrollo, o cuando prefieres un proceso guiado.

```bash
# Activar entorno virtual
cd backend
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate    # Linux/Mac

# Ejecutar script interactivo
python init_db.py
```

**El script te guiará para:**
1. ✅ Crear todas las tablas automáticamente
2. ✅ Seed de 25 iconos
3. ✅ Crear usuario administrador (interactivo)
4. ✅ Opcionalmente crear datos de ejemplo

**Ventajas:**
- ✅ Todo en un solo comando
- ✅ Proceso guiado paso a paso
- ✅ Detecta si ya existen datos
- ✅ Perfecto para desarrollo local

---

## 📊 Estructura de Base de Datos

### Tablas Principales

| Tabla | Descripción | Relaciones |
|-------|-------------|------------|
| **users** | Usuarios del sistema (admin/user) | → tasks, rewards, bonuses |
| **icons** | Iconos para autenticación visual | - |
| **tasks** | Plantillas de tareas | → task_assignments |
| **task_assignments** | Tareas asignadas a usuarios | → task_completions |
| **task_completions** | Tareas completadas y validadas | ← task_assignments |
| **task_proposals** | Propuestas de tareas por usuarios | → users, tasks |
| **rewards** | Premios canjeables | → reward_redemptions |
| **reward_redemptions** | Canjes de premios | → rewards, users |
| **bonuses** | Bonus/penalizaciones manuales | → users |

### Índices y Optimizaciones

Todas las tablas incluyen:
- ✅ Índices en claves foráneas
- ✅ Índices en campos de búsqueda frecuente
- ✅ Índices únicos donde corresponde
- ✅ Timestamps automáticos (created_at, updated_at)
- ✅ Codificación UTF-8 (emojis soportados)

---

## 🔄 Migración de Datos

### Exportar datos de producción

```bash
# Exportar solo datos (sin estructura)
mysqldump -u credikids_user -p credikids_db \
  --no-create-info --no-create-db \
  > backup_data.sql

# Exportar estructura y datos
mysqldump -u credikids_user -p credikids_db \
  > backup_full.sql
```

### Importar en nuevo servidor

```bash
# 1. Crear estructura con init_database.sql
mysql -u root -p < init_database.sql

# 2. Importar datos (si los tienes)
mysql -u credikids_user -p credikids_db < backup_data.sql
```

---

## 🧪 Verificación Post-Instalación

### Verificar tablas creadas

```sql
USE credikids_db;
SHOW TABLES;
-- Deberías ver 9 tablas

SELECT COUNT(*) FROM icons;
-- Debería retornar 25
```

### Verificar desde Python

```python
from app import create_app, db
from models import User, Icon, Task

app = create_app()
with app.app_context():
    print(f"Iconos: {Icon.query.count()}")
    print(f"Usuarios: {User.query.count()}")
    print(f"Tareas: {Task.query.count()}")
```

### Probar API

```bash
# Obtener iconos
curl http://localhost:5001/api/icons

# Login (requiere usuario creado)
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nick": "admin", "icon_codes": [1,2,3,4]}'
```

---

## 🔧 Solución de Problemas

### Error: "Access denied for user"

```bash
# Verificar credenciales en .env
cat .env | grep DB_

# Otorgar permisos manualmente
mysql -u root -p
GRANT ALL PRIVILEGES ON credikids_db.* TO 'credikids_user'@'localhost';
FLUSH PRIVILEGES;
```

### Error: "Table already exists"

```sql
-- Si quieres empezar de cero
DROP DATABASE IF EXISTS credikids_db;
-- Luego ejecuta init_database.sql de nuevo
```

### Error: "No module named 'models'"

```bash
# Asegúrate de estar en el directorio correcto
cd backend

# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Verificar que las dependencias están instaladas
pip install -r requirements.txt
```

### Script Python no encuentra la base de datos

Verifica tu archivo `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=credikids_user
DB_PASSWORD=tu_password
DB_NAME=credikids_db
```

---

## 📝 Notas Importantes

### Producción
- 🔒 Cambia las credenciales por defecto
- 🔒 Usa contraseñas fuertes para usuarios DB
- 🔒 Configura SECRET_KEY y JWT_SECRET_KEY únicos
- 📦 Haz backups regulares (`mysqldump`)
- 🔄 Documenta cualquier cambio en el esquema

### Desarrollo
- 💡 El script Python (`init_db.py`) es idempotente
- 💡 Puedes ejecutarlo múltiples veces sin problemas
- 💡 Los iconos solo se insertan si no existen
- 💡 SQLAlchemy creará las tablas automáticamente si usas `db.create_all()`

### Versionado
- 📌 Mantén `init_database.sql` actualizado con cualquier cambio de esquema
- 📌 Si agregas tablas nuevas, actualiza ambos scripts
- 📌 Documenta migraciones en `migrations/` si usas Flask-Migrate

---

## 🆘 Ayuda Adicional

Para más información, consulta:
- [SETUP.md](../SETUP.md) - Guía de instalación completa
- [README.md](../README.md) - Documentación del proyecto
- Logs del backend: El servidor Flask muestra errores detallados en consola

---

**Última actualización:** Diciembre 2025  
**Versión del esquema:** 1.0
