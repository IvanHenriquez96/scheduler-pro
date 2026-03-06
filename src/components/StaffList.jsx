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
    if (!turnosAsignados || turnosAsignados.length === 0) return 'Cualquier turno'
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
        <h2 className="text-2xl font-bold text-gray-800">
          Gestión de Staff
        </h2>
        <button
          onClick={handleNew}
          className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Nuevo Colaborador
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-lg">No hay colaboradores</p>
          <p className="text-gray-400 text-sm mt-1">
            Agrega colaboradores para comenzar a planificar
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {staff.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-sm transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-800">
                    {member.nombre}
                  </h3>
                  {member.esUniversitario && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      Universitario
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mt-1 text-sm text-gray-500">
                  <span>{member.rol || 'Sin rol'}</span>
                  <span>{member.horasContrato}h/semana</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Turnos: {getShiftNames(member.turnosAsignados)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(member)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => removeStaff(member.id)}
                  className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <StaffModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingMember(null)
        }}
        onSave={handleSave}
        member={editingMember}
      />
    </div>
  )
}
