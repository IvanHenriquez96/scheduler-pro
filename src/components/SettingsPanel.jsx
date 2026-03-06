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
    label: 'Mín. colaboradores por día',
    type: 'number',
    isLegal: false,
  },
  {
    key: 'maxColaboradoresPorDia',
    label: 'Máx. colaboradores por día',
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
      <h2 className="text-2xl font-bold text-base-content mb-6">
        Configuración de Reglas
      </h2>

      <div className="alert alert-soft alert-error mb-6" role="alert">
        <span className="icon-[tabler--alert-triangle] size-6" />
        <div>
          <h5 className="text-lg font-semibold">Advertencia Legal</h5>
          <p className="text-sm mt-1">
            Las reglas y parámetros configurados en esta sección están basados
            en la legislación laboral vigente en Chile. Omitir o modificar
            estas reglas puede generar incumplimientos legales que deriven en
            sanciones, multas o demandas laborales. Se recomienda
            encarecidamente respetar los valores por defecto y consultar con
            un asesor legal antes de realizar cambios.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body gap-4">
          <div className="alert alert-soft alert-warning" role="alert">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="font-semibold text-sm">Omitir todas las reglas</p>
                <p className="text-xs opacity-80">
                  Activa/desactiva todas las validaciones a la vez
                </p>
              </div>
              <input
                type="checkbox"
                className="switch switch-warning"
                checked={Object.values(settings.omitirReglas).every(Boolean)}
                onChange={toggleAll}
              />
            </div>
          </div>

          <div className="divide-y divide-base-content/10">
            {FIELD_CONFIG.map(({ key, label, type, isLegal }) => (
              <div
                key={key}
                className={`flex items-center justify-between gap-4 py-3 ${
                  settings.omitirReglas[key] ? 'opacity-60' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-base-content">
                      {label}
                    </span>
                    {isLegal && (
                      <span className="badge badge-soft badge-info badge-xs">
                        Legal
                      </span>
                    )}
                  </div>
                  {settings.omitirReglas[key] && (
                    <p className="text-xs text-warning mt-0.5">
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
                    className="input input-sm w-20 text-center"
                  />
                  <input
                    type="checkbox"
                    className="switch switch-warning switch-sm"
                    checked={settings.omitirReglas[key]}
                    onChange={() => toggleRule(key)}
                  />
                </div>
              </div>
            ))}
          </div>

          {anyRuleOmitted && (
            <div className="alert alert-soft alert-warning" role="alert">
              <span className="icon-[tabler--info-circle] size-5" />
              <p className="text-xs">
                Tienes reglas omitidas. El algoritmo ignorará esas validaciones al
                generar la planificación. Usa esta opción bajo tu propia
                responsabilidad.
              </p>
            </div>
          )}

          <button onClick={resetSettings} className="btn btn-soft btn-secondary btn-block">
            Restablecer valores por defecto
          </button>
        </div>
      </div>
    </div>
  )
}
