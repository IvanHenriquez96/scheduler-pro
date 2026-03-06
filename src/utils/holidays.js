export async function fetchHolidays() {
  try {
    const response = await fetch('https://api.boostr.cl/holidays.json')
    const data = await response.json()
    if (data?.status === 'success' && Array.isArray(data.data)) {
      return data.data.map((h) => ({
        date: h.date,
        title: h.title,
      }))
    }
    return []
  } catch (error) {
    console.error('Error fetching holidays:', error)
    return []
  }
}
