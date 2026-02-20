'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { createCalendarEvent } from '@/lib/calendar'

type Appointment = {
  id: string
  scheduled_at: string
  status: string
  services: { name: string; duration_minutes: number; price: number }
  profiles: { full_name: string; phone: string }
}

export default function AdminPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()

      if (profile?.role !== 'super_admin') { router.push('/'); return }

      const { data } = await supabase
        .from('appointments')
        .select('*, services(name, duration_minutes, price), profiles(full_name, phone)')
        .order('scheduled_at', { ascending: true })

      if (data) setAppointments(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('appointments').update({ status }).eq('id', id)
    const app = appointments.find(a => a.id === id)
    
    if (status === 'confirmed' && app) {
      await createCalendarEvent(
        app.profiles.full_name, 
        app.services.name, 
        app.scheduled_at, 
        app.services.duration_minutes
      )
    }
    
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const statusLabel: Record<string, string> = {
    pending: 'Pendente', confirmed: 'Confirmado', cancelled: 'Cancelado', completed: 'Concluído',
  }
  
  const statusColor: Record<string, string> = {
    pending: '#E67E22', confirmed: '#27AE60', cancelled: '#C0392B', completed: '#8B3A3A',
  }

  const filtered = appointments.filter(a => filter === 'all' || a.status === filter)
  const todayCount = appointments.filter(a => 
    new Date(a.scheduled_at).toDateString() === new Date().toDateString()
  ).length

  if (loading) {
    return (
      <main className="loading-screen">
        <style>{`
          .loading-screen { min-height: 100vh; background: #F7EDE8; display: flex; align-items: center; justify-content: center; font-family: 'Jost', sans-serif; color: #C4786A; }
        `}</style>
        <p>Carregando painel mestre...</p>
      </main>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Jost:wght@300;400;500&display=swap');
        
        .admin-page { min-height: 100vh; background-color: #F7EDE8; font-family: 'Jost', sans-serif; padding-bottom: 5rem; }
        .header-admin { background: white; padding: 2rem 1.5rem; border-bottom: 1px solid rgba(196,120,106,0.1); margin-bottom: 2rem; }
        .admin-title { font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; color: #6B2D2D; font-weight: 600; }
        
        .nav-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin: 1.5rem 0; }
        .nav-card { 
          background: white; border: 1px solid rgba(196,120,106,0.2); padding: 1rem; border-radius: 18px;
          text-align: center; cursor: pointer; transition: all 0.2s;
        }
        .nav-card:hover { border-color: #C4786A; background: #FFF9F6; }
        .nav-card span { display: block; font-size: 1.2rem; margin-bottom: 0.3rem; }
        .nav-card p { font-size: 0.75rem; font-weight: 500; color: #8B3A3A; letter-spacing: 0.05em; }

        .container { max-width: 550px; margin: 0 auto; padding: 0 1.2rem; }
        
        .stats-row { display: flex; gap: 1rem; margin-bottom: 2rem; }
        .mini-stat { flex: 1; background: rgba(255,255,255,0.5); padding: 1rem; border-radius: 20px; border: 1px solid rgba(196,120,106,0.1); }
        .mini-stat-val { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 600; color: #6B2D2D; display: block; }
        .mini-stat-label { font-size: 0.65rem; color: #C4786A; letter-spacing: 0.1em; }

        .filter-bar { display: flex; gap: 0.5rem; overflow-x: auto; margin-bottom: 1.5rem; padding-bottom: 0.5rem; }
        .f-btn { 
          padding: 0.5rem 1rem; border-radius: 100px; border: 1px solid rgba(196,120,106,0.2);
          background: white; font-size: 0.75rem; color: #8B5A5A; white-space: nowrap; cursor: pointer;
        }
        .f-btn.active { background: #6B2D2D; color: white; border-color: #6B2D2D; }

        .appt-card { 
          background: white; border-radius: 24px; padding: 1.2rem; margin-bottom: 1rem;
          box-shadow: 0 4px 12px rgba(107,45,45,0.03); border: 1px solid rgba(196,120,106,0.1);
        }
        .info-name { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: #6B2D2D; }
        .info-sub { font-size: 0.75rem; color: #C4786A; }
        .badge { font-size: 0.6rem; padding: 0.2rem 0.6rem; border-radius: 100px; border: 1px solid currentColor; font-weight: 600; }
        
        .service-tag { font-size: 0.8rem; font-weight: 500; color: #8B3A3A; margin: 0.8rem 0 0.4rem; }
        .time-tag { font-size: 0.75rem; color: #8B5A5A; display: flex; align-items: center; gap: 0.3rem; }

        .admin-actions { display: flex; gap: 0.5rem; margin-top: 1rem; pt-1rem; border-top: 1px dashed rgba(196,120,106,0.2); padding-top: 1rem; }
        .btn-adm { flex: 1; padding: 0.6rem; border-radius: 12px; border: none; font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
        .btn-adm:hover { opacity: 0.8; }
        .btn-confirm { background: #27AE60; color: white; }
        .btn-cancel { background: none; border: 1px solid #C0392B; color: #C0392B; }
      `}</style>

      <main className="admin-page">
        <header className="header-admin">
          <div className="container">
            <h1 className="admin-title">Painel Geral</h1>
            <p className="info-sub">Gestão Administrativa • Thamyres Ribeiro</p>
            
            <div className="nav-grid">
              <div className="nav-card" onClick={() => router.push('/admin/servicos')}>
                <span>✨</span>
                <p>SERVIÇOS</p>
              </div>
              <div className="nav-card" onClick={() => router.push('/admin/profissionais')}>
                <span>👥</span>
                <p>USUÁRIOS</p>
              </div>
            </div>
          </div>
        </header>

        <div className="container">
          <div className="stats-row">
            <div className="mini-stat">
              <span className="mini-stat-val">{todayCount}</span>
              <span className="mini-stat-label">HOJE</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-val">
                {appointments.filter(a => a.status === 'pending').length}
              </span>
              <span className="mini-stat-label">AGUARDANDO</span>
            </div>
          </div>

          <div className="filter-bar">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={`f-btn ${filter === f ? 'active' : ''}`}
              >
                {f === 'all' ? 'Todos' : statusLabel[f]}
              </button>
            ))}
          </div>

          <div className="list">
            {filtered.map(app => {
              const date = new Date(app.scheduled_at)
              return (
                <div key={app.id} className="appt-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <p className="info-name">{app.profiles?.full_name}</p>
                      <p className="info-sub">{app.profiles?.phone}</p>
                    </div>
                    <span className="badge" style={{ color: statusColor[app.status] }}>
                      {statusLabel[app.status].toUpperCase()}
                    </span>
                  </div>

                  <p className="service-tag">{app.services?.name}</p>
                  <p className="time-tag">
                    <span>📅</span> {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>

                  {app.status === 'pending' && (
                    <div className="admin-actions">
                      <button onClick={() => handleStatus(app.id, 'confirmed')} className="btn-adm btn-confirm">Confirmar</button>
                      <button onClick={() => handleStatus(app.id, 'cancelled')} className="btn-adm btn-cancel">Negar</button>
                    </div>
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