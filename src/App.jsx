import { useState } from 'react'
import SettingsPanel from './components/SettingsPanel'
import StaffList from './components/StaffList'
import CalendarView from './components/CalendarView'

const TABS = [
  { id: 'calendar', label: 'Calendario' },
  { id: 'staff', label: 'Staff' },
  { id: 'settings', label: 'Configuración' },
]

function App() {
  const [activeTab, setActiveTab] = useState('calendar')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            <span className="text-primary">Scheduler</span> Pro
          </h1>
          <nav className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  activeTab === tab.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'staff' && <StaffList />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  )
}

export default App
