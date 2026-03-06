import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_SHIFTS = [
  {
    id: 'default-morning',
    nombre: 'Mañana',
    tipo: 'morning',
    horaInicio: 8,
    horaFin: 14,
    horas: 6,
  },
  {
    id: 'default-afternoon',
    nombre: 'Tarde',
    tipo: 'afternoon',
    horaInicio: 14,
    horaFin: 20,
    horas: 6,
  },
  {
    id: 'default-night',
    nombre: 'Noche',
    tipo: 'night',
    horaInicio: 20,
    horaFin: 2,
    horas: 6,
  },
]

export const useShiftsStore = create(
  persist(
    (set) => ({
      shifts: [...DEFAULT_SHIFTS],
      addShift: (shift) =>
        set((state) => ({
          shifts: [...state.shifts, { ...shift, id: crypto.randomUUID() }],
        })),
      updateShift: (id, updates) =>
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      removeShift: (id) =>
        set((state) => ({
          shifts: state.shifts.filter((s) => s.id !== id),
        })),
      resetShifts: () => set({ shifts: [...DEFAULT_SHIFTS] }),
    }),
    { name: 'scheduler-pro-shifts' }
  )
)

export { DEFAULT_SHIFTS }
