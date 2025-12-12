import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authService, iconsService } from '../services'

export default function LoginPage() {
  const [selectedIcons, setSelectedIcons] = useState([])
  const [icons, setIcons] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  
  useEffect(() => {
    loadIcons()
  }, [])
  
  const loadIcons = async () => {
    try {
      const data = await iconsService.getIcons()
      if (data.length === 0) {
        // Si no hay iconos, crearlos
        await iconsService.seedIcons()
        const newData = await iconsService.getIcons()
        setIcons(newData)
      } else {
        setIcons(data)
      }
    } catch (err) {
      console.error('Error loading icons:', err)
    }
  }
  
  const handleIconClick = (iconId) => {
    if (selectedIcons.includes(iconId)) {
      setSelectedIcons(selectedIcons.filter(id => id !== iconId))
    } else if (selectedIcons.length < 4) {
      setSelectedIcons([...selectedIcons, iconId])
    }
  }
  
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    if (selectedIcons.length !== 4) {
      setError('Debes seleccionar exactamente 4 iconos')
      return
    }
    
    setLoading(true)
    
    try {
      const data = await authService.login(selectedIcons)
      setAuth(data.user, data.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Código de iconos incorrecto')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">CrediKids</h1>
          <p className="text-gray-600">Ingresa con tu código de iconos</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Código de iconos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Acceso (selecciona 4 iconos)
            </label>
            
            {/* Iconos seleccionados */}
            <div className="flex justify-center space-x-4 mb-4 p-4 bg-gray-50 rounded-lg min-h-[80px]">
              {selectedIcons.map((iconId, index) => {
                const icon = icons.find(i => i.id === iconId)
                return (
                  <div
                    key={index}
                    className="w-16 h-16 flex items-center justify-center text-4xl bg-white rounded-lg shadow-md"
                  >
                    {icon?.icon_path}
                  </div>
                )
              })}
              {[...Array(4 - selectedIcons.length)].map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-lg border-2 border-dashed border-gray-400"
                >
                  <span className="text-gray-400 text-2xl">?</span>
                </div>
              ))}
            </div>
            
            {/* Grid de iconos disponibles */}
            <div className="grid grid-cols-5 gap-3 max-h-80 overflow-y-auto p-2">
              {icons.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => handleIconClick(icon.id)}
                  className={`w-full aspect-square flex items-center justify-center text-3xl rounded-lg border-2 transition-all ${
                    selectedIcons.includes(icon.id)
                      ? 'border-primary-600 bg-primary-50 scale-95'
                      : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                  }`}
                  title={icon.name}
                >
                  {icon.icon_path}
                </button>
              ))}
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
