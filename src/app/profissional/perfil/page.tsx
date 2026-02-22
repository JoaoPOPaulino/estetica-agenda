'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ProfissionalPerfilPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<'dados' | 'sobre' | 'senha'>('dados')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')

  // Dados pessoais (profiles)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')

  // Sobre (professionals)
  const [bio, setBio] = useState('')
  const [specialties, setSpecialties] = useState('')

  // Senha
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role, full_name, phone, avatar_url').eq('id', user.id).single()
      if (profile?.role !== 'professional') { router.push('/'); return }

      setUserId(user.id)
      setEmail(user.email ?? '')
      setFullName(profile.full_name ?? '')
      setPhone(profile.phone ?? '')
      setAvatarUrl(profile.avatar_url ?? '')
      setAvatarPreview(profile.avatar_url ?? '')

      const { data: prof } = await supabase
        .from('professionals').select('bio, specialties').eq('id', user.id).single()
      if (prof) {
        setBio(prof.bio ?? '')
        setSpecialties(prof.specialties ?? '')
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleSaveDados() {
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

    const { error: profileError } = await supabase.from('profiles')
      .update({ full_name: fullName, phone: phone.replace(/\D/g, ''), avatar_url: newAvatarUrl })
      .eq('id', userId)

    // Sincroniza nome e foto na tabela professionals também
    await supabase.from('professionals')
      .update({ name: fullName, photo_url: newAvatarUrl })
      .eq('id', userId)

    setSaving(false)
    if (profileError) setMsg({ type: 'error', text: 'Erro ao salvar.' })
    else setMsg({ type: 'success', text: 'Dados atualizados com sucesso!' })
  }

  async function handleSaveSobre() {
    setSaving(true)
    setMsg(null)
    const supabase = createClient()
    const { error } = await supabase.from('professionals')
      .update({ bio, specialties })
      .eq('id', userId)
    setSaving(false)
    if (error) setMsg({ type: 'error', text: 'Erro ao salvar.' })
    else setMsg({ type: 'success', text: 'Informações salvas com sucesso!' })
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
          padding: 0 0 4rem;
          font-family: 'Jost', sans-serif;
        }
        .topbar {
          background: rgba(247,237,232,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(196,120,106,0.15);
          padding: 0.75rem 1.2rem;
          display: flex; justify-content: space-between; align-items: center;
          position: sticky; top: 0; z-index: 100;
        }
        .topbar-brand { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 600; color: #6B2D2D; }
        .topbar-links { display: flex; gap: 0.4rem; align-items: center; }
        .topbar-link {
          padding: 0.4rem 0.8rem; border-radius: 100px; font-size: 0.72rem;
          font-weight: 500; color: #8B5A5A; text-decoration: none;
          border: 1.5px solid transparent; transition: all 0.2s;
          font-family: 'Jost', sans-serif;
        }
        .topbar-link:hover { color: #6B2D2D; background: rgba(139,58,58,0.06); }
        .topbar-link.active { color: #6B2D2D; border-color: rgba(139,58,58,0.25); background: rgba(255,255,255,0.7); }
        .btn-logout {
          padding: 0.4rem 0.9rem; border-radius: 100px; font-size: 0.72rem;
          font-weight: 500; color: #C4786A; border: 1.5px solid rgba(196,120,106,0.3);
          background: none; cursor: pointer; font-family: 'Jost', sans-serif; transition: all 0.2s;
        }
        .btn-logout:hover { color: #8B3A3A; border-color: #8B3A3A; }
        .content { padding: 2rem 1.2rem; max-width: 480px; margin: 0 auto; }
        .page-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; color: #6B2D2D; margin-bottom: 0.2rem; }
        .page-subtitle { font-size: 0.78rem; letter-spacing: 0.1em; color: #C4786A; margin-bottom: 1.5rem; }

        .avatar-section { display: flex; align-items: center; gap: 1.2rem; margin-bottom: 1.8rem; }
        .avatar {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, #F2D4CC, #E8B4A8);
          border: 2px solid rgba(196,120,106,0.3);
          flex-shrink: 0; display: flex; align-items: center;
          justify-content: center; font-size: 2.2rem; overflow: hidden;
        }
        .avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .avatar-info {}
        .avatar-name { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: #6B2D2D; margin-bottom: 0.2rem; }
        .avatar-role { font-size: 0.72rem; letter-spacing: 0.1em; color: #C4786A; margin-bottom: 0.5rem; }
        .btn-upload {
          padding: 0.45rem 1rem; border-radius: 100px;
          border: 1.5px solid rgba(139,58,58,0.3); background: none;
          font-family: 'Jost', sans-serif; font-size: 0.72rem; font-weight: 500;
          color: #8B3A3A; cursor: pointer; transition: all 0.2s; letter-spacing: 0.05em;
        }
        .btn-upload:hover { background: rgba(139,58,58,0.06); }

        .tabs {
          display: flex; gap: 0.3rem; margin-bottom: 1.2rem;
          background: rgba(255,255,255,0.5);
          border: 1.5px solid rgba(196,120,106,0.15);
          border-radius: 100px; padding: 0.3rem;
        }
        .tab-btn {
          flex: 1; padding: 0.6rem 0.4rem; border-radius: 100px; border: none;
          font-family: 'Jost', sans-serif; font-size: 0.74rem; font-weight: 500;
          letter-spacing: 0.04em; cursor: pointer; transition: all 0.25s;
          background: none; color: #C4786A; white-space: nowrap;
        }
        .tab-btn.active {
          background: linear-gradient(135deg, #8B3A3A, #6B2D2D);
          color: #F7EDE8; box-shadow: 0 2px 12px rgba(107,45,45,0.25);
        }

        .card {
          background: rgba(255,255,255,0.65); backdrop-filter: blur(10px);
          border: 1.5px solid rgba(196,120,106,0.15); border-radius: 24px; padding: 1.8rem;
        }
        .form-group { display: flex; flex-direction: column; gap: 0.9rem; }
        .field-label { font-size: 0.68rem; letter-spacing: 0.12em; color: #C4786A; margin-bottom: 0.3rem; text-transform: uppercase; }
        .field-hint { font-size: 0.68rem; color: #C4A090; margin-top: 0.3rem; font-style: italic; }
        input[type="text"], input[type="email"], input[type="password"], input[type="tel"] {
          width: 100%; padding: 0.85rem 1.1rem;
          background: rgba(247,237,232,0.6);
          border: 1.5px solid rgba(196,120,106,0.2); border-radius: 12px;
          font-family: 'Jost', sans-serif; font-size: 0.88rem; color: #4A2020;
          outline: none; transition: border-color 0.2s, background 0.2s;
        }
        input:focus { border-color: #C4786A; background: rgba(255,255,255,0.8); }
        input::placeholder { color: #C4A090; }
        input:disabled { opacity: 0.5; cursor: not-allowed; }
        textarea {
          width: 100%; padding: 0.85rem 1.1rem;
          background: rgba(247,237,232,0.6);
          border: 1.5px solid rgba(196,120,106,0.2); border-radius: 12px;
          font-family: 'Jost', sans-serif; font-size: 0.88rem; color: #4A2020;
          outline: none; transition: border-color 0.2s, background 0.2s;
          resize: vertical; min-height: 120px; line-height: 1.6;
        }
        textarea:focus { border-color: #C4786A; background: rgba(255,255,255,0.8); }
        textarea::placeholder { color: #C4A090; }
        .char-count { font-size: 0.65rem; color: #C4A090; text-align: right; margin-top: 0.25rem; }
        .divider { height: 1px; background: linear-gradient(90deg, rgba(196,120,106,0.2), transparent); margin: 0.5rem 0; }
        .msg { font-size: 0.78rem; padding: 0.7rem 1rem; border-radius: 10px; margin-top: 1rem; }
        .msg.success { color: #27AE60; background: rgba(39,174,96,0.08); border: 1px solid rgba(39,174,96,0.2); }
        .msg.error { color: #C0392B; background: rgba(192,57,43,0.08); border: 1px solid rgba(192,57,43,0.2); }
        .btn-save {
          width: 100%; padding: 1rem; margin-top: 1.2rem;
          background: linear-gradient(135deg, #8B3A3A 0%, #6B2D2D 100%);
          color: #F7EDE8; border: none; border-radius: 100px;
          font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 500;
          letter-spacing: 0.15em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 16px rgba(107,45,45,0.25);
        }
        .btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(107,45,45,0.35); }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .preview-box {
          background: rgba(247,237,232,0.5); border: 1px dashed rgba(196,120,106,0.3);
          border-radius: 12px; padding: 1rem; margin-top: 0.5rem;
        }
        .preview-label { font-size: 0.65rem; letter-spacing: 0.1em; color: #C4A090; margin-bottom: 0.5rem; text-transform: uppercase; }
        .preview-text { font-size: 0.82rem; color: #8B5A5A; line-height: 1.6; white-space: pre-wrap; }
      `}</style>

      <main className="page">
        {/* Topbar */}
        <div className="topbar">
          <p className="topbar-brand">Thamyres Ribeiro</p>
          <div className="topbar-links">
            <a href="/profissional" className="topbar-link">Agenda</a>
            <a href="/profissional/perfil" className="topbar-link active">Perfil</a>
            <button
              className="btn-logout"
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push('/admin/login')
              }}
            >
              Sair
            </button>
          </div>
        </div>

        <div className="content">
          <h1 className="page-title">Meu Perfil</h1>
          <p className="page-subtitle">Gerencie suas informações</p>

          {/* Avatar */}
          <div className="avatar-section">
            <div className="avatar">
              {avatarPreview ? <img src={avatarPreview} alt="foto" /> : '🪷'}
            </div>
            <div className="avatar-info">
              <p className="avatar-name">{fullName || 'Seu nome'}</p>
              <p className="avatar-role">Profissional</p>
              <button className="btn-upload" onClick={() => fileRef.current?.click()}>
                Alterar foto
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          </div>

          {/* Abas */}
          <div className="tabs">
            <button className={`tab-btn ${tab === 'dados' ? 'active' : ''}`} onClick={() => { setTab('dados'); setMsg(null) }}>
              Dados
            </button>
            <button className={`tab-btn ${tab === 'sobre' ? 'active' : ''}`} onClick={() => { setTab('sobre'); setMsg(null) }}>
              Sobre Mim
            </button>
            <button className={`tab-btn ${tab === 'senha' ? 'active' : ''}`} onClick={() => { setTab('senha'); setPwMsg(null) }}>
              Senha
            </button>
          </div>

          {/* Aba Dados */}
          {tab === 'dados' && (
            <div className="card">
              <div className="form-group">
                <div>
                  <p className="field-label">Nome completo</p>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome completo" />
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
              <button className="btn-save" onClick={handleSaveDados} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Dados'}
              </button>
            </div>
          )}

          {/* Aba Sobre Mim */}
          {tab === 'sobre' && (
            <div className="card">
              <div className="form-group">
                <div>
                  <p className="field-label">Especialidades</p>
                  <input
                    type="text"
                    value={specialties}
                    onChange={e => setSpecialties(e.target.value)}
                    placeholder="Ex: Limpeza de pele, Micropigmentação, Sobrancelhas"
                  />
                  <p className="field-hint">Separe por vírgulas. Aparecerá no seu perfil público.</p>
                </div>
                <div>
                  <p className="field-label">Sobre mim</p>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Conte um pouco sobre você, sua trajetória, sua paixão pela estética..."
                    maxLength={500}
                  />
                  <p className="char-count">{bio.length}/500</p>
                </div>
                {bio && (
                  <div className="preview-box">
                    <p className="preview-label">Prévia do seu perfil público</p>
                    <p className="preview-text">{bio}</p>
                  </div>
                )}
              </div>
              {msg && <p className={`msg ${msg.type}`}>{msg.text}</p>}
              <button className="btn-save" onClick={handleSaveSobre} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Informações'}
              </button>
            </div>
          )}

          {/* Aba Senha */}
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