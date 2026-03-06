import { useState, useEffect } from 'react'
import { useShiftsStore, FULLTIME_SHIFT_ID } from '../store/useShiftsStore'
import { useSettingsStore } from '../store/useSettingsStore'

const TIPO_OPTIONS = [
  { value: 'fulltime', label: 'Jornada Completa' },
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noche' },
  { value: 'weekends', label: 'Fines de Semana / Feriados' },
]

const TIPO_LABELS = {
  fulltime: 'Jornada Completa',
  morning: 'Mañana',
  afternoon: 'Tarde',
  night: 'Noche',
  weekends: 'Fines de Semana / Feriados',
}

const TIPO_BADGE = {
  fulltime: 'badge-primary',
  morning: 'badge-warning',
  afternoon: 'badge-accent',
  night: 'badge-info',
  weekends: 'badge-success',
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
    <div className="overlay overlay-open:opacity-100 modal" style={{ display: 'flex', opacity: 1 }} role="dialog">
      <div className="modal-dialog modal-dialog-sm">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">{shift ? 'Editar' : 'Nuevo'} Turno</h3>
            <button type="button" className="btn btn-text btn-circle btn-sm" onClick={onClose}>
              <span className="icon-[tabler--x] size-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body space-y-4">
              <div>
                <label className="label-text mb-1">Nombre del turno</label>
                <input
                  type="text"
                  className="input w-full"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Turno Apertura"
                  required
                />
              </div>

              <div>
                <label className="label-text mb-1">Tipo de turno</label>
                <select
                  className="select w-full"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  {TIPO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label-text mb-1">Hora inicio</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    className="input w-full text-center"
                    value={form.horaInicio}
                    onChange={(e) => handleHoursChange('horaInicio', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-text mb-1">Hora fin</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    className="input w-full text-center"
                    value={form.horaFin}
                    onChange={(e) => handleHoursChange('horaFin', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-text mb-1">Horas</label>
                  <input
                    type="number"
                    className="input w-full text-center"
                    value={form.horas}
                    onChange={(e) => setForm({ ...form, horas: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <p className="text-xs text-base-content/60">
                Horario: {String(form.horaInicio).padStart(2, '0')}:00 -{' '}
                {String(form.horaFin).padStart(2, '0')}:00 ({form.horas}h)
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-soft btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
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
  const { shifts, addShift, updateShift, removeShift, resetShifts } = useShiftsStore()
  const { settings } = useSettingsStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState(null)

  const fulltimeShift = shifts.find((s) => s.id === FULLTIME_SHIFT_ID)
  if (fulltimeShift && fulltimeShift.horas !== settings.maxHorasDiarias) {
    updateShift(FULLTIME_SHIFT_ID, { horas: settings.maxHorasDiarias })
  }

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
        <h2 className="text-2xl font-bold text-base-content">Gestión de Turnos</h2>
        <div className="flex gap-2">
          <button onClick={resetShifts} className="btn btn-soft btn-secondary btn-sm">
            Restablecer
          </button>
          <button onClick={handleNew} className="btn btn-primary btn-sm">
            <span className="icon-[tabler--plus] size-4" />
            Nuevo Turno
          </button>
        </div>
      </div>

      {shifts.length === 0 ? (
        <div className="card">
          <div className="card-body items-center py-16">
            <span className="icon-[tabler--clock-off] size-12 text-base-content/20" />
            <p className="text-base-content/40 text-lg mt-2">No hay turnos creados</p>
            <p className="text-base-content/30 text-sm">
              Crea turnos para poder asignarlos a los colaboradores
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => (
            <div key={shift.id} className="card card-sm">
              <div className="card-body flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-semibold text-base-content">{shift.nombre}</h5>
                    <span className={`badge badge-soft ${TIPO_BADGE[shift.tipo] || 'badge-secondary'} badge-sm`}>
                      {TIPO_LABELS[shift.tipo] || shift.tipo}
                    </span>
                  </div>
                  <p className="text-sm text-base-content/60 mt-0.5">
                    {String(shift.horaInicio).padStart(2, '0')}:00 -{' '}
                    {String(shift.horaFin).padStart(2, '0')}:00 ({shift.horas}h)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {shift.id === FULLTIME_SHIFT_ID && (
                    <span className="badge badge-soft badge-primary badge-xs">Por defecto</span>
                  )}
                  <button onClick={() => handleEdit(shift)} className="btn btn-soft btn-secondary btn-xs">
                    Editar
                  </button>
                  {shift.id !== FULLTIME_SHIFT_ID && (
                    <button onClick={() => removeShift(shift.id)} className="btn btn-soft btn-error btn-xs">
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ShiftModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditingShift(null) }}
          onSave={handleSave}
          shift={editingShift}
        />
      )}
    </div>
  )
}
