import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  LayoutDashboard, 
  Calendar, 
  ListTodo, 
  Lightbulb, 
  Gift, 
  History, 
  Users,
  Settings,
  CalendarClock,
  CheckSquare
} from 'lucide-react'

export default function Sidebar() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/calendar', icon: Calendar, label: 'Calendario' },
    { to: '/tasks', icon: ListTodo, label: 'Tareas' },
    { to: '/proposals', icon: Lightbulb, label: 'Propuestas' },
    { to: '/rewards', icon: Gift, label: 'Premios' },
    { to: '/history', icon: History, label: 'Historial' }
  ]
  
  if (isAdmin) {
    navItems.push(
      { to: '/users', icon: Users, label: 'Usuarios' },
      { to: '/tasks-management', icon: Settings, label: 'Gestión Tareas' },
      { to: '/task-assignment', icon: CalendarClock, label: 'Asignar Tareas' },
      { to: '/task-validation', icon: CheckSquare, label: 'Validar Tareas' }
    )
  }
  
  return (
    <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-73px)] p-4">
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
