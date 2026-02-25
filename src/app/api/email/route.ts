import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateICS(summary: string, description: string, startTime: string, endTime: string, location: string) {
  const formatDate = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, '').replace('.000', '')

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Thamyres Ribeiro//Agendamento//PT
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:${formatDate(startTime)}
DTEND:${formatDate(endTime)}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT60M
ACTION:DISPLAY
DESCRIPTION:Lembrete: ${summary} em 1 hora
END:VALARM
END:VEVENT
END:VCALENDAR`
}

export async function POST(req: NextRequest) {
  const { clientEmail, clientName, serviceName, professionalName, startTime, endTime } = await req.json()

  const icsContent = generateICS(
    `${serviceName} — Thamyres Ribeiro`,
    `Seu agendamento foi confirmado!\\nServiço: ${serviceName}\\nProfissional: ${professionalName}`,
    startTime,
    endTime,
    'Thamyres Ribeiro Clínica Estética e Saúde'
  )

  const startDate = new Date(startTime)
  const dateStr = startDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })
  const timeStr = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

  try {
    await resend.emails.send({
      from: 'Thamyres Ribeiro <onboarding@resend.dev>',
      to: clientEmail,
      subject: `✨ Agendamento confirmado — ${serviceName}`,
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 500px; margin: 0 auto; background: #F7EDE8; padding: 2rem; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 2rem;">
            <h1 style="font-size: 1.8rem; color: #6B2D2D; margin: 0;">Thamyres Ribeiro</h1>
            <p style="font-size: 0.75rem; letter-spacing: 0.2em; color: #C4786A; margin: 0.3rem 0 0;">CLÍNICA ESTÉTICA E SAÚDE</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid rgba(196,120,106,0.2);">
            <p style="font-size: 1.4rem; color: #6B2D2D; margin: 0 0 1rem; text-align: center;">🌸 Agendamento Confirmado!</p>
            <p style="color: #4A2020; margin: 0 0 1.2rem;">Olá, <strong>${clientName}</strong>! Seu agendamento foi realizado com sucesso.</p>

            <div style="background: #F7EDE8; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
              <p style="margin: 0 0 0.5rem; color: #8B3A3A;"><strong>📋 Serviço:</strong> ${serviceName}</p>
              <p style="margin: 0 0 0.5rem; color: #8B3A3A;"><strong>👩‍⚕️ Profissional:</strong> ${professionalName}</p>
              <p style="margin: 0 0 0.5rem; color: #8B3A3A;"><strong>📅 Data:</strong> ${dateStr}</p>
              <p style="margin: 0; color: #8B3A3A;"><strong>⏰ Horário:</strong> ${timeStr}</p>
            </div>

            <p style="font-size: 0.8rem; color: #C4786A; text-align: center; margin: 0;">
              O arquivo em anexo permite adicionar o evento ao seu calendário.
            </p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; border: 1px solid rgba(196,120,106,0.2); text-align: center;">
            <p style="font-size: 0.8rem; color: #8B3A3A; margin: 0 0 0.5rem;"><strong>📍 Endereço</strong></p>
            <p style="font-size: 0.8rem; color: #C4786A; margin: 0;">Thamyres Ribeiro Clínica Estética e Saúde</p>
          </div>

          <div style="text-align: center;">
            <a href="https://wa.me/+556392906871" style="display: inline-block; padding: 0.75rem 2rem; background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8; text-decoration: none; border-radius: 100px; font-size: 0.8rem; letter-spacing: 0.1em;">
              📱 Falar no WhatsApp
            </a>
          </div>

          <p style="text-align: center; font-size: 0.7rem; color: #C4A090; margin-top: 1.5rem;">
            ✦ Beleza • Saúde • Bem-estar ✦
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'agendamento.ics',
          content: Buffer.from(icsContent).toString('base64'),
        }
      ]
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 })
  }
}