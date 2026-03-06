import { useState, useEffect, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { addMonths } from 'date-fns'
import { useScheduleStore } from '../store/useScheduleStore'
import { useStaffStore } from '../store/useStaffStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useShiftsStore } from '../store/useShiftsStore'
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
  const { shifts } = useShiftsStore()
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
    if (shifts.length === 0) {
      alert('Debes crear turnos antes de generar la planificación')
      return
    }
    setLoading(true)
    const nextMonth = addMonths(new Date(), 1)
    const result = generateSchedule(staff, settings, holidays, nextMonth, shifts)
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
        title: h.title,
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
        <h2 className="text-2xl font-bold text-base-content">
          Calendario de Planificación
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn btn-primary btn-sm"
          >
            {loading && <span className="loading loading-spinner loading-xs" />}
            {loading ? 'Generando...' : 'Generar Planificación Mensual'}
          </button>
          <button onClick={handleExport} className="btn btn-soft btn-success btn-sm">
            <span className="icon-[tabler--download] size-4" />
            Descargar Excel
          </button>
        </div>
      </div>

      {pendingSchedule && (
        <div className="alert alert-soft alert-info mb-4" role="alert">
          <span className="icon-[tabler--clipboard-check] size-6" />
          <div className="flex-1">
            <h5 className="font-semibold">Propuesta de planificación generada</h5>
            <p className="text-sm">
              {pendingSchedule.length} turnos asignados para el mes siguiente.
              Revisa y confirma o rechaza.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={confirmSchedule} className="btn btn-success btn-sm">
              Confirmar
            </button>
            <button onClick={rejectSchedule} className="btn btn-error btn-sm">
              Rechazar
            </button>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="alert alert-soft alert-warning mb-4" role="alert">
          <span className="icon-[tabler--alert-triangle] size-5" />
          <div>
            <p className="font-semibold mb-1">Advertencias:</p>
            <ul className="text-sm space-y-0.5">
              {warnings.map((w, i) => (
                <li key={i}>- {w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {staff.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {staff.map((m) => (
            <span
              key={m.id}
              className="badge badge-sm text-white"
              style={{ backgroundColor: staffColorMap[m.id] || '#6b7280' }}
            >
              {m.nombre}
            </span>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-body">
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
    </div>
  )
}
