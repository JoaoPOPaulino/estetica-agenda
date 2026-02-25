'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { createCalendarEvent } from '@/lib/calendar'

type Appointment = {
  id: string
  scheduled_at: string
  status: string
  completed_at?: string
  notes?: string
  services: { name: string; duration_minutes: number; price: number }
  client: { full_name: string; phone: string }
  walk_in_client: { full_name: string; phone: string } | null
}

export default function ProfissionalPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const [profName, setProfName] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('role, full_name').eq('id', user.id).single()
      if (profile?.role !== 'professional') { router.push('/'); return }
      setProfName(profile.full_name.split(' ')[0])

      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          services(name, duration_minutes, price),
          client:client_id(full_name, phone),
          walk_in_client:walk_in_client_id(full_name, phone)
        `)
        .eq('professional_id', user.id)
        .order('scheduled_at', { ascending: true })

      if (data) setAppointments(data as any)
      setLoading(false)
    }
    load()
  }, [])

  async function handleStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('appointments').update({ status }).eq('id', id)
    const app = appointments.find(a => a.id === id)
    if (status === 'confirmed' && app) {
      await createCalendarEvent(app.client.full_name, app.services.name, app.scheduled_at, app.services.duration_minutes)
    }
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  async function handleComplete(id: string) {
    const supabase = createClient()
    const completedAt = new Date().toISOString()
    await supabase.from('appointments').update({ status: 'completed', completed_at: completedAt }).eq('id', id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a))
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const statusLabel: Record<string, string> = {
    pending: 'Pendente', confirmed: 'Confirmado', cancelled: 'Cancelado', completed: 'Concluído',
  }
  const statusColor: Record<string, string> = {
    pending: '#E67E22', confirmed: '#27AE60', cancelled: '#C0392B', completed: '#8B3A3A',
  }

  const filtered = appointments.filter(a => filter === 'all' || a.status === filter)
  const today = appointments.filter(a => {
    const d = new Date(a.scheduled_at)
    return d.toDateString() === new Date().toDateString() && a.status !== 'cancelled'
  })

  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .page { min-height: 100vh; background-color: #F7EDE8; display: flex; align-items: center; justify-content: center; font-family: 'Jost', sans-serif; }
          .loading { font-size: 0.85rem; color: #C4786A; letter-spacing: 0.1em; }
        `}</style>
        <main className="page"><p className="loading">Carregando...</p></main>
      </>
    )
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
            radial-gradient(ellipse at 20% 30%, rgba(196,120,106,0.1) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 70%, rgba(242,212,204,0.3) 0%, transparent 50%);
          padding: 0 0 4rem;
          font-family: 'Jost', sans-serif;
        }
        .topbar {
          background: rgba(247,237,232,0.92); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(196,120,106,0.15);
          padding: 0.75rem 1.2rem;
          display: flex; justify-content: space-between; align-items: center;
          position: sticky; top: 0; z-index: 100;
        }
        .topbar-brand { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 600; color: #6B2D2D; }
        .topbar-greeting { font-size: 0.72rem; color: #C4786A; }
        .topbar-right { display: flex; align-items: center; gap: 0.4rem; }
        .topbar-link {
          padding: 0.4rem 0.8rem; border-radius: 100px; font-size: 0.72rem;
          font-weight: 500; color: #8B5A5A; text-decoration: none;
          border: 1.5px solid transparent; transition: all 0.2s; font-family: 'Jost', sans-serif;
        }
        .topbar-link:hover { color: #6B2D2D; background: rgba(139,58,58,0.06); }
        .btn-logout {
          padding: 0.4rem 0.9rem; border-radius: 100px; font-size: 0.72rem;
          font-weight: 500; color: #C4786A; border: 1.5px solid rgba(196,120,106,0.3);
          background: none; cursor: pointer; font-family: 'Jost', sans-serif; transition: all 0.2s;
        }
        .btn-logout:hover { color: #8B3A3A; border-color: #8B3A3A; }
        .content { padding: 2rem 1.2rem; }
        .page-header {
          display: flex; justify-content: space-between; align-items: flex-end;
          max-width: 500px; margin: 0 auto 1.5rem;
        }
        .page-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; color: #6B2D2D; margin-bottom: 0.2rem; }
        .page-subtitle { font-size: 0.78rem; letter-spacing: 0.1em; color: #C4786A; }
        .btn-new-appt {
          padding: 0.65rem 1.2rem; border-radius: 100px; border: none; flex-shrink: 0;
          background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8;
          font-family: 'Jost', sans-serif; font-size: 0.75rem; font-weight: 500;
          letter-spacing: 0.1em; text-decoration: none; cursor: pointer;
          box-shadow: 0 3px 12px rgba(107,45,45,0.25); transition: all 0.2s; white-space: nowrap;
          display: inline-flex; align-items: center;
        }
        .btn-new-appt:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(107,45,45,0.35); }
        .stats-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;
          margin-bottom: 1.5rem; max-width: 500px; margin-left: auto; margin-right: auto;
        }
        .stat-card {
          background: rgba(255,255,255,0.65); backdrop-filter: blur(10px);
          border: 1px solid rgba(196,120,106,0.15); border-radius: 20px; padding: 1.2rem 1.5rem;
        }
        .stat-number { font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; font-weight: 600; line-height: 1; margin-bottom: 0.3rem; }
        .stat-label { font-size: 0.72rem; color: #C4786A; letter-spacing: 0.08em; }
        .filters {
          max-width: 500px; margin: 0 auto 1.5rem;
          display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.2rem;
        }
        .filter-btn {
          padding: 0.5rem 1rem; border-radius: 100px;
          border: 1.5px solid rgba(196,120,106,0.25); background: rgba(255,255,255,0.5);
          font-family: 'Jost', sans-serif; font-size: 0.75rem; font-weight: 500;
          color: #8B5A5A; cursor: pointer; white-space: nowrap; transition: all 0.2s; letter-spacing: 0.05em;
        }
        .filter-btn.active { background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8; border-color: transparent; }
        .list { max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
        .empty {
          background: rgba(255,255,255,0.65); backdrop-filter: blur(10px);
          border: 1px solid rgba(196,120,106,0.15); border-radius: 24px;
          padding: 3rem 2rem; text-align: center;
        }
        .empty-icon { font-size: 2.5rem; margin-bottom: 1rem; }
        .empty-text { font-size: 0.85rem; color: #C4786A; line-height: 1.6; }
        .appt-card {
          background: rgba(255,255,255,0.65); backdrop-filter: blur(10px);
          border: 1.5px solid rgba(196,120,106,0.15); border-radius: 24px;
          padding: 1.5rem; transition: all 0.2s;
        }
        .appt-card:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(139,58,58,0.08); }
        .appt-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
        .client-name { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: #6B2D2D; }
        .client-phone { font-size: 0.72rem; color: #C4A090; margin-top: 0.1rem; }
        .status-badge {
          font-size: 0.68rem; font-weight: 500; letter-spacing: 0.08em;
          padding: 0.3rem 0.8rem; border-radius: 100px;
          background: rgba(255,255,255,0.8); border: 1px solid currentColor;
        }
        .appt-service { font-size: 0.85rem; font-weight: 500; color: #8B3A3A; margin-bottom: 0.5rem; }
        .appt-details { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 1rem; }
        .appt-detail { font-size: 0.8rem; color: #8B5A5A; display: flex; align-items: center; gap: 0.4rem; }
        .appt-notes {
          font-size: 0.78rem; color: #8B5A5A; font-style: italic;
          background: rgba(196,120,106,0.06); border-radius: 8px; padding: 0.5rem 0.7rem;
          margin-bottom: 0.8rem; border-left: 2px solid rgba(196,120,106,0.3);
        }
        .divider { height: 1px; background: linear-gradient(90deg, rgba(196,120,106,0.15), transparent); margin-bottom: 1rem; }
        .action-btns { display: flex; gap: 0.6rem; }
        .btn-confirm-appt {
          flex: 1; padding: 0.65rem; border-radius: 100px; border: none;
          background: linear-gradient(135deg, #27AE60, #1E8449); color: white;
          font-family: 'Jost', sans-serif; font-size: 0.75rem; font-weight: 500;
          letter-spacing: 0.06em; cursor: pointer; transition: all 0.2s;
        }
        .btn-confirm-appt:hover { transform: translateY(-1px); }
        .btn-complete {
          flex: 1; padding: 0.65rem; border-radius: 100px; border: none;
          background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8;
          font-family: 'Jost', sans-serif; font-size: 0.75rem; font-weight: 500;
          letter-spacing: 0.06em; cursor: pointer; transition: all 0.2s;
        }
        .btn-complete:hover { transform: translateY(-1px); }
        .btn-cancel-appt {
          flex: 1; padding: 0.65rem; border-radius: 100px;
          border: 1.5px solid rgba(192,57,43,0.3); color: #C0392B; background: none;
          font-family: 'Jost', sans-serif; font-size: 0.75rem; font-weight: 500;
          letter-spacing: 0.06em; cursor: pointer; transition: all 0.2s;
        }
        .btn-cancel-appt:hover { background: rgba(192,57,43,0.05); border-color: #C0392B; }
      `}</style>

      <main className="page">
        <div className="topbar">
          <div>
            <p className="topbar-brand">Thamyres Ribeiro</p>
            <p className="topbar-greeting">Olá, {profName} 🌸</p>
          </div>
          <div className="topbar-right">
            <a href="/profissional/servicos" className="topbar-link">Serviços</a>
            <a href="/profissional/perfil" className="topbar-link">Perfil</a>
            <button onClick={handleLogout} className="btn-logout">Sair</button>
          </div>
        </div>

        <div className="content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Minha Agenda</h1>
              <p className="page-subtitle">Gerencie seus atendimentos</p>
            </div>
            <a href="/profissional/novo-agendamento" className="btn-new-appt">
              + Agendar
            </a>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-number" style={{ color: '#8B3A3A' }}>{today.length}</p>
              <p className="stat-label">HOJE</p>
            </div>
            <div className="stat-card">
              <p className="stat-number" style={{ color: '#E67E22' }}>
                {appointments.filter(a => a.status === 'pending').length}
              </p>
              <p className="stat-label">PENDENTES</p>
            </div>
          </div>

          <div className="filters">
            {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`filter-btn ${filter === f ? 'active' : ''}`}>
                {f === 'all' ? 'Todos' : statusLabel[f]}
              </button>
            ))}
          </div>

          <div className="list">
            {filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🪷</div>
                <p className="empty-text">Nenhum agendamento encontrado.</p>
              </div>
            ) : filtered.map(appointment => {
              const date = new Date(appointment.scheduled_at)
              return (
                <div key={appointment.id} className="appt-card">
                  <div className="appt-header">
                    <div>
                      <p className="client-name">{appointment.client?.full_name ?? appointment.walk_in_client?.full_name ?? 'Cliente'}</p>
                      {appointment.client?.phone && (
                        <p className="client-phone">{appointment.client.phone}</p>
                      )}
                      {appointment.walk_in_client?.phone && !appointment.client?.phone && (
                        <p className="client-phone">{appointment.walk_in_client.phone}</p>
                      )}
                    </div>
                    <span className="status-badge" style={{ color: statusColor[appointment.status] }}>
                      {statusLabel[appointment.status]}
                    </span>
                  </div>

                  <p className="appt-service">{appointment.services?.name}</p>

                  <div className="appt-details">
                    <p className="appt-detail">
                      <span>📅</span>
                      {date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </p>
                    <p className="appt-detail">
                      <span>🕐</span>
                      {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="appt-detail">
                      <span>⏱</span>
                      {appointment.services?.duration_minutes >= 60
                        ? `${appointment.services.duration_minutes / 60}h`
                        : `${appointment.services?.duration_minutes} min`}
                      {' · '}R$ {appointment.services?.price}
                    </p>
                  </div>

                  {appointment.notes && (
                    <p className="appt-notes">📝 {appointment.notes}</p>
                  )}

                  {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                    <>
                      <div className="divider" />
                      <div className="action-btns">
                        {appointment.status === 'pending' && (
                          <button onClick={() => handleStatus(appointment.id, 'confirmed')} className="btn-confirm-appt">
                            Confirmar
                          </button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button onClick={() => handleComplete(appointment.id)} className="btn-complete">
                            Concluir
                          </button>
                        )}
                        <button onClick={() => handleStatus(appointment.id, 'cancelled')} className="btn-cancel-appt">
                          Cancelar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </>
  )
}