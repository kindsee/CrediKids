import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService, iconsService } from '../services'
import { useAuthStore } from '../store/authStore'
import { Lock, Check, X, AlertCircle } from 'lucide-react'

export default function ChangePinPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [icons, setIcons] = useState([])
  const [step, setStep] = useState(1) // 1: PIN actual, 2: nuevo PIN, 3: confirmar nuevo PIN
  const [oldPin, setOldPin] = useState([])
  const [newPin, setNewPin] = useState([])
  const [confirmPin, setConfirmPin] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingIcons, setLoadingIcons] = useState(true)
  
  useEffect(() => {
    loadIcons()
  }, [])
  
  const loadIcons = async () => {
    try {
      setLoadingIcons(true)
      const data = await iconsService.getIcons()
      console.log('Iconos cargados:', data)
      setIcons(data)
      setError('')
    } catch (error) {
      console.error('Error al cargar los iconos:', error)
      setError('Error al cargar los iconos. Por favor, recarga la página.')
    } finally {
      setLoadingIcons(false)
    }
  }
  
  const handleIconClick = (iconId) => {
    if (step === 1) {
      if (oldPin.includes(iconId)) {
        setOldPin(oldPin.filter(id => id !== iconId))
      } else if (oldPin.length < 4) {
        setOldPin([...oldPin, iconId])
      }
    } else if (step === 2) {
      if (newPin.includes(iconId)) {
        setNewPin(newPin.filter(id => id !== iconId))
      } else if (newPin.length < 4) {
        setNewPin([...newPin, iconId])
      }
    } else if (step === 3) {
      if (confirmPin.includes(iconId)) {
        setConfirmPin(confirmPin.filter(id => id !== iconId))
      } else if (confirmPin.length < 4) {
        setConfirmPin([...confirmPin, iconId])
      }
    }
    setError('')
  }
  
  const handleNextStep = () => {
    if (step === 1) {
      if (oldPin.length !== 4) {
        setError('Debes seleccionar exactamente 4 iconos')
        return
      }
      setStep(2)
      setError('')
    } else if (step === 2) {
      if (newPin.length !== 4) {
        setError('Debes seleccionar exactamente 4 iconos para el nuevo PIN')
        return
      }
      if (JSON.stringify(oldPin) === JSON.stringify(newPin)) {
        setError('El nuevo PIN debe ser diferente al actual')
        return
      }
      setStep(3)
      setError('')
    }
  }
  
  const handleSubmit = async () => {
    if (confirmPin.length !== 4) {
      setError('Debes confirmar seleccionando 4 iconos')
      return
    }
    
    if (JSON.stringify(newPin) !== JSON.stringify(confirmPin)) {
      setError('Los nuevos PINs no coinciden. Inténtalo de nuevo.')
      setStep(2)
      setNewPin([])
      setConfirmPin([])
      return
    }
    
    setLoading(true)
    setError('')
    
    console.log('Enviando cambio de PIN:')
    console.log('Old PIN:', oldPin)
    console.log('New PIN:', newPin)
    
    try {
      await authService.changePin(oldPin, newPin)
      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Error al cambiar PIN:', error)
      console.error('Respuesta del servidor:', error.response?.data)
      console.error('Status:', error.response?.status)
      console.error('Headers:', error.response?.headers)
      const errorMsg = error.response?.data?.msg || error.response?.data?.error || 'Error al cambiar el PIN. Verifica que tu PIN actual sea correcto.'
      setError(errorMsg)
      setStep(1)
      setOldPin([])
      setNewPin([])
      setConfirmPin([])
    } finally {
      setLoading(false)
    }
  }
  
  const getCurrentPin = () => {
    if (step === 1) return oldPin
    if (step === 2) return newPin
    return confirmPin
  }
  
  const getStepTitle = () => {
    if (step === 1) return 'Ingresa tu PIN actual'
    if (step === 2) return 'Selecciona tu nuevo PIN'
    return 'Confirma tu nuevo PIN'
  }
  
  const getStepDescription = () => {
    if (step === 1) return 'Selecciona los 4 iconos de tu PIN actual en orden'
    if (step === 2) return 'Elige 4 iconos para tu nuevo PIN'
    return 'Vuelve a seleccionar los mismos 4 iconos para confirmar'
  }
  
  const canContinue = () => {
    if (step === 1) return oldPin.length === 4
    if (step === 2) return newPin.length === 4
    return confirmPin.length === 4
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="card max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡PIN Cambiado!</h2>
          <p className="text-gray-600">
            Tu PIN se ha actualizado correctamente. Redirigiendo al dashboard...
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <Lock size={24} className="text-primary-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Cambiar PIN</h1>
                  <p className="text-sm text-gray-600">{user?.nick}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
            
            {/* Progress */}
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`h-2 rounded-full flex-1 ${s <= step ? 'bg-primary-600' : 'bg-gray-200'}`} />
                  {s < 3 && <div className="w-2" />}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>PIN actual</span>
              <span>Nuevo PIN</span>
              <span>Confirmar</span>
            </div>
          </div>
          
          {/* Step title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{getStepTitle()}</h2>
            <p className="text-gray-600">{getStepDescription()}</p>
          </div>
          
          {/* Selected icons */}
          <div className="flex justify-center space-x-4 mb-6">
            {[0, 1, 2, 3].map((index) => {
              const currentPin = getCurrentPin()
              const selectedIcon = currentPin[index]
              const icon = icons.find(i => i.id === selectedIcon)
              
              return (
                <div
                  key={index}
                  className={`w-20 h-20 rounded-2xl border-4 flex items-center justify-center text-4xl transition-all ${
                    icon
                      ? 'border-primary-600 bg-primary-50 scale-105 shadow-lg'
                      : 'border-dashed border-gray-300 bg-gray-50'
                  }`}
                >
                  {icon ? icon.icon_path : '?'}
                </div>
              )
            })}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          {/* Loading icons */}
          {loadingIcons && (
            <div className="mb-6 text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 mt-4">Cargando iconos...</p>
            </div>
          )}
          
          {/* No icons message */}
          {!loadingIcons && icons.length === 0 && !error && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-sm text-yellow-800">
                No se encontraron iconos. Por favor, asegúrate de que los iconos estén inicializados en el sistema.
              </p>
            </div>
          )}
          
          {/* Icons grid */}
          {!loadingIcons && icons.length > 0 && (
            <div className="grid grid-cols-5 gap-3 mb-6">
              {icons.map((icon) => {
                const currentPin = getCurrentPin()
                const isSelected = currentPin.includes(icon.id)
                const selectionIndex = currentPin.indexOf(icon.id)
              
              return (
                <button
                  key={icon.id}
                  onClick={() => handleIconClick(icon.id)}
                  disabled={loading}
                  className={`aspect-square rounded-xl border-2 text-4xl flex items-center justify-center transition-all relative ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 scale-105 shadow-md'
                      : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                >
                  {icon.icon_path}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {selectionIndex + 1}
                    </div>
                  )}
                </button>
              )
            })}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-between">
            {step > 1 && (
              <button
                onClick={() => {
                  setStep(step - 1)
                  if (step === 2) setNewPin([])
                  if (step === 3) setConfirmPin([])
                  setError('')
                }}
                className="btn-secondary"
                disabled={loading}
              >
                Atrás
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={handleNextStep}
                className={`btn-primary ${step === 1 ? 'ml-auto' : ''}`}
                disabled={!canContinue() || loading}
              >
                Continuar
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="btn-primary ml-auto"
                disabled={!canContinue() || loading}
              >
                {loading ? 'Cambiando PIN...' : 'Cambiar PIN'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
