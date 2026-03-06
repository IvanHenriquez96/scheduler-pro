import { useState, useEffect } from 'react'
import { useShiftsStore } from '../store/useShiftsStore'

const DAYS = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

const EMPTY_MEMBER = {
  nombre: '',
  rol: '',
  horasContrato: 42,
  turnosAsignados: [],
  esUniversitario: false,
  disponibilidad: [],
}

export default function StaffModal({ isOpen, onClose, onSave, member }) {
  const [form, setForm] = useState(EMPTY_MEMBER)
  const { shifts } = useShiftsStore()

  useEffect(() => {
    if (member) {
      setForm({
        ...EMPTY_MEMBER,
        ...member,
        turnosAsignados: member.turnosAsignados || [],
      })
    } else {
      setForm(EMPTY_MEMBER)
    }
  }, [member, isOpen])

  if (!isOpen) return null

  const toggleShift = (shiftId) => {
    setForm((prev) => {
      const has = prev.turnosAsignados.includes(shiftId)
      return {
        ...prev,
        turnosAsignados: has
          ? prev.turnosAsignados.filter((id) => id !== shiftId)
          : [...prev.turnosAsignados, shiftId],
      }
    })
  }

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
    <div className="overlay overlay-open:opacity-100 modal" style={{ display: 'flex', opacity: 1 }} role="dialog">
      <div className="modal-dialog modal-dialog-sm">
        <div className="modal-content max-h-[90vh] overflow-y-auto">
          <div className="modal-header">
            <h3 className="modal-title">
              {member ? 'Editar' : 'Nuevo'} Colaborador
            </h3>
            <button type="button" className="btn btn-text btn-circle btn-sm" onClick={onClose}>
              <span className="icon-[tabler--x] size-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body space-y-4">
              <div>
                <label className="label-text mb-1">Nombre</label>
                <input
                  type="text"
                  className="input w-full"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label-text mb-1">Rol</label>
                <input
                  type="text"
                  className="input w-full"
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                />
              </div>

              <div>
                <label className="label-text mb-1">Horas contrato semanal</label>
                <input
                  type="number"
                  className="input w-full"
                  value={form.horasContrato}
                  onChange={(e) =>
                    setForm({ ...form, horasContrato: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div>
                <label className="label-text mb-2">Turnos asignados</label>
                {shifts.length === 0 ? (
                  <div className="alert alert-soft alert-info" role="alert">
                    <span className="icon-[tabler--info-circle] size-4" />
                    <p className="text-sm">No hay turnos creados. Ve a la pestaña Turnos para crear algunos.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {shifts.map((shift) => {
                      const isSelected = form.turnosAsignados.includes(shift.id)
                      return (
                        <label
                          key={shift.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-base-content/10 hover:border-base-content/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm"
                            checked={isSelected}
                            onChange={() => toggleShift(shift.id)}
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-base-content">
                              {shift.nombre}
                            </span>
                            <span className="text-xs text-base-content/50 ml-2">
                              {String(shift.horaInicio).padStart(2, '0')}:00 -{' '}
                              {String(shift.horaFin).padStart(2, '0')}:00 ({shift.horas}h)
                            </span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
                {form.turnosAsignados.length === 0 && shifts.length > 0 && (
                  <p className="helper-text mt-1">
                    Si no seleccionas ninguno, se asignará a Jornada Completa.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="esUniversitario"
                  className="checkbox checkbox-primary checkbox-sm"
                  checked={form.esUniversitario}
                  onChange={(e) =>
                    setForm({ ...form, esUniversitario: e.target.checked })
                  }
                />
                <label htmlFor="esUniversitario" className="label-text">
                  Perfil universitario (requiere disponibilidad horaria)
                </label>
              </div>

              {form.esUniversitario && (
                <div className="card card-border card-sm">
                  <div className="card-body">
                    <p className="text-sm font-medium text-base-content mb-2">
                      Disponibilidad horaria
                    </p>
                    {DAYS.map(({ key, label }) => {
                      const dayAvail = form.disponibilidad.find((d) => d.dia === key)
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-3 py-2 border-b border-base-content/5 last:border-0"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={!!dayAvail}
                            onChange={() => toggleDay(key)}
                          />
                          <span className="w-24 text-sm">{label}</span>
                          {dayAvail && (
                            <>
                              <input
                                type="number"
                                min="0"
                                max="23"
                                className="input input-sm w-16 text-center"
                                value={dayAvail.inicio}
                                onChange={(e) =>
                                  handleAvailabilityChange(key, 'inicio', e.target.value)
                                }
                              />
                              <span className="text-sm text-base-content/50">a</span>
                              <input
                                type="number"
                                min="0"
                                max="24"
                                className="input input-sm w-16 text-center"
                                value={dayAvail.fin}
                                onChange={(e) =>
                                  handleAvailabilityChange(key, 'fin', e.target.value)
                                }
                              />
                              <span className="text-sm text-base-content/50">hrs</span>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-soft btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {member ? 'Guardar cambios' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
