import { useState, useEffect } from 'react'
import { rewardsService, authService } from '../services'
import { useAuthStore } from '../store/authStore'
import { Gift, Lock, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

export default function RewardsPage() {
  const { user, updateUser } = useAuthStore()
  const [rewards, setRewards] = useState([])
  const [myRedemptions, setMyRedemptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('catalog') // catalog, my-requests
  const [availableCredits, setAvailableCredits] = useState(0)
  const [pendingCredits, setPendingCredits] = useState(0)
  
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [selectedReward, setSelectedReward] = useState(null)
  const [redeemNotes, setRedeemNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [activeTab])
  
  useEffect(() => {
    calculateAvailableCredits()
  }, [user, myRedemptions])
  
  const calculateAvailableCredits = () => {
    if (!user) return
    
    // Calcular créditos en solicitudes pendientes
    const pending = myRedemptions
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.credits_spent, 0)
    
    setPendingCredits(pending)
    setAvailableCredits(user.score - pending)
  }

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      if (activeTab === 'catalog') {
        const data = await rewardsService.getRewards()
        setRewards(data.filter(r => r.is_active))
      }
      
      // Siempre cargar redemptions para calcular créditos disponibles
      const redemptionsData = await rewardsService.getRedemptions()
      setMyRedemptions(redemptionsData)
    } catch (error) {
      setError(error.response?.data?.error || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestRedeem = (reward) => {
    setSelectedReward(reward)
    setRedeemNotes('')
    setShowRedeemModal(true)
  }

  const handleRedeem = async () => {
    setError('')
    setSuccess('')
    try {
      await rewardsService.redeemReward(selectedReward.id, redeemNotes)
      setSuccess('¡Solicitud de canje enviada! El administrador la revisará pronto.')
      setShowRedeemModal(false)
      
      // Actualizar datos del usuario
      const userData = await authService.getCurrentUser()
      updateUser(userData)
      
      // Recargar lista
      await loadData()
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al solicitar canje'
      
      // Mostrar detalles si es error de créditos insuficientes
      if (error.response?.data?.available_credits !== undefined) {
        const data = error.response.data
        setError(`${errorMsg}. Tienes ${data.total_credits} créditos, pero ${data.pending_credits} están reservados en solicitudes pendientes. Disponibles: ${data.available_credits}.`)
      } else {
        setError(errorMsg)
      }
    }
  }

  const canAfford = (cost) => availableCredits >= cost

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: <Clock size={16} />,
        text: 'Pendiente',
        className: 'bg-yellow-100 text-yellow-800'
      },
      approved: {
        icon: <CheckCircle size={16} />,
        text: 'Aprobado',
        className: 'bg-green-100 text-green-800'
      },
      rejected: {
        icon: <XCircle size={16} />,
        text: 'Rechazado',
        className: 'bg-red-100 text-red-800'
      }
    }
    
    const badge = badges[status] || badges.pending
    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.icon}
        {badge.text}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Premios</h1>
          <div className="mt-1">
            <p className="text-gray-600">
              Créditos totales: <span className="font-bold text-gray-900">{user?.score || 0}</span>
            </p>
            {pendingCredits > 0 && (
              <p className="text-gray-600 text-sm">
                En solicitudes pendientes: <span className="font-bold text-yellow-600">{pendingCredits}</span>
              </p>
            )}
            <p className="text-gray-600">
              Disponibles: <span className="font-bold text-blue-600">{availableCredits}</span>
            </p>
          </div>
        </div>
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
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'catalog'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Gift size={20} />
            Catálogo
          </div>
        </button>
        <button
          onClick={() => setActiveTab('my-requests')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'my-requests'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock size={20} />
            Mis Solicitudes
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
          {activeTab === 'catalog' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map(reward => {
                const affordable = canAfford(reward.credit_cost)
                const outOfStock = reward.available_stock !== null && reward.available_stock <= 0
                
                return (
                  <div 
                    key={reward.id} 
                    className={`card ${!affordable || outOfStock ? 'opacity-60' : ''}`}
                  >
                    <div className="text-center mb-3">
                      <div className="text-5xl mb-2">{reward.icon}</div>
                      <h3 className="font-bold text-lg">{reward.name}</h3>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
                    
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-blue-600">
                          {reward.credit_cost} créditos
                        </span>
                        {reward.stock !== null && (
                          <span className={`text-sm font-medium ${
                            reward.available_stock <= 0 ? 'text-red-600' : 
                            reward.available_stock <= 2 ? 'text-orange-600' : 
                            'text-gray-600'
                          }`}>
                            Disponible: {reward.available_stock}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleRequestRedeem(reward)}
                        disabled={!affordable || outOfStock}
                        className={`w-full py-2 px-4 rounded font-medium transition ${
                          affordable && !outOfStock
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {outOfStock ? (
                          'Sin Stock'
                        ) : affordable ? (
                          'Solicitar'
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Lock size={16} />
                            Te faltan {reward.credit_cost - availableCredits} créditos
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
              
              {rewards.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No hay premios disponibles
                </div>
              )}
            </div>
          )}

          {activeTab === 'my-requests' && (
            <div className="space-y-4">
              {myRedemptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No has solicitado ningún premio aún
                </div>
              ) : (
                myRedemptions.map(redemption => (
                  <div key={redemption.id} className="card">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{redemption.reward?.icon || '🎁'}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-lg">{redemption.reward?.name}</h3>
                          {getStatusBadge(redemption.status)}
                        </div>
                        <p className="text-gray-600 text-sm mb-1">
                          Solicitado: {new Date(redemption.redeemed_at).toLocaleString()}
                        </p>
                        {redemption.approved_at && (
                          <p className="text-gray-600 text-sm mb-1">
                            {redemption.status === 'approved' ? 'Aprobado' : 'Procesado'}: {new Date(redemption.approved_at).toLocaleString()}
                          </p>
                        )}
                        <p className="text-blue-600 font-bold">
                          {redemption.credits_spent} créditos
                        </p>
                        {redemption.notes && (
                          <p className="text-gray-700 text-sm bg-gray-50 p-2 rounded mt-2">
                            Nota: {redemption.notes}
                          </p>
                        )}
                        {redemption.status === 'rejected' && redemption.rejection_reason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-red-800 text-sm font-medium">
                              Motivo del rechazo: {redemption.rejection_reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Solicitar Premio */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">{selectedReward.icon}</div>
              <h2 className="text-2xl font-bold">{selectedReward.name}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded">
                <p className="text-gray-700 mb-2">{selectedReward.description}</p>
                <p className="text-blue-600 font-bold text-lg">
                  Costo: {selectedReward.credit_cost} créditos
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Te quedarán: {availableCredits - selectedReward.credit_cost} créditos disponibles
                </p>
                {pendingCredits > 0 && (
                  <p className="text-yellow-600 text-sm">
                    (Tienes {pendingCredits} créditos en solicitudes pendientes)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nota adicional (opcional)
                </label>
                <textarea
                  value={redeemNotes}
                  onChange={(e) => setRedeemNotes(e.target.value)}
                  className="input w-full"
                  rows="3"
                  placeholder="Añade información adicional para el administrador..."
                />
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Tu solicitud será revisada por un administrador. Los créditos se descontarán una vez aprobada.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleRedeem} className="btn-primary flex-1">
                Enviar Solicitud
              </button>
              <button onClick={() => setShowRedeemModal(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

