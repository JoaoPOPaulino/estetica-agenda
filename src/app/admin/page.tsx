'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Appointment = {
  id: string
  scheduled_at: string
  status: string
  notes: string
  services: { name: string; duration_minutes: number; price: number }
  profiles: { full_name: string; phone: string }
}

export default function AdminPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') { router.push('/'); return }

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
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, status } : a)
    )
  }

  async function handleComplete(id: string) {
  const supabase = createClient()
  const completedAt = new Date().toISOString()
  await supabase.from('appointments')
    .update({ status: 'completed', completed_at: completedAt })
    .eq('id', id)
  setAppointments(prev =>
    prev.map(a => a.id === id ? { ...a, status: 'completed', completed_at: completedAt } : a)
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

  const filtered = appointments.filter(a => filter === 'all' || a.status === filter)

  const today = appointments.filter(a => {
    const d = new Date(a.scheduled_at)
    const now = new Date()
    return d.toDateString() === now.toDateString() && a.status !== 'cancelled'
  })

  if (loading) {
    return (
      <main className="min-h-screen bg-rose-50 flex items-center justify-center">
        <p className="text-rose-400">Carregando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-rose-50 px-4 py-8">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-rose-700">Painel Admin</h1>
          <p className="text-gray-400 text-sm">Gerencie os agendamentos</p>
        </div>

        <button
            onClick={() => router.push('/admin/servicos')}
            className="border border-rose-300 text-rose-600 px-4 py-2 rounded-xl text-sm font-semibold"
            >
            Gerenciar Serviços
        </button>

        {/* Cards resumo */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-3xl font-bold text-rose-600">{today.length}</p>
            <p className="text-sm text-gray-400">Hoje</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-3xl font-bold text-yellow-500">
              {appointments.filter(a => a.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-400">Pendentes</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                filter === f ? 'bg-rose-600 text-white' : 'bg-white text-gray-500'
              }`}
            >
              {f === 'all' ? 'Todos' : statusLabel[f]}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-gray-400">Nenhum agendamento encontrado.</p>
            </div>
          ) : (
            filtered.map(appointment => {
              const date = new Date(appointment.scheduled_at)
              return (
                <div key={appointment.id} className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-700">{appointment.profiles?.full_name}</p>
                      <p className="text-xs text-gray-400">{appointment.profiles?.phone}</p>
                    </div>
                    <span className={`text-xs font-medium ${statusColor[appointment.status]}`}>
                      {statusLabel[appointment.status]}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-rose-600 mb-1">{appointment.services?.name}</p>
                  <p className="text-sm text-gray-400">
                    {date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    {' às '}
                    {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-sm text-gray-400">{appointment.services?.duration_minutes} min · R$ {appointment.services?.price}</p>

                  {appointment.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleStatus(appointment.id, 'confirmed')}
                        className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-semibold"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => handleStatus(appointment.id, 'cancelled')}
                        className="flex-1 border border-red-300 text-red-400 py-2 rounded-xl text-sm font-semibold"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {appointment.status === 'confirmed' && (
                    <div className="flex gap-2 mt-3">
                        <button
                        onClick={() => handleComplete(appointment.id)}
                        className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-sm font-semibold"
                        >
                        Concluir agora
                        </button>
                        <button
                        onClick={() => handleStatus(appointment.id, 'cancelled')}
                        className="flex-1 border border-red-300 text-red-400 py-2 rounded-xl text-sm font-semibold"
                        >
                        Cancelar
                        </button>
                    </div>
                    )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}