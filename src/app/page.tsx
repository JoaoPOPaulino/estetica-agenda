import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-rose-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-rose-700 mb-2">Estética</h1>
        <p className="text-rose-400 text-lg mb-10">Agende seu horário com facilidade</p>

        <div className="flex flex-col gap-4">
          <Link
            href="/agendar"
            className="bg-rose-600 text-white py-4 rounded-2xl text-lg font-semibold hover:bg-rose-700 transition"
          >
            Agendar Horário
          </Link>
          <Link
            href="/login"
            className="border border-rose-600 text-rose-600 py-4 rounded-2xl text-lg font-semibold hover:bg-rose-50 transition"
          >
            Entrar na minha conta
          </Link>
        </div>
      </div>
    </main>
  )
}