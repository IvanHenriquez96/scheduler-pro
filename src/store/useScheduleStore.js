import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useScheduleStore = create(
  persist(
    (set) => ({
      schedule: [],
      holidays: [],
      pendingSchedule: null,
      setSchedule: (schedule) => set({ schedule, pendingSchedule: null }),
      setPendingSchedule: (pendingSchedule) => set({ pendingSchedule }),
      confirmSchedule: () =>
        set((state) => ({
          schedule: state.pendingSchedule || state.schedule,
          pendingSchedule: null,
        })),
      rejectSchedule: () => set({ pendingSchedule: null }),
      clearSchedule: () => set({ schedule: [], pendingSchedule: null }),
      setHolidays: (holidays) => set({ holidays }),
    }),
    { name: 'scheduler-pro-schedule' }
  )
)
