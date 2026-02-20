import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Código não encontrado' }, { status: 400 })
  }

  const { tokens } = await oauth2Client.getToken(code)

  // Mostra os tokens no console para salvarmos no .env
  console.log('ACCESS TOKEN:', tokens.access_token)
  console.log('REFRESH TOKEN:', tokens.refresh_token)

  return NextResponse.json({
    message: 'Autenticado com sucesso! Copie o refresh_token do console do servidor.',
    refresh_token: tokens.refresh_token,
  })
}