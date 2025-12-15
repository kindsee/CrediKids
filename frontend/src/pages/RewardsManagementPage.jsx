import { useState, useEffect } from 'react'
import { rewardsService, usersService } from '../services'
import { Gift, Plus, Edit2, Trash2, Check, X, AlertCircle, Package, History, Filter } from 'lucide-react'

export default function RewardsManagementPage() {
  const [rewards, setRewards] = useState([])
  const [pendingRedemptions, setPendingRedemptions] = useState([])
  const [historyData, setHistoryData] = useState({ redemptions: [], users: [], filters: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('rewards') // rewards, pending, history
  
  // Filtros de historial
  const [filterUserId, setFilterUserId] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [editingReward, setEditingReward] = useState(null)
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    icon: '🎁',
    credit_cost: 0,
    stock: null
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      if (activeTab === 'rewards') {
        const data = await rewardsService.getRewards()
        setRewards(data)
      } else if (activeTab === 'pending') {
        const data = await rewardsService.getPendingRedemptions()
        setPendingRedemptions(data)
      } else if (activeTab === 'history') {
        const filters = {}
        if (filterUserId) filters.user_id = filterUserId
        if (filterStartDate) filters.start_date = filterStartDate
        if (filterEndDate) filters.end_date = filterEndDate
        
        const data = await rewardsService.getRedemptionsHistory(filters)
        setHistoryData(data)
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }
  
  const handleFilterChange = () => {
    if (activeTab === 'history') {
      loadData()
    }
  }

  const handleCreateReward = () => {
    setEditingReward(null)
    setRewardForm({
      name: '',
      description: '',
      icon: '🎁',
      credit_cost: 0,
      stock: null
    })
    setShowRewardModal(true)
  }

  const handleEditReward = (reward) => {
    setEditingReward(reward)
    setRewardForm({
      name: reward.name,
      description: reward.description || '',
      icon: reward.icon || '🎁',
      credit_cost: reward.credit_cost,
      stock: reward.stock
    })
    setShowRewardModal(true)
  }

  const handleSaveReward = async () => {
    setError('')
    setSuccess('')
    try {
      if (editingReward) {
        await rewardsService.updateReward(editingReward.id, rewardForm)
        setSuccess('Premio actualizado exitosamente')
      } else {
        await rewardsService.createReward(rewardForm)
        setSuccess('Premio creado exitosamente')
      }
      setShowRewardModal(false)
      loadData()
    } catch (error) {
      setError(error.response?.data?.error || 'Error al guardar premio')
    }
  }

  const handleDeleteReward = async (rewardId) => {
    if (!confirm('¿Estás seguro de eliminar este premio?')) return
    
    setError('')
    setSuccess('')
    try {
      await rewardsService.deleteReward(rewardId)
      setSuccess('Premio eliminado exitosamente')
      loadData()
    } catch (error) {
      setError(error.response?.data?.error || 'Error al eliminar premio')
    }
  }

  const handleApprove = async (redemptionId) => {
    setError('')
    setSuccess('')
    try {
      await rewardsService.approveRedemption(redemptionId)
      setSuccess('Solicitud aprobada exitosamente')
      loadData()
    } catch (error) {
      setError(error.response?.data?.error || 'Error al aprobar')
    }
  }

  const handleReject = async (redemptionId) => {
    const reason = prompt('Motivo del rechazo (opcional):')
    if (reason === null) return // Usuario canceló
    
    setError('')
    setSuccess('')
    try {
      await rewardsService.rejectRedemption(redemptionId, reason)
      setSuccess('Solicitud rechazada')
      loadData()
    } catch (error) {
      setError(error.response?.data?.error || 'Error al rechazar')
    }
  }

  const iconOptions = ['🎁', '🎮', '🍕', '🍿', '🎬', '📚', '🎨', '⚽', '🎵', '🍦', '🎂', '🧸', '🎪', '🎯', '🏆']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Premios</h1>
        <button
          onClick={handleCreateReward}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Premio
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'rewards'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Gift size={20} />
            Premios Disponibles
          </div>
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'pending'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package size={20} />
            Solicitudes Pendientes
            {pendingRedemptions.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {pendingRedemptions.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <History size={20} />
            Historial Completo
          </div>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      ) : (
        <>
          {activeTab === 'rewards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map(reward => (
                <div key={reward.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{reward.icon}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditReward(reward)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteReward(reward.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{reward.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-lg font-bold text-blue-600">
                      {reward.credit_cost} créditos
                    </span>
                    {reward.stock !== null && (
                      <span className="text-sm text-gray-500">
                        Stock: {reward.stock}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingRedemptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay solicitudes pendientes
                </div>
              ) : (
                pendingRedemptions.map(redemption => (
                  <div key={redemption.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-4xl">{redemption.reward?.icon || '🎁'}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{redemption.reward?.name}</h3>
                            <span className="text-2xl">{redemption.user?.figure}</span>
                            <span className="text-gray-600">{redemption.user?.nick}</span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            Solicitado: {new Date(redemption.redeemed_at).toLocaleString()}
                          </p>
                          {redemption.notes && (
                            <p className="text-gray-700 text-sm bg-gray-50 p-2 rounded">
                              Nota: {redemption.notes}
                            </p>
                          )}
                          <p className="text-blue-600 font-bold mt-2">
                            Costo: {redemption.credits_spent} créditos
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(redemption.id)}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Check size={18} />
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(redemption.id)}
                          className="btn-danger flex items-center gap-2"
                        >
                          <X size={18} />
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="card">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Filter size={20} />
                  Filtros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuario
                    </label>
                    <select
                      value={filterUserId}
                      onChange={(e) => setFilterUserId(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">Todos los usuarios</option>
                      {historyData.users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.figure} {user.nick}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="input w-full"
                    />
                  </div>
                </div>
                <button
                  onClick={handleFilterChange}
                  className="btn-primary mt-4"
                >
                  Aplicar Filtros
                </button>
              </div>

              {/* Tabla de historial */}
              {historyData.redemptions.length === 0 ? (
                <div className="card text-center py-8 text-gray-500">
                  No hay transacciones en el rango seleccionado
                </div>
              ) : (
                <div className="card overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Usuario</th>
                        <th className="text-left py-3 px-4">Premio</th>
                        <th className="text-left py-3 px-4">Créditos</th>
                        <th className="text-left py-3 px-4">Estado</th>
                        <th className="text-left py-3 px-4">Fecha Solicitud</th>
                        <th className="text-left py-3 px-4">Fecha Aprobación</th>
                        <th className="text-left py-3 px-4">Aprobado Por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.redemptions.map(redemption => {
                        const getStatusBadge = (status) => {
                          const badges = {
                            pending: { text: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
                            approved: { text: 'Aprobado', className: 'bg-green-100 text-green-800' },
                            rejected: { text: 'Rechazado', className: 'bg-red-100 text-red-800' }
                          }
                          const badge = badges[status] || badges.pending
                          return (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                              {badge.text}
                            </span>
                          )
                        }
                        
                        return (
                          <tr key={redemption.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{redemption.user?.figure}</span>
                                <span className="font-medium">{redemption.user?.nick}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{redemption.reward?.icon}</span>
                                <span>{redemption.reward?.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-blue-600">{redemption.credits_spent}</span>
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(redemption.status)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {new Date(redemption.redeemed_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {redemption.approved_at 
                                ? new Date(redemption.approved_at).toLocaleDateString() 
                                : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {redemption.approved_by_id || '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Crear/Editar Premio */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingReward ? 'Editar Premio' : 'Nuevo Premio'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icono
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setRewardForm({ ...rewardForm, icon })}
                      className={`text-2xl p-2 rounded hover:bg-gray-100 ${
                        rewardForm.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  className="input w-full"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo en Créditos
                </label>
                <input
                  type="number"
                  value={rewardForm.credit_cost}
                  onChange={(e) => setRewardForm({ ...rewardForm, credit_cost: parseInt(e.target.value) })}
                  className="input w-full"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock (dejar vacío para ilimitado)
                </label>
                <input
                  type="number"
                  value={rewardForm.stock || ''}
                  onChange={(e) => setRewardForm({ ...rewardForm, stock: e.target.value ? parseInt(e.target.value) : null })}
                  className="input w-full"
                  min="0"
                  placeholder="Ilimitado"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveReward} className="btn-primary flex-1">
                {editingReward ? 'Actualizar' : 'Crear'}
              </button>
              <button onClick={() => setShowRewardModal(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
