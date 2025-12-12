# CrediKids - Estructura del Proyecto

```
CrediKids/
│
├── 📄 .gitignore                    # Archivos ignorados por Git
├── 📄 README.md                     # Documentación principal completa
├── 📄 SETUP.md                      # Guía de instalación paso a paso
├── 📄 install.ps1                   # Script automatizado de instalación
│
├── 📁 .github/
│   └── 📄 copilot-instructions.md   # Instrucciones para AI coding agents
│
├── 📁 backend/                      # Servidor Flask (Python)
│   │
│   ├── 📄 .env.example              # Plantilla de configuración
│   ├── 📄 app.py                    # Aplicación Flask principal
│   ├── 📄 config.py                 # Configuración (DB, JWT, etc.)
│   ├── 📄 requirements.txt          # Dependencias de Python
│   ├── 📄 seed_data.py              # Script para datos de prueba
│   │
│   ├── 📁 models/                   # Modelos SQLAlchemy
│   │   ├── 📄 __init__.py
│   │   ├── 📄 user.py               # Usuario con sistema de iconos
│   │   ├── 📄 task.py               # Tarea (obligatoria/especial/propuesta)
│   │   ├── 📄 task_assignment.py    # Asignación de tarea a usuario
│   │   ├── 📄 task_completion.py    # Registro de tarea completada
│   │   ├── 📄 task_proposal.py      # Propuesta de tarea por usuario
│   │   ├── 📄 reward.py             # Premio canjeable
│   │   ├── 📄 reward_redemption.py  # Registro de canje
│   │   └── 📄 icon.py               # Iconos para códigos de acceso
│   │
│   └── 📁 routes/                   # Endpoints REST (Blueprints)
│       ├── 📄 __init__.py
│       ├── 📄 auth.py               # Login con iconos, JWT
│       ├── 📄 users.py              # CRUD usuarios, historial
│       ├── 📄 tasks.py              # Gestión tareas, asignaciones, validación
│       ├── 📄 rewards.py            # Gestión premios, canjes
│       ├── 📄 calendar.py           # Vista calendario, tareas por fecha
│       └── 📄 icons.py              # 25 iconos para códigos de acceso
│
└── 📁 frontend/                     # Cliente React + Vite
    │
    ├── 📄 .env.example              # Plantilla de configuración
    ├── 📄 .eslintrc.cjs             # Configuración ESLint
    ├── 📄 index.html                # HTML principal
    ├── 📄 package.json              # Dependencias de Node.js
    ├── 📄 postcss.config.js         # PostCSS para TailwindCSS
    ├── 📄 tailwind.config.js        # Configuración TailwindCSS
    ├── 📄 vite.config.js            # Configuración Vite + proxy
    │
    └── 📁 src/
        │
        ├── 📄 main.jsx              # Punto de entrada React
        ├── 📄 App.jsx               # Router + rutas protegidas
        ├── 📄 index.css             # Estilos globales + Tailwind
        │
        ├── 📁 components/           # Componentes reutilizables
        │   ├── 📄 Layout.jsx        # Layout principal con Outlet
        │   ├── 📄 Navbar.jsx        # Barra superior (créditos, usuario)
        │   └── 📄 Sidebar.jsx       # Menú lateral de navegación
        │
        ├── 📁 pages/                # Páginas de la aplicación
        │   ├── 📄 LoginPage.jsx     # Login con selector de iconos
        │   ├── 📄 DashboardPage.jsx # Resumen: créditos, stats
        │   ├── 📄 CalendarPage.jsx  # Calendario de tareas
        │   ├── 📄 TasksPage.jsx     # Lista y gestión de tareas
        │   ├── 📄 ProposalsPage.jsx # Proponer/revisar tareas
        │   ├── 📄 RewardsPage.jsx   # Catálogo de premios
        │   ├── 📄 HistoryPage.jsx   # Historial de actividad
        │   └── 📄 UsersPage.jsx     # Gestión usuarios (admin)
        │
        ├── 📁 services/             # Comunicación con API
        │   ├── 📄 api.js            # Cliente Axios + interceptors JWT
        │   └── 📄 index.js          # Servicios organizados por dominio
        │
        └── 📁 store/                # Estado global
            └── 📄 authStore.js      # Zustand: user, token, auth state
```

## 🎯 Flujo de Datos

### Autenticación
```
Usuario → LoginPage (selecciona 4 iconos) 
  → POST /api/auth/login 
  → Backend verifica User.access_code 
  → Retorna JWT token 
  → Frontend guarda en localStorage + Zustand 
  → Redirige a Dashboard
```

### Completar Tarea
```
Usuario ve tarea en Calendar → Click "Completar" 
  → POST /api/tasks/assignments/:id/complete 
  → Crea TaskCompletion 
  → Admin recibe notificación 
  → Admin valida con score 1/2/3 
  → POST /api/tasks/completions/:id/validate 
  → Calcula créditos (10%/60%/100%) 
  → Actualiza User.score 
  → Frontend actualiza display de créditos
```

### Canjear Premio
```
Usuario ve Rewards → Click "Canjear" 
  → Verifica User.score >= Reward.credit_cost 
  → POST /api/rewards/:id/redeem 
  → Crea RewardRedemption 
  → Resta créditos (User.score -= cost) 
  → Actualiza stock si existe 
  → Frontend actualiza créditos
```

## 📦 Modelos de Base de Datos

### Relaciones Clave

```
User (1) ←→ (N) TaskAssignment
User (1) ←→ (N) TaskCompletion
User (1) ←→ (N) TaskProposal
User (1) ←→ (N) RewardRedemption

Task (1) ←→ (N) TaskAssignment
Task (1) ←→ (N) TaskCompletion

TaskAssignment (1) ←→ (1) TaskCompletion

Reward (1) ←→ (N) RewardRedemption

Icon (25 disponibles para códigos de acceso)
```

## 🔐 Sistema de Autenticación Único

**Código de Iconos:**
- 25 iconos disponibles (emojis)
- Usuario selecciona 4 en orden específico
- Backend guarda como string: `"1,5,12,8"`
- Login verifica nick + secuencia exacta de iconos
- JWT token generado con `user.id` como identity

**Protección de Rutas:**
- `@jwt_required()` - Requiere token válido
- `@admin_required` - Requiere token + role='admin'
- Frontend: `<PrivateRoute>` y `<AdminRoute>`

## 🎨 Componentes Frontend Principales

### Páginas Implementadas
- ✅ **LoginPage**: Selector visual de 4 iconos
- ✅ **DashboardPage**: Stats, acciones rápidas
- 🚧 **CalendarPage**: Vista calendario (placeholder)
- 🚧 **TasksPage**: Gestión de tareas (placeholder)
- 🚧 **ProposalsPage**: Propuestas (placeholder)
- 🚧 **RewardsPage**: Catálogo premios (placeholder)
- 🚧 **HistoryPage**: Historial (placeholder)
- 🚧 **UsersPage**: Gestión usuarios admin (placeholder)

**Nota:** Las páginas marcadas con 🚧 tienen estructura básica pero requieren implementación completa de funcionalidad.

## 🛠️ Tecnologías Utilizadas

### Backend
- **Flask** - Framework web Python
- **SQLAlchemy** - ORM para base de datos
- **Flask-JWT-Extended** - Autenticación JWT
- **Flask-CORS** - Manejo de CORS
- **PyMySQL** - Conector MariaDB
- **python-dotenv** - Variables de entorno

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool y dev server
- **React Router** - Navegación SPA
- **Zustand** - Estado global
- **Axios** - Cliente HTTP
- **TailwindCSS** - Framework CSS
- **Lucide React** - Iconos

### Base de Datos
- **MariaDB** - Base de datos relacional
- Charset: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`

## 📚 Endpoints API Disponibles

### Auth (3)
- POST `/api/auth/login`
- GET `/api/auth/me`
- POST `/api/auth/refresh`

### Users (5)
- GET `/api/users`
- POST `/api/users`
- GET `/api/users/:id`
- PUT `/api/users/:id`
- DELETE `/api/users/:id`
- GET `/api/users/:id/history`

### Tasks (9)
- GET `/api/tasks`
- POST `/api/tasks`
- GET `/api/tasks/:id`
- PUT `/api/tasks/:id`
- DELETE `/api/tasks/:id`
- POST `/api/tasks/assign`
- POST `/api/tasks/assignments/:id/complete`
- POST `/api/tasks/completions/:id/validate`
- GET `/api/tasks/proposals`
- POST `/api/tasks/proposals`
- POST `/api/tasks/proposals/:id/review`

### Rewards (6)
- GET `/api/rewards`
- POST `/api/rewards`
- GET `/api/rewards/:id`
- PUT `/api/rewards/:id`
- DELETE `/api/rewards/:id`
- POST `/api/rewards/:id/redeem`
- GET `/api/rewards/redemptions`

### Calendar (4)
- GET `/api/calendar/user/:id`
- GET `/api/calendar/user/:id/day/:date`
- GET `/api/calendar/user/:id/pending`
- GET `/api/calendar/user/:id/completed`

### Icons (2)
- GET `/api/icons`
- POST `/api/icons/seed`

**Total: 29 endpoints**

## 🚀 Próximos Pasos para Desarrollo

1. ✅ Estructura base completa
2. ✅ Modelos y relaciones de DB
3. ✅ Todos los endpoints REST
4. ✅ Sistema de autenticación con iconos
5. ✅ Layout y navegación frontend
6. ✅ LoginPage con selector de iconos
7. ✅ Dashboard con estadísticas
8. 🚧 Implementar páginas restantes (Calendar, Tasks, etc.)
9. 🚧 Componentes de formularios (crear tarea, usuario, premio)
10. 🚧 Modales de confirmación y validación
11. 🚧 Notificaciones/toasts para feedback
12. 🚧 Implementación de calendario interactivo
13. 🚧 Manejo de errores mejorado
14. 🚧 Tests unitarios backend
15. 🚧 Tests E2E frontend

---

**📝 Nota:** Este proyecto está listo para desarrollo. Los componentes principales están implementados y funcionando. Las páginas marcadas como "placeholder" necesitan implementación de lógica de negocio y UI completa.
