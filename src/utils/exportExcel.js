import * as XLSX from 'xlsx'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function exportScheduleToExcel(assignments, staff) {
  const rows = assignments.map((a) => ({
    Fecha: format(parseISO(a.date), 'dd/MM/yyyy'),
    Día: format(parseISO(a.date), 'EEEE', { locale: es }),
    Colaborador: a.staffName,
    Turno: a.shiftLabel,
    'Hora Inicio': format(new Date(a.startTime), 'HH:mm'),
    'Hora Fin': format(new Date(a.endTime), 'HH:mm'),
    Horas: a.hours,
    Feriado: a.isHoliday ? 'Sí' : 'No',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Planificación')

  const summaryRows = staff.map((member) => {
    const memberAssignments = assignments.filter(
      (a) => a.staffId === member.id
    )
    const totalHours = memberAssignments.reduce((sum, a) => sum + a.hours, 0)
    return {
      Colaborador: member.nombre,
      Rol: member.rol,
      'Total Turnos': memberAssignments.length,
      'Total Horas': totalHours,
      'Horas Contrato': member.horasContrato,
    }
  })

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')

  XLSX.writeFile(workbook, `planificacion-${format(new Date(), 'yyyy-MM')}.xlsx`)
}
