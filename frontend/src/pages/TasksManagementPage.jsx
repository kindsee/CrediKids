import { useState, useEffect } from 'react'
import { List, Plus, Edit2, Power, CheckCircle, XCircle, Clock, Save, X, Calendar, Trash2 } from 'lucide-react'
import { tasksService, usersService } from '../services'

export default function TasksManagementPage() {
  const [tasks, setTasks] = useState([])
  const [proposals, setProposals] = useState([])
  const [assignments, setAssignments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [activeTab, setActiveTab] = useState('tasks') // 'tasks' | 'proposals' | 'assignments'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [reviewingProposal, setReviewingProposal] = useState(null)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [selectedAssignments, setSelectedAssignments] = useState([])
  
  // Filtros para asignaciones
  const [assignmentFilters, setAssignmentFilters] = useState({
    user_id: '',
    task_id: '',
    status: 'pending',
    start_date: '',
    end_date: ''
  })

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'special',
    frequency: 'daily',
    base_value: 10
  })

  const [proposalReviewData, setProposalReviewData] = useState({
    status: 'approved',
    final_title: '',
    final_description: '',
    final_reward: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (activeTab === 'assignments') {
      loadAssignments()
    }
  }, [activeTab, assignmentFilters])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tasksData, proposalsData, usersData] = await Promise.all([
        tasksService.getTasks(),
        tasksService.getProposals(),
        usersService.getUsers()
      ])
      setTasks(tasksData)
      setProposals(proposalsData)
      setUsers(usersData.filter(u => u.is_active)) // Solo usuarios activos para asignar
    } catch (err) {
      setError('Error al cargar datos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadAssignments = async () => {
    try {
      setLoading(true)
      setSelectedAssignments([]) // Limpiar selección al cargar
      const filters = {}
      if (assignmentFilters.user_id) filters.user_id = assignmentFilters.user_id
      if (assignmentFilters.task_id) filters.task_id = assignmentFilters.task_id
      if (assignmentFilters.status) filters.status = assignmentFilters.status
      if (assignmentFilters.start_date) filters.start_date = assignmentFilters.start_date
      if (assignmentFilters.end_date) filters.end_date = assignmentFilters.end_date
      
      const data = await tasksService.getAllAssignments(filters)
      setAssignments(data)
    } catch (err) {
      setError('Error al cargar asignaciones')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setModalError('')

    try {
      await tasksService.createTask(formData)
      setShowCreateModal(false)
      resetForm()
      loadData()
    } catch (err) {
      setModalError(err.response?.data?.error || 'Error al crear tarea')
    }
  }

  const handleUpdateTask = async (e) => {
    e.preventDefault()
    setModalError('')

    try {
      await tasksService.updateTask(editingTask.id, formData)
      setEditingTask(null)
      resetForm()
      loadData()
    } catch (err) {
      setModalError(err.response?.data?.error || 'Error al actualizar tarea')
    }
  }

  const handleToggleTaskActive = async (taskId, currentStatus) => {
    const action = currentStatus === 'active' ? 'desactivar' : 'activar'
    if (!confirm(`¿Estás seguro de ${action} esta tarea?`)) return

    try {
      await tasksService.updateTask(taskId, { 
        status: currentStatus === 'active' ? 'inactive' : 'active' 
      })
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || `Error al ${action} tarea`)
    }
  }

  const handleReviewProposal = async (e) => {
    e.preventDefault()
    setModalError('')

    try {
      await tasksService.reviewProposal(reviewingProposal.id, proposalReviewData)
      setReviewingProposal(null)
      resetProposalReviewForm()
      loadData()
    } catch (err) {
      setModalError(err.response?.data?.error || 'Error al revisar propuesta')
    }
  }

  const openEditModal = (task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      task_type: task.task_type,
      frequency: task.frequency,
      base_value: task.base_value
    })
  }

  const openReviewModal = (proposal) => {
    setReviewingProposal(proposal)
    setProposalReviewData({
      status: 'approved',
      final_title: proposal.title,
      final_description: proposal.description,
      final_reward: proposal.suggested_reward
    })
  }

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm('¿Estás seguro de eliminar esta asignación?')) return

    try {
      await tasksService.deleteAssignment(assignmentId)
      loadAssignments()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar asignación')
    }
  }

  const handleDeleteSelectedAssignments = async () => {
    if (selectedAssignments.length === 0) {
      setError('No hay asignaciones seleccionadas')
      return
    }

    const count = selectedAssignments.length
    if (!confirm(`¿Estás seguro de eliminar ${count} asignación(es)?`)) return

    try {
      setLoading(true)
      // Eliminar todas las asignaciones seleccionadas
      await Promise.all(
        selectedAssignments.map(id => tasksService.deleteAssignment(id))
      )
      setSelectedAssignments([])
      loadAssignments()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar asignaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAssignment = (assignmentId) => {
    setSelectedAssignments(prev => {
      if (prev.includes(assignmentId)) {
        return prev.filter(id => id !== assignmentId)
      } else {
        return [...prev, assignmentId]
      }
    })
  }

  const handleToggleAll = () => {
    // Solo seleccionar asignaciones no completadas
    const selectableAssignments = assignments.filter(a => !a.is_completed)
    if (selectedAssignments.length === selectableAssignments.length) {
      setSelectedAssignments([])
    } else {
      setSelectedAssignments(selectableAssignments.map(a => a.id))
    }
  }

  const handleUpdateAssignmentDate = async (assignmentId, newDate) => {
    try {
      await tasksService.updateAssignment(assignmentId, {
        assigned_date: newDate
      })
      loadAssignments()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar fecha')
    }
  }

  const openEditAssignmentModal = (assignment) => {
    setEditingAssignment(assignment)
  }

  const closeEditAssignmentModal = () => {
    setEditingAssignment(null)
  }

  const handleSaveAssignmentDate = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const newDate = formData.get('assigned_date')
    
    try {
      await handleUpdateAssignmentDate(editingAssignment.id, newDate)
      closeEditAssignmentModal()
    } catch (err) {
      setModalError(err.response?.data?.error || 'Error al guardar')
    }
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setEditingTask(null)
    setReviewingProposal(null)
    setModalError('')
    resetForm()
    resetProposalReviewForm()
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      task_type: 'special',
      frequency: 'daily',
      base_value: 10
    })
  }

  const resetProposalReviewForm = () => {
    setProposalReviewData({
      status: 'approved',
      final_title: '',
      final_description: '',
      final_reward: 0
    })
  }

  const getTaskTypeLabel = (type) => {
    const labels = {
      'obligatory': 'Obligatoria',
      'special': 'Normal',
      'proposed': 'Propuesta'
    }
    return labels[type] || type
  }

  const getTaskTypeBadge = (type) => {
    const badges = {
      'obligatory': 'bg-red-100 text-red-800',
      'special': 'bg-blue-100 text-blue-800',
      'proposed': 'bg-purple-100 text-purple-800'
    }
    return badges[type] || 'bg-gray-100 text-gray-800'
  }

  const getFrequencyLabel = (freq) => {
    const labels = {
      'daily': 'Diaria',
      'weekly': 'Semanal',
      'monthly': 'Mensual',
      'one_time': 'Única'
    }
    return labels[freq] || freq
  }

  const getProposalStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'modified': 'bg-blue-100 text-blue-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Tareas</h1>
        {activeTab === 'tasks' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Tarea
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <List className="inline mr-2" size={20} />
            Tareas ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'proposals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="inline mr-2" size={20} />
            Propuestas Pendientes ({proposals.filter(p => p.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assignments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="inline mr-2" size={20} />
            Asignaciones ({assignments.length})
          </button>
        </nav>
      </div>

      {/* Tareas Tab */}
      {activeTab === 'tasks' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frecuencia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map(task => (
                  <tr key={task.id} className={`hover:bg-gray-50 ${task.status !== 'active' ? 'opacity-50 bg-gray-100' : ''}`}>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${task.status === 'active' ? 'text-gray-900' : 'text-gray-500'}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTaskTypeBadge(task.task_type)}`}>
                        {getTaskTypeLabel(task.task_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getFrequencyLabel(task.frequency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${task.task_type === 'obligatory' ? 'text-red-600' : 'text-green-600'}`}>
                        {task.task_type === 'obligatory' ? '-' : '+'}{task.base_value}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {task.status === 'active' ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(task)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Editar tarea"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleToggleTaskActive(task.id, task.status)}
                        className={`${task.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={task.status === 'active' ? 'Desactivar tarea' : 'Activar tarea'}
                      >
                        <Power size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Propuestas Tab */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          {proposals.filter(p => p.status === 'pending').length === 0 ? (
            <div className="card text-center py-12">
              <Clock size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No hay propuestas pendientes</p>
            </div>
          ) : (
            proposals
              .filter(p => p.status === 'pending')
              .map(proposal => (
                <div key={proposal.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{proposal.title}</h3>
                      <p className="text-sm text-gray-600 mt-2">{proposal.description}</p>
                      <div className="flex items-center gap-4 mt-4 text-sm">
                        <span className="text-gray-500">
                          Propuesto por: <span className="font-medium">{proposal.user?.nick || 'Usuario'}</span>
                        </span>
                        <span className="text-green-600 font-medium">
                          Recompensa propuesta: +{proposal.suggested_reward}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => openReviewModal(proposal)}
                      className="btn-primary ml-4"
                    >
                      Revisar
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Asignaciones Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <select
                  value={assignmentFilters.user_id}
                  onChange={(e) => setAssignmentFilters({ ...assignmentFilters, user_id: e.target.value })}
                  className="input"
                >
                  <option value="">Todos los usuarios</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.figure} {user.nick}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarea</label>
                <select
                  value={assignmentFilters.task_id}
                  onChange={(e) => setAssignmentFilters({ ...assignmentFilters, task_id: e.target.value })}
                  className="input"
                >
                  <option value="">Todas las tareas</option>
                  {tasks.filter(t => t.status === 'active').map(task => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={assignmentFilters.status}
                  onChange={(e) => setAssignmentFilters({ ...assignmentFilters, status: e.target.value })}
                  className="input"
                >
                  <option value="">Todos</option>
                  <option value="pending">Pendientes</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha inicio</label>
                <input
                  type="date"
                  value={assignmentFilters.start_date}
                  onChange={(e) => setAssignmentFilters({ ...assignmentFilters, start_date: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha fin</label>
                <input
                  type="date"
                  value={assignmentFilters.end_date}
                  onChange={(e) => setAssignmentFilters({ ...assignmentFilters, end_date: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Botón para eliminar seleccionados */}
          {selectedAssignments.length > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedAssignments.length} asignación(es) seleccionada(s)
              </span>
              <button
                onClick={handleDeleteSelectedAssignments}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={18} />
                Eliminar seleccionadas
              </button>
            </div>
          )}

          {/* Lista de asignaciones */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No se encontraron asignaciones</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedAssignments.length === assignments.filter(a => !a.is_completed).length && assignments.filter(a => !a.is_completed).length > 0}
                        onChange={handleToggleAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarea</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créditos</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map(assignment => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        {!assignment.is_completed && (
                          <input
                            type="checkbox"
                            checked={selectedAssignments.includes(assignment.id)}
                            onChange={() => handleToggleAssignment(assignment.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{assignment.user?.figure}</span>
                          <span className="text-sm font-medium text-gray-900">{assignment.user?.nick}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{assignment.task?.title}</div>
                        <div className="text-xs text-gray-500">{assignment.task?.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(assignment.assigned_date).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assignment.is_completed ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                            <CheckCircle size={14} />
                            Completada
                          </span>
                        ) : assignment.is_cancelled ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                            <XCircle size={14} />
                            Cancelada
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                            <Clock size={14} />
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {assignment.task?.base_value}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!assignment.is_completed && (
                          <>
                            <button
                              onClick={() => openEditAssignmentModal(assignment)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              title="Editar fecha"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar asignación"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Crear Tarea */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Crear Nueva Tarea</h2>
                <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                    <select
                      value={formData.task_type}
                      onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                      className="input"
                    >
                      <option value="obligatory">Obligatoria (resta si no se hace)</option>
                      <option value="special">Normal (suma si se hace)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="input"
                    >
                      <option value="daily">Diaria</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                      <option value="one_time">Única</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Base (créditos)
                  </label>
                  <input
                    type="number"
                    value={formData.base_value}
                    onChange={(e) => setFormData({ ...formData, base_value: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.task_type === 'obligatory' 
                      ? 'Se restará este valor si NO se completa' 
                      : 'Se sumará según validación: 10%/60%/100% del valor base'}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    <Save size={20} className="inline mr-2" />
                    Crear Tarea
                  </button>
                  <button type="button" onClick={closeModals} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Tarea */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Editar Tarea</h2>
                <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleUpdateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                    <select
                      value={formData.task_type}
                      onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                      className="input"
                    >
                      <option value="obligatory">Obligatoria (resta si no se hace)</option>
                      <option value="special">Normal (suma si se hace)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="input"
                    >
                      <option value="daily">Diaria</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                      <option value="one_time">Única</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Base (créditos)
                  </label>
                  <input
                    type="number"
                    value={formData.base_value}
                    onChange={(e) => setFormData({ ...formData, base_value: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    <Save size={20} className="inline mr-2" />
                    Guardar Cambios
                  </button>
                  <button type="button" onClick={closeModals} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Revisar Propuesta */}
      {reviewingProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Revisar Propuesta</h2>
                <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {modalError}
                </div>
              )}

              {/* Propuesta Original */}
              <div className="bg-gray-50 p-4 rounded mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Propuesta Original:</h3>
                <p className="text-sm text-gray-700"><strong>Título:</strong> {reviewingProposal.title}</p>
                <p className="text-sm text-gray-700 mt-1"><strong>Descripción:</strong> {reviewingProposal.description}</p>
                <p className="text-sm text-gray-700 mt-1"><strong>Frecuencia:</strong> {getFrequencyLabel(reviewingProposal.frequency)}</p>
                <p className="text-sm text-gray-700 mt-1"><strong>Recompensa:</strong> +{reviewingProposal.suggested_reward}</p>
                {reviewingProposal.message_to_admin && (
                  <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                    <p className="text-xs text-gray-500 mb-1">Mensaje del usuario:</p>
                    <p className="text-sm text-gray-700 italic">"{reviewingProposal.message_to_admin}"</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">Por: {reviewingProposal.user?.nick} • {new Date(reviewingProposal.created_at).toLocaleDateString()}</p>
              </div>

              <form onSubmit={handleReviewProposal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Acción</label>
                  <select
                    value={proposalReviewData.status}
                    onChange={(e) => setProposalReviewData({ ...proposalReviewData, status: e.target.value })}
                    className="input"
                  >
                    <option value="approved">Aprobar sin cambios</option>
                    <option value="modified">Aprobar con modificaciones</option>
                    <option value="rejected">Rechazar</option>
                  </select>
                </div>

                {(proposalReviewData.status === 'approved' || proposalReviewData.status === 'modified') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título Final {proposalReviewData.status === 'modified' && '(modificado)'}
                      </label>
                      <input
                        type="text"
                        value={proposalReviewData.final_title}
                        onChange={(e) => setProposalReviewData({ ...proposalReviewData, final_title: e.target.value })}
                        className="input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción Final {proposalReviewData.status === 'modified' && '(modificada)'}
                      </label>
                      <textarea
                        value={proposalReviewData.final_description}
                        onChange={(e) => setProposalReviewData({ ...proposalReviewData, final_description: e.target.value })}
                        className="input"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recompensa Final {proposalReviewData.status === 'modified' && '(ajustada)'}
                      </label>
                      <input
                        type="number"
                        value={proposalReviewData.final_reward}
                        onChange={(e) => setProposalReviewData({ ...proposalReviewData, final_reward: parseInt(e.target.value) })}
                        className="input"
                        min="1"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit" 
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded font-medium ${
                      proposalReviewData.status === 'rejected'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {proposalReviewData.status === 'approved' && <CheckCircle size={20} />}
                    {proposalReviewData.status === 'modified' && <Edit2 size={20} />}
                    {proposalReviewData.status === 'rejected' && <XCircle size={20} />}
                    {proposalReviewData.status === 'approved' && 'Aprobar'}
                    {proposalReviewData.status === 'modified' && 'Aprobar con Cambios'}
                    {proposalReviewData.status === 'rejected' && 'Rechazar'}
                  </button>
                  <button type="button" onClick={closeModals} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Asignación */}
      {editingAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Editar Fecha de Asignación</h3>
              <button onClick={closeEditAssignmentModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            {modalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {modalError}
              </div>
            )}

            <div className="mb-4 p-4 bg-gray-50 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{editingAssignment.user?.figure}</span>
                <span className="font-medium">{editingAssignment.user?.nick}</span>
              </div>
              <div className="text-sm font-medium">{editingAssignment.task?.title}</div>
              <div className="text-xs text-gray-500">{editingAssignment.task?.description}</div>
            </div>

            <form onSubmit={handleSaveAssignmentDate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Fecha</label>
                <input
                  type="date"
                  name="assigned_date"
                  defaultValue={editingAssignment.assigned_date}
                  className="input"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="flex-1 btn-primary flex items-center justify-center gap-2">
                  <Save size={18} />
                  Guardar
                </button>
                <button type="button" onClick={closeEditAssignmentModal} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
