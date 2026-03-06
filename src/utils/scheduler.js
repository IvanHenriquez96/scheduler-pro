import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addHours,
  isBefore,
  isSameWeek,
  format,
  isSameMonth,
  parseISO,
} from 'date-fns'
import { FULLTIME_SHIFT_ID } from '../store/useShiftsStore'

const DAY_NAMES = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
]

function getTotalDaysAssigned(staffId, assignments) {
  const uniqueDays = new Set(
    assignments.filter((a) => a.staffId === staffId).map((a) => a.date)
  )
  return uniqueDays.size
}

function getWeeklyHours(staffId, assignments, date) {
  return assignments
    .filter(
      (a) =>
        a.staffId === staffId &&
        isSameWeek(parseISO(a.date), date, { weekStartsOn: 1 })
    )
    .reduce((sum, a) => sum + a.hours, 0)
}

function getSundaysWorked(staffId, assignments, date) {
  return assignments.filter(
    (a) =>
      a.staffId === staffId &&
      getDay(parseISO(a.date)) === 0 &&
      isSameMonth(parseISO(a.date), date)
  ).length
}

function getLastShiftEnd(staffId, assignments) {
  const staffAssignments = assignments
    .filter((a) => a.staffId === staffId)
    .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
  if (staffAssignments.length === 0) return null
  return new Date(staffAssignments[0].endTime)
}

function getDaysWorkedInWeek(staffId, assignments, date) {
  const uniqueDays = new Set(
    assignments
      .filter(
        (a) =>
          a.staffId === staffId &&
          isSameWeek(parseISO(a.date), date, { weekStartsOn: 1 })
      )
      .map((a) => a.date)
  )
  return uniqueDays.size
}

function isAvailableForShift(member, dayOfWeek, shift) {
  if (!member.disponibilidad || member.disponibilidad.length === 0) return true
  const dayName = DAY_NAMES[dayOfWeek]
  const dayAvailability = member.disponibilidad.find(
    (d) => d.dia === dayName
  )
  if (!dayAvailability) return false
  return (
    dayAvailability.inicio <= shift.horaInicio &&
    dayAvailability.fin >= shift.horaFin
  )
}

function canWorkShift(member, shift, fulltimeShiftId) {
  if (!member.turnosAsignados || member.turnosAsignados.length === 0) {
    return shift.id === fulltimeShiftId
  }
  return member.turnosAsignados.includes(shift.id)
}

export function generateSchedule(staff, settings, holidays, targetMonth, shifts) {
  const year = targetMonth.getFullYear()
  const month = targetMonth.getMonth()
  const monthStart = startOfMonth(new Date(year, month))
  const monthEnd = endOfMonth(new Date(year, month))
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const holidayDates = new Set(holidays.map((h) => h.date))
  const assignments = []
  const warnings = []
  const omit = settings.omitirReglas || {}

  for (const day of days) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayOfWeek = getDay(day)
    const isHoliday = holidayDates.has(dateStr)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    const sorted = [...staff].sort((a, b) => {
      const aDays = getTotalDaysAssigned(a.id, assignments)
      const bDays = getTotalDaysAssigned(b.id, assignments)
      if (aDays !== bDays) return aDays - bDays
      return Math.random() - 0.5
    })
    let assignedToday = 0

    for (const member of sorted) {
      const eligibleShifts = shifts.filter((shift) => {
        if (shift.tipo === 'weekends' && !isWeekend && !isHoliday) return false
        if (!canWorkShift(member, shift, FULLTIME_SHIFT_ID)) return false
        if (!isAvailableForShift(member, dayOfWeek, shift)) return false

        const shiftStart = new Date(day)
        shiftStart.setHours(shift.horaInicio, 0, 0, 0)

        if (!omit.minDescansoEntreJornadas) {
          const lastEnd = getLastShiftEnd(member.id, assignments)
          if (
            lastEnd &&
            isBefore(
              shiftStart,
              addHours(lastEnd, settings.minDescansoEntreJornadas)
            )
          ) {
            return false
          }
        }

        if (!omit.maxDomingosAlMes) {
          if (
            dayOfWeek === 0 &&
            getSundaysWorked(member.id, assignments, day) >=
              settings.maxDomingosAlMes
          ) {
            return false
          }
        }

        if (!omit.maxHorasSemanales) {
          const weeklyHours = getWeeklyHours(member.id, assignments, day)
          const memberMax = member.horasContrato || settings.maxHorasSemanales
          if (weeklyHours + shift.horas > memberMax) {
            return false
          }
        }

        if (!omit.maxDiasTrabajoSemana) {
          if (
            getDaysWorkedInWeek(member.id, assignments, day) >=
            settings.maxDiasTrabajoSemana
          ) {
            return false
          }
        }

        return true
      })

      if (eligibleShifts.length === 0) continue

      const shift = eligibleShifts[0]
      const shiftStart = new Date(day)
      shiftStart.setHours(shift.horaInicio, 0, 0, 0)
      const shiftEnd = new Date(day)
      shiftEnd.setHours(shift.horaFin, 0, 0, 0)
      if (shift.horaFin <= shift.horaInicio) {
        shiftEnd.setDate(shiftEnd.getDate() + 1)
      }

      assignments.push({
        id: crypto.randomUUID(),
        staffId: member.id,
        staffName: member.nombre,
        date: dateStr,
        shiftType: shift.id,
        shiftLabel: shift.nombre,
        startTime: shiftStart.toISOString(),
        endTime: shiftEnd.toISOString(),
        hours: shift.horas,
        isHoliday,
      })
      assignedToday++
    }

    if (
      !omit.minColaboradoresPorDia &&
      assignedToday < settings.minColaboradoresPorDia
    ) {
      warnings.push(
        `${dateStr}: Solo ${assignedToday}/${settings.minColaboradoresPorDia} colaboradores disponibles`
      )
    }
  }

  return { assignments, warnings }
}
