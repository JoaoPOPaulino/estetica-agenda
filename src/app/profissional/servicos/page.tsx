'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Service = {
  id: string
  name: string
  description: string
  duration_minutes: number
  price: number
  service_type: string
  blocks_equipment: boolean
  active: boolean
}

type ServiceType = {
  id: string
  name: string
}

const EMPTY_FORM = {
  name: '',
  description: '',
  duration_minutes: 60,
  price: 0,
  service_type: '',
  blocks_equipment: false,
}

export default function ProfissionalServicosPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Novo tipo inline
  const [showNewType, setShowNewType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [savingType, setSavingType] = useState(false)
  const [typeMsg, setTypeMsg] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'professional') { router.push('/'); return }
      setUserId(user.id)
      await Promise.all([fetchServices(user.id), fetchTypes()])
      setLoading(false)
    }
    load()
  }, [])

  async function fetchServices(uid: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('services').select('*').eq('professional_id', uid).order('name')
    if (data) setServices(data)
  }

  async function fetchTypes() {
    const supabase = createClient()
    const { data } = await supabase
      .from('service_types').select('*').order('name')
    if (data) setServiceTypes(data)
  }

  async function handleCreateType() {
    if (!newTypeName.trim()) return
    setSavingType(true)
    setTypeMsg(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('service_types')
      .insert({ name: newTypeName.trim() })
      .select().single()
    setSavingType(false)
    if (error) {
      setTypeMsg('Esse tipo já existe ou ocorreu um erro.')
    } else {
      await fetchTypes()
      setForm(f => ({ ...f, service_type: data.name }))
      setNewTypeName('')
      setShowNewType(false)
      setTypeMsg(null)
    }
  }

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setMsg(null)
    setShowNewType(false)
    setNewTypeName('')
    setShowForm(true)
  }

  function openEdit(s: Service) {
    setEditingId(s.id)
    setForm({
      name: s.name,
      description: s.description ?? '',
      duration_minutes: s.duration_minutes,
      price: s.price,
      service_type: s.service_type ?? '',
      blocks_equipment: s.blocks_equipment ?? false,
    })
    setMsg(null)
    setShowNewType(false)
    setNewTypeName('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setMsg(null)
    setShowNewType(false)
    setNewTypeName('')
  }

  async function handleSave() {
    if (!form.name || !form.service_type) {
      setMsg({ type: 'error', text: 'Nome e tipo são obrigatórios.' })
      return
    }
    setSaving(true)
    setMsg(null)
    const supabase = createClient()

    if (editingId) {
      const { error } = await supabase.from('services')
        .update({ ...form, professional_id: userId })
        .eq('id', editingId)
      if (error) setMsg({ type: 'error', text: 'Erro ao salvar.' })
      else {
        setMsg({ type: 'success', text: 'Serviço atualizado!' })
        await fetchServices(userId)
      }
    } else {
      const { error } = await supabase.from('services')
        .insert({ ...form, professional_id: userId, active: true })
      if (error) setMsg({ type: 'error', text: 'Erro ao criar serviço.' })
      else {
        setMsg({ type: 'success', text: 'Serviço criado!' })
        await fetchServices(userId)
        setTimeout(() => closeForm(), 1200)
      }
    }
    setSaving(false)
  }

  async function handleToggleActive(s: Service) {
    const supabase = createClient()
    await supabase.from('services').update({ active: !s.active }).eq('id', s.id)
    await fetchServices(userId)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('services').delete().eq('id', id)
    setDeleteConfirm(null)
    await fetchServices(userId)
  }

  const formatDuration = (min: number) =>
    min >= 60 ? `${min / 60}h` : `${min} min`

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
          min-height: 100vh; background-color: #F7EDE8;
          background-image:
            radial-gradient(ellipse at 20% 30%, rgba(196,120,106,0.1) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 70%, rgba(242,212,204,0.3) 0%, transparent 50%);
          padding: 0 0 4rem; font-family: 'Jost', sans-serif;
        }
        .topbar {
          background: rgba(247,237,232,0.92); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(196,120,106,0.15);
          padding: 0.75rem 1.2rem;
          display: flex; justify-content: space-between; align-items: center;
          position: sticky; top: 0; z-index: 100;
        }
        .topbar-brand { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 600; color: #6B2D2D; }
        .topbar-right { display: flex; align-items: center; gap: 0.4rem; }
        .topbar-link {
          padding: 0.4rem 0.8rem; border-radius: 100px; font-size: 0.72rem;
          font-weight: 500; color: #8B5A5A; text-decoration: none;
          border: 1.5px solid transparent; transition: all 0.2s; font-family: 'Jost', sans-serif;
        }
        .topbar-link:hover { color: #6B2D2D; background: rgba(139,58,58,0.06); }
        .topbar-link.active { color: #6B2D2D; border-color: rgba(139,58,58,0.25); background: rgba(255,255,255,0.7); }
        .btn-logout {
          padding: 0.4rem 0.9rem; border-radius: 100px; font-size: 0.72rem;
          font-weight: 500; color: #C4786A; border: 1.5px solid rgba(196,120,106,0.3);
          background: none; cursor: pointer; font-family: 'Jost', sans-serif; transition: all 0.2s;
        }
        .btn-logout:hover { color: #8B3A3A; border-color: #8B3A3A; }
        .content { padding: 2rem 1.2rem; max-width: 560px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; }
        .page-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; color: #6B2D2D; }
        .page-subtitle { font-size: 0.78rem; letter-spacing: 0.1em; color: #C4786A; margin-top: 0.2rem; }
        .btn-new {
          padding: 0.65rem 1.2rem; border-radius: 100px; border: none;
          background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8;
          font-family: 'Jost', sans-serif; font-size: 0.75rem; font-weight: 500;
          letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 3px 12px rgba(107,45,45,0.25); white-space: nowrap;
        }
        .btn-new:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(107,45,45,0.35); }
        .list { display: flex; flex-direction: column; gap: 0.8rem; }
        .empty-state {
          background: rgba(255,255,255,0.6); border: 1.5px dashed rgba(196,120,106,0.3);
          border-radius: 24px; padding: 3rem; text-align: center;
        }
        .empty-icon { font-size: 2rem; margin-bottom: 0.8rem; }
        .empty-text { font-size: 0.82rem; color: #C4786A; line-height: 1.6; }
        .service-card {
          background: rgba(255,255,255,0.65); backdrop-filter: blur(10px);
          border: 1.5px solid rgba(196,120,106,0.15); border-radius: 20px;
          padding: 1.2rem 1.4rem; transition: all 0.2s;
        }
        .service-card.inactive { opacity: 0.55; }
        .service-row { display: flex; justify-content: space-between; align-items: flex-start; }
        .service-name { font-weight: 500; color: #4A2020; font-size: 0.95rem; margin-bottom: 0.25rem; }
        .service-badges { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
        .badge { font-size: 0.65rem; font-weight: 500; letter-spacing: 0.06em; padding: 0.2rem 0.6rem; border-radius: 100px; }
        .badge-type { background: rgba(196,120,106,0.12); color: #8B3A3A; border: 1px solid rgba(196,120,106,0.2); }
        .badge-equipment { background: rgba(231,76,60,0.08); color: #C0392B; border: 1px solid rgba(192,57,43,0.2); }
        .badge-inactive { background: rgba(0,0,0,0.05); color: #999; border: 1px solid rgba(0,0,0,0.1); }
        .service-meta { font-size: 0.78rem; color: #C4786A; }
        .service-actions { display: flex; gap: 0.4rem; flex-shrink: 0; margin-left: 0.5rem; }
        .btn-icon {
          width: 32px; height: 32px; border-radius: 10px; border: 1.5px solid rgba(196,120,106,0.2);
          background: none; cursor: pointer; font-size: 0.85rem;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .btn-icon:hover { background: rgba(196,120,106,0.1); }
        .btn-icon.danger:hover { background: rgba(192,57,43,0.08); border-color: rgba(192,57,43,0.3); }

        /* Modal */
        .overlay {
          position: fixed; inset: 0; background: rgba(107,45,45,0.2);
          backdrop-filter: blur(4px); z-index: 200;
          display: flex; align-items: flex-end; justify-content: center;
        }
        .modal {
          background: #F7EDE8; border-radius: 28px 28px 0 0;
          padding: 2rem 1.5rem 3rem; width: 100%; max-width: 560px;
          max-height: 92vh; overflow-y: auto;
          box-shadow: 0 -8px 40px rgba(107,45,45,0.15);
        }
        .modal-handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(196,120,106,0.3); margin: 0 auto 1.5rem; }
        .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; color: #6B2D2D; margin-bottom: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 1rem; }
        .field-label { font-size: 0.68rem; letter-spacing: 0.12em; color: #C4786A; margin-bottom: 0.3rem; text-transform: uppercase; }

        /* Select de tipo */
        .type-row { display: flex; gap: 0.5rem; align-items: stretch; }
        .type-select-wrap { flex: 1; position: relative; }
        select {
          width: 100%; padding: 0.85rem 2.2rem 0.85rem 1.1rem;
          background: rgba(255,255,255,0.7);
          border: 1.5px solid rgba(196,120,106,0.2); border-radius: 12px;
          font-family: 'Jost', sans-serif; font-size: 0.88rem; color: #4A2020;
          outline: none; transition: border-color 0.2s; appearance: none; cursor: pointer;
        }
        select:focus { border-color: #C4786A; background: rgba(255,255,255,0.9); }
        .select-arrow {
          position: absolute; right: 0.9rem; top: 50%; transform: translateY(-50%);
          color: #C4786A; font-size: 0.7rem; pointer-events: none;
        }
        .btn-add-type {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          border: 1.5px solid rgba(196,120,106,0.3);
          background: rgba(255,255,255,0.7); color: #8B3A3A;
          font-size: 1.2rem; cursor: pointer; display: flex;
          align-items: center; justify-content: center; transition: all 0.2s;
          align-self: flex-end;
        }
        .btn-add-type:hover { background: rgba(139,58,58,0.08); border-color: #C4786A; }
        .btn-add-type.active { background: rgba(139,58,58,0.1); border-color: #8B3A3A; color: #6B2D2D; }

        /* Inline novo tipo */
        .new-type-box {
          background: rgba(255,255,255,0.8); border: 1.5px solid rgba(196,120,106,0.25);
          border-radius: 14px; padding: 0.9rem 1rem;
          display: flex; flex-direction: column; gap: 0.6rem;
        }
        .new-type-hint { font-size: 0.7rem; color: #C4786A; letter-spacing: 0.06em; }
        .new-type-row { display: flex; gap: 0.5rem; }
        input[type="text"], input[type="number"], textarea {
          width: 100%; padding: 0.85rem 1.1rem;
          background: rgba(255,255,255,0.7);
          border: 1.5px solid rgba(196,120,106,0.2); border-radius: 12px;
          font-family: 'Jost', sans-serif; font-size: 0.88rem; color: #4A2020;
          outline: none; transition: border-color 0.2s;
        }
        input:focus, textarea:focus { border-color: #C4786A; background: rgba(255,255,255,0.9); }
        input::placeholder, textarea::placeholder { color: #C4A090; }
        textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
        .btn-type-save {
          padding: 0 1rem; border-radius: 10px; border: none; flex-shrink: 0;
          background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8;
          font-family: 'Jost', sans-serif; font-size: 0.75rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .btn-type-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-type-cancel {
          padding: 0 0.8rem; border-radius: 10px;
          border: 1.5px solid rgba(196,120,106,0.3); background: none;
          font-family: 'Jost', sans-serif; font-size: 0.75rem; color: #8B5A5A; cursor: pointer;
        }
        .type-error { font-size: 0.72rem; color: #C0392B; }

        .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
        .toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.7); border: 1.5px solid rgba(196,120,106,0.2);
          border-radius: 12px; padding: 0.9rem 1.1rem;
        }
        .toggle-label { font-size: 0.85rem; color: #4A2020; }
        .toggle-hint { font-size: 0.7rem; color: #C4A090; margin-top: 0.1rem; }
        .toggle {
          width: 44px; height: 24px; border-radius: 100px; border: none; cursor: pointer;
          transition: background 0.2s; flex-shrink: 0; position: relative;
        }
        .toggle.on { background: linear-gradient(135deg, #8B3A3A, #6B2D2D); }
        .toggle.off { background: rgba(196,120,106,0.25); }
        .toggle::after {
          content: ''; position: absolute; top: 3px;
          width: 18px; height: 18px; border-radius: 50%; background: white;
          transition: left 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .toggle.on::after { left: 23px; }
        .toggle.off::after { left: 3px; }
        .msg { font-size: 0.78rem; padding: 0.7rem 1rem; border-radius: 10px; margin-top: 0.5rem; }
        .msg.success { color: #27AE60; background: rgba(39,174,96,0.08); border: 1px solid rgba(39,174,96,0.2); }
        .msg.error { color: #C0392B; background: rgba(192,57,43,0.08); border: 1px solid rgba(192,57,43,0.2); }
        .modal-actions { display: flex; gap: 0.6rem; margin-top: 1.5rem; }
        .btn-save {
          flex: 1; padding: 1rem; border-radius: 100px; border: none;
          background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8;
          font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer;
          transition: all 0.2s; box-shadow: 0 4px 16px rgba(107,45,45,0.25);
        }
        .btn-save:hover { transform: translateY(-1px); }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-cancel-form {
          padding: 1rem 1.5rem; border-radius: 100px;
          border: 1.5px solid rgba(196,120,106,0.3); background: none;
          font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 500;
          color: #8B5A5A; cursor: pointer; transition: all 0.2s; letter-spacing: 0.06em;
        }
        .btn-cancel-form:hover { border-color: #C4786A; color: #6B2D2D; }
        .confirm-overlay {
          position: fixed; inset: 0; background: rgba(107,45,45,0.25);
          backdrop-filter: blur(4px); z-index: 300;
          display: flex; align-items: center; justify-content: center; padding: 1.5rem;
        }
        .confirm-box {
          background: #F7EDE8; border-radius: 24px; padding: 2rem;
          max-width: 320px; width: 100%; text-align: center;
          box-shadow: 0 8px 40px rgba(107,45,45,0.2);
        }
        .confirm-icon { font-size: 2rem; margin-bottom: 0.8rem; }
        .confirm-title { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: #6B2D2D; margin-bottom: 0.5rem; }
        .confirm-text { font-size: 0.82rem; color: #8B5A5A; margin-bottom: 1.5rem; line-height: 1.5; }
        .confirm-btns { display: flex; gap: 0.6rem; }
        .btn-delete-confirm {
          flex: 1; padding: 0.85rem; border-radius: 100px; border: none;
          background: linear-gradient(135deg, #C0392B, #922B21); color: white;
          font-family: 'Jost', sans-serif; font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.08em; cursor: pointer;
        }
        .btn-delete-cancel {
          flex: 1; padding: 0.85rem; border-radius: 100px;
          border: 1.5px solid rgba(196,120,106,0.3); background: none;
          font-family: 'Jost', sans-serif; font-size: 0.78rem; font-weight: 500;
          color: #8B5A5A; cursor: pointer;
        }
      `}</style>

      <main className="page">
        <div className="topbar">
          <p className="topbar-brand">Thamyres Ribeiro</p>
          <div className="topbar-right">
            <a href="/profissional" className="topbar-link">Agenda</a>
            <a href="/profissional/servicos" className="topbar-link active">Serviços</a>
            <a href="/profissional/perfil" className="topbar-link">Perfil</a>
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
          <div className="page-header">
            <div>
              <h1 className="page-title">Meus Serviços</h1>
              <p className="page-subtitle">Gerencie o que você oferece</p>
            </div>
            <button className="btn-new" onClick={openNew}>+ Novo</button>
          </div>

          <div className="list">
            {services.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✂️</div>
                <p className="empty-text">Nenhum serviço cadastrado ainda.<br />Clique em "+ Novo" para começar.</p>
              </div>
            ) : services.map(s => (
              <div key={s.id} className={`service-card ${!s.active ? 'inactive' : ''}`}>
                <div className="service-row">
                  <div style={{ flex: 1 }}>
                    <p className="service-name">{s.name}</p>
                    <div className="service-badges">
                      {s.service_type && <span className="badge badge-type">{s.service_type}</span>}
                      {s.blocks_equipment && <span className="badge badge-equipment">⚡ Bloqueia equipamento</span>}
                      {!s.active && <span className="badge badge-inactive">Inativo</span>}
                    </div>
                    <p className="service-meta">{formatDuration(s.duration_minutes)} · R$ {s.price}</p>
                  </div>
                  <div className="service-actions">
                    <button className="btn-icon" title={s.active ? 'Desativar' : 'Ativar'} onClick={() => handleToggleActive(s)}>
                      {s.active ? '👁' : '👁‍🗨'}
                    </button>
                    <button className="btn-icon" title="Editar" onClick={() => openEdit(s)}>✏️</button>
                    <button className="btn-icon danger" title="Excluir" onClick={() => setDeleteConfirm(s.id)}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal formulário */}
      {showForm && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) closeForm() }}>
          <div className="modal">
            <div className="modal-handle" />
            <p className="modal-title">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</p>

            <div className="form-group">
              <div>
                <p className="field-label">Nome do serviço *</p>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Criolipose Abdominal"
                />
              </div>

              {/* Select de tipo + botão criar */}
              <div>
                <p className="field-label">Tipo / Categoria *</p>
                <div className="type-row">
                  <div className="type-select-wrap">
                    <select
                      value={form.service_type}
                      onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
                    >
                      <option value="">Selecione um tipo...</option>
                      {serviceTypes.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                    <span className="select-arrow">▾</span>
                  </div>
                  <button
                    className={`btn-add-type ${showNewType ? 'active' : ''}`}
                    onClick={() => { setShowNewType(v => !v); setTypeMsg(null); setNewTypeName('') }}
                    title="Criar novo tipo"
                  >
                    {showNewType ? '×' : '+'}
                  </button>
                </div>

                {/* Box criar novo tipo */}
                {showNewType && (
                  <div className="new-type-box" style={{ marginTop: '0.6rem' }}>
                    <p className="new-type-hint">NOVO TIPO</p>
                    <div className="new-type-row">
                      <input
                        type="text"
                        value={newTypeName}
                        onChange={e => setNewTypeName(e.target.value)}
                        placeholder="Ex: Ultrassom, Peeling..."
                        onKeyDown={e => e.key === 'Enter' && handleCreateType()}
                        style={{ padding: '0.65rem 0.9rem', fontSize: '0.85rem' }}
                      />
                      <button
                        className="btn-type-save"
                        onClick={handleCreateType}
                        disabled={savingType || !newTypeName.trim()}
                      >
                        {savingType ? '...' : 'Criar'}
                      </button>
                      <button
                        className="btn-type-cancel"
                        onClick={() => { setShowNewType(false); setNewTypeName(''); setTypeMsg(null) }}
                      >
                        ×
                      </button>
                    </div>
                    {typeMsg && <p className="type-error">{typeMsg}</p>}
                  </div>
                )}
              </div>

              <div className="row-2">
                <div>
                  <p className="field-label">Duração (minutos)</p>
                  <input
                    type="number"
                    value={form.duration_minutes}
                    min={15} step={15}
                    onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <p className="field-label">Preço (R$)</p>
                  <input
                    type="number"
                    value={form.price}
                    min={0} step={0.01}
                    onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <p className="field-label">Descrição (opcional)</p>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descreva o serviço brevemente..."
                />
              </div>

              <div className="toggle-row">
                <div>
                  <p className="toggle-label">Bloqueia equipamento</p>
                  <p className="toggle-hint">Impede outro serviço do mesmo tipo no mesmo horário</p>
                </div>
                <button
                  className={`toggle ${form.blocks_equipment ? 'on' : 'off'}`}
                  onClick={() => setForm(f => ({ ...f, blocks_equipment: !f.blocks_equipment }))}
                />
              </div>
            </div>

            {msg && <p className={`msg ${msg.type}`}>{msg.text}</p>}

            <div className="modal-actions">
              <button className="btn-cancel-form" onClick={closeForm}>Cancelar</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Serviço'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">🗑</div>
            <p className="confirm-title">Excluir serviço?</p>
            <p className="confirm-text">Esta ação não pode ser desfeita.</p>
            <div className="confirm-btns">
              <button className="btn-delete-cancel" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn-delete-confirm" onClick={() => handleDelete(deleteConfirm)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}