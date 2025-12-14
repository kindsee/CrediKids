import { useState, useEffect } from 'react'
import { tasksService, usersService } from '../services'
import { useAuthStore } from '../store/authStore'

export default function TaskAssignmentPage() {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    task_id: '',
    user_ids: [],
    start_date: '',
    end_date: '',
    frequency: 'daily',
    weekdays: [0, 1, 2, 3, 4], // Lun-Vie por defecto
    times_per_day: 1,
    weekday: 0, // Para semanal
    weeks: [1, 2, 3, 4],
    day_of_month: 1,
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  })

  const weekdayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tasksData, usersData] = await Promise.all([
        tasksService.getTasks(),
        usersService.getUsers()
      ])
      setTasks(tasksData.filter(t => t.status === 'active'))
      setUsers(usersData.filter(u => u.is_active && u.role !== 'admin'))
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error.response?.data?.error || 'Error al cargar datos')
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      if (name === 'user_ids') {
        const userId = parseInt(value)
        setFormData(prev => ({
          ...prev,
          user_ids: checked 
            ? [...prev.user_ids, userId]
            : prev.user_ids.filter(id => id !== userId)
        }))
      } else if (name === 'weekdays') {
        const day = parseInt(value)
        setFormData(prev => ({
          ...prev,
          weekdays: checked
            ? [...prev.weekdays, day]
            : prev.weekdays.filter(d => d !== day)
        }))
      } else if (name === 'weeks') {
        const week = parseInt(value)
        setFormData(prev => ({
          ...prev,
          weeks: checked
            ? [...prev.weeks, week]
            : prev.weeks.filter(w => w !== week)
        }))
      } else if (name === 'months') {
        const month = parseInt(value)
        setFormData(prev => ({
          ...prev,
          months: checked
            ? [...prev.months, month]
            : prev.months.filter(m => m !== month)
        }))
      }
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
    } else if (name === 'weekday' || name === 'day_of_month') {
      // Convertir a número para campos específicos
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const toggleAllUsers = () => {
    if (formData.user_ids.length === users.length) {
      setFormData(prev => ({ ...prev, user_ids: [] }))
    } else {
      setFormData(prev => ({ ...prev, user_ids: users.map(u => u.id) }))
    }
  }

  const toggleAllWeekdays = () => {
    if (formData.weekdays.length === 7) {
      setFormData(prev => ({ ...prev, weekdays: [] }))
    } else {
      setFormData(prev => ({ ...prev, weekdays: [0, 1, 2, 3, 4, 5, 6] }))
    }
  }

  const toggleAllWeeks = () => {
    if (formData.weeks.length === 4) {
      setFormData(prev => ({ ...prev, weeks: [] }))
    } else {
      setFormData(prev => ({ ...prev, weeks: [1, 2, 3, 4] }))
    }
  }

  const toggleAllMonths = () => {
    if (formData.months.length === 12) {
      setFormData(prev => ({ ...prev, months: [] }))
    } else {
      setFormData(prev => ({ ...prev, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validaciones
    if (!formData.task_id) {
      setError('Debes seleccionar una tarea')
      return
    }

    if (formData.user_ids.length === 0) {
      setError('Debes seleccionar al menos un usuario')
      return
    }

    if (!formData.start_date || !formData.end_date) {
      setError('Debes seleccionar fechas de inicio y fin')
      return
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin')
      return
    }

    if (formData.frequency === 'daily' && formData.weekdays.length === 0) {
      setError('Debes seleccionar al menos un día de la semana')
      return
    }

    if (formData.frequency === 'weekly' && formData.weeks.length === 0) {
      setError('Debes seleccionar al menos una semana')
      return
    }

    if (formData.frequency === 'monthly' && formData.months.length === 0) {
      setError('Debes seleccionar al menos un mes')
      return
    }

    setLoading(true)

    try {
      // Preparar datos asegurando que los números sean números
      const dataToSend = {
        task_id: parseInt(formData.task_id),
        user_ids: formData.user_ids,
        start_date: formData.start_date,
        end_date: formData.end_date,
        frequency: formData.frequency,
        weekdays: formData.weekdays,
        times_per_day: parseInt(formData.times_per_day),
        weekday: parseInt(formData.weekday),
        weeks: formData.weeks,
        day_of_month: parseInt(formData.day_of_month),
        months: formData.months
      }
      
      const result = await tasksService.bulkAssignTask(dataToSend)
      setSuccess(result.message)
      
      // Reset form
      setFormData({
        task_id: '',
        user_ids: [],
        start_date: '',
        end_date: '',
        frequency: 'daily',
        weekdays: [0, 1, 2, 3, 4],
        times_per_day: 1,
        weekday: 0,
        weeks: [1, 2, 3, 4],
        day_of_month: 1,
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      })

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000)
    } catch (error) {
      console.error('Error assigning task:', error)
      setError(error.response?.data?.error || 'Error al asignar tarea')
    } finally {
      setLoading(false)
    }
  }

  const selectedTask = tasks.find(t => t.id === parseInt(formData.task_id))

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Asignar Tareas</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Seleccionar Tarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tarea *
          </label>
          <select
            name="task_id"
            value={formData.task_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Selecciona una tarea...</option>
            {tasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.title} - {task.frequency} - {task.base_value} créditos
              </option>
            ))}
          </select>
          
          {selectedTask && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium">{selectedTask.title}</p>
              <p className="text-gray-600">{selectedTask.description}</p>
              <div className="mt-2 flex gap-3 text-xs">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {selectedTask.task_type}
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                  {selectedTask.frequency}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                  {selectedTask.base_value} créditos
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Seleccionar Usuarios */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Usuarios * ({formData.user_ids.length} seleccionados)
            </label>
            <button
              type="button"
              onClick={toggleAllUsers}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {formData.user_ids.length === users.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
            {users.map(user => (
              <label key={user.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  name="user_ids"
                  value={user.id}
                  checked={formData.user_ids.includes(user.id)}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span className="text-2xl">{user.figure}</span>
                <span className="text-sm">{user.nick}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio *
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Fin *
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Frecuencia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frecuencia de Asignación *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value="daily"
                checked={formData.frequency === 'daily'}
                onChange={handleInputChange}
              />
              <span>Diaria</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value="weekly"
                checked={formData.frequency === 'weekly'}
                onChange={handleInputChange}
              />
              <span>Semanal</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value="monthly"
                checked={formData.frequency === 'monthly'}
                onChange={handleInputChange}
              />
              <span>Mensual</span>
            </label>
          </div>
        </div>

        {/* Opciones para Diaria */}
        {formData.frequency === 'daily' && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Días de la Semana * ({formData.weekdays.length} seleccionados)
                </label>
                <button
                  type="button"
                  onClick={toggleAllWeekdays}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {formData.weekdays.length === 7 ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {weekdayNames.map((day, index) => (
                  <label key={index} className="flex flex-col items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="weekdays"
                      value={index}
                      checked={formData.weekdays.includes(index)}
                      onChange={handleInputChange}
                      className="mb-1"
                    />
                    <span className="text-xs text-center">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Veces por Día
              </label>
              <input
                type="number"
                name="times_per_day"
                value={formData.times_per_day}
                onChange={handleInputChange}
                min="1"
                max="10"
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Se creará {formData.times_per_day} asignación(es) por día para cada usuario
              </p>
            </div>
          </div>
        )}

        {/* Opciones para Semanal */}
        {formData.frequency === 'weekly' && (
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Día de la Semana *
              </label>
              <select
                name="weekday"
                value={formData.weekday}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {weekdayNames.map((day, index) => (
                  <option key={index} value={index}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Semanas del Mes * ({formData.weeks.length} seleccionadas)
                </label>
                <button
                  type="button"
                  onClick={toggleAllWeeks}
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  {formData.weeks.length === 4 ? 'Deseleccionar todas' : 'Seleccionar todas'}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(week => (
                  <label key={week} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="weeks"
                      value={week}
                      checked={formData.weeks.includes(week)}
                      onChange={handleInputChange}
                    />
                    <span>Semana {week}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Opciones para Mensual */}
        {formData.frequency === 'monthly' && (
          <div className="space-y-4 p-4 bg-green-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Día del Mes *
              </label>
              <input
                type="number"
                name="day_of_month"
                value={formData.day_of_month}
                onChange={handleInputChange}
                min="1"
                max="31"
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Día del mes (1-31). Si el mes no tiene ese día, se omitirá.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Meses * ({formData.months.length} seleccionados)
                </label>
                <button
                  type="button"
                  onClick={toggleAllMonths}
                  className="text-sm text-green-600 hover:text-green-800"
                >
                  {formData.months.length === 12 ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {monthNames.map((month, index) => (
                  <label key={index} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="months"
                      value={index + 1}
                      checked={formData.months.includes(index + 1)}
                      onChange={handleInputChange}
                    />
                    <span className="text-sm">{month}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Botón de Submit */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => {
              setFormData({
                task_id: '',
                user_ids: [],
                start_date: '',
                end_date: '',
                frequency: 'daily',
                weekdays: [0, 1, 2, 3, 4],
                times_per_day: 1,
                weekday: 0,
                weeks: [1, 2, 3, 4],
                day_of_month: 1,
                months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
              })
              setError('')
              setSuccess('')
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Limpiar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Asignando...' : 'Asignar Tarea'}
          </button>
        </div>
      </form>

      {/* Información de Ayuda */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
        <h3 className="font-bold mb-2">💡 Información sobre Asignaciones</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li><strong>Diaria:</strong> Asigna la tarea en los días de la semana seleccionados. Puedes asignar varias veces al día.</li>
          <li><strong>Semanal:</strong> Asigna la tarea un día específico de la semana, en las semanas del mes seleccionadas.</li>
          <li><strong>Mensual:</strong> Asigna la tarea en un día específico del mes, solo en los meses seleccionados.</li>
          <li>Una misma tarea puede asignarse al mismo usuario varias veces el mismo día.</li>
          <li>Las asignaciones se crean automáticamente para el rango de fechas especificado.</li>
        </ul>
      </div>
    </div>
  )
}
