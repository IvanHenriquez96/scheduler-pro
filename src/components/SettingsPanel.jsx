import { useSettingsStore, DEFAULT_SETTINGS } from '../store/useSettingsStore'

const FIELD_CONFIG = [
  { key: 'maxHorasSemanales', label: 'Máx. horas semanales', type: 'number' },
  {
    key: 'minDescansoEntreJornadas',
    label: 'Mín. descanso entre jornadas (hrs)',
    type: 'number',
  },
  { key: 'maxHorasDiarias', label: 'Máx. horas diarias', type: 'number' },
  {
    key: 'minColaboradoresPorDia',
    label: 'Mín. colaboradores por turno',
    type: 'number',
  },
  {
    key: 'maxDomingosAlMes',
    label: 'Máx. domingos trabajados al mes',
    type: 'number',
  },
  {
    key: 'minMinutosAlmuerzo',
    label: 'Mín. minutos almuerzo',
    type: 'number',
  },
  {
    key: 'maxDiasTrabajoSemana',
    label: 'Máx. días trabajo por semana',
    type: 'number',
  },
]

export default function SettingsPanel() {
  const { settings, updateSettings, resetSettings } = useSettingsStore()

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Configuración de Reglas
      </h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div>
            <p className="font-semibold text-amber-800">
              Omitir leyes y reglas
            </p>
            <p className="text-sm text-amber-600">
              Modo flexible: ignora restricciones legales
            </p>
          </div>
          <button
            onClick={() =>
              updateSettings({ omitirReglas: !settings.omitirReglas })
            }
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              settings.omitirReglas ? 'bg-amber-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                settings.omitirReglas ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {FIELD_CONFIG.map(({ key, label, type }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-gray-700">
              {label}
            </label>
            <input
              type={type}
              value={settings[key]}
              onChange={(e) =>
                updateSettings({ [key]: parseInt(e.target.value) || 0 })
              }
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        ))}

        <button
          onClick={resetSettings}
          className="w-full mt-4 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
        >
          Restablecer valores por defecto
        </button>
      </div>
    </div>
  )
}
