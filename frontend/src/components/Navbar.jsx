import { useAuthStore } from '../store/authStore'
import { LogOut, User, Key } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  
  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-primary-600">CrediKids</h1>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Score del usuario */}
          <div className="flex items-center space-x-2 bg-primary-50 px-4 py-2 rounded-lg">
            <span className="text-2xl">💎</span>
            <div>
              <p className="text-xs text-gray-600">Créditos</p>
              <p className="text-lg font-bold text-primary-700">{user?.score || 0}</p>
            </div>
          </div>
          
          {/* Info del usuario */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="font-medium text-gray-800">{user?.nick}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-xl">{user?.figure || '👤'}</span>
            </div>
          </div>
          
          {/* Botón de cambiar PIN */}
          <button
            onClick={() => navigate('/change-pin')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cambiar PIN"
          >
            <Key size={20} className="text-gray-600" />
          </button>
          
          {/* Botón de logout */}
          <button
            onClick={logout}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
    </nav>
  )
}
