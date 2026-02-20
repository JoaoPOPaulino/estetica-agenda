'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/navbar'

type Service = {
  id: string
  name: string
  description: string
  duration_minutes: number
  price: number
}

type Professional = {
  id: string
  name: string
  bio: string
  photo_url: string
}

const ALL_SLOTS = Array.from({ length: 9 * 4 }, (_, i) => {
  const totalMin = 8 * 60 + i * 15
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 12) return null
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}).filter(Boolean) as string[]

const HOURS = [...new Set(ALL_SLOTS.map(s => s.split(':')[0]))]

function getSlotMinutes(slot: string) {
  const [h, m] = slot.split(':').map(Number)
  return h * 60 + m
}

function getBlockedSlots(appointments: any[], services: Service[], date: string, professionalId: string) {
  const blocked = new Set<string>()
  appointments.forEach(app => {
    if (app.status === 'cancelled' || app.status === 'completed') return
    if (app.professional_id !== professionalId) return
    const appDate = new Date(app.scheduled_at)
    if (appDate.toISOString().split('T')[0] !== date) return
    const service = services.find(s => s.id === app.service_id)
    if (!service) return
    const endTime = app.completed_at
      ? new Date(app.completed_at)
      : new Date(appDate.getTime() + service.duration_minutes * 60000)
    const startMin = appDate.getHours() * 60 + appDate.getMinutes()
    const endMin = endTime.getHours() * 60 + endTime.getMinutes()
    ALL_SLOTS.forEach(slot => {
      const slotMin = getSlotMinutes(slot)
      if (slotMin >= startMin && slotMin < endMin) blocked.add(slot)
    })
  })
  return blocked
}

function CalendarPicker({ selected, onSelect }: { selected: string, onSelect: (d: string) => void }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const weekdays = ['D','S','T','Q','Q','S','S']

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function handleDay(day: number) {
    const date = new Date(viewYear, viewMonth, day)
    date.setHours(0, 0, 0, 0)
    if (date < today) return
    const str = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    onSelect(str)
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="calendar-wrapper">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-month">{monthNames[viewMonth]} {viewYear}</span>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="cal-weekdays">
        {weekdays.map((w, i) => <div key={i} className="cal-weekday">{w}</div>)}
      </div>
      <div className="cal-days">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="cal-day empty" />
          const date = new Date(viewYear, viewMonth, day)
          date.setHours(0,0,0,0)
          const isPast = date < today
          const isToday = date.getTime() === today.getTime()
          const str = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const isSelected = selected === str
          return (
            <button
              key={day}
              className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              disabled={isPast}
              onClick={() => handleDay(day)}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AgendarPage() {
  const router = useRouter()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [allAppointments, setAllAppointments] = useState<any[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedHour, setSelectedHour] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [dateError, setDateError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: profsData } = await supabase.from('professionals').select('*').eq('active', true)
      if (profsData) setProfessionals(profsData)
      const { data: servicesData } = await supabase.from('services').select('*').eq('active', true)
      if (servicesData) setServices(servicesData)
      const { data: appsData } = await supabase.from('appointments').select('*')
      if (appsData) setAllAppointments(appsData)
    }
    load()
  }, [])

  const selectedServiceData = services.find(s => s.id === selectedService)
  const blockedSlots = selectedDate && selectedProfessional
    ? getBlockedSlots(allAppointments, services, selectedDate, selectedProfessional)
    : new Set<string>()

  function getAvailableSlots() {
    if (!selectedServiceData) return ALL_SLOTS
    const durationSlots = Math.ceil(selectedServiceData.duration_minutes / 15)
    return ALL_SLOTS.filter(slot => {
      const slotMin = getSlotMinutes(slot)
      for (let i = 0; i < durationSlots; i++) {
        const checkMin = slotMin + i * 15
        const checkSlot = ALL_SLOTS.find(s => getSlotMinutes(s) === checkMin)
        if (checkSlot && blockedSlots.has(checkSlot)) return false
      }
      return !blockedSlots.has(slot)
    })
  }

  async function handleAgendar() {
    if (!selectedProfessional || !selectedService || !selectedDate || !selectedTime) return
    if (!user) { router.push('/login'); return }
    setLoading(true)
    const supabase = createClient()
    const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`)
    const { error } = await supabase.from('appointments').insert({
      client_id: user.id,
      service_id: selectedService,
      professional_id: selectedProfessional,
      scheduled_at: scheduledAt.toISOString(),
      status: 'pending'
    })
    if (!error) setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .page { min-height: 100vh; background-color: #F7EDE8; display: flex; align-items: center; justify-content: center; padding: 2rem; font-family: 'Jost', sans-serif; }
          .card { background: rgba(255,255,255,0.65); backdrop-filter: blur(20px); border: 1px solid rgba(196,120,106,0.2); border-radius: 32px; padding: 3rem 2.5rem; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(139,58,58,0.08); }
          .success-icon { font-size: 4rem; margin-bottom: 1.5rem; }
          .title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; color: #6B2D2D; margin-bottom: 0.5rem; }
          .desc { font-size: 0.85rem; color: #C4786A; margin-bottom: 2rem; line-height: 1.6; }
          .btn { display: block; width: 100%; padding: 1rem; background: linear-gradient(135deg, #8B3A3A 0%, #6B2D2D 100%); color: #F7EDE8; border: none; border-radius: 100px; font-family: 'Jost', sans-serif; font-size: 0.85rem; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; box-shadow: 0 4px 20px rgba(107,45,45,0.3); text-decoration: none; }
        `}</style>
        <Navbar />
        <main className="page">
          <div className="header">
            <h1 className="page-title">Agendar</h1>
            <p className="page-subtitle">Escolha a profissional e horário</p>
          </div>
        </main>
      </>
    )
  }

  const availableSlots = getAvailableSlots()

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
        .header { max-width: 500px; margin: 0 auto 2.5rem; }
        .back-link:hover { opacity: 1; }
        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem;
          font-weight: 600;
          color: #6B2D2D;
          margin-bottom: 0.3rem;
        }
        .page-subtitle { font-size: 0.78rem; letter-spacing: 0.1em; color: #C4786A; }
        .section { max-width: 500px; margin: 0 auto 2rem; }
        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #6B2D2D;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(196,120,106,0.3), transparent);
        }
        .prof-card {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(196,120,106,0.15);
          border-radius: 20px;
          padding: 1.2rem 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .prof-card:hover { border-color: rgba(196,120,106,0.4); transform: translateY(-1px); }
        .prof-card.selected { border-color: #8B3A3A; background: rgba(139,58,58,0.05); }
        .prof-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, #F2D4CC, #E8B4A8);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; flex-shrink: 0;
        }
        .prof-info { flex: 1; }
        .prof-name { font-weight: 500; color: #4A2020; font-size: 0.95rem; }
        .prof-bio { font-size: 0.78rem; color: #C4786A; margin-top: 0.15rem; }
        .check { color: #8B3A3A; font-size: 1.1rem; opacity: 0; transition: opacity 0.2s; }
        .prof-card.selected .check { opacity: 1; }
        .service-card {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(196,120,106,0.15);
          border-radius: 20px;
          padding: 1.2rem 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .service-card:hover { border-color: rgba(196,120,106,0.4); transform: translateY(-1px); }
        .service-card.selected { border-color: #8B3A3A; background: rgba(139,58,58,0.05); }
        .service-name { font-weight: 500; color: #4A2020; font-size: 0.95rem; }
        .service-meta { font-size: 0.78rem; color: #C4786A; margin-top: 0.2rem; }
        .service-price { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: #8B3A3A; }
        .hint { font-size: 0.72rem; color: #C4786A; margin-bottom: 1rem; font-style: italic; }
        .hours-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.6rem; margin-bottom: 1rem; }
        .minutes-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.6rem; margin-bottom: 1.5rem; }
        .slot-btn {
          padding: 0.75rem 0.5rem;
          border-radius: 12px;
          font-family: 'Jost', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1.5px solid rgba(196,120,106,0.2);
          background: rgba(255,255,255,0.65);
          color: #4A2020;
        }
        .slot-btn:hover:not(:disabled) { border-color: #C4786A; transform: translateY(-1px); }
        .slot-btn.selected { background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8; border-color: transparent; }
        .slot-btn:disabled { background: rgba(0,0,0,0.04); color: #CCC; cursor: not-allowed; border-color: transparent; }
        .btn-confirm {
          width: 100%; max-width: 500px; display: block; margin: 0 auto;
          padding: 1.1rem;
          background: linear-gradient(135deg, #8B3A3A 0%, #6B2D2D 100%);
          color: #F7EDE8; border: none; border-radius: 100px;
          font-family: 'Jost', sans-serif; font-size: 0.85rem; font-weight: 500;
          letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer;
          transition: all 0.3s; box-shadow: 0 4px 20px rgba(107,45,45,0.3);
        }
        .btn-confirm:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(107,45,45,0.4); }
        .btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .login-hint { text-align: center; font-size: 0.78rem; color: #C4786A; margin-top: 1rem; }
        .login-hint a { color: #8B3A3A; font-weight: 500; text-decoration: none; }
        .calendar-wrapper {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(196,120,106,0.2);
          border-radius: 20px;
          padding: 1.2rem;
          overflow: hidden;
        }
        .cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem; }
        .cal-month { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: #6B2D2D; letter-spacing: 0.05em; }
        .cal-nav {
          background: none; border: 1.5px solid rgba(196,120,106,0.3);
          border-radius: 8px; width: 32px; height: 32px; cursor: pointer;
          color: #8B3A3A; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .cal-nav:hover { background: rgba(139,58,58,0.08); }
        .cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 0.5rem; }
        .cal-weekday { text-align: center; font-size: 0.65rem; font-weight: 500; letter-spacing: 0.1em; color: #C4786A; padding: 0.3rem 0; }
        .cal-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.2rem; }
        .cal-day {
          aspect-ratio: 1; border: none; background: none; border-radius: 10px;
          font-family: 'Jost', sans-serif; font-size: 0.82rem; color: #4A2020;
          cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center;
        }
        .cal-day:hover:not(:disabled) { background: rgba(196,120,106,0.15); }
        .cal-day.selected { background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8; font-weight: 500; }
        .cal-day.today { border: 1.5px solid rgba(139,58,58,0.3); }
        .cal-day:disabled { color: #DDD; cursor: not-allowed; }
        .cal-day.empty { cursor: default; pointer-events: none; }
        .date-error { font-size: 0.72rem; color: #C0392B; margin-top: 0.6rem; padding-left: 0.3rem; }
      `}</style>

      <Navbar />
        <main className="page">
          <div className="header">
            <h1 className="page-title">Agendar</h1>
            <p className="page-subtitle">Escolha a profissional e horário</p>
          </div>

        {/* Profissionais */}
        <div className="section">
          <h2 className="section-title">Profissional</h2>
          {professionals.map(prof => (
            <div
              key={prof.id}
              className={`prof-card ${selectedProfessional === prof.id ? 'selected' : ''}`}
              onClick={() => { setSelectedProfessional(prof.id); setSelectedTime(null); setSelectedHour(null) }}
            >
              <div className="prof-avatar">🪷</div>
              <div className="prof-info">
                <p className="prof-name">{prof.name}</p>
                {prof.bio && <p className="prof-bio">{prof.bio}</p>}
              </div>
              <span className="check">✓</span>
            </div>
          ))}
        </div>

        {/* Serviços */}
        {selectedProfessional && (
          <div className="section">
            <h2 className="section-title">Serviço</h2>
            {services.map(service => (
              <div
                key={service.id}
                className={`service-card ${selectedService === service.id ? 'selected' : ''}`}
                onClick={() => { setSelectedService(service.id); setSelectedTime(null); setSelectedHour(null) }}
              >
                <div>
                  <p className="service-name">{service.name}</p>
                  <p className="service-meta">
                    {service.duration_minutes >= 60
                      ? `${service.duration_minutes / 60}h`
                      : `${service.duration_minutes} min`}
                  </p>
                </div>
                <p className="service-price">R$ {service.price}</p>
              </div>
            ))}
          </div>
        )}

        {/* Data */}
        {selectedService && (
          <div className="section">
            <h2 className="section-title">Data</h2>
            <CalendarPicker
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date)
                setSelectedTime(null)
                setSelectedHour(null)
                setDateError('')
              }}
            />
            {dateError && <p className="date-error">⚠ {dateError}</p>}
          </div>
        )}

        {/* Horários */}
        {selectedDate && selectedService && selectedProfessional && (
          <div className="section">
            <h2 className="section-title">Horário</h2>
            {selectedServiceData && selectedServiceData.duration_minutes >= 60 && (
              <p className="hint">⏱ Este serviço dura {selectedServiceData.duration_minutes / 60}h — horários subsequentes serão bloqueados.</p>
            )}

            <p style={{ fontSize: '0.72rem', color: '#C4A090', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>HORA</p>
            <div className="hours-grid">
              {HOURS.map(hour => {
                const slotsInHour = ALL_SLOTS.filter(s => s.startsWith(hour))
                const allBlocked = slotsInHour.every(s => !availableSlots.includes(s))
                return (
                  <button
                    key={hour}
                    onClick={() => { setSelectedHour(hour); setSelectedTime(null) }}
                    disabled={allBlocked}
                    className={`slot-btn ${selectedHour === hour ? 'selected' : ''}`}
                  >
                    {hour}h
                  </button>
                )
              })}
            </div>

            {selectedHour && (
              <>
                <p style={{ fontSize: '0.72rem', color: '#C4A090', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>MINUTO</p>
                <div className="minutes-grid">
                  {['00', '15', '30', '45'].map(min => {
                    const slot = `${selectedHour}:${min}`
                    const available = availableSlots.includes(slot)
                    return (
                      <button
                        key={min}
                        onClick={() => available && setSelectedTime(slot)}
                        disabled={!available}
                        className={`slot-btn ${selectedTime === slot ? 'selected' : ''}`}
                      >
                        :{min}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <button
          className="btn-confirm"
          onClick={handleAgendar}
          disabled={!selectedProfessional || !selectedService || !selectedDate || !selectedTime || loading}
        >
          {loading ? 'Agendando...' : 'Confirmar Agendamento'}
        </button>

        {!user && (
          <p className="login-hint">
            Você precisa estar <a href="/login">logada</a> para agendar.
          </p>
        )}
      </main>
    </>
  )
}