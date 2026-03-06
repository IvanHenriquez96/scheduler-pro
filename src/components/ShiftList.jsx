import { useState, useEffect } from 'react'
import { useShiftsStore } from '../store/useShiftsStore'

const TIPO_OPTIONS = [
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noche' },
  { value: 'weekends', label: 'Fines de Semana / Feriados' },
]

const TIPO_LABELS = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  night: 'Noche',
  weekends: 'Fines de Semana / Feriados',
}

const TIPO_COLORS = {
  morning: 'bg-amber-100 text-amber-700',
  afternoon: 'bg-orange-100 text-orange-700',
  night: 'bg-indigo-100 text-indigo-700',
  weekends: 'bg-green-100 text-green-700',
}

const EMPTY_SHIFT = {
  nombre: '',
  tipo: 'morning',
  horaInicio: 8,
  horaFin: 14,
  horas: 6,
}

function ShiftModal({ isOpen, onClose, onSave, shift }) {
  const [form, setForm] = useState(EMPTY_SHIFT)

  useEffect(() => {
    if (shift) {
      setForm({ ...EMPTY_SHIFT, ...shift })
    } else {
      setForm(EMPTY_SHIFT)
    }
  }, [shift, isOpen])

  if (!isOpen) return null

  const handleHoursChange = (field, value) => {
    const updated = { ...form, [field]: parseInt(value) || 0 }
    if (updated.horaFin > updated.horaInicio) {
      updated.horas = updated.horaFin - updated.horaInicio
    } else if (updated.horaFin < updated.horaInicio) {
      updated.horas = 24 - updated.horaInicio + updated.horaFin
    } else {
      updated.horas = 0
    }
    setForm(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) return
    onSave(form)
    setForm(EMPTY_SHIFT)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              {shift ? 'Editar' : 'Nuevo'} Turno
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del turno
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Turno Apertura"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de turno
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                {TIPO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora inicio
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={form.horaInicio}
                  onChange={(e) =>
                    handleHoursChange('horaInicio', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora fin
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={form.horaFin}
                  onChange={(e) =>
                    handleHoursChange('horaFin', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas
                </label>
                <input
                  type="number"
                  value={form.horas}
                  onChange={(e) =>
                    setForm({ ...form, horas: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Horario: {String(form.horaInicio).padStart(2, '0')}:00 -{' '}
              {String(form.horaFin).padStart(2, '0')}:00 ({form.horas}h)
            </p>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium"
              >
                {shift ? 'Guardar cambios' : 'Crear turno'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ShiftList() {
  const { shifts, addShift, updateShift, removeShift, resetShifts } =
    useShiftsStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState(null)

  const handleSave = (data) => {
    if (editingShift) {
      updateShift(editingShift.id, data)
    } else {
      addShift(data)
    }
    setEditingShift(null)
  }

  const handleEdit = (shift) => {
    setEditingShift(shift)
    setModalOpen(true)
  }

  const handleNew = () => {
    setEditingShift(null)
    setModalOpen(true)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Gestión de Turnos
        </h2>
        <div className="flex gap-3">
          <button
            onClick={resetShifts}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Restablecer
          </button>
          <button
            onClick={handleNew}
            className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Nuevo Turno
          </button>
        </div>
      </div>

      {shifts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-lg">No hay turnos creados</p>
          <p className="text-gray-400 text-sm mt-1">
            Crea turnos para poder asignarlos a los colaboradores
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-sm transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-800">
                    {shift.nombre}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      TIPO_COLORS[shift.tipo] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {TIPO_LABELS[shift.tipo] || shift.tipo}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {String(shift.horaInicio).padStart(2, '0')}:00 -{' '}
                  {String(shift.horaFin).padStart(2, '0')}:00 ({shift.horas}h)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(shift)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => removeShift(shift.id)}
                  className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ShiftModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingShift(null)
        }}
        onSave={handleSave}
        shift={editingShift}
      />
    </div>
  )
}
