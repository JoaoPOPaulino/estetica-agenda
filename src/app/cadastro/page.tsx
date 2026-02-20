'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function validatePhone(phone: string) {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 11
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePassword(password: string) {
  return password.length >= 6
}

export default function CadastroPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const newErrors: Record<string, string> = {}

    if (fullName.trim().length < 3)
      newErrors.fullName = 'Nome deve ter pelo menos 3 caracteres.'

    if (!validateEmail(email))
      newErrors.email = 'Email inválido.'

    if (!validatePhone(phone))
      newErrors.phone = 'Telefone inválido. Use DDD + número (ex: 11999999999).'

    if (!validatePassword(password))
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres.'

    if (password !== confirmPassword)
      newErrors.confirmPassword = 'As senhas não coincidem.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleCadastro() {
    if (!validate()) return

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })

    if (error) {
      setErrors({ geral: error.message })
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles')
        .update({ phone: phone.replace(/\D/g, ''), full_name: fullName })
        .eq('id', user.id)
    }

    router.push('/agendar')
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
            radial-gradient(ellipse at 80% 50%, rgba(196,120,106,0.12) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 20%, rgba(242,212,204,0.4) 0%, transparent 50%);
          display: flex;
          flex-direction: column;
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
          margin-bottom: 2rem;
        }
        .divider {
          width: 40px; height: 1px;
          background: linear-gradient(90deg, transparent, #C4786A, transparent);
          margin: 0 auto 2rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
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
        input:focus { border-color: #C4786A; background: rgba(255,255,255,0.8); }
        input::placeholder { color: #C4A090; }
        input.has-error { border-color: #C0392B; background: rgba(192,57,43,0.04); }
        .field-error {
          font-size: 0.72rem;
          color: #C0392B;
          padding-left: 0.3rem;
        }
        .error-geral {
          font-size: 0.78rem;
          color: #C0392B;
          margin-bottom: 1rem;
          padding: 0.7rem 1rem;
          background: rgba(192,57,43,0.08);
          border-radius: 10px;
        }
        .password-hint {
          font-size: 0.72rem;
          color: #C4A090;
          padding-left: 0.3rem;
        }
        .strength-bar {
          height: 3px;
          border-radius: 3px;
          background: #F2D4CC;
          margin-top: 0.3rem;
          overflow: hidden;
        }
        .strength-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s, background 0.3s;
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
      `}</style>

      <main className="page">
        <div className="card">
          <h1 className="brand-name">Criar conta</h1>
          <p className="subtitle">Rápido e gratuito</p>
          <div className="divider" />

          {errors.geral && <p className="error-geral">{errors.geral}</p>}

          <div className="form-group">

            <div className="field">
              <input
                type="text"
                placeholder="Nome completo"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className={errors.fullName ? 'has-error' : ''}
              />
              {errors.fullName && <span className="field-error">⚠ {errors.fullName}</span>}
            </div>

            <div className="field">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={errors.email ? 'has-error' : ''}
              />
              {errors.email && <span className="field-error">⚠ {errors.email}</span>}
            </div>

            <div className="field">
              <input
                type="tel"
                placeholder="WhatsApp (ex: 11999999999)"
                value={phone}
                onChange={e => {
                  const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 11)
                  setPhone(onlyNumbers)
                }}
                className={errors.phone ? 'has-error' : ''}
                maxLength={11}
                inputMode="numeric"
              />
            </div>

            <div className="field">
              <input
                type="password"
                placeholder="Crie uma senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={errors.password ? 'has-error' : ''}
              />
              <div className="strength-bar">
                <div className="strength-fill" style={{
                  width: password.length === 0 ? '0%' : password.length < 6 ? '33%' : password.length < 10 ? '66%' : '100%',
                  background: password.length < 6 ? '#E74C3C' : password.length < 10 ? '#E67E22' : '#27AE60'
                }} />
              </div>
              {errors.password
                ? <span className="field-error">⚠ {errors.password}</span>
                : <span className="password-hint">Mínimo 6 caracteres</span>
              }
            </div>

            <div className="field">
              <input
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={errors.confirmPassword ? 'has-error' : ''}
              />
              {errors.confirmPassword && <span className="field-error">⚠ {errors.confirmPassword}</span>}
            </div>

          </div>

          <button className="btn-primary" onClick={handleCadastro} disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>

          <p className="footer-link">
            Já tem conta?{' '}
            <Link href="/login">Entrar</Link>
          </p>
        </div>
      </main>
    </>
  )
}