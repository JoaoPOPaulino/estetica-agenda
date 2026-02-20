import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
})

export async function POST(req: NextRequest) {
  const { summary, description, startTime, endTime } = await req.json()

  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        description,
        start: { dateTime: startTime, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: endTime, timeZone: 'America/Sao_Paulo' },
      },
    })

    return NextResponse.json({ success: true, eventId: event.data.id })
  } catch (error) {
    console.error('Erro Google Calendar:', error)
    return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 })
  }
}