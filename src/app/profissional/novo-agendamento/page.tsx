'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Service = {
  id: string
  name: string
  duration_minutes: number
  price: number
  service_type: string
  blocks_equipment: boolean
}

type Client = {
  id: string
  full_name: string
  phone: string
  isWalkIn?: boolean
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

function getBlockedSlots(
  appointments: any[],
  allServices: Service[],
  date: string,
  professionalId: string,
  selectedServiceType: string,
  selectedBlocks: boolean
) {
  const blocked = new Set<string>()
  appointments.forEach(app => {
    if (app.status === 'cancelled' || app.status === 'completed') return
    const appDate = new Date(app.scheduled_at)
    if (appDate.toISOString().split('T')[0] !== date) return
    const appService = allServices.find(s => s.id === app.service_id)
    if (!appService) return
    const sameProf = app.professional_id === professionalId
    const sameEquipment =
      selectedBlocks &&
      appService.blocks_equipment &&
      appService.service_type === selectedServiceType
    if (!sameProf && !sameEquipment) return
    const end = app.completed_at
      ? new Date(app.completed_at)
      : new Date(new Date(app.scheduled_at).getTime() + appService.duration_minutes * 60000)
    const startMin = appDate.getHours() * 60 + appDate.getMinutes()
    const endMin = end.getHours() * 60 + end.getMinutes()
    ALL_SLOTS.forEach(slot => {
      const slotMin = getSlotMinutes(slot)
      if (slotMin >= startMin && slotMin < endMin) blocked.add(slot)
    })
  })
  return blocked
}

function CalendarPicker({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const weekdays = ['D','S','T','Q','Q','S','S']
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="calendar-wrapper">
      <div className="cal-header">
        <button className="cal-nav" onClick={() => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1)}>‹</button>
        <span className="cal-month">{monthNames[viewMonth]} {viewYear}</span>
        <button className="cal-nav" onClick={() => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y+1)) : setViewMonth(m => m+1)}>›</button>
      </div>
      <div className="cal-weekdays">{weekdays.map((w,i) => <div key={i} className="cal-weekday">{w}</div>)}</div>
      <div className="cal-days">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="cal-day empty" />
          const date = new Date(viewYear, viewMonth, day); date.setHours(0,0,0,0)
          const isPast = date < today
          const isToday = date.getTime() === today.getTime()
          const str = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          return (
            <button key={day} disabled={isPast}
              className={`cal-day ${selected === str ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => !isPast && onSelect(str)}
            >{day}</button>
          )
        })}
      </div>
    </div>
  )
}

export default function NovoAgendamentoPage() {
  const router = useRouter()
  const [profId, setProfId] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [allAppointments, setAllAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Busca cliente
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Client[]>([])
  const [searched, setSearched] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Novo cliente
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [creatingClient, setCreatingClient] = useState(false)

  // Agendamento
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedHour, setSelectedHour] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'professional') { router.push('/'); return }
      setProfId(user.id)
      const { data: srvData } = await supabase
        .from('services').select('*')
        .eq('professional_id', user.id).eq('active', true).order('name')
      if (srvData) setServices(srvData as Service[])
      const { data: appsData } = await supabase.from('appointments').select('*')
      if (appsData) setAllAppointments(appsData)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearched(false)
    setSearchResults([])
    setSelectedClient(null)
    const supabase = createClient()
    const q = searchQuery.trim()
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'client')
      .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(5)
    setSearchResults((data as Client[]) ?? [])
    setSearched(true)
    setSearching(false)
  }

  async function handleCreateClient() {
  if (!newClientName.trim()) return

  setCreatingClient(true)
  setMsg(null)

  const supabase = createClient()

  const { data, error } = await supabase
    .from('walk_in_clients')
    .insert({
      full_name: newClientName.trim(),
      phone: newClientPhone.replace(/\D/g, ''),
      created_by: profId,
    })
    .select('id, full_name, phone')
    .single()

  if (error || !data) {
    setMsg({ type: 'error', text: 'Erro ao criar cliente.' })
    setCreatingClient(false)
    return
  }

  const newClient: Client = {
    id: data.id,
    full_name: data.full_name,
    phone: data.phone,
    isWalkIn: true,
  }

  setSelectedClient(newClient)
  setShowNewClient(false)
  setNewClientName('')
  setNewClientPhone('')
  setCreatingClient(false)
}

  async function handleSave() {
    if (!selectedClient || !selectedService || !selectedDate || !selectedTime) {
      setMsg({ type: 'error', text: 'Preencha todos os campos obrigatórios.' })
      return
    }
    setSaving(true)
    setMsg(null)
    const supabase = createClient()
    const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`)
   const appointmentData = selectedClient.isWalkIn
    ? {
        walk_in_client_id: selectedClient.id,
        client_id: null,
      }
    : {
        client_id: selectedClient.id,
        walk_in_client_id: null,
      }

  const { error } = await supabase.from('appointments').insert({
    ...appointmentData,
    professional_id: profId,
    service_id: selectedService,
    scheduled_at: scheduledAt.toISOString(),
    status: 'confirmed',
    notes: notes.trim() || null,
  })
    setSaving(false)
    if (error) setMsg({ type: 'error', text: 'Erro ao agendar.' })
    else setSuccess(true)
  }

  const selectedServiceData = services.find(s => s.id === selectedService)
  const blockedSlots = selectedDate && selectedServiceData
    ? getBlockedSlots(allAppointments, services, selectedDate, profId, selectedServiceData.service_type, selectedServiceData.blocks_equipment)
    : new Set<string>()

  function getAvailableSlots() {
    if (!selectedServiceData) return ALL_SLOTS
    const dur = Math.ceil(selectedServiceData.duration_minutes / 15)
    return ALL_SLOTS.filter(slot => {
      const slotMin = getSlotMinutes(slot)
      for (let i = 0; i < dur; i++) {
        const checkMin = slotMin + i * 15
        const checkSlot = ALL_SLOTS.find(s => getSlotMinutes(s) === checkMin)
        if (checkSlot && blockedSlots.has(checkSlot)) return false
      }
      return !blockedSlots.has(slot)
    })
  }

  const availableSlots = getAvailableSlots()

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

  if (success) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Jost:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { min-height: 100vh; background: #F7EDE8; display: flex; align-items: center; justify-content: center; padding: 2rem; font-family: 'Jost', sans-serif; }
        .card { background: rgba(255,255,255,0.65); backdrop-filter: blur(20px); border: 1px solid rgba(196,120,106,0.2); border-radius: 32px; padding: 3rem 2.5rem; max-width: 380px; width: 100%; text-align: center; }
        .icon { font-size: 3.5rem; margin-bottom: 1.2rem; }
        .title { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; color: #6B2D2D; margin-bottom: 0.5rem; }
        .desc { font-size: 0.82rem; color: #C4786A; margin-bottom: 2rem; line-height: 1.6; }
        .btn { display: block; padding: 0.9rem; background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8; border: none; border-radius: 100px; font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; text-decoration: none; margin-bottom: 0.6rem; }
        .btn-outline { display: block; padding: 0.9rem; background: none; color: #8B3A3A; border: 1.5px solid rgba(139,58,58,0.3); border-radius: 100px; font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; }
      `}</style>
      <main className="page">
        <div className="card">
          <div className="icon">✅</div>
          <h1 className="title">Agendado!</h1>
          <p className="desc">O agendamento de <strong>{selectedClient?.full_name}</strong> foi confirmado com sucesso.</p>
          <a href="/profissional" className="btn">Ver Agenda</a>
          <a href="/profissional/novo-agendamento" className="btn-outline">Novo Agendamento</a>
        </div>
      </main>
    </>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Jost:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page {
          min-height: 100vh; background-color: #F7EDE8;
          background-image: radial-gradient(ellipse at 20% 30%, rgba(196,120,106,0.1) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(242,212,204,0.3) 0%, transparent 50%);
          padding: 0 0 4rem; font-family: 'Jost', sans-serif;
        }
        .topbar {
          background: rgba(247,237,232,0.92); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(196,120,106,0.15); padding: 0.75rem 1.2rem;
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
        .btn-logout {
          padding: 0.4rem 0.9rem; border-radius: 100px; font-size: 0.72rem;
          font-weight: 500; color: #C4786A; border: 1.5px solid rgba(196,120,106,0.3);
          background: none; cursor: pointer; font-family: 'Jost', sans-serif; transition: all 0.2s;
        }
        .btn-logout:hover { color: #8B3A3A; border-color: #8B3A3A; }
        .content { padding: 2rem 1.2rem; max-width: 520px; margin: 0 auto; }
        .page-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; color: #6B2D2D; margin-bottom: 0.2rem; }
        .page-subtitle { font-size: 0.78rem; letter-spacing: 0.1em; color: #C4786A; margin-bottom: 2rem; }
        .step { margin-bottom: 2rem; }
        .step-title {
          font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600;
          color: #6B2D2D; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;
        }
        .step-title::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(196,120,106,0.3), transparent); }
        .step-num {
          width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8;
          font-size: 0.65rem; font-weight: 600; display: flex; align-items: center; justify-content: center;
          font-family: 'Jost', sans-serif;
        }
        .search-row { display: flex; gap: 0.6rem; }
        input[type="text"], input[type="tel"], textarea {
          width: 100%; padding: 0.85rem 1.1rem;
          background: rgba(255,255,255,0.7); border: 1.5px solid rgba(196,120,106,0.2); border-radius: 12px;
          font-family: 'Jost', sans-serif; font-size: 0.88rem; color: #4A2020;
          outline: none; transition: border-color 0.2s;
        }
        input:focus, textarea:focus { border-color: #C4786A; background: rgba(255,255,255,0.9); }
        input::placeholder, textarea::placeholder { color: #C4A090; }
        textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
        .btn-search {
          padding: 0 1.2rem; border-radius: 12px; border: none; flex-shrink: 0;
          background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8;
          font-family: 'Jost', sans-serif; font-size: 0.78rem; font-weight: 500;
          cursor: pointer; white-space: nowrap; transition: all 0.2s;
        }
        .btn-search:disabled { opacity: 0.5; cursor: not-allowed; }
        .search-results { margin-top: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .client-result {
          background: rgba(255,255,255,0.65); backdrop-filter: blur(10px);
          border: 1.5px solid rgba(196,120,106,0.15); border-radius: 14px;
          padding: 0.9rem 1.1rem; cursor: pointer; transition: all 0.2s;
          display: flex; justify-content: space-between; align-items: center;
        }
        .client-result:hover { border-color: rgba(196,120,106,0.4); transform: translateY(-1px); }
        .client-result.selected { border-color: #8B3A3A; background: rgba(139,58,58,0.05); }
        .client-name { font-weight: 500; color: #4A2020; font-size: 0.9rem; }
        .client-phone { font-size: 0.75rem; color: #C4786A; margin-top: 0.1rem; }
        .check-icon { color: #8B3A3A; font-size: 1rem; opacity: 0; transition: opacity 0.2s; }
        .client-result.selected .check-icon { opacity: 1; }
        .no-results { font-size: 0.82rem; color: #C4A090; font-style: italic; padding: 0.5rem 0; }
        .selected-client-card {
          background: rgba(139,58,58,0.06); border: 1.5px solid rgba(139,58,58,0.2);
          border-radius: 16px; padding: 1rem 1.2rem;
          display: flex; justify-content: space-between; align-items: center;
        }
        .btn-change {
          font-size: 0.72rem; color: #C4786A; background: none; border: none;
          cursor: pointer; font-family: 'Jost', sans-serif; text-decoration: underline;
        }
        .btn-new-client {
          margin-top: 0.8rem; padding: 0.65rem 1.2rem; border-radius: 100px;
          border: 1.5px solid rgba(196,120,106,0.3); background: none;
          font-family: 'Jost', sans-serif; font-size: 0.75rem; font-weight: 500;
          color: #8B3A3A; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.4rem;
        }
        .btn-new-client:hover { background: rgba(139,58,58,0.06); }
        .new-client-form {
          margin-top: 0.8rem; background: rgba(255,255,255,0.7);
          border: 1.5px solid rgba(196,120,106,0.2); border-radius: 16px; padding: 1.2rem;
          display: flex; flex-direction: column; gap: 0.8rem;
        }
        .new-client-title { font-size: 0.72rem; letter-spacing: 0.1em; color: #C4786A; text-transform: uppercase; }
        .field-label { font-size: 0.68rem; letter-spacing: 0.12em; color: #C4786A; margin-bottom: 0.3rem; text-transform: uppercase; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
        .btn-create-client {
          padding: 0.8rem; border-radius: 100px; border: none;
          background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8;
          font-family: 'Jost', sans-serif; font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s;
        }
        .btn-create-client:disabled { opacity: 0.5; cursor: not-allowed; }
        .service-card {
          background: rgba(255,255,255,0.65); backdrop-filter: blur(10px);
          border: 1.5px solid rgba(196,120,106,0.15); border-radius: 16px;
          padding: 1rem 1.2rem; cursor: pointer; transition: all 0.2s;
          margin-bottom: 0.6rem; display: flex; justify-content: space-between; align-items: center;
        }
        .service-card:hover { border-color: rgba(196,120,106,0.4); transform: translateY(-1px); }
        .service-card.selected { border-color: #8B3A3A; background: rgba(139,58,58,0.05); }
        .service-name { font-weight: 500; color: #4A2020; font-size: 0.9rem; }
        .service-meta { font-size: 0.75rem; color: #C4786A; margin-top: 0.15rem; }
        .service-price { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: #8B3A3A; }
        .calendar-wrapper {
          background: rgba(255,255,255,0.65); backdrop-filter: blur(10px);
          border: 1.5px solid rgba(196,120,106,0.2); border-radius: 20px; padding: 1.2rem; overflow: hidden;
        }
        .cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem; }
        .cal-month { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: #6B2D2D; }
        .cal-nav {
          background: none; border: 1.5px solid rgba(196,120,106,0.3); border-radius: 8px;
          width: 32px; height: 32px; cursor: pointer; color: #8B3A3A; font-size: 0.9rem;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
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
        .hours-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-bottom: 0.8rem; }
        .minutes-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
        .slot-btn {
          padding: 0.7rem 0.5rem; border-radius: 10px; font-family: 'Jost', sans-serif;
          font-size: 0.8rem; font-weight: 500; cursor: pointer; transition: all 0.2s;
          border: 1.5px solid rgba(196,120,106,0.2); background: rgba(255,255,255,0.65); color: #4A2020;
        }
        .slot-btn:hover:not(:disabled) { border-color: #C4786A; }
        .slot-btn.selected { background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8; border-color: transparent; }
        .slot-btn:disabled { background: rgba(0,0,0,0.04); color: #CCC; cursor: not-allowed; border-color: transparent; }
        .slot-hint { font-size: 0.7rem; color: #C4A090; margin-bottom: 0.6rem; letter-spacing: 0.05em; }
        .obs-label { font-size: 0.68rem; letter-spacing: 0.12em; color: #C4786A; margin-bottom: 0.4rem; text-transform: uppercase; }
        .msg { font-size: 0.78rem; padding: 0.7rem 1rem; border-radius: 10px; margin-bottom: 1rem; }
        .msg.success { color: #27AE60; background: rgba(39,174,96,0.08); border: 1px solid rgba(39,174,96,0.2); }
        .msg.error { color: #C0392B; background: rgba(192,57,43,0.08); border: 1px solid rgba(192,57,43,0.2); }
        .btn-confirm {
          width: 100%; padding: 1.1rem; border-radius: 100px; border: none;
          background: linear-gradient(135deg, #8B3A3A, #6B2D2D); color: #F7EDE8;
          font-family: 'Jost', sans-serif; font-size: 0.85rem; font-weight: 500;
          letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer;
          transition: all 0.2s; box-shadow: 0 4px 20px rgba(107,45,45,0.3);
        }
        .btn-confirm:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(107,45,45,0.4); }
        .btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
      `}</style>

      <main className="page">
        <div className="topbar">
          <p className="topbar-brand">Thamyres Ribeiro</p>
          <div className="topbar-right">
            <a href="/profissional" className="topbar-link">Agenda</a>
            <a href="/profissional/servicos" className="topbar-link">Serviços</a>
            <a href="/profissional/perfil" className="topbar-link">Perfil</a>
            <button className="btn-logout" onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              router.push('/admin/login')
            }}>Sair</button>
          </div>
        </div>

        <div className="content">
          <h1 className="page-title">Novo Agendamento</h1>
          <p className="page-subtitle">Agende para uma cliente</p>

          {/* Step 1 — Cliente */}
          <div className="step">
            <h2 className="step-title"><span className="step-num">1</span> Cliente</h2>
            {selectedClient ? (
              <div className="selected-client-card">
                <div>
                  <p className="client-name">{selectedClient.full_name}</p>
                  {selectedClient.phone && <p className="client-phone">{selectedClient.phone}</p>}
                </div>
                <button className="btn-change" onClick={() => {
                  setSelectedClient(null); setSearched(false); setSearchResults([]); setSearchQuery('')
                }}>Trocar</button>
              </div>
            ) : (
              <>
                <div className="search-row">
                  <input
                    type="text" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Buscar por nome ou telefone..."
                  />
                  <button className="btn-search" onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                    {searching ? '...' : 'Buscar'}
                  </button>
                </div>

                {searched && (
                  <div className="search-results">
                    {searchResults.length === 0 ? (
                      <p className="no-results">Nenhuma cliente encontrada.</p>
                    ) : searchResults.map((c: Client) => (
                      <div
                        key={c.id}
                        className={`client-result ${selectedClient && (selectedClient as Client).id === c.id ? 'selected' : ''}`}
                        onClick={() => setSelectedClient(c)}
                      >
                        <div>
                          <p className="client-name">{c.full_name}</p>
                          {c.phone && <p className="client-phone">{c.phone}</p>}
                        </div>
                        <span className="check-icon">✓</span>
                      </div>
                    ))}
                  </div>
                )}

                {(searched || !searchQuery) && !selectedClient && (
                  <button className="btn-new-client" onClick={() => setShowNewClient(v => !v)}>
                    {showNewClient ? '× Cancelar' : '+ Cadastrar nova cliente'}
                  </button>
                )}

                {showNewClient && (
                  <div className="new-client-form">
                    <p className="new-client-title">Nova Cliente</p>
                    <div className="form-row">
                      <div>
                        <p className="field-label">Nome *</p>
                        <input type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Nome completo" />
                      </div>
                      <div>
                        <p className="field-label">Telefone</p>
                        <input type="tel" value={newClientPhone}
                          onChange={e => setNewClientPhone(e.target.value.replace(/\D/g,'').slice(0,11))}
                          placeholder="DDD + número" inputMode="numeric" />
                      </div>
                    </div>
                    {msg && msg.type === 'error' && <p className={`msg ${msg.type}`}>{msg.text}</p>}
                    <button className="btn-create-client" onClick={handleCreateClient} disabled={creatingClient || !newClientName.trim()}>
                      {creatingClient ? 'Criando...' : 'Cadastrar e Selecionar'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Step 2 — Serviço */}
          {selectedClient && (
            <div className="step">
              <h2 className="step-title"><span className="step-num">2</span> Serviço</h2>
              {services.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#C4A090', fontStyle: 'italic' }}>
                  Nenhum serviço ativo. <a href="/profissional/servicos" style={{ color: '#8B3A3A' }}>Cadastrar serviços</a>
                </p>
              ) : services.map((s: Service) => (
                <div key={s.id}
                  className={`service-card ${selectedService === s.id ? 'selected' : ''}`}
                  onClick={() => { setSelectedService(s.id); setSelectedTime(null); setSelectedHour(null) }}
                >
                  <div>
                    <p className="service-name">{s.name}</p>
                    <p className="service-meta">
                      {s.duration_minutes >= 60 ? `${s.duration_minutes / 60}h` : `${s.duration_minutes} min`}
                      {s.service_type ? ` · ${s.service_type}` : ''}
                    </p>
                  </div>
                  <p className="service-price">R$ {s.price}</p>
                </div>
              ))}
            </div>
          )}

          {/* Step 3 — Data */}
          {selectedService && (
            <div className="step">
              <h2 className="step-title"><span className="step-num">3</span> Data</h2>
              <CalendarPicker selected={selectedDate} onSelect={d => { setSelectedDate(d); setSelectedTime(null); setSelectedHour(null) }} />
            </div>
          )}

          {/* Step 4 — Horário */}
          {selectedDate && selectedService && (
            <div className="step">
              <h2 className="step-title"><span className="step-num">4</span> Horário</h2>
              <p className="slot-hint">HORA</p>
              <div className="hours-grid">
                {HOURS.map(hour => {
                  const slotsInHour = ALL_SLOTS.filter(s => s.startsWith(hour))
                  const allBlocked = slotsInHour.every(s => !availableSlots.includes(s))
                  return (
                    <button key={hour} disabled={allBlocked}
                      className={`slot-btn ${selectedHour === hour ? 'selected' : ''}`}
                      onClick={() => { setSelectedHour(hour); setSelectedTime(null) }}
                    >{hour}h</button>
                  )
                })}
              </div>
              {selectedHour && (
                <>
                  <p className="slot-hint">MINUTO</p>
                  <div className="minutes-grid">
                    {['00', '15', '30', '45'].map(min => {
                      const slot = `${selectedHour}:${min}`
                      const available = availableSlots.includes(slot)
                      return (
                        <button key={min} disabled={!available}
                          className={`slot-btn ${selectedTime === slot ? 'selected' : ''}`}
                          onClick={() => available && setSelectedTime(slot)}
                        >:{min}</button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 5 — Observações */}
          {selectedTime && (
            <div className="step">
              <h2 className="step-title"><span className="step-num">5</span> Observações</h2>
              <p className="obs-label">Notas internas (opcional)</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Cliente com sensibilidade, trazer laudo médico, etc."
              />
            </div>
          )}

          {msg && msg.type === 'error' && !showNewClient && <p className={`msg ${msg.type}`}>{msg.text}</p>}
          <button
            className="btn-confirm"
            onClick={handleSave}
            disabled={!selectedClient || !selectedService || !selectedDate || !selectedTime || saving}
          >
            {saving ? 'Agendando...' : 'Confirmar Agendamento'}
          </button>
        </div>
      </main>
    </>
  )
}