import { useState, useEffect, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { addMonths, format } from 'date-fns'
import { useScheduleStore } from '../store/useScheduleStore'
import { useStaffStore } from '../store/useStaffStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { fetchHolidays } from '../utils/holidays'
import { generateSchedule } from '../utils/scheduler'
import { exportScheduleToExcel } from '../utils/exportExcel'

const STAFF_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#84cc16', '#e11d48', '#0ea5e9', '#d946ef', '#22c55e',
]

export default function CalendarView() {
  const {
    schedule,
    holidays,
    pendingSchedule,
    setHolidays,
    setPendingSchedule,
    confirmSchedule,
    rejectSchedule,
  } = useScheduleStore()
  const { staff } = useStaffStore()
  const { settings } = useSettingsStore()
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchHolidays().then(setHolidays)
  }, [setHolidays])

  const staffColorMap = useMemo(() => {
    const map = {}
    staff.forEach((m, i) => {
      map[m.id] = STAFF_COLORS[i % STAFF_COLORS.length]
    })
    return map
  }, [staff])

  const handleGenerate = () => {
    if (staff.length === 0) {
      alert('Debes agregar colaboradores antes de generar la planificación')
      return
    }
    setLoading(true)
    const nextMonth = addMonths(new Date(), 1)
    const result = generateSchedule(staff, settings, holidays, nextMonth)
    setPendingSchedule(result.assignments)
    setWarnings(result.warnings)
    setLoading(false)
  }

  const handleExport = () => {
    const data = schedule.length > 0 ? schedule : pendingSchedule
    if (!data || data.length === 0) {
      alert('No hay planificación para exportar')
      return
    }
    exportScheduleToExcel(data, staff)
  }

  const displayData = pendingSchedule || schedule
  const events = useMemo(() => {
    const evts = []

    if (displayData) {
      displayData.forEach((a) => {
        evts.push({
          id: a.id,
          title: `${a.staffName} - ${a.shiftLabel}`,
          start: a.startTime,
          end: a.endTime,
          backgroundColor: staffColorMap[a.staffId] || '#6b7280',
          borderColor: staffColorMap[a.staffId] || '#6b7280',
          textColor: '#fff',
        })
      })
    }

    holidays.forEach((h) => {
      evts.push({
        title: `🎉 ${h.title}`,
        start: h.date,
        allDay: true,
        display: 'background',
        backgroundColor: '#fef3c7',
      })
    })

    return evts
  }, [displayData, holidays, staffColorMap])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Calendario de Planificación
        </h2>
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium disabled:opacity-50"
          >
            {loading ? 'Generando...' : 'Generar Planificación Mensual'}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-success text-white rounded-lg hover:opacity-90 transition font-medium"
          >
            Descargar Excel
          </button>
        </div>
      </div>

      {pendingSchedule && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-800">
              Propuesta de planificación generada
            </p>
            <p className="text-sm text-blue-600">
              {pendingSchedule.length} turnos asignados para el mes siguiente.
              Revisa y confirma o rechaza.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={confirmSchedule}
              className="px-4 py-2 bg-success text-white rounded-lg hover:opacity-90 transition font-medium"
            >
              Confirmar
            </button>
            <button
              onClick={rejectSchedule}
              className="px-4 py-2 bg-danger text-white rounded-lg hover:opacity-90 transition font-medium"
            >
              Rechazar
            </button>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="font-semibold text-amber-800 mb-2">Advertencias:</p>
          <ul className="text-sm text-amber-700 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>- {w}</li>
            ))}
          </ul>
        </div>
      )}

      {staff.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {staff.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
              style={{
                backgroundColor: staffColorMap[m.id] || '#6b7280',
              }}
            >
              {m.nombre}
            </span>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          locale="es"
          events={events}
          height="auto"
          firstDay={1}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
          }}
        />
      </div>
    </div>
  )
}
