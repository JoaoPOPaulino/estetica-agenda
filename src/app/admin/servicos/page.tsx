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
  active: boolean
}

export default function AdminServicosPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Service | null>(null)
  const [creating, setCreating] = useState(false)

  const emptyForm = { id: '', name: '', description: '', duration_minutes: 60, price: 0, active: true }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/'); return }

      const { data } = await supabase.from('services').select('*').order('name')
      if (data) setServices(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    const supabase = createClient()

    if (editing) {
      const { data } = await supabase
        .from('services')
        .update({
          name: form.name,
          description: form.description,
          duration_minutes: form.duration_minutes,
          price: form.price,
          active: form.active,
        })
        .eq('id', editing.id)
        .select()
        .single()

      if (data) setServices(prev => prev.map(s => s.id === data.id ? data : s))
    } else {
      const { data } = await supabase
        .from('services')
        .insert({
          name: form.name,
          description: form.description,
          duration_minutes: form.duration_minutes,
          price: form.price,
          active: form.active,
        })
        .select()
        .single()

      if (data) setServices(prev => [...prev, data])
    }

    setEditing(null)
    setCreating(false)
    setForm(emptyForm)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('services').delete().eq('id', id)
    setServices(prev => prev.filter(s => s.id !== id))
  }

  function startEdit(service: Service) {
    setEditing(service)
    setCreating(false)
    setForm(service)
  }

  function startCreate() {
    setCreating(true)
    setEditing(null)
    setForm(emptyForm)
  }

  function cancelForm() {
    setEditing(null)
    setCreating(false)
    setForm(emptyForm)
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
      <div className="max-w-lg mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-rose-700">Serviços</h1>
            <p className="text-gray-400 text-sm">Gerencie os serviços oferecidos</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/admin')}
              className="border border-rose-300 text-rose-600 px-3 py-2 rounded-xl text-sm"
            >
              ← Painel
            </button>
            <button
              onClick={startCreate}
              className="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
            >
              + Novo
            </button>
          </div>
        </div>

        {/* Formulário */}
        {(creating || editing) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <h2 className="font-semibold text-gray-700 mb-4">
              {creating ? 'Novo Serviço' : 'Editar Serviço'}
            </h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nome do serviço"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400"
              />
              <input
                type="text"
                placeholder="Descrição"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Duração (min)"
                  value={form.duration_minutes}
                  onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400 w-1/2"
                />
                <input
                  type="number"
                  placeholder="Preço (R$)"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400 w-1/2"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                />
                Serviço ativo (visível para clientes)
              </label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-semibold"
                >
                  Salvar
                </button>
                <button
                  onClick={cancelForm}
                  className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de serviços */}
        <div className="flex flex-col gap-3">
          {services.map(service => (
            <div key={service.id} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-700">{service.name}</p>
                    {!service.active && (
                      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{service.description}</p>
                  <p className="text-sm text-rose-600 mt-1">
                    {service.duration_minutes} min · R$ {service.price}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => startEdit(service)}
                    className="text-sm text-rose-600 font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-sm text-red-400"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}