import { useState } from 'react'
import { useStaffStore } from '../store/useStaffStore'
import { useShiftsStore } from '../store/useShiftsStore'
import StaffModal from './StaffModal'

export default function StaffList() {
  const { staff, addStaff, updateStaff, removeStaff } = useStaffStore()
  const { shifts } = useShiftsStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

  const shiftMap = Object.fromEntries(shifts.map((s) => [s.id, s]))

  const getShiftNames = (turnosAsignados) => {
    if (!turnosAsignados || turnosAsignados.length === 0) return 'Jornada Completa'
    return turnosAsignados
      .map((id) => shiftMap[id]?.nombre)
      .filter(Boolean)
      .join(', ') || 'Cualquier turno'
  }

  const handleSave = (data) => {
    if (editingMember) {
      updateStaff(editingMember.id, data)
    } else {
      addStaff(data)
    }
    setEditingMember(null)
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setModalOpen(true)
  }

  const handleNew = () => {
    setEditingMember(null)
    setModalOpen(true)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-base-content">Gestión de Staff</h2>
        <button onClick={handleNew} className="btn btn-primary btn-sm">
          <span className="icon-[tabler--plus] size-4" />
          Nuevo Colaborador
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="card">
          <div className="card-body items-center py-16">
            <span className="icon-[tabler--users-minus] size-12 text-base-content/20" />
            <p className="text-base-content/40 text-lg mt-2">No hay colaboradores</p>
            <p className="text-base-content/30 text-sm">
              Agrega colaboradores para comenzar a planificar
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <div key={member.id} className="card card-sm">
              <div className="card-body flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-semibold text-base-content">{member.nombre}</h5>
                    {member.esUniversitario && (
                      <span className="badge badge-soft badge-info badge-xs">Universitario</span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-0.5 text-sm text-base-content/60">
                    <span>{member.rol || 'Sin rol'}</span>
                    <span>{member.horasContrato}h/semana</span>
                  </div>
                  <p className="text-xs text-base-content/40 mt-0.5">
                    Turnos: {getShiftNames(member.turnosAsignados)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(member)} className="btn btn-soft btn-secondary btn-xs">
                    Editar
                  </button>
                  <button onClick={() => removeStaff(member.id)} className="btn btn-soft btn-error btn-xs">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <StaffModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditingMember(null) }}
          onSave={handleSave}
          member={editingMember}
        />
      )}
    </div>
  )
}
