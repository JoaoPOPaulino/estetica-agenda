import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, novaSenha } = await req.json()

    // Cliente com a chave SERVICE_ROLE para ignorar confirmações de e-mail
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Adicione esta chave no seu .env
    )

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: novaSenha }
    )

    if (error) throw error

    return NextResponse.json({ message: 'Senha alterada com sucesso!' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}