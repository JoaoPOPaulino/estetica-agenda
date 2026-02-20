'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/navbar'

type Appointment = {
  id: string
  scheduled_at: string
  status: string
  services: { name: string; duration_minutes: number; price: number }
}

export default function MeusAgendamentosPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('appointments')
        .select('*, services(name, duration_minutes, price)')
        .eq('client_id', user.id)
        .order('scheduled_at', { ascending: true })
      if (data) setAppointments(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleCancelar(id: string) {
    const supabase = createClient()
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
  }

  const statusLabel: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
  }

  const statusColor: Record<string, string> = {
    pending: '#E67E22',
    confirmed: '#27AE60',
    cancelled: '#C0392B',
    completed: '#8B3A3A',
  }

  const filtered = appointments.filter(a => filter === 'all' || a.status === filter)

  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
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
          padding: 2rem 1.5rem 4rem;
          font-family: 'Jost', sans-serif;
        }
        .header {
          max-width: 500px;
          margin: 0 auto 2rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem;
          font-weight: 600;
          color: #6B2D2D;
          margin-bottom: 0.2rem;
        }
        .page-subtitle { font-size: 0.78rem; letter-spacing: 0.1em; color: #C4786A; }
        .btn-new {
          padding: 0.7rem 1.2rem;
          background: linear-gradient(135deg, #8B3A3A 0%, #6B2D2D 100%);
          color: #F7EDE8;
          border: none;
          border-radius: 100px;
          font-family: 'Jost', sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(107,45,45,0.25);
          transition: all 0.2s;
          white-space: nowrap;
          display: inline-block;
        }
        .btn-new:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(107,45,45,0.35); }
        .filters {
          max-width: 500px;
          margin: 0 auto 1.5rem;
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.2rem;
        }
        .filter-btn {
          padding: 0.5rem 1rem;
          border-radius: 100px;
          border: 1.5px solid rgba(196,120,106,0.25);
          background: rgba(255,255,255,0.5);
          font-family: 'Jost', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          color: #8B5A5A;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          letter-spacing: 0.05em;
        }
        .filter-btn.active {
          background: linear-gradient(135deg, #8B3A3A, #6B2D2D);
          color: #F7EDE8;
          border-color: transparent;
        }
        .list { max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
        .empty {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(196,120,106,0.15);
          border-radius: 24px;
          padding: 3rem 2rem;
          text-align: center;
        }
        .empty-icon { font-size: 2.5rem; margin-bottom: 1rem; }
        .empty-text { font-size: 0.85rem; color: #C4786A; margin-bottom: 1.5rem; line-height: 1.6; }
        .appointment-card {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(196,120,106,0.15);
          border-radius: 24px;
          padding: 1.5rem;
          transition: all 0.2s;
        }
        .appointment-card:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(139,58,58,0.08); }
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
        .service-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #6B2D2D;
        }
        .status-badge {
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          padding: 0.3rem 0.8rem;
          border-radius: 100px;
          background: rgba(255,255,255,0.8);
          border: 1px solid currentColor;
        }
        .card-details { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 1.2rem; }
        .detail { font-size: 0.82rem; color: #8B5A5A; display: flex; align-items: center; gap: 0.4rem; }
        .detail-icon { font-size: 0.75rem; opacity: 0.7; }
        .divider { height: 1px; background: linear-gradient(90deg, rgba(196,120,106,0.15), transparent); margin-bottom: 1rem; }
        .btn-cancel {
          background: none;
          border: 1.5px solid rgba(192,57,43,0.3);
          color: #C0392B;
          padding: 0.6rem 1.2rem;
          border-radius: 100px;
          font-family: 'Jost', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel:hover { background: rgba(192,57,43,0.05); border-color: #C0392B; }
      `}</style>

      <Navbar />

      <main className="page">
        <div className="header">
          <div>
            <h1 className="page-title">Meus Agendamentos</h1>
            <p className="page-subtitle">Seus horários marcados</p>
          </div>
          <a href="/agendar" className="btn-new">+ Novo</a>
        </div>

        <div className="filters">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
            >
              {f === 'all' ? 'Todos' : statusLabel[f]}
            </button>
          ))}
        </div>

        <div className="list">
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🪷</div>
              <p className="empty-text">Nenhum agendamento encontrado.<br />Que tal marcar um horário?</p>
              <a href="/agendar" className="btn-new">Agendar agora</a>
            </div>
          ) : (
            filtered.map(appointment => {
              const date = new Date(appointment.scheduled_at)
              return (
                <div key={appointment.id} className="appointment-card">
                  <div className="card-header">
                    <p className="service-name">{appointment.services?.name}</p>
                    <span
                      className="status-badge"
                      style={{ color: statusColor[appointment.status] }}
                    >
                      {statusLabel[appointment.status]}
                    </span>
                  </div>

                  <div className="card-details">
                    <p className="detail">
                      <span className="detail-icon">📅</span>
                      {date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="detail">
                      <span className="detail-icon">🕐</span>
                      {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="detail">
                      <span className="detail-icon">⏱</span>
                      {appointment.services?.duration_minutes >= 60
                        ? `${appointment.services.duration_minutes / 60}h`
                        : `${appointment.services?.duration_minutes} min`}
                      {' · '}
                      R$ {appointment.services?.price}
                    </p>
                  </div>

                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <>
                      <div className="divider" />
                      <button onClick={() => handleCancelar(appointment.id)} className="btn-cancel">
                        Cancelar agendamento
                      </button>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>
    </>
  )
}