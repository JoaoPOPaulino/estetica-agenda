'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles').select('full_name').eq('id', user.id).single()
      if (profile?.full_name) {
        setUserName(profile.full_name.split(' ')[0])
      }
    }
    load()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(247,237,232,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(196,120,106,0.15);
          padding: 0.75rem 1.2rem;
          font-family: 'Jost', sans-serif;
        }
        .navbar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .navbar-brand {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          font-weight: 600;
          color: #6B2D2D;
          text-decoration: none;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .nav-greeting {
          font-size: 0.7rem;
          color: #C4786A;
          letter-spacing: 0.05em;
        }
        .navbar-bottom {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .nav-link {
          padding: 0.4rem 0.8rem;
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-decoration: none;
          color: #8B5A5A;
          transition: all 0.2s;
          border: 1.5px solid transparent;
          cursor: pointer;
          background: none;
          font-family: 'Jost', sans-serif;
          white-space: nowrap;
        }
        .nav-link:hover { color: #6B2D2D; background: rgba(139,58,58,0.06); }
        .nav-link.active {
          color: #6B2D2D;
          border-color: rgba(139,58,58,0.25);
          background: rgba(255,255,255,0.7);
        }
        .nav-link.logout { color: #C4786A; margin-left: auto; }
        .nav-link.logout:hover { color: #8B3A3A; background: rgba(139,58,58,0.06); }
      `}</style>

      <nav className="navbar">
        <div className="navbar-top">
          <a href="/" className="navbar-brand">Thamyres Ribeiro</a>
          {userName && <span className="nav-greeting">Olá, {userName} 🌸</span>}
        </div>
        <div className="navbar-bottom">
          <a href="/agendar" className={`nav-link ${pathname === '/agendar' ? 'active' : ''}`}>
            Agendar
          </a>
          <a href="/meus-agendamentos" className={`nav-link ${pathname === '/meus-agendamentos' ? 'active' : ''}`}>
            Agendamentos
          </a>
          <button onClick={handleLogout} className="nav-link logout">
            Sair
          </button>
        </div>
      </nav>
    </>
  )
}