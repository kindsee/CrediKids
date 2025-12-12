import { useState, useEffect } from 'react'
import { Users as UsersIcon, UserPlus, Edit2, Power, Save, X } from 'lucide-react'
import { usersService, iconsService } from '../services'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [icons, setIcons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    nick: '',
    figure: '👤',
    role: 'user',
    icon_codes: []
  })

  useEffect(() => {
    loadUsers()
    loadIcons()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await usersService.getUsers()
      setUsers(data)
    } catch (err) {
      setError('Error al cargar usuarios')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadIcons = async () => {
    try {
      const data = await iconsService.getIcons()
      setIcons(data)
    } catch (err) {
      console.error('Error loading icons:', err)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setModalError('')
    if (formData.icon_codes.length !== 4) {
      setModalError('Debes seleccionar exactamente 4 iconos')
      return
    }

    try {
      await usersService.createUser(formData)
      setShowCreateModal(false)
      resetForm()
      loadUsers()
    } catch (err) {
      setModalError(err.response?.data?.error || 'Error al crear usuario')
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    setModalError('')
    if (formData.icon_codes.length > 0 && formData.icon_codes.length !== 4) {
      setModalError('Debes seleccionar exactamente 4 iconos o dejar vacío para no cambiar')
      return
    }

    try {
      const updateData = { ...formData }
      if (updateData.icon_codes.length === 0) {
        delete updateData.icon_codes
      }
      
      await usersService.updateUser(editingUser.id, updateData)
      setEditingUser(null)
      resetForm()
      loadUsers()
    } catch (err) {
      setModalError(err.response?.data?.error || 'Error al actualizar usuario')
    }
  }

  const handleToggleActive = async (userId, currentStatus) => {
    const action = currentStatus ? 'desactivar' : 'activar'
    if (!confirm(`¿Estás seguro de ${action} este usuario?`)) return

    try {
      await usersService.toggleUserActive(userId)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.error || `Error al ${action} usuario`)
    }
  }

  const handleIconClick = (iconId) => {
    if (formData.icon_codes.includes(iconId)) {
      setFormData({
        ...formData,
        icon_codes: formData.icon_codes.filter(id => id !== iconId)
      })
    } else if (formData.icon_codes.length < 4) {
      setFormData({
        ...formData,
        icon_codes: [...formData.icon_codes, iconId]
      })
    }
  }

  const resetForm = () => {
    setFormData({
      nick: '',
      figure: '👤',
      role: 'user',
      icon_codes: []
    })
    setError('')
  }

  const openEditModal = (user) => {
    setEditingUser(user)
    setFormData({
      nick: user.nick,
      figure: user.figure,
      role: user.role,
      icon_codes: []
    })
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setEditingUser(null)
    setModalError('')
    resetForm()
  }

  const emojis = ['👤', '👨', '👩', '👦', '👧', '🧒', '👶', '👨‍💼', '👩‍💼', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑', '🧔', '🧓', '👴', '👵']

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
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={20} />
          Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Figura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créditos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className={`hover:bg-gray-50 ${!user.is_active ? 'opacity-50 bg-gray-100' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${user.is_active ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                      {user.nick}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-2xl">{user.figure}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.score}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Editar usuario"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
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

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Crear Nuevo Usuario</h2>
                <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nick</label>
                  <input
                    type="text"
                    value={formData.nick}
                    onChange={(e) => setFormData({ ...formData, nick: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Figura (emoji)</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, figure: emoji })}
                        className={`text-3xl p-2 rounded border-2 ${
                          formData.figure === emoji 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN de Acceso (selecciona 4 iconos): {formData.icon_codes.length}/4
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {icons.map(icon => (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => handleIconClick(icon.id)}
                        className={`p-3 text-4xl rounded border-2 transition-all ${
                          formData.icon_codes.includes(icon.id)
                            ? 'border-blue-500 bg-blue-50 scale-110'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {icon.icon_path}
                        {formData.icon_codes.includes(icon.id) && (
                          <div className="text-xs text-blue-600 mt-1">
                            #{formData.icon_codes.indexOf(icon.id) + 1}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    <Save size={20} className="inline mr-2" />
                    Crear Usuario
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

      {/* Modal Editar Usuario */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Editar Usuario</h2>
                <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nick</label>
                  <input
                    type="text"
                    value={formData.nick}
                    onChange={(e) => setFormData({ ...formData, nick: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Figura (emoji)</label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, figure: emoji })}
                        className={`text-3xl p-2 rounded border-2 ${
                          formData.figure === emoji 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cambiar PIN (opcional - selecciona 4 iconos o deja vacío): {formData.icon_codes.length}/4
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {icons.map(icon => (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => handleIconClick(icon.id)}
                        className={`p-3 text-4xl rounded border-2 transition-all ${
                          formData.icon_codes.includes(icon.id)
                            ? 'border-blue-500 bg-blue-50 scale-110'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {icon.icon_path}
                        {formData.icon_codes.includes(icon.id) && (
                          <div className="text-xs text-blue-600 mt-1">
                            #{formData.icon_codes.indexOf(icon.id) + 1}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
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
    </div>
  )
}
