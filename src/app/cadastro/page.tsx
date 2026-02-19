'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function CadastroPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

 async function handleCadastro() {
  setLoading(true)
  setError('')
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  })

  console.log('ERRO:', error)
  console.log('DATA:', data)

  if (error) {
    setError(error.message) // mostra o erro real na tela
    setLoading(false)
    return
  }

  router.push('/agendar')
}

  return (
    <main className="min-h-screen bg-rose-50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-rose-700 mb-1">Criar conta</h1>
        <p className="text-sm text-gray-400 mb-6">Rápido e gratuito</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Seu nome completo"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400"
          />
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400"
          />
          <input
            type="tel"
            placeholder="WhatsApp (ex: 11999999999)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400"
          />
          <input
            type="password"
            placeholder="Crie uma senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400"
          />
          <button
            onClick={handleCadastro}
            disabled={loading}
            className="bg-rose-600 text-white py-3 rounded-xl font-semibold hover:bg-rose-700 transition disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-rose-600 font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}