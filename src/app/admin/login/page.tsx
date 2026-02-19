'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Email ou senha inválidos.')
      setLoading(false)
      return
    }

    // Verifica se é admin
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single()

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setError('Acesso negado. Esta área é restrita.')
      setLoading(false)
      return
    }

    router.push('/admin')
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 w-full max-w-sm rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Área Restrita</h1>
        <p className="text-sm text-gray-400 mb-6">Acesso exclusivo para administradores</p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-rose-400"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-rose-400"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-rose-600 text-white py-3 rounded-xl font-semibold hover:bg-rose-700 transition disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </main>
  )
}