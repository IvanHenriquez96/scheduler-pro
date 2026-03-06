import { useState, useEffect, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
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

  const coverageAnalysis = useMemo(() => {
    if (staff.length === 0 || shifts.length === 0) return null

    const nextMonth = addMonths(new Date(), 1)
    const mStart = startOfMonth(nextMonth)
    const mEnd = endOfMonth(nextMonth)
    const monthDays = eachDayOfInterval({ start: mStart, end: mEnd })
    const totalDays = monthDays.length

    const regularShifts = shifts.filter((s) => s.tipo !== 'weekends')
    const avgShiftHours =
      regularShifts.length > 0
        ? regularShifts.reduce((sum, s) => sum + s.horas, 0) / regularShifts.length
        : 8

    const minStaffPerDay = settings.minColaboradoresPorDia
    const totalHoursNeeded = totalDays * minStaffPerDay * avgShiftHours

    const weeksInMonth = totalDays / 7
    const totalHoursAvailable = staff.reduce((sum, m) => {
      const weeklyHours = m.horasContrato || settings.maxHorasSemanales
      return sum + weeklyHours * weeksInMonth
    }, 0)

    const hoursDifference = totalHoursAvailable - totalHoursNeeded
    const isDeficit = hoursDifference < 0

    const avgContractHours =
      staff.reduce((sum, m) => sum + (m.horasContrato || settings.maxHorasSemanales), 0) /
      staff.length
    const extraStaffNeeded = isDeficit
      ? Math.ceil(Math.abs(hoursDifference) / (avgContractHours * weeksInMonth))
      : 0

    return {
      totalDays,
      minStaffPerDay,
      avgShiftHours: Math.round(avgShiftHours * 10) / 10,
      totalHoursNeeded: Math.round(totalHoursNeeded),
      totalHoursAvailable: Math.round(totalHoursAvailable),
      hoursDifference: Math.round(hoursDifference),
      isDeficit,
      extraStaffNeeded,
      staffCount: staff.length,
    }
  }, [staff, shifts, settings])

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

      {coverageAnalysis && (
        <div className={`alert ${coverageAnalysis.isDeficit ? 'alert-soft alert-error' : 'alert-soft alert-success'} mb-4`} role="alert">
          <span className={`${coverageAnalysis.isDeficit ? 'icon-[tabler--alert-triangle]' : 'icon-[tabler--circle-check]'} size-6 shrink-0`} />
          <div className="flex-1">
            <h5 className="font-semibold">
              Análisis de Cobertura — {coverageAnalysis.isDeficit ? 'Déficit de personal' : 'Cobertura suficiente'}
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              <div>
                <p className="text-xs opacity-70">Días del mes</p>
                <p className="text-lg font-bold">{coverageAnalysis.totalDays}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Horas necesarias</p>
                <p className="text-lg font-bold">{coverageAnalysis.totalHoursNeeded}h</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Horas disponibles</p>
                <p className="text-lg font-bold">{coverageAnalysis.totalHoursAvailable}h</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Diferencia</p>
                <p className={`text-lg font-bold ${coverageAnalysis.isDeficit ? 'text-error' : 'text-success'}`}>
                  {coverageAnalysis.hoursDifference > 0 ? '+' : ''}{coverageAnalysis.hoursDifference}h
                </p>
              </div>
            </div>
            <p className="text-sm mt-2">
              {coverageAnalysis.minStaffPerDay} colaborador{coverageAnalysis.minStaffPerDay > 1 ? 'es' : ''}/día × {coverageAnalysis.avgShiftHours}h promedio × {coverageAnalysis.totalDays} días = {coverageAnalysis.totalHoursNeeded}h necesarias.
              {' '}Tienes {coverageAnalysis.staffCount} colaborador{coverageAnalysis.staffCount > 1 ? 'es' : ''} con {coverageAnalysis.totalHoursAvailable}h disponibles.
            </p>
            {coverageAnalysis.isDeficit && (
              <p className="text-sm font-semibold mt-1">
                Necesitas contratar al menos {coverageAnalysis.extraStaffNeeded} colaborador{coverageAnalysis.extraStaffNeeded > 1 ? 'es' : ''} más, o reducir el mínimo de colaboradores por día en Configuración.
              </p>
            )}
          </div>
        </div>
      )}

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
