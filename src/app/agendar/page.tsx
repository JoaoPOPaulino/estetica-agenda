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

function getBlockedSlots(appointments: any[], services: Service[], date: string) {
  const blocked = new Set<string>()

  appointments.forEach(app => {
    if (app.status === 'cancelled' || app.status === 'completed') return

    const appDate = new Date(app.scheduled_at)
    const appDateStr = appDate.toISOString().split('T')[0]
    if (appDateStr !== date) return

    const service = services.find(s => s.id === app.service_id)
    if (!service) return

    const endTime = app.completed_at
      ? new Date(app.completed_at)
      : new Date(appDate.getTime() + service.duration_minutes * 60000)

    const startMinutes = appDate.getHours() * 60 + appDate.getMinutes()
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes()

    ALL_SLOTS.forEach(slot => {
      const slotMin = getSlotMinutes(slot)
      if (slotMin >= startMinutes && slotMin < endMinutes) {
        blocked.add(slot)
      }
    })
  })

  return blocked
}

export default function AgendarPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [allAppointments, setAllAppointments] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedHour, setSelectedHour] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: servicesData } = await supabase
        .from('services').select('*').eq('active', true)
      if (servicesData) setServices(servicesData)

      const { data: appsData } = await supabase
        .from('appointments').select('*')
      if (appsData) setAllAppointments(appsData)
    }
    load()
  }, [])

  const selectedServiceData = services.find(s => s.id === selectedService)

  const blockedSlots = selectedDate
    ? getBlockedSlots(allAppointments, services, selectedDate)
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
    if (!selectedService || !selectedDate || !selectedTime) return
    if (!user) { router.push('/login'); return }

    setLoading(true)
    const supabase = createClient()
    const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`)

    const { error } = await supabase.from('appointments').insert({
      client_id: user.id,
      service_id: selectedService,
      scheduled_at: scheduledAt.toISOString(),
      status: 'pending'
    })

    if (!error) setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-rose-50 flex items-center justify-center px-4">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-md p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-rose-700 mb-2">Agendado!</h1>
          <p className="text-gray-400 mb-6">Seu horário foi reservado com sucesso.</p>
          <button
            onClick={() => router.push('/meus-agendamentos')}
            className="bg-rose-600 text-white py-3 px-6 rounded-xl font-semibold w-full"
          >
            Ver meus agendamentos
          </button>
        </div>
      </main>
    )
  }

  const availableSlots = getAvailableSlots()

  return (
    <main className="min-h-screen bg-rose-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-rose-700 mb-1">Agendar</h1>
        <p className="text-gray-400 text-sm mb-6">Escolha o serviço e horário</p>

        {/* Serviços */}
        <h2 className="font-semibold text-gray-600 mb-3">Serviço</h2>
        <div className="flex flex-col gap-3 mb-6">
          {services.map(service => (
            <button
              key={service.id}
              onClick={() => {
                setSelectedService(service.id)
                setSelectedTime(null)
                setSelectedHour(null)
              }}
              className={`p-4 rounded-2xl border-2 text-left transition ${
                selectedService === service.id
                  ? 'border-rose-500 bg-rose-50'
                  : 'border-gray-100 bg-white'
              }`}
            >
              <p className="font-semibold text-gray-700">{service.name}</p>
              <p className="text-sm text-gray-400">
                {service.duration_minutes >= 60
                  ? `${service.duration_minutes / 60}h`
                  : `${service.duration_minutes} min`} · R$ {service.price}
              </p>
            </button>
          ))}
        </div>

        {/* Data */}
        <h2 className="font-semibold text-gray-600 mb-3">Data</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={e => {
            setSelectedDate(e.target.value)
            setSelectedTime(null)
            setSelectedHour(null)
          }}
          min={new Date().toISOString().split('T')[0]}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-6 outline-none focus:border-rose-400 bg-white"
        />

        {/* Horários */}
        {selectedDate && selectedService && (
          <>
            <h2 className="font-semibold text-gray-600 mb-3">Horário</h2>
            {selectedServiceData && selectedServiceData.duration_minutes >= 60 && (
              <p className="text-xs text-rose-400 mb-3">
                ⏱ Este serviço dura {selectedServiceData.duration_minutes / 60}h — os horários subsequentes serão bloqueados automaticamente.
              </p>
            )}

            {/* Seletor de hora */}
            <p className="text-xs text-gray-400 mb-2">Escolha a hora</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {HOURS.map(hour => {
                const slotsInHour = ALL_SLOTS.filter(s => s.startsWith(hour))
                const allBlocked = slotsInHour.every(s => !availableSlots.includes(s))
                return (
                  <button
                    key={hour}
                    onClick={() => { setSelectedHour(hour); setSelectedTime(null) }}
                    disabled={allBlocked}
                    className={`py-3 rounded-xl text-sm font-medium transition ${
                      selectedHour === hour
                        ? 'bg-rose-600 text-white'
                        : allBlocked
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-gray-600'
                    }`}
                  >
                    {hour}h
                  </button>
                )
              })}
            </div>

            {/* Seletor de minuto */}
            {selectedHour && (
              <>
                <p className="text-xs text-gray-400 mb-2">Escolha o minuto</p>
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {['00', '15', '30', '45'].map(min => {
                    const slot = `${selectedHour}:${min}`
                    const available = availableSlots.includes(slot)
                    return (
                      <button
                        key={min}
                        onClick={() => available && setSelectedTime(slot)}
                        disabled={!available}
                        className={`py-3 rounded-xl text-sm font-medium transition ${
                          selectedTime === slot
                            ? 'bg-rose-600 text-white'
                            : available
                            ? 'bg-white border border-gray-200 text-gray-600'
                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        :{min}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* Botão confirmar */}
        <button
          onClick={handleAgendar}
          disabled={!selectedService || !selectedDate || !selectedTime || loading}
          className="w-full bg-rose-600 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-rose-700 transition disabled:opacity-40"
        >
          {loading ? 'Agendando...' : 'Confirmar Agendamento'}
        </button>

        {!user && (
          <p className="text-center text-sm text-gray-400 mt-4">
            Você precisa estar logado para agendar.
          </p>
        )}
      </div>
    </main>
  )
}