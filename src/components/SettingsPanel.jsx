import { useSettingsStore } from '../store/useSettingsStore'

const FIELD_CONFIG = [
  {
    key: 'maxHorasSemanales',
    label: 'Máx. horas semanales',
    type: 'number',
    isLegal: true,
  },
  {
    key: 'minDescansoEntreJornadas',
    label: 'Mín. descanso entre jornadas (hrs)',
    type: 'number',
    isLegal: true,
  },
  {
    key: 'maxHorasDiarias',
    label: 'Máx. horas diarias',
    type: 'number',
    isLegal: true,
  },
  {
    key: 'minColaboradoresPorDia',
    label: 'Mín. colaboradores por turno',
    type: 'number',
    isLegal: false,
  },
  {
    key: 'maxDomingosAlMes',
    label: 'Máx. domingos trabajados al mes',
    type: 'number',
    isLegal: true,
  },
  {
    key: 'minMinutosAlmuerzo',
    label: 'Mín. minutos almuerzo',
    type: 'number',
    isLegal: true,
  },
  {
    key: 'maxDiasTrabajoSemana',
    label: 'Máx. días trabajo por semana',
    type: 'number',
    isLegal: true,
  },
]

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-amber-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function SettingsPanel() {
  const { settings, updateSettings, resetSettings } = useSettingsStore()

  const anyRuleOmitted = Object.values(settings.omitirReglas).some(Boolean)

  const toggleRule = (key) => {
    updateSettings({
      omitirReglas: {
        ...settings.omitirReglas,
        [key]: !settings.omitirReglas[key],
      },
    })
  }

  const toggleAll = () => {
    const allOmitted = Object.values(settings.omitirReglas).every(Boolean)
    const newValue = !allOmitted
    const updated = {}
    for (const key of Object.keys(settings.omitirReglas)) {
      updated[key] = newValue
    }
    updateSettings({ omitirReglas: updated })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Configuración de Reglas
      </h2>

      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex gap-3">
          <span className="text-red-500 text-xl leading-none mt-0.5">!</span>
          <div>
            <p className="font-semibold text-red-800">
              Advertencia Legal
            </p>
            <p className="text-sm text-red-700 mt-1">
              Las reglas y parámetros configurados en esta sección están basados
              en la legislación laboral vigente en Chile. Omitir o modificar
              estas reglas puede generar incumplimientos legales que deriven en
              sanciones, multas o demandas laborales. Se recomienda
              encarecidamente respetar los valores por defecto y consultar con
              un asesor legal antes de realizar cambios.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-1">
        <div className="flex items-center justify-between p-3 mb-4 bg-amber-50 rounded-lg border border-amber-200">
          <div>
            <p className="font-semibold text-amber-800 text-sm">
              Omitir todas las reglas
            </p>
            <p className="text-xs text-amber-600">
              Activa/desactiva todas las validaciones a la vez
            </p>
          </div>
          <Toggle
            checked={Object.values(settings.omitirReglas).every(Boolean)}
            onChange={toggleAll}
          />
        </div>

        {FIELD_CONFIG.map(({ key, label, type, isLegal }) => (
          <div
            key={key}
            className={`flex items-center justify-between gap-4 p-3 rounded-lg ${
              settings.omitirReglas[key] ? 'bg-amber-50/50' : ''
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  {label}
                </label>
                {isLegal && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium uppercase tracking-wide">
                    Legal
                  </span>
                )}
              </div>
              {settings.omitirReglas[key] && (
                <p className="text-xs text-amber-600 mt-0.5">
                  Esta regla no se aplicará al generar turnos
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type={type}
                value={settings[key]}
                onChange={(e) =>
                  updateSettings({ [key]: parseInt(e.target.value) || 0 })
                }
                disabled={settings.omitirReglas[key]}
                className={`w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-primary focus:border-primary ${
                  settings.omitirReglas[key]
                    ? 'bg-gray-100 text-gray-400'
                    : ''
                }`}
              />
              <Toggle
                checked={settings.omitirReglas[key]}
                onChange={() => toggleRule(key)}
              />
            </div>
          </div>
        ))}

        {anyRuleOmitted && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              Tienes reglas omitidas. El algoritmo ignorará esas validaciones al
              generar la planificación. Usa esta opción bajo tu propia
              responsabilidad.
            </p>
          </div>
        )}

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
