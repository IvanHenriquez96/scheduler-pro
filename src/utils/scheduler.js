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

function canWorkShift(member, shift) {
  if (!member.turnosAsignados || member.turnosAsignados.length === 0) return true
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

    for (const shift of shifts) {
      if (shift.tipo === 'weekends' && !isWeekend && !isHoliday) continue

      const shiftStart = new Date(day)
      shiftStart.setHours(shift.horaInicio, 0, 0, 0)
      const shiftEnd = new Date(day)
      shiftEnd.setHours(shift.horaFin, 0, 0, 0)
      if (shift.horaFin <= shift.horaInicio) {
        shiftEnd.setDate(shiftEnd.getDate() + 1)
      }

      const candidates = staff.filter((member) => {
        if (!canWorkShift(member, shift)) return false

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

        if (!isAvailableForShift(member, dayOfWeek, shift)) {
          return false
        }

        return true
      })

      const shuffled = shuffle(candidates)
      const toAssign = Math.min(
        shuffled.length,
        settings.minColaboradoresPorDia
      )

      if (
        !omit.minColaboradoresPorDia &&
        toAssign < settings.minColaboradoresPorDia
      ) {
        warnings.push(
          `${dateStr} (${shift.nombre}): Solo ${toAssign}/${settings.minColaboradoresPorDia} colaboradores disponibles`
        )
      }

      for (let i = 0; i < toAssign; i++) {
        assignments.push({
          id: crypto.randomUUID(),
          staffId: shuffled[i].id,
          staffName: shuffled[i].nombre,
          date: dateStr,
          shiftType: shift.id,
          shiftLabel: shift.nombre,
          startTime: shiftStart.toISOString(),
          endTime: shiftEnd.toISOString(),
          hours: shift.horas,
          isHoliday,
        })
      }
    }
  }

  return { assignments, warnings }
}
