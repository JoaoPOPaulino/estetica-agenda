'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Appointment = {
  id: string
  scheduled_at: string
  status: string
  services: {
    name: string
    duration_minutes: number
    price: number
  }
}

export default function MeusAgendamentosPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

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
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a)
    )
  }

  const statusLabel: Record<string, string> = {
    pending: '⏳ Pendente',
    confirmed: '✅ Confirmado',
    cancelled: '❌ Cancelado',
  }

  const statusColor: Record<string, string> = {
    pending: 'text-yellow-500',
    confirmed: 'text-green-500',
    cancelled: 'text-red-400',
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-rose-50 flex items-center justify-center">
        <p className="text-rose-400">Carregando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-rose-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-rose-700">Meus Agendamentos</h1>
            <p className="text-gray-400 text-sm">Seus horários marcados</p>
          </div>
          <button
            onClick={() => router.push('/agendar')}
            className="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
          >
            + Novo
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-gray-500">Você ainda não tem agendamentos.</p>
            <button
              onClick={() => router.push('/agendar')}
              className="mt-4 bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Agendar agora
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {appointments.map(appointment => {
              const date = new Date(appointment.scheduled_at)
              return (
                <div key={appointment.id} className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-700">{appointment.services.name}</p>
                    <span className={`text-xs font-medium ${statusColor[appointment.status]}`}>
                      {statusLabel[appointment.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </p>
                  <p className="text-sm text-gray-400">
                    {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-sm text-gray-400">{appointment.services.duration_minutes} min · R$ {appointment.services.price}</p>

                  {appointment.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelar(appointment.id)}
                      className="mt-3 text-red-400 text-sm font-medium"
                    >
                      Cancelar agendamento
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}