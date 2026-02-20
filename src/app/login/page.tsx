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
  const [message, setMessage] = useState('') // Para mensagens de sucesso
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou senha inválidos.'); setLoading(false); return }
    router.push('/meus-agendamentos')
  }

  // Função para recuperação de senha
  async function handleForgotPassword() {
    if (!email) {
      setError('Por favor, digite seu email primeiro.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setMessage('Link de recuperação enviado para o seu email!')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page {
          min-height: 100vh;
          background-color: #F7EDE8;
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(196,120,106,0.12) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(242,212,204,0.4) 0%, transparent 50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'Jost', sans-serif;
          position: relative;
        }
        .back-link {
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          font-family: 'Jost', sans-serif;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
          color: #8B3A3A;
          text-decoration: none;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .back-link:hover { opacity: 1; }
        .card {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(196,120,106,0.2);
          border-radius: 32px;
          padding: 3rem 2.5rem;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 4px 24px rgba(139,58,58,0.08);
        }
        .brand-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem;
          font-weight: 600;
          color: #6B2D2D;
          margin-bottom: 0.2rem;
        }
        .subtitle {
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          color: #C4786A;
          margin-bottom: 2.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        input {
          width: 100%;
          padding: 0.9rem 1.2rem;
          background: rgba(247,237,232,0.6);
          border: 1.5px solid rgba(196,120,106,0.25);
          border-radius: 14px;
          font-family: 'Jost', sans-serif;
          font-size: 0.9rem;
          color: #4A2020;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        input:focus {
          border-color: #C4786A;
          background: rgba(255,255,255,0.8);
        }
        input::placeholder { color: #C4A090; }
        .error-msg {
          font-size: 0.78rem;
          color: #C0392B;
          margin-bottom: 1rem;
          padding: 0.7rem 1rem;
          background: rgba(192,57,43,0.08);
          border-radius: 10px;
        }
        .success-msg {
          font-size: 0.78rem;
          color: #27AE60;
          margin-bottom: 1rem;
          padding: 0.7rem 1rem;
          background: rgba(39, 174, 96, 0.08);
          border-radius: 10px;
        }
        .btn-primary {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #8B3A3A 0%, #6B2D2D 100%);
          color: #F7EDE8;
          border: none;
          border-radius: 100px;
          font-family: 'Jost', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(107,45,45,0.3);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(107,45,45,0.4); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .footer-link {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.8rem;
          color: #C4786A;
        }
        .footer-link a { color: #8B3A3A; font-weight: 500; text-decoration: none; }
        .footer-link a:hover { text-decoration: underline; }
        .forgot-link {
          background: none;
          border: none;
          font-family: 'Jost', sans-serif;
          font-size: 0.75rem;
          color: #C4786A;
          cursor: pointer;
          text-decoration: underline;
          align-self: flex-end;
          margin-top: -0.5rem;
        }
        .divider {
          width: 40px; height: 1px;
          background: linear-gradient(90deg, transparent, #C4786A, transparent);
          margin: 0 auto 2rem;
        }
      `}</style>

      <main className="page">
        <Link href="/" className="back-link">← Voltar</Link>
        <div className="card">
          <h1 className="brand-name">Bem-vinda de volta</h1>
          <p className="subtitle">Acesse sua conta para agendar</p>
          <div className="divider" />

          {error && <p className="error-msg">{error}</p>}
          {message && <p className="success-msg">{message}</p>}

          <div className="form-group">
            <input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Link href="/recuperar-senha" className="forgot-link">
              Esqueci minha senha
            </Link>
          </div>

          <button className="btn-primary" onClick={handleLogin} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="footer-link">
            Não tem conta?{' '}
            <Link href="/cadastro">Cadastre-se</Link>
          </p>
        </div>
      </main>
    </>
  )
}