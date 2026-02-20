'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError('Link inválido ou expirado.')
      }
    })
  }, [])

  async function handleUpdatePassword() {
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    setLoading(true)
    setError('')
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Erro ao atualizar senha: ' + error.message)
      setLoading(false)
    } else {
      setMessage('Senha atualizada com sucesso!')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Jost:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page {
          min-height: 100vh;
          background-color: #F7EDE8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'Jost', sans-serif;
        }
        .card {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(196,120,106,0.2);
          border-radius: 32px;
          padding: 3rem 2.5rem;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 4px 24px rgba(139,58,58,0.08);
          text-align: center;
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
        }
        .error-msg { font-size: 0.78rem; color: #C0392B; margin-bottom: 1rem; }
        .success-msg { font-size: 0.78rem; color: #27AE60; margin-bottom: 1rem; }
      `}</style>

      <main className="page">
        <div className="card">
          <h1 className="brand-name">Nova Senha</h1>
          <p className="subtitle">Crie sua nova senha de acesso</p>

          {error && <p className="error-msg">{error}</p>}
          {message && <p className="success-msg">{message}</p>}

          <div className="form-group">
            <input
              type="password"
              placeholder="Digite a nova senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={handleUpdatePassword} disabled={loading}>
            {loading ? 'Salvando...' : 'Atualizar Senha'}
          </button>
        </div>
      </main>
    </>
  )
}