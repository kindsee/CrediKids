import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { calendarService, tasksService, authService, usersService } from '../services'
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Clock, MessageSquare, Filter, XCircle } from 'lucide-react'

export default function CalendarPage() {
  const { user, updateUser } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDayTasksModal, setShowDayTasksModal] = useState(false)
  const [selectedDayTasks, setSelectedDayTasks] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Para filtro de admin
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('all') // 'all' para todos los usuarios

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  useEffect(() => {
    fetchCalendarData()
  }, [currentDate, user, selectedUserId])
  
  const loadUsers = async () => {
    try {
      const data = await usersService.getUsers()
      setUsers(data.filter(u => u.role === 'user'))
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const fetchCalendarData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      
      // Primer y último día del mes
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)
      
      let response
      
      if (isAdmin && selectedUserId === 'all') {
        // Admin viendo todos los usuarios: cargar todas las tareas del mes
        response = await calendarService.getUserCalendar(
          user.id,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
        
        // Cargar tareas de todos los usuarios día por día
        const allTasksByDate = {}
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0]
          try {
            const dayTasks = await calendarService.getAllUsersTasks(dateStr)
            allTasksByDate[dateStr] = dayTasks
          } catch (err) {
            console.error(`Error loading tasks for ${dateStr}:`, err)
          }
        }
        setCalendarData(allTasksByDate)
      } else {
        // Usuario normal o admin filtrando por usuario específico
        const targetUserId = isAdmin && selectedUserId !== 'all' ? parseInt(selectedUserId) : user.id
        response = await calendarService.getUserCalendar(
          targetUserId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
        setCalendarData(response.calendar || {})
      }
    } catch (error) {
      console.error('Error fetching calendar:', error)
      setError('Error al cargar el calendario')
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days = []
    const startDayOfWeek = firstDay.getDay()
    
    // Días del mes anterior (para completar la primera semana)
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i)
      })
    }
    
    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      })
    }
    
    // Días del mes siguiente (para completar la última semana)
    const remainingDays = 42 - days.length // 6 semanas x 7 días
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day)
      })
    }
    
    return days
  }

  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return calendarData[dateStr] || []
  }

  const isToday = (date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const openCompleteModal = (task) => {
    setSelectedTask(task)
    setCompletionNotes('')
    setShowCompleteModal(true)
    setError('')
    setSuccess('')
  }

  const closeCompleteModal = () => {
    setShowCompleteModal(false)
    setSelectedTask(null)
    setCompletionNotes('')
  }

  const openCancelModal = (task) => {
    setSelectedTask(task)
    setCancellationReason('')
    setShowCancelModal(true)
    setError('')
    setSuccess('')
  }

  const closeCancelModal = () => {
    setShowCancelModal(false)
    setSelectedTask(null)
    setCancellationReason('')
  }

  const openDayTasksModal = (date, tasks) => {
    setSelectedDate(date)
    setSelectedDayTasks(tasks)
    setShowDayTasksModal(true)
  }

  const closeDayTasksModal = () => {
    setShowDayTasksModal(false)
    setSelectedDayTasks([])
    setSelectedDate(null)
  }

  const handleCompleteTask = async () => {
    if (!selectedTask) return

    try {
      await tasksService.completeTask(selectedTask.id, completionNotes)
      setSuccess('¡Tarea completada!')
      closeCompleteModal()
      fetchCalendarData() // Recargar calendario
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error completing task:', error)
      setError(error.response?.data?.error || 'Error al completar la tarea')
    }
  }

  const handleCancelTask = async () => {
    if (!selectedTask) return

    try {
      const response = await tasksService.cancelTask(selectedTask.id, cancellationReason)
      
      // Actualizar datos del usuario para reflejar los créditos
      const updatedUser = await authService.getCurrentUser()
      updateUser(updatedUser)
      
      if (response.penalty_applied > 0) {
        setSuccess(`Tarea cancelada. Penalización: -${response.penalty_applied} créditos`)
      } else {
        setSuccess('Tarea cancelada')
      }
      
      closeCancelModal()
      fetchCalendarData() // Recargar calendario
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error cancelling task:', error)
      setError(error.response?.data?.error || 'Error al cancelar la tarea')
    }
  }

  const getTaskTypeColor = (taskType) => {
    switch (taskType) {
      case 'obligatory':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'special':
        return 'bg-purple-100 border-purple-300 text-purple-800'
      case 'proposed':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const days = getDaysInMonth()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Calendario</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
      
      {/* Filtro de usuario para admin */}
      {isAdmin && (
        <div className="card">
          <div className="flex items-center gap-3">
            <Filter size={20} />
            <label className="font-medium">Filtrar por usuario:</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="input flex-1 max-w-md"
            >
              <option value="all">Todos los usuarios</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.figure} {u.nick}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Calendar */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div>
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {dayNames.map(day => (
                <div key={day} className="p-3 text-center font-semibold text-gray-700 bg-gray-50">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {days.map((dayInfo, index) => {
                const tasks = dayInfo.isCurrentMonth ? getTasksForDate(dayInfo.date) : []
                const completedTasks = tasks.filter(t => t.is_completed).length
                const totalTasks = tasks.length
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] border-b border-r border-gray-200 p-2 ${
                      !dayInfo.isCurrentMonth ? 'bg-gray-50' : ''
                    } ${isToday(dayInfo.date) ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      !dayInfo.isCurrentMonth ? 'text-gray-400' : 
                      isToday(dayInfo.date) ? 'text-blue-600 font-bold' : 'text-gray-700'
                    }`}>
                      {dayInfo.day}
                    </div>

                    {/* Tasks */}
                    {dayInfo.isCurrentMonth && tasks.length > 0 && (
                      <div className="space-y-1">
                        {tasks.slice(0, 3).map(task => (
                          <button
                            key={task.id}
                            onClick={() => !task.is_completed && !task.is_cancelled && openCompleteModal(task)}
                            disabled={task.is_completed || task.is_cancelled}
                            className={`w-full text-left p-1 rounded text-xs border transition-all ${
                              getTaskTypeColor(task.task?.task_type)
                            } ${
                              task.is_completed || task.is_cancelled
                                ? 'opacity-60 cursor-not-allowed line-through' 
                                : 'hover:scale-105 cursor-pointer hover:shadow-sm'
                            }`}
                            title={`${isAdmin && task.user ? task.user.nick + ': ' : ''}${task.task?.title}`}
                          >
                            <div className="flex items-center space-x-1">
                              {task.is_completed ? (
                                <CheckCircle size={12} className="flex-shrink-0" />
                              ) : task.is_cancelled ? (
                                <span className="text-red-600 flex-shrink-0">✕</span>
                              ) : (
                                <Circle size={12} className="flex-shrink-0" />
                              )}
                              {isAdmin && task.user && (
                                <span className="flex-shrink-0 text-sm">{task.user.figure}</span>
                              )}
                              <span className="truncate flex-1">{task.task?.title}</span>
                            </div>
                          </button>
                        ))}
                        
                        {tasks.length > 3 && (
                          <button
                            onClick={() => openDayTasksModal(dayInfo.date, tasks)}
                            className="w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-center py-1 rounded transition-colors"
                          >
                            +{tasks.length - 3} más
                          </button>
                        )}
                        
                        {/* Progress indicator */}
                        {totalTasks > 0 && (
                          <div className="text-xs text-gray-600 text-center mt-1">
                            {completedTasks}/{totalTasks}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-2">Leyenda</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span>Obligatoria</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
            <span>Especial</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Propuesta</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle size={16} />
            <span>Completada</span>
          </div>
          <div className="flex items-center space-x-2">
            <Circle size={16} />
            <span>Por completar</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-600 text-xs">✕</div>
            <span>No completada</span>
          </div>
        </div>
      </div>

      {/* Day Tasks Modal */}
      {showDayTasksModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                Tareas del {selectedDate.toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              <button
                onClick={closeDayTasksModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {selectedDayTasks.map(task => {
                const isCompleted = task.is_completed
                const isCancelled = task.is_cancelled
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      getTaskTypeColor(task.task?.task_type)
                    } ${isCompleted || isCancelled ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {isAdmin && task.user && (
                          <div className="flex items-center gap-2 mb-2 text-sm">
                            <span className="text-xl">{task.user.figure}</span>
                            <span className="font-medium text-gray-700">{task.user.nick}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 mb-1">
                          {isCompleted ? (
                            <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                          ) : (
                            <Circle size={18} className="flex-shrink-0" />
                          )}
                          <h4 className={`font-semibold ${isCompleted || isCancelled ? 'line-through' : ''}`}>
                            {task.task?.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 ml-6">
                          {task.task?.description}
                        </p>
                        <div className="flex gap-2 mt-2 ml-6">
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                            {task.task?.base_value} créditos
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                            {task.task?.frequency}
                          </span>
                          {isCompleted && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              ✓ Completada
                            </span>
                          )}
                          {isCancelled && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                              ✕ No completada
                            </span>
                          )}
                        </div>
                      </div>
                      {!isCompleted && !task.is_cancelled && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              closeDayTasksModal()
                              openCompleteModal(task)
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 whitespace-nowrap"
                          >
                            Completar
                          </button>
                          <button
                            onClick={() => {
                              closeDayTasksModal()
                              openCancelModal(task)
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 whitespace-nowrap"
                          >
                            No completar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeDayTasksModal}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* div>
      </div>

      {/* Complete Task Modal */}
      {showCompleteModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Completar Tarea</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-lg">{selectedTask.task?.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{selectedTask.task?.description}</p>
              <div className="mt-2 flex gap-2">
                <span className={`text-xs px-2 py-1 rounded ${getTaskTypeColor(selectedTask.task?.task_type)}`}>
                  {selectedTask.task?.task_type}
                </span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                  {selectedTask.task?.base_value} créditos
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MessageSquare size={16} className="mr-2" />
                Comentario (opcional)
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Añade un comentario sobre cómo completaste la tarea..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este comentario será visible para el administrador al validar
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-between space-x-3">
              <button
                onClick={() => {
                  closeCompleteModal()
                  openCancelModal(selectedTask)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <XCircle size={18} />
                <span>No Completar</span>
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={closeCompleteModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCompleteTask}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <CheckCircle size={18} />
                  <span>Completar Tarea</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Task Modal */}
      {showCancelModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">No completar tarea</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-lg">{selectedTask.task?.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{selectedTask.task?.description}</p>
              <div className="mt-2 flex gap-2">
                <span className={`text-xs px-2 py-1 rounded ${getTaskTypeColor(selectedTask.task?.task_type)}`}>
                  {selectedTask.task?.task_type}
                </span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                  {selectedTask.task?.base_value} créditos
                </span>
              </div>
            </div>

            {selectedTask.task?.task_type === 'obligatory' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ Esta es una tarea obligatoria
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Se te restarán {selectedTask.task?.base_value} créditos por no completarla
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MessageSquare size={16} className="mr-2" />
                Motivo (opcional)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="¿Por qué no puedes completar esta tarea?..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows="3"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeCancelModal}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                onClick={handleCancelTask}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                No completar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
