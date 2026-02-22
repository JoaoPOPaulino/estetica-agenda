'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/navbar'

export default function PerfilPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<'perfil' | 'senha'>('perfil')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setEmail(user.email ?? '')
      const { data: profile } = await supabase
        .from('profiles').select('full_name, phone, avatar_url').eq('id', user.id).single()
      if (profile) {
        setFullName(profile.full_name ?? '')
        setPhone(profile.phone ?? '')
        setAvatarUrl(profile.avatar_url ?? '')
        setAvatarPreview(profile.avatar_url ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSaveProfile() {
    setSaving(true)
    setMsg(null)
    const supabase = createClient()

    let newAvatarUrl = avatarUrl
    const file = fileRef.current?.files?.[0]
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${userId}.${ext}`.replace(/avatars\//g, '')
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(path, file, { upsert: true })
      if (uploadError) {
        setMsg({ type: 'error', text: 'Erro ao enviar foto.' })
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      newAvatarUrl = urlData.publicUrl + '?t=' + Date.now()
      setAvatarUrl(newAvatarUrl)
      setAvatarPreview(newAvatarUrl)
    }

    const { error } = await supabase.from('profiles')
      .update({ full_name: fullName, phone: phone.replace(/\D/g, ''), avatar_url: newAvatarUrl })
      .eq('id', userId)

    setSaving(false)
    if (error) setMsg({ type: 'error', text: 'Erro ao salvar.' })
    else setMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' })
  }

  async function handleChangePassword() {
    setPwMsg(null)
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwMsg({ type: 'error', text: 'Preencha todos os campos.' }); return
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'As senhas não coincidem.' }); return
    }
    if (newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' }); return
    }
    setSaving(true)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (signInError) {
      setPwMsg({ type: 'error', text: 'Senha atual incorreta.' })
      setSaving(false)
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) setPwMsg({ type: 'error', text: 'Erro ao atualizar senha.' })
    else {
      setPwMsg({ type: 'success', text: 'Senha alterada com sucesso!' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    }
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setAvatarPreview(URL.createObjectURL(file))
  }

  if (loading) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { min-height: 100vh; background: #F7EDE8; display: flex; align-items: center; justify-content: center; font-family: 'Jost', sans-serif; }
        .loading { color: #C4786A; font-size: 0.85rem; letter-spacing: 0.1em; }
      `}</style>
      <main className="page"><p className="loading">Carregando...</p></main>
    </>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Jost:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page {
          min-height: 100vh;
          background-color: #F7EDE8;
          background-image:
            radial-gradient(ellipse at 20% 30%, rgba(196,120,106,0.1) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 70%, rgba(242,212,204,0.3) 0%, transparent 50%);
          padding: 2rem 1.2rem 4rem;
          font-family: 'Jost', sans-serif;
        }
        .container { max-width: 480px; margin: 0 auto; }
        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem; font-weight: 600; color: #6B2D2D; margin-bottom: 0.2rem;
        }
        .page-subtitle { font-size: 0.78rem; letter-spacing: 0.1em; color: #C4786A; margin-bottom: 1.5rem; }

        .avatar-section {
          display: flex; align-items: center; gap: 1.2rem; margin-bottom: 1.8rem;
        }
        .avatar {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #F2D4CC, #E8B4A8);
          border: 2px solid rgba(196,120,106,0.3);
          flex-shrink: 0; display: flex; align-items: center;
          justify-content: center; font-size: 2rem; overflow: hidden;
        }
        .avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .avatar-info p { font-size: 0.9rem; font-weight: 500; color: #4A2020; margin-bottom: 0.4rem; }
        .btn-upload {
          padding: 0.45rem 1rem; border-radius: 100px;
          border: 1.5px solid rgba(139,58,58,0.3); background: none;
          font-family: 'Jost', sans-serif; font-size: 0.72rem; font-weight: 500;
          color: #8B3A3A; cursor: pointer; transition: all 0.2s; letter-spacing: 0.05em;
        }
        .btn-upload:hover { background: rgba(139,58,58,0.06); }

        .tabs {
          display: flex; gap: 0.4rem; margin-bottom: 1.2rem;
          background: rgba(255,255,255,0.5);
          border: 1.5px solid rgba(196,120,106,0.15);
          border-radius: 100px; padding: 0.3rem;
        }
        .tab-btn {
          flex: 1; padding: 0.6rem; border-radius: 100px; border: none;
          font-family: 'Jost', sans-serif; font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.06em; cursor: pointer; transition: all 0.25s;
          background: none; color: #C4786A;
        }
        .tab-btn.active {
          background: linear-gradient(135deg, #8B3A3A, #6B2D2D);
          color: #F7EDE8;
          box-shadow: 0 2px 12px rgba(107,45,45,0.25);
        }

        .card {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(196,120,106,0.15);
          border-radius: 24px;
          padding: 1.8rem;
        }
        .form-group { display: flex; flex-direction: column; gap: 0.9rem; }
        .field-label {
          font-size: 0.68rem; letter-spacing: 0.12em; color: #C4786A;
          margin-bottom: 0.3rem; text-transform: uppercase;
        }
        input[type="text"], input[type="email"], input[type="password"], input[type="tel"] {
          width: 100%; padding: 0.85rem 1.1rem;
          background: rgba(247,237,232,0.6);
          border: 1.5px solid rgba(196,120,106,0.2);
          border-radius: 12px;
          font-family: 'Jost', sans-serif; font-size: 0.88rem; color: #4A2020;
          outline: none; transition: border-color 0.2s, background 0.2s;
        }
        input:focus { border-color: #C4786A; background: rgba(255,255,255,0.8); }
        input::placeholder { color: #C4A090; }
        input:disabled { opacity: 0.5; cursor: not-allowed; }
        .divider { height: 1px; background: linear-gradient(90deg, rgba(196,120,106,0.2), transparent); margin: 0.5rem 0; }
        .msg {
          font-size: 0.78rem; padding: 0.7rem 1rem;
          border-radius: 10px; margin-top: 1rem;
        }
        .msg.success { color: #27AE60; background: rgba(39,174,96,0.08); border: 1px solid rgba(39,174,96,0.2); }
        .msg.error { color: #C0392B; background: rgba(192,57,43,0.08); border: 1px solid rgba(192,57,43,0.2); }
        .btn-save {
          width: 100%; padding: 1rem; margin-top: 1.2rem;
          background: linear-gradient(135deg, #8B3A3A 0%, #6B2D2D 100%);
          color: #F7EDE8; border: none; border-radius: 100px;
          font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 500;
          letter-spacing: 0.15em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(107,45,45,0.25);
        }
        .btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(107,45,45,0.35); }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      `}</style>

      <Navbar />
      <main className="page">
        <div className="container">
          <h1 className="page-title">Meu Perfil</h1>
          <p className="page-subtitle">Gerencie suas informações</p>

          <div className="avatar-section">
            <div className="avatar">
              {avatarPreview ? <img src={avatarPreview} alt="foto" /> : '🪷'}
            </div>
            <div className="avatar-info">
              <p>{fullName || 'Seu nome'}</p>
              <button className="btn-upload" onClick={() => fileRef.current?.click()}>
                Alterar foto
              </button>
              <input
                ref={fileRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tab-btn ${tab === 'perfil' ? 'active' : ''}`}
              onClick={() => { setTab('perfil'); setMsg(null) }}
            >
              Dados Pessoais
            </button>
            <button
              className={`tab-btn ${tab === 'senha' ? 'active' : ''}`}
              onClick={() => { setTab('senha'); setPwMsg(null) }}
            >
              Trocar Senha
            </button>
          </div>

          {tab === 'perfil' && (
            <div className="card">
              <div className="form-group">
                <div>
                  <p className="field-label">Nome completo</p>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome" />
                </div>
                <div>
                  <p className="field-label">Telefone</p>
                  <input type="tel" value={phone} onChange={handlePhoneChange} placeholder="DDD + número" inputMode="numeric" />
                </div>
                <div>
                  <p className="field-label">Email</p>
                  <input type="email" value={email} disabled />
                </div>
              </div>
              {msg && <p className={`msg ${msg.type}`}>{msg.text}</p>}
              <button className="btn-save" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          )}

          {tab === 'senha' && (
            <div className="card">
              <div className="form-group">
                <div>
                  <p className="field-label">Senha atual</p>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Digite a senha atual" />
                </div>
                <div className="divider" />
                <div>
                  <p className="field-label">Nova senha</p>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
                <div>
                  <p className="field-label">Confirmar nova senha</p>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" />
                </div>
              </div>
              {pwMsg && <p className={`msg ${pwMsg.type}`}>{pwMsg.text}</p>}
              <button className="btn-save" onClick={handleChangePassword} disabled={saving}>
                {saving ? 'Salvando...' : 'Alterar Senha'}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}