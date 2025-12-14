import { useState, useEffect } from 'react'
import { Lightbulb, Plus, Clock, CheckCircle, XCircle, AlertCircle, Save, X } from 'lucide-react'
import { tasksService } from '../services'
import { useAuthStore } from '../store/authStore'

export default function ProposalsPage() {
  const { user } = useAuthStore()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'daily',
    suggested_reward: 10,
    message_to_admin: ''
  })

  useEffect(() => {
    loadProposals()
  }, [])

  const loadProposals = async () => {
    try {
      setLoading(true)
      const data = await tasksService.getProposals()
      // Filtrar solo las propuestas del usuario actual (no admin)
      setProposals(data.filter(p => p.user_id === user.id))
    } catch (err) {
      setError('Error al cargar propuestas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProposal = async (e) => {
    e.preventDefault()
    setModalError('')

    try {
      await tasksService.createProposal(formData)
      setShowCreateModal(false)
      resetForm()
      loadProposals()
    } catch (err) {
      setModalError(err.response?.data?.error || 'Error al crear propuesta')
    }
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setModalError('')
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      frequency: 'daily',
      suggested_reward: 10,
      message_to_admin: ''
    })
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />
      case 'approved':
        return <CheckCircle className="text-green-500" size={20} />
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />
      case 'modified':
        return <AlertCircle className="text-blue-500" size={20} />
      default:
        return <Clock className="text-gray-500" size={20} />
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pendiente',
      'approved': 'Aprobada',
      'rejected': 'Rechazada',
      'modified': 'Aprobada con cambios'
    }
    return labels[status] || status
  }

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'modified': 'bg-blue-100 text-blue-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
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
        <h1 className="text-3xl font-bold text-gray-900">Mis Propuestas de Tareas</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Propuesta
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded flex items-start gap-3">
        <Lightbulb size={20} className="mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium">¿Tienes una idea para una nueva tarea?</p>
          <p className="mt-1">Propón tareas que crees que deberían realizarse. Los administradores las revisarán y podrán aprobarlas, modificarlas o rechazarlas.</p>
        </div>
      </div>

      {/* Lista de propuestas */}
      <div className="space-y-4">
        {proposals.length === 0 ? (
          <div className="card text-center py-12">
            <Lightbulb size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Aún no has creado ninguna propuesta</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary mt-4 mx-auto"
            >
              Crear tu primera propuesta
            </button>
          </div>
        ) : (
          proposals.map(proposal => (
            <div key={proposal.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(proposal.status)}
                    <h3 className="text-lg font-semibold text-gray-900">{proposal.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(proposal.status)}`}>
                      {getStatusLabel(proposal.status)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{proposal.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Frecuencia:</span>
                      <span className="ml-2 font-medium">{getFrequencyLabel(proposal.frequency)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Recompensa sugerida:</span>
                      <span className="ml-2 font-medium text-green-600">+{proposal.suggested_reward}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Enviada:</span>
                      <span className="ml-2 font-medium">{new Date(proposal.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {proposal.message_to_admin && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 mb-1">Mensaje para el administrador:</p>
                      <p className="text-sm text-gray-700 italic">"{proposal.message_to_admin}"</p>
                    </div>
                  )}

                  {/* Respuesta del admin */}
                  {proposal.status !== 'pending' && (
                    <div className={`mt-4 p-4 rounded border-l-4 ${
                      proposal.status === 'approved' || proposal.status === 'modified'
                        ? 'bg-green-50 border-green-400'
                        : 'bg-red-50 border-red-400'
                    }`}>
                      <p className="text-sm font-medium mb-2">
                        {proposal.status === 'approved' && '✅ Propuesta aprobada'}
                        {proposal.status === 'modified' && '✏️ Propuesta aprobada con modificaciones'}
                        {proposal.status === 'rejected' && '❌ Propuesta rechazada'}
                      </p>

                      {proposal.status === 'modified' && (
                        <div className="text-sm space-y-1 mb-2">
                          <p><strong>Título final:</strong> {proposal.final_title}</p>
                          <p><strong>Descripción final:</strong> {proposal.final_description}</p>
                          <p><strong>Recompensa final:</strong> <span className="text-green-600">+{proposal.final_reward}</span></p>
                        </div>
                      )}

                      {proposal.admin_notes && (
                        <div className="text-sm text-gray-700 mt-2">
                          <strong>Nota del administrador:</strong> {proposal.admin_notes}
                        </div>
                      )}

                      {proposal.reviewed_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Revisada el {new Date(proposal.reviewed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear Propuesta */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Proponer Nueva Tarea</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateProposal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título de la tarea *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    placeholder="Ej: Ordenar mi habitación"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Describe en qué consiste la tarea..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frecuencia *
                    </label>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recompensa sugerida *
                    </label>
                    <input
                      type="number"
                      value={formData.suggested_reward}
                      onChange={(e) => setFormData({ ...formData, suggested_reward: parseInt(e.target.value) })}
                      className="input"
                      min="1"
                      placeholder="Créditos"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje para el administrador
                  </label>
                  <textarea
                    value={formData.message_to_admin}
                    onChange={(e) => setFormData({ ...formData, message_to_admin: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="¿Por qué crees que esta tarea debería aprobarse? (opcional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Explica por qué esta tarea es importante y por qué merece la recompensa que propones
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    <Save size={20} className="inline mr-2" />
                    Enviar Propuesta
                  </button>
                  <button type="button" onClick={closeModal} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

