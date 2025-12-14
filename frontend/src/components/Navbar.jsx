import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { LogOut, User, Key, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="px-4 md:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl md:text-2xl font-bold text-primary-600">CrediKids</h1>
        </div>
        
        <div className="flex items-center space-x-3 md:space-x-6">
          {/* Score del usuario */}
          <div className="flex items-center space-x-2 bg-primary-50 px-3 md:px-4 py-2 rounded-lg">
            <span className="text-xl md:text-2xl">💎</span>
            <div>
              <p className="text-xs text-gray-600 hidden md:block">Créditos</p>
              <p className="text-base md:text-lg font-bold text-primary-700">{user?.score || 0}</p>
            </div>
          </div>
          
          {/* User menu dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <div className="text-right hidden md:block">
                <p className="font-medium text-gray-800 text-sm">{user?.nick}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-xl">{user?.figure || '👤'}</span>
              </div>
              <ChevronDown size={16} className="text-gray-600" />
            </button>
            
            {/* Dropdown menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                    <p className="font-medium text-gray-800">{user?.nick}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate('/change-pin')
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-gray-700"
                  >
                    <Key size={18} />
                    <span>Cambiar PIN</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      logout()
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-red-600"
                  >
                    <LogOut size={18} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
