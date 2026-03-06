import { useState, useCallback } from 'react'
import SettingsPanel from './components/SettingsPanel'
import StaffList from './components/StaffList'
import ShiftList from './components/ShiftList'
import CalendarView from './components/CalendarView'

const TABS = [
  { id: 'calendar', label: 'Calendario', icon: 'icon-[tabler--calendar]' },
  { id: 'shifts', label: 'Turnos', icon: 'icon-[tabler--clock]' },
  { id: 'staff', label: 'Staff', icon: 'icon-[tabler--users]' },
  { id: 'settings', label: 'Configuración', icon: 'icon-[tabler--settings]' },
]

function App() {
  const [activeTab, setActiveTab] = useState('calendar')

  const handleReset = useCallback(() => {
    if (!window.confirm('¿Estás seguro? Se eliminarán todos los datos y la app volverá a su estado inicial.')) return
    localStorage.clear()
    window.location.reload()
  }, [])

  return (
    <div className="min-h-screen bg-base-200/50">
      <nav className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <a className="link text-base-content link-neutral text-xl font-bold no-underline">
            Scheduler <span className="text-primary">Pro</span>
          </a>
        </div>
        <div className="navbar-end">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-sm ${
                  activeTab === tab.id
                    ? 'btn-primary'
                    : 'btn-soft btn-secondary'
                }`}
              >
                <span className={`${tab.icon} size-4`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
            <button onClick={handleReset} className="btn btn-sm btn-soft btn-error" title="Reiniciar app">
              <span className="icon-[tabler--refresh] size-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'shifts' && <ShiftList />}
        {activeTab === 'staff' && <StaffList />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  )
}

export default App
