import { useState, useEffect } from 'react'
import { calendarService, tasksService } from '../services'
import { useAuthStore } from '../store/authStore'
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

export default function TasksPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  useEffect(() => {
    loadDayTasks()
  }, [currentDate, user])
  
  const loadDayTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      if (isAdmin) {
        // Admin: cargar tareas de todos los usuarios para este día
        const response = await calendarService.getAllUsersTasks(dateStr)
        setTasks(response || [])
      } else {
        // Usuario: cargar solo sus tareas del día
        const response = await calendarService.getUserDay(user.id, dateStr)
        setTasks(response.tasks || [])
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
      setError('Error al cargar tareas del día')
    } finally {
      setLoading(false)
    }
  }
  
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }
  
  const goToNextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  const isToday = () => {
    const today = new Date()
    return currentDate.toDateString() === today.toDateString()
  }
  
  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    return date.toLocaleDateString('es-ES', options)
  }
  
  const getTaskStatus = (task) => {
    if (task.is_cancelled) return 'cancelled'
    if (task.completion) return 'completed'
    return 'pending'
  }
  
  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: <Clock size={16} />,
        text: 'Pendiente',
        className: 'bg-yellow-100 text-yellow-800'
      },
      completed: {
        icon: <CheckCircle size={16} />,
        text: 'Completada',
        className: 'bg-green-100 text-green-800'
      },
      cancelled: {
        icon: <XCircle size={16} />,
        text: 'Cancelada',
        className: 'bg-red-100 text-red-800'
      }
    }
    
    const badge = badges[status]
    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.icon}
        {badge.text}
      </span>
    )
  }
  
  // Agrupar tareas por estado
  const pendingTasks = tasks.filter(t => getTaskStatus(t) === 'pending')
  const completedTasks = tasks.filter(t => getTaskStatus(t) === 'completed')
  const cancelledTasks = tasks.filter(t => getTaskStatus(t) === 'cancelled')
  
  return (
    <div className="space-y-6">
      {/* Header con navegación de fecha */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tareas del Día</h1>
        
        <div className="flex items-center gap-3">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded hover:bg-gray-100 transition"
            title="Día anterior"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            onClick={goToToday}
            className={`px-4 py-2 rounded font-medium transition ${
              isToday()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              Hoy
            </div>
          </button>
          
          <button
            onClick={goToNextDay}
            className="p-2 rounded hover:bg-gray-100 transition"
            title="Día siguiente"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
      
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-700 capitalize">
          {formatDate(currentDate)}
        </h2>
        {isAdmin && (
          <p className="text-sm text-gray-500 mt-1">Mostrando tareas de todos los usuarios</p>
        )}
      </div>
      
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tareas...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tareas Pendientes */}
          <div className="card">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Clock size={20} className="text-yellow-600" />
              Pendientes ({pendingTasks.length})
            </h3>
            {pendingTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay tareas pendientes</p>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map(task => (
                  <div key={task.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {isAdmin && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{task.user?.figure}</span>
                            <span className="font-medium text-gray-700">{task.user?.nick}</span>
                          </div>
                        )}
                        <h4 className="font-bold text-lg">{task.task?.title}</h4>
                        <p className="text-gray-600 text-sm">{task.task?.description}</p>
                        <p className="text-blue-600 font-medium mt-2">
                          {task.task?.base_value} créditos
                        </p>
                      </div>
                      {getStatusBadge('pending')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Tareas Completadas */}
          <div className="card">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              Completadas ({completedTasks.length})
            </h3>
            {completedTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay tareas completadas</p>
            ) : (
              <div className="space-y-3">
                {completedTasks.map(task => (
                  <div key={task.id} className="p-4 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {isAdmin && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{task.user?.figure}</span>
                            <span className="font-medium text-gray-700">{task.user?.nick}</span>
                          </div>
                        )}
                        <h4 className="font-bold text-lg">{task.task?.title}</h4>
                        <p className="text-gray-600 text-sm">{task.task?.description}</p>
                        {task.completion && (
                          <div className="mt-2">
                            <p className="text-green-600 font-medium">
                              Créditos ganados: {task.completion.credits_awarded}
                            </p>
                            {task.completion.validation_score && (
                              <p className="text-sm text-gray-600">
                                Validación: {task.completion.validation_score}/3
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      {getStatusBadge('completed')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Tareas Canceladas */}
          {cancelledTasks.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <XCircle size={20} className="text-red-600" />
                Canceladas ({cancelledTasks.length})
              </h3>
              <div className="space-y-3">
                {cancelledTasks.map(task => (
                  <div key={task.id} className="p-4 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {isAdmin && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{task.user?.figure}</span>
                            <span className="font-medium text-gray-700">{task.user?.nick}</span>
                          </div>
                        )}
                        <h4 className="font-bold text-lg">{task.task?.title}</h4>
                        <p className="text-gray-600 text-sm">{task.task?.description}</p>
                        {task.cancellation_reason && (
                          <p className="text-red-600 text-sm mt-2">
                            Motivo: {task.cancellation_reason}
                          </p>
                        )}
                      </div>
                      {getStatusBadge('cancelled')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {tasks.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-gray-500">No hay tareas asignadas para este día</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

