import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { tasksService, usersService, authService } from '../services'
import { CheckCircle, XCircle, RotateCcw, Star, User as UserIcon, AlertTriangle } from 'lucide-react'

export default function TaskValidationPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('pending') // pending, cancelled, bonus, penalty
  const [pendingTasks, setPendingTasks] = useState([])
  const [cancelledTasks, setCancelledTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Modal states
  const [showValidateModal, setShowValidateModal] = useState(false)
  const [showBonusModal, setShowBonusModal] = useState(false)
  const [showPenaltyModal, setShowPenaltyModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [validationScore, setValidationScore] = useState(3)
  const [validationNotes, setValidationNotes] = useState('')
  const [bonusCredits, setBonusCredits] = useState('')
  const [bonusDescription, setBonusDescription] = useState('')
  const [penaltyCredits, setPenaltyCredits] = useState('')
  const [penaltyDescription, setPenaltyDescription] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  
  useEffect(() => {
    loadData()
    loadUsers()
  }, [activeTab])
  
  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'pending') {
        const data = await tasksService.getPendingValidations()
        setPendingTasks(data.completions || [])
      } else if (activeTab === 'cancelled') {
        const data = await tasksService.getCancelledAssignments()
        setCancelledTasks(data.assignments || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }
  
  const loadUsers = async () => {
    try {
      const data = await usersService.getUsers()
      setUsers(data.filter(u => u.role === 'user'))
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }
  
  const handleValidateTask = async () => {
    if (!selectedItem) return
    
    try {
      await tasksService.validateTask(selectedItem.id, {
        validation_score: validationScore,
        validation_notes: validationNotes
      })
      
      setSuccess('¡Tarea validada correctamente!')
      setShowValidateModal(false)
      setSelectedItem(null)
      setValidationScore(3)
      setValidationNotes('')
      loadData()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error validating task:', error)
      setError(error.response?.data?.error || 'Error al validar la tarea')
    }
  }
  
  const handleResetTask = async (assignmentId) => {
    if (!confirm('¿Estás seguro de que quieres resetear esta tarea?')) return
    
    try {
      await tasksService.resetTaskAssignment(assignmentId)
      setSuccess('Tarea reseteada correctamente')
      loadData()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error resetting task:', error)
      setError(error.response?.data?.error || 'Error al resetear la tarea')
    }
  }
  
  const handleAssignBonus = async () => {
    if (!selectedUserId || !bonusCredits) {
      setError('Debes seleccionar un usuario y una cantidad de créditos')
      return
    }
    
    const credits = parseInt(bonusCredits)
    if (credits <= 0) {
      setError('Los créditos bonus deben ser positivos')
      return
    }
    
    try {
      await tasksService.assignBonusCredits(selectedUserId, {
        credits: credits,
        description: bonusDescription
      })
      
      setSuccess('¡Bonus asignado correctamente!')
      setShowBonusModal(false)
      setSelectedUserId('')
      setBonusCredits('')
      setBonusDescription('')
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error assigning bonus:', error)
      setError(error.response?.data?.error || 'Error al asignar el bonus')
    }
  }
  
  const handleAssignPenalty = async () => {
    if (!selectedUserId || !penaltyCredits) {
      setError('Debes seleccionar un usuario y una cantidad de créditos')
      return
    }
    
    const credits = parseInt(penaltyCredits)
    if (credits >= 0) {
      setError('Los créditos de penalización deben ser negativos')
      return
    }
    
    try {
      await tasksService.assignBonusCredits(selectedUserId, {
        credits: credits,
        description: penaltyDescription
      })
      
      setSuccess('¡Penalización aplicada correctamente!')
      setShowPenaltyModal(false)
      setSelectedUserId('')
      setPenaltyCredits('')
      setPenaltyDescription('')
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error assigning penalty:', error)
      setError(error.response?.data?.error || 'Error al aplicar la penalización')
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
  
  const calculateCredits = (baseValue, score) => {
    const percentages = { 1: 0.1, 2: 0.6, 3: 1.0 }
    return Math.round(baseValue * percentages[score])
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Tareas</h1>
        <p className="text-gray-600 mt-1">Validar tareas y asignar bonuses</p>
      </div>
      
      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          {success}
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm md:text-base font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pendientes de Validar ({pendingTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-2 text-sm md:text-base font-medium border-b-2 transition-colors ${
            activeTab === 'cancelled'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Tareas Canceladas ({cancelledTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('bonus')}
          className={`px-4 py-2 text-sm md:text-base font-medium border-b-2 transition-colors ${
            activeTab === 'bonus'
              ? 'border-yellow-500 text-yellow-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Asignar Bonus
        </button>
        <button
          onClick={() => setActiveTab('penalty')}
          className={`px-4 py-2 text-sm md:text-base font-medium border-b-2 transition-colors ${
            activeTab === 'penalty'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Penalizar
        </button>
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-gray-600">Cargando...</p>
        ) : activeTab === 'pending' ? (
          pendingTasks.length === 0 ? (
            <p className="text-center text-gray-500">No hay tareas pendientes de validar</p>
          ) : (
            pendingTasks.map((completion) => (
              <div key={completion.id} className="card">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${getTaskTypeColor(completion.task?.task_type)}`}>
                        {completion.task?.task_type}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {completion.task?.base_value} créditos
                      </span>
                    </div>
                    <h3 className="font-semibold text-base md:text-lg">{completion.task?.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{completion.task?.description}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      <p><strong>Usuario:</strong> {completion.user?.nick}</p>
                      <p><strong>Completada:</strong> {new Date(completion.completed_at).toLocaleString('es-ES')}</p>
                      {completion.completion_notes && (
                        <p className="mt-1"><strong>Notas:</strong> {completion.completion_notes}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedItem(completion)
                      setShowValidateModal(true)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                  >
                    Validar
                  </button>
                </div>
              </div>
            ))
          )
        ) : activeTab === 'cancelled' ? (
          cancelledTasks.length === 0 ? (
            <p className="text-center text-gray-500">No hay tareas canceladas</p>
          ) : (
            cancelledTasks.map((assignment) => (
              <div key={assignment.id} className="card">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${getTaskTypeColor(assignment.task?.task_type)}`}>
                        {assignment.task?.task_type}
                      </span>
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                        Cancelada
                      </span>
                    </div>
                    <h3 className="font-semibold text-base md:text-lg">{assignment.task?.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{assignment.task?.description}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      <p><strong>Usuario:</strong> {assignment.user?.nick}</p>
                      <p><strong>Asignada:</strong> {new Date(assignment.assigned_date).toLocaleDateString('es-ES')}</p>
                      <p><strong>Cancelada:</strong> {new Date(assignment.cancelled_at).toLocaleString('es-ES')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResetTask(assignment.id)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 whitespace-nowrap"
                  >
                    <RotateCcw size={18} />
                    Resetear
                  </button>
                </div>
              </div>
            ))
          )
        ) : activeTab === 'bonus' ? (
          <div className="card">
            <button
              onClick={() => setShowBonusModal(true)}
              className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
            >
              <Star size={48} className="mx-auto text-yellow-500 mb-2" />
              <h3 className="text-lg font-semibold">Asignar Créditos Bonus</h3>
              <p className="text-sm text-gray-600 mt-1">Otorgar créditos especiales a un usuario</p>
            </button>
          </div>
        ) : (
          <div className="card">
            <button
              onClick={() => setShowPenaltyModal(true)}
              className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
            >
              <AlertTriangle size={48} className="mx-auto text-red-500 mb-2" />
              <h3 className="text-lg font-semibold">Aplicar Penalización</h3>
              <p className="text-sm text-gray-600 mt-1">Quitar créditos a un usuario</p>
            </button>
          </div>
        )}
      </div>
      
      {/* Validate Modal */}
      {showValidateModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold mb-4">Validar Tarea</h3>
            
            <div className="mb-4 p-3 md:p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold">{selectedItem.task?.title}</h4>
              <p className="text-sm text-gray-600 mt-1">Usuario: {selectedItem.user?.nick}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puntuación (1=10%, 2=60%, 3=100%)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((score) => (
                  <button
                    key={score}
                    onClick={() => setValidationScore(score)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      validationScore === score
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl font-bold">{score}</div>
                    <div className="text-xs text-gray-600">
                      {calculateCredits(selectedItem.task?.base_value, score)} créditos
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                placeholder="Comentarios sobre la validación..."
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
                onClick={() => {
                  setShowValidateModal(false)
                  setSelectedItem(null)
                  setValidationScore(3)
                  setValidationNotes('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleValidateTask}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Validar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bonus Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-yellow-600">
              Asignar Créditos Bonus
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Seleccionar usuario...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nick} ({u.score} créditos)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad de créditos (positivos)
              </label>
              <input
                type="number"
                value={bonusCredits}
                onChange={(e) => setBonusCredits(e.target.value)}
                placeholder="50"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={bonusDescription}
                onChange={(e) => setBonusDescription(e.target.value)}
                placeholder="Por buen comportamiento, ayudar en casa, etc..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none text-sm"
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
                onClick={() => {
                  setShowBonusModal(false)
                  setSelectedUserId('')
                  setBonusCredits('')
                  setBonusDescription('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignBonus}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Penalty Modal */}
      {showPenaltyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
              <AlertTriangle size={24} />
              Aplicar Penalización
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Seleccionar usuario...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nick} ({u.score} créditos)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad de créditos (negativos)
              </label>
              <input
                type="number"
                value={penaltyCredits}
                onChange={(e) => setPenaltyCredits(e.target.value)}
                placeholder="-50"
                max="-1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">Introduce un valor negativo (ej: -50)</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo (opcional)
              </label>
              <textarea
                value={penaltyDescription}
                onChange={(e) => setPenaltyDescription(e.target.value)}
                placeholder="Mal comportamiento, incumplimiento de normas, etc..."
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
                onClick={() => {
                  setShowPenaltyModal(false)
                  setSelectedUserId('')
                  setPenaltyCredits('')
                  setPenaltyDescription('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignPenalty}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Penalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
