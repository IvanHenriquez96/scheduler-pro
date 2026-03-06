import { useState, useEffect } from 'react'

const DAYS = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

const SHIFT_OPTIONS = [
  { value: 'any', label: 'Cualquiera' },
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noche' },
  { value: 'weekends', label: 'Solo Fines de Semana/Feriados' },
]

const EMPTY_MEMBER = {
  nombre: '',
  rol: '',
  horasContrato: 42,
  restriccionTurno: 'any',
  esUniversitario: false,
  disponibilidad: [],
}

export default function StaffModal({ isOpen, onClose, onSave, member }) {
  const [form, setForm] = useState(EMPTY_MEMBER)

  useEffect(() => {
    if (member) {
      setForm({ ...EMPTY_MEMBER, ...member })
    } else {
      setForm(EMPTY_MEMBER)
    }
  }, [member, isOpen])

  if (!isOpen) return null

  const handleAvailabilityChange = (dayKey, field, value) => {
    setForm((prev) => {
      const existing = prev.disponibilidad.find((d) => d.dia === dayKey)
      if (existing) {
        return {
          ...prev,
          disponibilidad: prev.disponibilidad.map((d) =>
            d.dia === dayKey ? { ...d, [field]: parseInt(value) } : d
          ),
        }
      }
      return {
        ...prev,
        disponibilidad: [
          ...prev.disponibilidad,
          { dia: dayKey, inicio: 0, fin: 24, [field]: parseInt(value) },
        ],
      }
    })
  }

  const toggleDay = (dayKey) => {
    setForm((prev) => {
      const exists = prev.disponibilidad.find((d) => d.dia === dayKey)
      if (exists) {
        return {
          ...prev,
          disponibilidad: prev.disponibilidad.filter((d) => d.dia !== dayKey),
        }
      }
      return {
        ...prev,
        disponibilidad: [
          ...prev.disponibilidad,
          { dia: dayKey, inicio: 8, fin: 20 },
        ],
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) return
    onSave(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              {member ? 'Editar' : 'Nuevo'} Colaborador
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
                Nombre
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <input
                type="text"
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas contrato semanal
                </label>
                <input
                  type="number"
                  value={form.horasContrato}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      horasContrato: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restricción de turno
                </label>
                <select
                  value={form.restriccionTurno}
                  onChange={(e) =>
                    setForm({ ...form, restriccionTurno: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  {SHIFT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="esUniversitario"
                checked={form.esUniversitario}
                onChange={(e) =>
                  setForm({ ...form, esUniversitario: e.target.checked })
                }
                className="h-4 w-4 rounded"
              />
              <label htmlFor="esUniversitario" className="text-sm text-blue-800">
                Perfil universitario (requiere disponibilidad horaria)
              </label>
            </div>

            {form.esUniversitario && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Disponibilidad horaria
                </p>
                {DAYS.map(({ key, label }) => {
                  const dayAvail = form.disponibilidad.find(
                    (d) => d.dia === key
                  )
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={!!dayAvail}
                        onChange={() => toggleDay(key)}
                        className="h-4 w-4"
                      />
                      <span className="w-24 text-sm">{label}</span>
                      {dayAvail && (
                        <>
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={dayAvail.inicio}
                            onChange={(e) =>
                              handleAvailabilityChange(
                                key,
                                'inicio',
                                e.target.value
                              )
                            }
                            className="w-16 px-2 py-1 border rounded text-center text-sm"
                          />
                          <span className="text-sm text-gray-500">a</span>
                          <input
                            type="number"
                            min="0"
                            max="24"
                            value={dayAvail.fin}
                            onChange={(e) =>
                              handleAvailabilityChange(
                                key,
                                'fin',
                                e.target.value
                              )
                            }
                            className="w-16 px-2 py-1 border rounded text-center text-sm"
                          />
                          <span className="text-sm text-gray-500">hrs</span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

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
                {member ? 'Guardar cambios' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
