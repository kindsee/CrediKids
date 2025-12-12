# Copilot Instructions - CrediKids

## Project Overview
CrediKids is a **gamified task management system** for families with admin/user roles, credit-based rewards, and an icon-based authentication system. Built as a SPA with React + Vite frontend and Flask + MariaDB backend.

## Architecture Quick Reference

### Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS + React Router + Zustand
- **Backend**: Flask + SQLAlchemy + Flask-JWT-Extended
- **Database**: MariaDB (PyMySQL connector)
- **Auth**: JWT tokens + 4-icon visual password (from 25 icons)

### Key Directory Structure
```
backend/
├── models/           # SQLAlchemy models (User, Task, TaskAssignment, TaskCompletion, TaskProposal, Reward, RewardRedemption, Icon)
├── routes/           # Flask blueprints: auth, users, tasks, rewards, calendar, icons
├── app.py            # Flask app factory with CORS + JWT
└── config.py         # Environment-based config (dev/prod)

frontend/
├── src/
│   ├── components/   # Layout, Navbar, Sidebar
│   ├── pages/        # LoginPage, DashboardPage, CalendarPage, TasksPage, ProposalsPage, RewardsPage, HistoryPage, UsersPage
│   ├── services/     # API client (axios) + service modules (authService, tasksService, etc.)
│   ├── store/        # Zustand store (authStore)
│   └── App.jsx       # React Router with PrivateRoute/AdminRoute guards
```

## Core Domain Concepts

### Task Types & Scoring Logic
1. **Obligatory Tasks** (`task_type='obligatory'`): 
   - Do NOT award credits when completed
   - DEDUCT `base_value` credits if NOT completed (penalty system)
   - Created only by admins

2. **Special Tasks** (`task_type='special'`):
   - Created by admins
   - Award credits based on admin validation: `validation_score` (1/2/3) = 10%/60%/100% of `base_value`

3. **Proposed Tasks** (`task_type='proposed'`):
   - Submitted by users via `TaskProposal` model
   - Require admin review (approve/reject/modify)
   - Upon approval, converted to regular `Task` with `task_type='proposed'`

### Task Assignment Flow
```
Task (template) → TaskAssignment (user + date) → TaskCompletion (when user completes) 
→ Admin validates with score 1/2/3 → Credits calculated and added to User.score
```

### Authentication Flow
1. User selects 4 icons from 25 available (stored as comma-separated IDs in `User.access_code`)
2. `POST /api/auth/login` with `{ "nick": "...", "icon_codes": [1, 5, 12, 8] }`
3. Backend verifies icon sequence, returns JWT token
4. Frontend stores token in localStorage + Zustand store
5. All API requests include `Authorization: Bearer <token>` header

## Database Schema Patterns

### User Model
- `access_code`: String like `"1,5,12,8"` (4 icon IDs)
- `score`: Integer (current credits balance, can go negative)
- `role`: `'admin'` or `'user'`
- Methods: `set_access_code(icon_ids)`, `verify_access_code(icon_ids)`, `add_credits()`, `subtract_credits()`

### TaskAssignment vs TaskCompletion
- **TaskAssignment**: Links `Task` to `User` with specific `assigned_date` (created by admin)
- **TaskCompletion**: Created when user completes the assignment
  - Has one-to-one relationship with `TaskAssignment` via `assignment_id`
  - Stores `validation_score`, `credits_awarded`, `validated_by_id`

### TaskProposal Workflow
- User creates with `status='pending'`
- Admin reviews with `POST /api/tasks/proposals/:id/review`
  - If approved: creates new `Task`, sets `created_task_id`
  - If modified: stores `final_title`, `final_description`, `final_reward`

## API Endpoint Patterns

### Admin-Only Endpoints
Use `@admin_required` decorator (checks `user.role == 'admin'`):
- `POST /api/users` - Create user
- `POST /api/tasks` - Create task
- `POST /api/tasks/assign` - Assign task to user
- `POST /api/tasks/completions/:id/validate` - Validate completed task
- `POST /api/tasks/proposals/:id/review` - Review user proposal
- `POST /api/rewards` - Create reward

### User Endpoints
- `POST /api/tasks/assignments/:id/complete` - Mark task as done
- `POST /api/tasks/proposals` - Propose new task
- `POST /api/rewards/:id/redeem` - Redeem reward with credits

### Calendar/History Endpoints
- `GET /api/calendar/user/:id?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Date-ranged tasks
- `GET /api/calendar/user/:id/pending` - Uncompleted tasks
- `GET /api/users/:id/history` - Full history (completions + redemptions)

## Frontend State Management

### Zustand authStore
```javascript
{
  user: { id, nick, figure, role, score, ... },
  token: "jwt_token",
  isAuthenticated: boolean,
  setAuth(user, token),
  updateUser(user),
  logout()
}
```

### Protected Routes
- `<PrivateRoute>`: Checks `isAuthenticated`
- `<AdminRoute>`: Checks `isAuthenticated` AND `user.role === 'admin'`

### API Services Pattern
All services in `frontend/src/services/index.js`:
```javascript
export const tasksService = {
  getTasks: async () => { ... },
  completeTask: async (assignmentId) => { ... },
  validateTask: async (completionId, { validation_score, validation_notes }) => { ... }
}
```

## Development Workflows

### Adding a New Feature (Full Stack)
1. **Backend**:
   - Add/modify model in `backend/models/`
   - Create/update route in `backend/routes/`
   - Test with Postman: `POST http://localhost:5000/api/...`

2. **Frontend**:
   - Add service method in `frontend/src/services/index.js`
   - Create/update component in `frontend/src/pages/` or `frontend/src/components/`
   - Use `useAuthStore()` for auth, `useState()/useEffect()` for data fetching

### Running the App
```powershell
# Terminal 1 - Backend
cd backend
.\venv\Scripts\Activate.ps1
python app.py  # Runs on http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev    # Runs on http://localhost:3000
```

### Database Initialization
```powershell
# First time setup
mysql -u root -p
CREATE DATABASE credikids_db;

# Flask will auto-create tables via SQLAlchemy on first run
# Seed icons: POST http://localhost:5000/api/icons/seed
```

## Code Style & Conventions

### Backend (Python)
- **Naming**: `snake_case` for functions/variables, `PascalCase` for classes
- **Models**: Always include `created_at`, `updated_at` timestamps
- **Routes**: Group by domain in separate blueprint files
- **Validation**: Return `400` for bad requests, `403` for forbidden, `404` for not found

### Frontend (React)
- **Naming**: `PascalCase` for components, `camelCase` for functions
- **Styling**: Use TailwindCSS utility classes (e.g., `className="card"` for white bg + shadow)
- **Hooks**: Use `useEffect()` for data fetching, `useAuthStore()` for auth state
- **Error Handling**: Try/catch in async functions, display errors in UI

### Common Patterns
```python
# Backend: Admin-only route
@tasks_bp.route('/validate', methods=['POST'])
@admin_required  # Custom decorator
def validate_task():
    ...

# Frontend: Protected API call
import { tasksService } from '../services'

const handleComplete = async () => {
  try {
    await tasksService.completeTask(assignmentId)
    // Refresh data
  } catch (error) {
    setError(error.response?.data?.error || 'Error')
  }
}
```

## Common Pitfalls & Solutions

### Issue: JWT Token Expired
- **Symptom**: 401 errors on API calls
- **Fix**: Implement token refresh or re-login flow

### Issue: User Score Not Updating
- **Check**: Ensure `db.session.commit()` called after `user.add_credits()`
- **Check**: Frontend calls `authService.refreshUser()` after task validation

### Issue: Icon Codes Not Matching
- **Check**: Array order matters! `[1,5,12,8]` ≠ `[5,1,8,12]`
- **Fix**: Use consistent ordering in UI and backend verification

### Issue: CORS Errors
- **Fix**: Ensure `Flask-CORS` is initialized in `app.py`
- **Check**: Frontend proxy in `vite.config.js` points to correct backend port

## Testing Checklist

### Backend API Tests
- [ ] Create user with 4 icons
- [ ] Login with correct/incorrect icon sequence
- [ ] Create task and assign to user
- [ ] Complete task as user
- [ ] Validate task as admin (score 1/2/3)
- [ ] Verify user score updated correctly
- [ ] Redeem reward (check credit deduction)

### Frontend Flow Tests
- [ ] Login with icon selector
- [ ] View dashboard (credits, pending tasks)
- [ ] Navigate to calendar (date-based view)
- [ ] Complete a task
- [ ] Propose new task (user role)
- [ ] Validate task (admin role)
- [ ] Redeem reward
- [ ] Check history page

## Quick Reference Commands

```powershell
# Backend
cd backend
pip install -r requirements.txt
.\venv\Scripts\Activate.ps1
python app.py

# Frontend
cd frontend
npm install
npm run dev

# Database
mysql -u root -p
CREATE DATABASE credikids_db;

# Test API
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nick": "admin", "icon_codes": [1,2,3,4]}'
```

## Files to Reference When...

### Working on Authentication
- `backend/routes/auth.py` - Login endpoints
- `backend/models/user.py` - Access code logic
- `frontend/src/pages/LoginPage.jsx` - Icon selector UI
- `frontend/src/services/index.js` - authService

### Working on Tasks
- `backend/models/task.py`, `task_assignment.py`, `task_completion.py` - Core models
- `backend/routes/tasks.py` - All task endpoints
- `frontend/src/pages/TasksPage.jsx` - Task management UI

### Working on Scoring/Credits
- `backend/models/user.py` - `add_credits()`, `subtract_credits()`
- `backend/models/task_completion.py` - `calculate_credits()`
- `backend/routes/tasks.py` - Validation endpoint logic

### Working on Calendar
- `backend/routes/calendar.py` - Date-range queries
- `frontend/src/pages/CalendarPage.jsx` - Calendar UI (use react-calendar)

---

**Key Principle**: This is a **credit-based gamification system** where tasks either award or deduct credits based on completion and validation. Always update `User.score` atomically with `TaskCompletion` validation.
