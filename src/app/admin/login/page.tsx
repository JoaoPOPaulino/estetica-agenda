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

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user!.id).single()

    if (profile?.role !== 'super_admin' && profile?.role !== 'professional') {
      await supabase.auth.signOut()
      setError('Acesso negado. Esta área é restrita.')
      setLoading(false)
      return
    }

    if (profile?.role === 'super_admin') {
      router.push('/admin')
    } else {
      router.push('/profissional')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page {
          min-height: 100vh;
          background: linear-gradient(160deg, #F2D4CC 0%, #E8B4A8 40%, #C4786A 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'Jost', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .page::before {
          content: '';
          position: absolute;
          top: -150px; left: -150px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(196,120,106,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .page::after {
          content: '';
          position: absolute;
          bottom: -100px; right: -100px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,58,58,0.2) 0%, transparent 70%);
          pointer-events: none;
        }
        .back-link {
          position: absolute;
          top: 1.5rem; left: 1.5rem;
          font-size: 0.78rem; letter-spacing: 0.1em;
          color: rgba(107,45,45,0.6);
          text-decoration: none;
          transition: color 0.2s;
          z-index: 1;
        }
        .back-link:hover { color: rgba(242,212,204,0.9); }
        .card {
          background: rgba(255,255,255,0.35);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(196,120,106,0.2);
          border-radius: 32px;
          padding: 3rem 2.5rem;
          max-width: 400px;
          width: 100%;
          position: relative;
          z-index: 1;
          box-shadow: 0 8px 40px rgba(0,0,0,0.3);
        }
        .icon { font-size: 2rem; margin-bottom: 1.2rem; }
        .title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem;
          font-weight: 600;
          color: #6B2D2D;
          margin-bottom: 0.2rem;
        }
        .subtitle {
          font-size: 0.72rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #C4786A;
          margin-bottom: 0.5rem;
        }
        .divider {
          width: 40px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(196,120,106,0.5), transparent);
          margin: 1.5rem 0;
        }
        .form-group { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
        input {
          width: 100%;
          padding: 0.9rem 1.2rem;
          background: rgba(255,255,255,0.5);
          border: 1.5px solid rgba(139,58,58,0.2);
          border-radius: 14px;
          font-family: 'Jost', sans-serif;
          font-size: 0.9rem;
          color: #4A2020;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        input:focus { border-color: rgba(196,120,106,0.6); background: rgba(255,255,255,0.1); }
        input::placeholder { color: #C4A090; }
        .error-msg {
          font-size: 0.78rem;
          color: #E8A090;
          margin-bottom: 1rem;
          padding: 0.7rem 1rem;
          background: rgba(192,57,43,0.15);
          border: 1px solid rgba(192,57,43,0.3);
          border-radius: 10px;
        }
        .btn-primary {
          width: 100%; padding: 1rem;
          background: linear-gradient(135deg, #C4786A 0%, #8B3A3A 100%);
          color: #F7EDE8; border: none; border-radius: 100px;
          font-family: 'Jost', sans-serif; font-size: 0.85rem; font-weight: 500;
          letter-spacing: 0.15em; text-transform: uppercase;
          cursor: pointer; transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(139,58,58,0.4);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(139,58,58,0.5); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .footer-text {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.7rem;
          color: rgba(196,120,106,0.4);
          letter-spacing: 0.1em;
        }
      `}</style>

      <main className="page">
        <a href="/" className="back-link">← Voltar ao site</a>
        <div className="card">
          <div className="icon">🔐</div>
          <h1 className="title">Área Restrita</h1>
          <p className="subtitle">Thamyres Ribeiro — Acesso interno</p>
          <div className="divider" />

          {error && <p className="error-msg">{error}</p>}

         <div className="form-group">
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <a href="/recuperar-senha" style={{
            fontSize: '0.72rem',
            color: 'rgba(196,120,106,0.7)',
            textDecoration: 'none',
            alignSelf: 'flex-end',
            marginTop: '-0.3rem',
            transition: 'color 0.2s'
          }}>
            Esqueci minha senha
          </a>
        </div>

          <button className="btn-primary" onClick={handleLogin} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="footer-text">✦ Acesso exclusivo para equipe ✦</p>
        </div>
      </main>
    </>
  )
}