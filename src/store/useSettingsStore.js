import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_SETTINGS = {
  maxHorasSemanales: 42,
  minDescansoEntreJornadas: 12,
  maxHorasDiarias: 10,
  minColaboradoresPorDia: 2,
  maxColaboradoresPorDia: 4,
  maxDomingosAlMes: 2,
  minMinutosAlmuerzo: 30,
  maxDiasTrabajoSemana: 6,
  omitirReglas: {
    maxHorasSemanales: false,
    minDescansoEntreJornadas: false,
    maxHorasDiarias: false,
    maxDomingosAlMes: false,
    maxDiasTrabajoSemana: false,
    minColaboradoresPorDia: false,
    maxColaboradoresPorDia: false,
    minMinutosAlmuerzo: false,
  },
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
    {
      name: 'scheduler-pro-settings',
      merge: (persisted, current) => {
        const merged = { ...current, ...persisted }
        // Ensure new default fields are present in persisted settings
        merged.settings = {
          ...DEFAULT_SETTINGS,
          ...merged.settings,
          omitirReglas: {
            ...DEFAULT_SETTINGS.omitirReglas,
            ...(merged.settings?.omitirReglas || {}),
          },
        }
        return merged
      },
    }
  )
)

export { DEFAULT_SETTINGS }
