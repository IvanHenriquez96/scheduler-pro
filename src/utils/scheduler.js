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
  startOfWeek,
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

const DAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

/** Fisher-Yates shuffle */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getTotalHoursAssigned(staffId, assignments) {
  return assignments
    .filter((a) => a.staffId === staffId)
    .reduce((sum, a) => sum + a.hours, 0)
}

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

/** Estimate total monthly hours a staff member can work */
function getMonthlyCapacity(member, settings, totalDays) {
  const weeklyHours = member.horasContrato || settings.maxHorasSemanales
  const weeks = totalDays / 7
  return weeklyHours * weeks
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

  // Track which staff members are depleted (no more hours available)
  const depletedStaff = new Set()

  // Group days by week (weekStartsOn: Monday = 1)
  const weekMap = new Map()
  for (const day of days) {
    const weekKey = format(startOfWeek(day, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    if (!weekMap.has(weekKey)) weekMap.set(weekKey, [])
    weekMap.get(weekKey).push(day)
  }

  // Process weeks in chronological order, but randomize day order within each week.
  // This distributes days off randomly across all 7 days instead of always
  // leaving the same day(s) uncovered.
  const sortedWeeks = [...weekMap.keys()].sort()
  const processedDays = []
  for (const weekKey of sortedWeeks) {
    const weekDays = weekMap.get(weekKey)
    processedDays.push(...shuffle(weekDays))
  }

  for (const day of processedDays) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayOfWeek = getDay(day)
    const isHoliday = holidayDates.has(dateStr)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Shuffle staff randomly, then sort by least days assigned for fairness.
    // The initial shuffle ensures random tiebreaking when days are equal.
    const shuffled = shuffle(staff)
    const sorted = shuffled.sort((a, b) => {
      const aDays = getTotalDaysAssigned(a.id, assignments)
      const bDays = getTotalDaysAssigned(b.id, assignments)
      return aDays - bDays
    })

    let assignedToday = 0

    const maxPerDay = settings.maxColaboradoresPorDia || Infinity

    for (const member of sorted) {
      // Skip depleted staff
      if (depletedStaff.has(member.id)) continue

      // Stop if we reached the max collaborators for this day
      if (!omit.maxColaboradoresPorDia && assignedToday >= maxPerDay) break

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

      if (eligibleShifts.length === 0) {
        // Check if this member is fully depleted for the month
        const monthlyCapacity = getMonthlyCapacity(member, settings, days.length)
        const totalUsed = getTotalHoursAssigned(member.id, assignments)
        if (totalUsed >= monthlyCapacity) {
          depletedStaff.add(member.id)
        }
        continue
      }

      // Pick a random eligible shift instead of always the first one
      const shift = eligibleShifts[Math.floor(Math.random() * eligibleShifts.length)]
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

      // Check if member is now depleted after this assignment
      const monthlyCapacity = getMonthlyCapacity(member, settings, days.length)
      const totalUsed = getTotalHoursAssigned(member.id, assignments)
      if (totalUsed >= monthlyCapacity) {
        depletedStaff.add(member.id)
      }
    }

    const dayLabel = DAY_LABELS[dayOfWeek]
    if (assignedToday === 0) {
      warnings.push(
        `⚠️ ${dayLabel} ${dateStr}: Sin personal asignado. Considere agregar más colaboradores o ajustar la configuración.`
      )
    } else if (
      !omit.minColaboradoresPorDia &&
      assignedToday < settings.minColaboradoresPorDia
    ) {
      warnings.push(
        `${dayLabel} ${dateStr}: Solo ${assignedToday}/${settings.minColaboradoresPorDia} colaboradores asignados`
      )
    }
  }

  // Summary warning about depleted staff
  if (depletedStaff.size > 0) {
    const depletedNames = staff
      .filter((s) => depletedStaff.has(s.id))
      .map((s) => s.nombre)
    warnings.push(
      `ℹ️ ${depletedNames.length} colaborador(es) alcanzaron su capacidad máxima mensual: ${depletedNames.join(', ')}`
    )
  }

  return { assignments, warnings }
}
