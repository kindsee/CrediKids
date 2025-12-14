import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { calendarService } from '../services'
import { CheckCircle, Clock, AlertCircle, TrendingUp, XCircle } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    cancelled: 0
  })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadStats()
  }, [])
  
  const loadStats = async () => {
    try {
      const [pendingData, completedData, cancelledData] = await Promise.all([
        calendarService.getUserPendingTasks(user.id),
        calendarService.getUserCompletedTasks(user.id, 30),
        calendarService.getUserCancelledTasks(user.id, 30)
      ])
      
      setStats({
        pending: pendingData.pending_count,
        completed: completedData.completed_count,
        cancelled: cancelledData.cancelled_count
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const statCards = [
    {
      title: 'Créditos',
      value: user?.score || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Tareas Pendientes',
      value: stats.pending,
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Tareas Completadas',
      value: stats.completed,
      icon: CheckCircle,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Tareas No Completadas',
      value: stats.cancelled,
      icon: XCircle,
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50'
    }
  ]
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bienvenido, {user?.nick}!</p>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className={`card ${stat.bgColor} border-l-4 ${stat.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-3xl font-bold mt-2 ${stat.textColor}`}>
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Quick actions */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/calendar" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors">
            <h3 className="font-semibold text-lg mb-1">Ver Calendario</h3>
            <p className="text-sm text-gray-600">Revisa tus tareas del día</p>
          </a>
          <a href="/rewards" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors">
            <h3 className="font-semibold text-lg mb-1">Canjear Premios</h3>
            <p className="text-sm text-gray-600">Usa tus créditos</p>
          </a>
          <a href="/proposals" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors">
            <h3 className="font-semibold text-lg mb-1">Proponer Tarea</h3>
            <p className="text-sm text-gray-600">Sugiere nuevas misiones</p>
          </a>
          <a href="/history" className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors">
            <h3 className="font-semibold text-lg mb-1">Ver Historial</h3>
            <p className="text-sm text-gray-600">Revisa tu progreso</p>
          </a>
        </div>
      </div>
    </div>
  )
}
