'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/agendar')
  }

  return (
    <main className="min-h-screen bg-rose-50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-rose-700 mb-1">Entrar</h1>
        <p className="text-sm text-gray-400 mb-6">Acesse sua conta para agendar</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400"
          />
          <input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-rose-600 text-white py-3 rounded-xl font-semibold hover:bg-rose-700 transition disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-rose-600 font-medium">
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  )
}