import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { email, name } = await req.json()

  try {
    // Cria o usuário e envia email de convite
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: name }
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const userId = data.user.id

    // Define o role como professional
    await supabaseAdmin
      .from('profiles')
      .update({ role: 'professional', full_name: name })
      .eq('id', userId)

    // Cria o registro na tabela professionals
    await supabaseAdmin
      .from('professionals')
      .insert({ id: userId, name })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}