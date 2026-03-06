import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStaffStore = create(
  persist(
    (set) => ({
      staff: [],
      addStaff: (member) =>
        set((state) => ({
          staff: [...state.staff, { ...member, id: crypto.randomUUID() }],
        })),
      updateStaff: (id, updates) =>
        set((state) => ({
          staff: state.staff.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),
      removeStaff: (id) =>
        set((state) => ({
          staff: state.staff.filter((m) => m.id !== id),
        })),
    }),
    { name: 'scheduler-pro-staff' }
  )
)
