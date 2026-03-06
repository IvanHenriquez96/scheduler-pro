import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_SETTINGS = {
  maxHorasSemanales: 42,
  minDescansoEntreJornadas: 12,
  maxHorasDiarias: 10,
  minColaboradoresPorDia: 2,
  maxDomingosAlMes: 2,
  minMinutosAlmuerzo: 30,
  maxDiasTrabajoSemana: 6,
  omitirReglas: false,
}

export const useSettingsStore = create(
  persist(
    (set) => ({
      settings: { ...DEFAULT_SETTINGS },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS } }),
    }),
    { name: 'scheduler-pro-settings' }
  )
)

export { DEFAULT_SETTINGS }
