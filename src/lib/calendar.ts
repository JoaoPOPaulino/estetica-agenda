export async function createCalendarEvent(
  clientName: string,
  serviceName: string,
  scheduledAt: string,
  durationMinutes: number
) {
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + durationMinutes * 60000)

  await fetch('/api/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: `${serviceName} — ${clientName}`,
      description: `Agendamento de ${serviceName} para ${clientName}`,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    }),
  })
}