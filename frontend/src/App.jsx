import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CalendarPage from './pages/CalendarPage'
import TasksPage from './pages/TasksPage'
import ProposalsPage from './pages/ProposalsPage'
import RewardsPage from './pages/RewardsPage'
import UsersPage from './pages/UsersPage'
import TasksManagementPage from './pages/TasksManagementPage'
import TaskAssignmentPage from './pages/TaskAssignmentPage'
import HistoryPage from './pages/HistoryPage'
import ChangePinPage from './pages/ChangePinPage'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" />
  }
  
  return children
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="proposals" element={<ProposalsPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="change-pin" element={<ChangePinPage />} />
          
          {/* Rutas de administrador */}
          <Route path="users" element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          } />
          <Route path="tasks-management" element={
            <AdminRoute>
              <TasksManagementPage />
            </AdminRoute>
          } />
          <Route path="task-assignment" element={
            <AdminRoute>
              <TaskAssignmentPage />
            </AdminRoute>
          } />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
