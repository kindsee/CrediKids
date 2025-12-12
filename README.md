# CrediKids - Sistema de Tareas Gamificado

Sistema de gamificación de tareas familiares con roles de administrador y usuario, gestión de créditos, y sistema de recompensas.

## 🏗️ Arquitectura

### Stack Tecnológico
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Flask (Python) + SQLAlchemy
- **Base de Datos**: MariaDB
- **Autenticación**: JWT + Sistema de iconos (4 iconos de 25 posibles)
- **Estado Global**: Zustand

### Estructura del Proyecto
```
CrediKids/
├── backend/
│   ├── models/          # Modelos SQLAlchemy (User, Task, Reward, etc.)
│   ├── routes/          # Blueprints de Flask (auth, users, tasks, rewards, calendar)
│   ├── app.py           # Aplicación principal Flask
│   ├── config.py        # Configuración (DB, JWT, etc.)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes reutilizables (Layout, Navbar, Sidebar)
│   │   ├── pages/       # Páginas de la app (Dashboard, Calendar, Tasks, etc.)
│   │   ├── services/    # Servicios API (axios)
│   │   ├── store/       # Estado global (Zustand)
│   │   └── App.jsx      # Rutas y configuración principal
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🎯 Conceptos Clave del Dominio

### Roles
1. **Administrador**: Crea usuarios, asigna tareas, valida completados, gestiona premios
2. **Usuario**: Completa tareas, propone nuevas tareas, canjea premios

### Tipos de Tareas
1. **Obligatorias (Misiones Base)**: NO suman créditos al completarse, pero RESTAN si no se hacen
2. **Especiales**: Creadas por admin, suman créditos según validación (10%, 60%, 100%)
3. **Propuestas**: Creadas por usuarios, requieren aprobación de admin

### Sistema de Puntuación
- Cada tarea tiene un `base_value` (créditos)
- Al validar: `validation_score` (1, 2, 3) = 10%, 60%, 100% del valor
- Tareas obligatorias: solo evitan penalización
- Usuario tiene `score` (créditos actuales) que se actualiza con cada validación

### Flujo de Tareas
```
1. Admin crea Task → 2. Admin asigna TaskAssignment a Usuario + Fecha →
3. Usuario completa → crea TaskCompletion →
4. Admin valida → actualiza credits_awarded → suma/resta al User.score
```

## 🚀 Configuración e Instalación

### Backend (Flask)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Configurar .env (copiar de .env.example)
cp .env.example .env
# Editar .env con credenciales de MariaDB

# Iniciar servidor
python app.py  # Corre en http://localhost:5000
```

### Frontend (React + Vite)
```powershell
cd frontend
npm install

# Configurar .env (copiar de .env.example)
cp .env.example .env

# Iniciar desarrollo
npm run dev  # Corre en http://localhost:3000
```

### Base de Datos MariaDB
```sql
CREATE DATABASE credikids_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'credikids_user'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON credikids_db.* TO 'credikids_user'@'localhost';
FLUSH PRIVILEGES;
```

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login con nick + 4 iconos
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/refresh` - Refrescar datos del usuario

### Usuarios (Admin)
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Desactivar usuario
- `GET /api/users/:id/history` - Historial completo

### Tareas
- `GET /api/tasks` - Listar tareas
- `POST /api/tasks` - Crear tarea (admin)
- `POST /api/tasks/assign` - Asignar tarea a usuario (admin)
- `POST /api/tasks/assignments/:id/complete` - Completar tarea
- `POST /api/tasks/completions/:id/validate` - Validar tarea (admin)

### Propuestas
- `GET /api/tasks/proposals` - Listar propuestas
- `POST /api/tasks/proposals` - Crear propuesta (usuario)
- `POST /api/tasks/proposals/:id/review` - Revisar propuesta (admin)

### Premios
- `GET /api/rewards` - Listar premios
- `POST /api/rewards` - Crear premio (admin)
- `POST /api/rewards/:id/redeem` - Canjear premio
- `GET /api/rewards/redemptions` - Historial de canjes

### Calendario
- `GET /api/calendar/user/:id?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Calendario de usuario
- `GET /api/calendar/user/:id/day/:date` - Tareas de un día específico
- `GET /api/calendar/user/:id/pending` - Tareas pendientes
- `GET /api/calendar/user/:id/completed` - Tareas completadas

### Iconos
- `GET /api/icons` - Obtener 25 iconos para códigos de acceso
- `POST /api/icons/seed` - Inicializar iconos (solo desarrollo)

## 🔒 Autenticación

Sistema único con código de iconos:
1. Usuario selecciona 4 iconos de 25 posibles
2. Backend guarda como string: `"1,5,12,8"` en `User.access_code`
3. Login verifica nick + secuencia de iconos
4. JWT token se almacena en localStorage
5. Cada petición incluye header: `Authorization: Bearer <token>`

## 🎨 Componentes Frontend

### Estructura de Páginas
- **LoginPage**: Selector de iconos + nick
- **DashboardPage**: Resumen de créditos, tareas pendientes/completadas
- **CalendarPage**: Vista de calendario con tareas asignadas
- **TasksPage**: Lista de tareas (con opciones admin)
- **ProposalsPage**: Proponer/revisar tareas
- **RewardsPage**: Catálogo de premios y canje
- **HistoryPage**: Historial personal
- **UsersPage**: Gestión de usuarios (solo admin)

### Estado Global (Zustand)
```javascript
authStore: {
  user: { id, nick, figure, role, score, ... },
  token: "jwt_token",
  isAuthenticated: bool,
  setAuth(), updateUser(), logout()
}
```

### Servicios API
Todos los servicios en `frontend/src/services/index.js`:
- `authService`: login, getCurrentUser, refreshUser
- `usersService`: CRUD usuarios
- `tasksService`: gestión de tareas, asignaciones, validaciones
- `rewardsService`: premios y canjes
- `calendarService`: calendario y vistas por fecha
- `iconsService`: obtener iconos

## 🗄️ Modelos de Base de Datos

### User
```python
id, nick, figure, access_code (4 iconos), role (admin/user), 
score (créditos), is_active, created_at, updated_at
```

### Task
```python
id, title, description, task_type (obligatory/special/proposed),
frequency (daily/weekly/monthly/one_time), base_value, 
status (active/inactive/archived), created_by_id
```

### TaskAssignment
```python
id, task_id, user_id, assigned_date, is_completed, 
is_validated, assigned_by_id
```

### TaskCompletion
```python
id, assignment_id, task_id, user_id, completed_at,
validation_score (1/2/3), validated_by_id, validated_at,
validation_notes, credits_awarded
```

### TaskProposal
```python
id, user_id, title, description, frequency, suggested_reward,
message_to_admin, status (pending/approved/rejected/modified),
reviewed_by_id, reviewed_at, final_title, final_description,
final_reward, created_task_id
```

### Reward
```python
id, name, description, icon, credit_cost, is_active, 
stock (null=ilimitado), created_by_id
```

### RewardRedemption
```python
id, reward_id, user_id, credits_spent, redeemed_at, notes
```

### Icon
```python
id, name, icon_path (emoji o URL), display_order
```

## 🧪 Testing y Desarrollo

### Inicializar Datos de Prueba
```python
# En el backend, puedes crear un script seed_data.py:
from app import create_app, db
from models import User, Icon

app = create_app()
with app.app_context():
    # Crear admin
    admin = User(nick='admin', figure='👨‍💼', role='admin')
    admin.set_access_code([1, 2, 3, 4])
    db.session.add(admin)
    
    # Crear usuario de prueba
    user = User(nick='usuario1', figure='👦', role='user')
    user.set_access_code([5, 6, 7, 8])
    db.session.add(user)
    
    db.session.commit()
```

### Flujo de Desarrollo Típico
1. Backend: Crear/modificar modelos → actualizar rutas → probar con Postman/curl
2. Frontend: Actualizar servicios API → crear/modificar componentes → probar en navegador
3. Usar React DevTools para inspeccionar estado Zustand
4. Verificar JWT en Application → Local Storage en DevTools

## 📝 Convenciones de Código

### Backend (Python/Flask)
- Snake_case para variables y funciones
- PascalCase para clases/modelos
- Blueprints por dominio (auth, users, tasks, etc.)
- Decorador `@admin_required` para rutas de administrador
- Usar `db.session.commit()` después de cambios en DB

### Frontend (React)
- PascalCase para componentes
- camelCase para funciones/variables
- Servicios centralizados en `services/index.js`
- Zustand para estado global, useState para estado local
- TailwindCSS para estilos (clases utilitarias)

## 🛠️ Comandos Útiles

### Backend
```powershell
# Instalar dependencias
pip install -r requirements.txt

# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Ejecutar servidor
python app.py

# Crear migración (si usas Flask-Migrate)
flask db migrate -m "Descripción"
flask db upgrade
```

### Frontend
```powershell
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

## 🐛 Troubleshooting

### Error de conexión a MariaDB
- Verificar que MariaDB esté corriendo: `systemctl status mariadb`
- Revisar credenciales en `backend/.env`
- Confirmar que la base de datos existe

### JWT Token inválido
- Verificar que `JWT_SECRET_KEY` sea el mismo en backend
- Limpiar localStorage: `localStorage.clear()` en consola del navegador

### CORS errors
- Verificar que Flask-CORS esté configurado en `app.py`
- Confirmar que frontend apunte al puerto correcto del backend

### Iconos no cargan
- Ejecutar `POST /api/icons/seed` para inicializar 25 iconos por defecto

## 📚 Recursos Adicionales

- [Flask Documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Zustand GitHub](https://github.com/pmndrs/zustand)

## 📄 Licencia

Proyecto privado - CrediKids © 2025
