import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Estetica - Agendamento',
  description: 'Agende seu horario',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}