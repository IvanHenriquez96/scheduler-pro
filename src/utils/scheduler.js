import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addHours,
  isBefore,
  startOfWeek,
  endOfWeek,
  isSameWeek,
  format,
  isSameMonth,
  parseISO,
} from 'date-fns'

const SHIFT_DEFINITIONS = {
  morning: { label: 'Mañana', start: 8, end: 14, hours: 6 },
  afternoon: { label: 'Tarde', start: 14, end: 20, hours: 6 },
  night: { label: 'Noche', start: 20, end: 2, hours: 6 },
}

const DAY_NAMES = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
]

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
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

function isAvailable(member, dayOfWeek, shiftType) {
  if (!member.disponibilidad || member.disponibilidad.length === 0) return true
  const dayName = DAY_NAMES[dayOfWeek]
  const dayAvailability = member.disponibilidad.find(
    (d) => d.dia === dayName
  )
  if (!dayAvailability) return false

  const shift = SHIFT_DEFINITIONS[shiftType]
  return (
    dayAvailability.inicio <= shift.start && dayAvailability.fin >= shift.end
  )
}

function matchesShiftPreference(member, shiftType) {
  if (!member.restriccionTurno || member.restriccionTurno === 'any') return true
  if (member.restriccionTurno === 'morning' && shiftType === 'morning')
    return true
  if (member.restriccionTurno === 'afternoon' && shiftType === 'afternoon')
    return true
  if (member.restriccionTurno === 'night' && shiftType === 'night') return true
  if (member.restriccionTurno === 'weekends') {
    return true
  }
  return false
}

export function generateSchedule(staff, settings, holidays, targetMonth) {
  const year = targetMonth.getFullYear()
  const month = targetMonth.getMonth()
  const monthStart = startOfMonth(new Date(year, month))
  const monthEnd = endOfMonth(new Date(year, month))
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const holidayDates = new Set(holidays.map((h) => h.date))
  const assignments = []
  const warnings = []

  for (const day of days) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayOfWeek = getDay(day)
    const isHoliday = holidayDates.has(dateStr)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    const shiftsToFill = ['morning', 'afternoon']

    for (const shiftType of shiftsToFill) {
      const shift = SHIFT_DEFINITIONS[shiftType]
      const shiftStart = new Date(day)
      shiftStart.setHours(shift.start, 0, 0, 0)
      const shiftEnd = new Date(day)
      shiftEnd.setHours(shift.end, 0, 0, 0)
      if (shift.end < shift.start) {
        shiftEnd.setDate(shiftEnd.getDate() + 1)
      }

      const candidates = staff.filter((member) => {
        if (settings.omitirReglas) return true

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

        if (
          dayOfWeek === 0 &&
          getSundaysWorked(member.id, assignments, day) >=
            settings.maxDomingosAlMes
        ) {
          return false
        }

        const weeklyHours = getWeeklyHours(member.id, assignments, day)
        const memberMax = member.horasContrato || settings.maxHorasSemanales
        if (weeklyHours + shift.hours > memberMax) {
          return false
        }

        if (
          getDaysWorkedInWeek(member.id, assignments, day) >=
          settings.maxDiasTrabajoSemana
        ) {
          return false
        }

        if (!isAvailable(member, dayOfWeek, shiftType)) {
          return false
        }

        if (!matchesShiftPreference(member, shiftType)) {
          if (
            member.restriccionTurno === 'weekends' &&
            !isWeekend &&
            !isHoliday
          ) {
            return false
          }
        }

        return true
      })

      const shuffled = shuffle(candidates)
      const toAssign = Math.min(
        shuffled.length,
        settings.minColaboradoresPorDia
      )

      if (toAssign < settings.minColaboradoresPorDia) {
        warnings.push(
          `${dateStr} (${shift.label}): Solo ${toAssign}/${settings.minColaboradoresPorDia} colaboradores disponibles`
        )
      }

      for (let i = 0; i < toAssign; i++) {
        assignments.push({
          id: crypto.randomUUID(),
          staffId: shuffled[i].id,
          staffName: shuffled[i].nombre,
          date: dateStr,
          shiftType,
          shiftLabel: shift.label,
          startTime: shiftStart.toISOString(),
          endTime: shiftEnd.toISOString(),
          hours: shift.hours,
          isHoliday,
        })
      }
    }
  }

  return { assignments, warnings }
}

export { SHIFT_DEFINITIONS }
