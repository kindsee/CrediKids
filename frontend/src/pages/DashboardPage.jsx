import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { calendarService, usersService, tasksService, authService } from '../services'
import { CheckCircle, Clock, TrendingUp, XCircle, X, MessageSquare } from 'lucide-react'

export default function DashboardPage() {
  const { user, updateUser } = useAuthStore()
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    cancelled: 0
  })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [modalData, setModalData] = useState([])
  const [modalLoading, setModalLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [completionNotes, setCompletionNotes] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
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
  
  const handleCardClick = async (type) => {
    setModalType(type)
    setShowModal(true)
    setModalLoading(true)
    setError('')
    
    try {
      if (type === 'credits') {
        const history = await usersService.getUserHistory(user.id)
        // Combinar completions, redemptions y bonuses en una sola lista
        const completions = (history.task_completions || []).map(item => ({
          ...item,
          type: 'completion',
          date: item.completed_at,
          credits: item.credits_awarded,
          description: item.task?.title || 'Tarea completada'
        }))
        const redemptions = (history.reward_redemptions || []).map(item => ({
          ...item,
          type: 'redemption',
          date: item.redeemed_at,
          credits: item.status === 'rejected' ? 0 : -item.credits_spent,
          description: item.reward?.name || 'Premio canjeado'
        }))
        const bonuses = (history.bonuses || []).map(item => ({
          ...item,
          type: 'bonus',
          date: item.created_at,
          credits: item.credits,
          description: item.description || 'Bonus del administrador'
        }))
        // Combinar y ordenar por fecha
        const combined = [...completions, ...redemptions, ...bonuses].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )
        setModalData(combined)
      } else if (type === 'pending') {
        const data = await calendarService.getUserPendingTasks(user.id)
        setModalData(data.tasks || [])
      } else if (type === 'completed') {
        const data = await calendarService.getUserCompletedTasks(user.id, 30)
        setModalData(data.tasks || [])
      } else if (type === 'cancelled') {
        const data = await calendarService.getUserCancelledTasks(user.id, 30)
        setModalData(data.tasks || [])
      }
    } catch (error) {
      console.error('Error loading modal data:', error)
      setError('Error al cargar los datos')
    } finally {
      setModalLoading(false)
    }
  }
  
  const closeModal = () => {
    setShowModal(false)
    setModalType(null)
    setModalData([])
    setError('')
  }
  
  const openCompleteModal = (task) => {
    setSelectedTask(task)
    setCompletionNotes('')
    setShowCompleteModal(true)
    setShowModal(false)
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
    setShowModal(false)
  }
  
  const closeCancelModal = () => {
    setShowCancelModal(false)
    setSelectedTask(null)
    setCancellationReason('')
  }
  
  const handleCompleteTask = async () => {
    if (!selectedTask) return
    
    try {
      await tasksService.completeTask(selectedTask.id, completionNotes)
      setSuccess('¡Tarea completada!')
      closeCompleteModal()
      loadStats()
      
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
      
      const updatedUser = await authService.getCurrentUser()
      updateUser(updatedUser)
      
      if (response.penalty_applied > 0) {
        setSuccess(`Tarea cancelada. Penalización: -${response.penalty_applied} créditos`)
      } else {
        setSuccess('Tarea cancelada')
      }
      
      closeCancelModal()
      loadStats()
      
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
  
  const statCards = [
    {
      title: 'Créditos',
      value: user?.score || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      type: 'credits'
    },
    {
      title: 'Tareas Pendientes',
      value: stats.pending,
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
      type: 'pending'
    },
    {
      title: 'Tareas Completadas',
      value: stats.completed,
      icon: CheckCircle,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      type: 'completed'
    },
    {
      title: 'Tareas No Completadas',
      value: stats.cancelled,
      icon: XCircle,
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      type: 'cancelled'
    }
  ]
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bienvenid@, {user?.nick}!</p>
      </div>
      
      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          {success}
        </div>
      )}
      
      {/* Stats cards - Clickeable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <button
              key={index}
              onClick={() => handleCardClick(stat.type)}
              className={`card ${stat.bgColor} border-l-4 ${stat.color} hover:shadow-lg transition-all transform hover:scale-105 text-left w-full`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl md:text-3xl font-bold mt-2 ${stat.textColor}`}>
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`p-2 md:p-3 rounded-full ${stat.color}`}>
                  <Icon className="text-white" size={20} />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Modal para mostrar detalles */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <h3 className="text-lg md:text-xl font-bold">
                {modalType === 'credits' && 'Historial de Créditos'}
                {modalType === 'pending' && 'Tareas Pendientes'}
                {modalType === 'completed' && 'Tareas Completadas'}
                {modalType === 'cancelled' && 'Tareas No Completadas'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 md:p-6">
              {modalLoading ? (
                <p className="text-center text-gray-600">Cargando...</p>
              ) : error ? (
                <p className="text-center text-red-600">{error}</p>
              ) : modalData.length === 0 ? (
                <p className="text-center text-gray-500">No hay datos para mostrar</p>
              ) : (
                <div className="space-y-3">
                  {modalType === 'credits' && (
                    modalData.map((item, index) => (
                      <div key={index} className="p-3 md:p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-sm md:text-base">
                              {item.type === 'completion' ? '✅ Tarea completada' : 
                               item.type === 'redemption' ? '🎁 Premio canjeado' :
                               item.type === 'bonus' ? '⭐ Bonus especial' : 
                               '📋 Actividad'}
                            </p>
                            <p className="text-xs md:text-sm text-gray-600 mt-1">
                              {item.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(item.date).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className={`text-base md:text-lg font-bold ml-4 ${
                            item.credits > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.credits > 0 ? `+${item.credits}` : item.credits}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {modalType === 'pending' && (
                    modalData.map((task) => (
                      <div key={task.id} className={`p-3 md:p-4 border-2 rounded-lg ${getTaskTypeColor(task.task?.task_type)}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm md:text-base break-words">{task.task?.title}</h4>
                            <p className="text-xs md:text-sm text-gray-600 mt-1 break-words">{task.task?.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs px-2 py-1 bg-white rounded">
                                {task.task?.base_value} créditos
                              </span>
                              <span className="text-xs px-2 py-1 bg-white rounded">
                                {new Date(task.assigned_date).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <button
                              onClick={() => openCompleteModal(task)}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs md:text-sm rounded-lg hover:bg-green-700 whitespace-nowrap"
                            >
                              Completar
                            </button>
                            <button
                              onClick={() => openCancelModal(task)}
                              className="px-3 py-1.5 bg-red-600 text-white text-xs md:text-sm rounded-lg hover:bg-red-700 whitespace-nowrap"
                            >
                              No hacer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {(modalType === 'completed' || modalType === 'cancelled') && (
                    modalData.map((task) => (
                      <div key={task.id} className={`p-3 md:p-4 border-2 rounded-lg opacity-70 ${getTaskTypeColor(task.task?.task_type)}`}>
                        <h4 className="font-semibold text-sm md:text-base line-through">{task.task?.title}</h4>
                        <p className="text-xs md:text-sm text-gray-600 mt-1">{task.task?.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-white rounded">
                            {task.task?.base_value} créditos
                          </span>
                          <span className="text-xs px-2 py-1 bg-white rounded">
                            {new Date(task.assigned_date).toLocaleDateString('es-ES')}
                          </span>
                          {modalType === 'completed' && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              ✓ Completada
                            </span>
                          )}
                          {modalType === 'cancelled' && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                              ✕ No completada
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 p-4 md:p-6">
              <button
                onClick={closeModal}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {showCompleteModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold mb-4">Completar Tarea</h3>
            
            <div className="mb-4 p-3 md:p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-base md:text-lg">{selectedTask.task?.title}</h4>
              <p className="text-xs md:text-sm text-gray-600 mt-1">{selectedTask.task?.description}</p>
            </div>

            <div className="mb-4">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MessageSquare size={16} className="mr-2" />
                Comentario (opcional)
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Añade un comentario..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                rows="3"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeCompleteModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteTask}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm md:text-base"
              >
                Completar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Task Modal */}
      {showCancelModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-red-600">No completar tarea</h3>
            
            <div className="mb-4 p-3 md:p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-base md:text-lg">{selectedTask.task?.title}</h4>
              <p className="text-xs md:text-sm text-gray-600 mt-1">{selectedTask.task?.description}</p>
            </div>

            {selectedTask.task?.task_type === 'obligatory' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ Esta es una tarea obligatoria
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Se te restarán {selectedTask.task?.base_value} créditos
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
                placeholder="¿Por qué no puedes completarla?..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
                rows="3"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeCancelModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base"
              >
                Volver
              </button>
              <button
                onClick={handleCancelTask}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm md:text-base"
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
