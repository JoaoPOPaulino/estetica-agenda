'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Professional = {
  id: string
  name: string
  bio: string
  specialties: string
  photo_url: string
  profiles: { avatar_url: string }
}

export default function SobrePage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('professionals')
        .select('*, profiles(avatar_url)')
        .eq('active', true)
      if (data) setProfessionals(data as any)
      setLoading(false)
    }
    load()
  }, [])

  function getFoto(prof: Professional): string | null {
    if (prof.profiles?.avatar_url) return prof.profiles.avatar_url
    if (prof.photo_url) return prof.photo_url
    return null
  }

  function getSpecs(prof: Professional): string[] {
    if (!prof.specialties) return []
    return prof.specialties.split(',').map(s => s.trim()).filter(Boolean)
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
            radial-gradient(ellipse at 20% 20%, rgba(196,120,106,0.12) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 80%, rgba(242,212,204,0.3) 0%, transparent 50%);
          font-family: 'Jost', sans-serif;
        }
        .topbar {
          background: rgba(247,237,232,0.92); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(196,120,106,0.15);
          padding: 0.9rem 1.5rem;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
        }
        .topbar-brand {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem; font-weight: 600; color: #6B2D2D; text-decoration: none;
        }
        .topbar-links { display: flex; gap: 0.5rem; align-items: center; }
        .topbar-link {
          padding: 0.45rem 0.9rem; border-radius: 100px;
          font-size: 0.75rem; font-weight: 500; letter-spacing: 0.06em;
          text-decoration: none; color: #8B5A5A;
          border: 1.5px solid transparent; transition: all 0.2s;
        }
        .topbar-link:hover { color: #6B2D2D; background: rgba(139,58,58,0.06); }
        .topbar-link.primary {
          background: linear-gradient(135deg, #8B3A3A, #6B2D2D);
          color: #F7EDE8; box-shadow: 0 2px 12px rgba(107,45,45,0.25);
        }
        .topbar-link.primary:hover { transform: translateY(-1px); }

        .hero {
          text-align: center; padding: 4rem 1.5rem 2.5rem;
          max-width: 600px; margin: 0 auto;
        }
        .hero-icon { font-size: 2.5rem; margin-bottom: 1rem; }
        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.8rem; font-weight: 600; color: #6B2D2D;
          line-height: 1.1; margin-bottom: 0.5rem;
        }
        .hero-title em { font-style: italic; font-weight: 300; }
        .hero-subtitle {
          font-size: 0.78rem; letter-spacing: 0.15em; color: #C4786A;
          text-transform: uppercase; margin-bottom: 1rem;
        }
        .hero-divider {
          width: 50px; height: 1px;
          background: linear-gradient(90deg, transparent, #C4786A, transparent);
          margin: 1.5rem auto;
        }
        .hero-desc {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.05rem; font-style: italic; font-weight: 300;
          color: #8B5A5A; line-height: 1.7;
        }

        /* Grid de cards — 1 coluna mobile, 2 colunas desktop */
        .grid {
          max-width: 900px; margin: 0 auto;
          padding: 0 1.2rem 5rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 640px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
        }

        .prof-card {
          background: rgba(255,255,255,0.7); backdrop-filter: blur(16px);
          border: 1.5px solid rgba(196,120,106,0.15); border-radius: 28px;
          overflow: hidden; transition: all 0.3s;
          display: flex; flex-direction: column;
        }
        .prof-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(139,58,58,0.12); }

        /* Foto grande no topo do card */
       /* Substitua o .card-photo e .card-photo img por isso: */

      .card-photo {
        display: flex;
        justify-content: center;
        padding: 2rem 1.5rem 0;
        background: transparent;
      }

      .card-photo .avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        object-position: center top;
        border: 3px solid rgba(196,120,106,0.3);
        box-shadow: 0 4px 20px rgba(139,58,58,0.15);
      }

      .card-photo .avatar-placeholder {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: linear-gradient(135deg, #F2D4CC, #E8B4A8);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        border: 3px solid rgba(196,120,106,0.3);
      }

        .card-body { padding: 1.5rem; flex: 1; display: flex; flex-direction: column; }

        .prof-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem; font-weight: 600; color: #6B2D2D; margin-bottom: 0.2rem;
        }
        .prof-role {
          font-size: 0.68rem; letter-spacing: 0.15em; color: #C4786A;
          text-transform: uppercase; margin-bottom: 0.8rem;
        }
        .specialties-list { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1rem; }
        .specialty-tag {
          font-size: 0.65rem; font-weight: 500; letter-spacing: 0.04em;
          padding: 0.2rem 0.65rem; border-radius: 100px;
          background: rgba(196,120,106,0.1); border: 1px solid rgba(196,120,106,0.2);
          color: #8B3A3A;
        }
        .card-divider {
          height: 1px;
          background: linear-gradient(90deg, rgba(196,120,106,0.2), transparent);
          margin-bottom: 1rem;
        }
        .bio-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem; font-weight: 300; font-style: italic;
          color: #6B4040; line-height: 1.8; margin-bottom: 1.2rem; flex: 1;
        }
        .no-bio {
          font-size: 0.8rem; color: #C4A090; font-style: italic;
          margin-bottom: 1.2rem; flex: 1;
        }
        .btn-agendar {
          display: block; width: 100%; padding: 0.85rem;
          background: linear-gradient(135deg, #8B3A3A 0%, #6B2D2D 100%);
          color: #F7EDE8; text-decoration: none; border-radius: 100px;
          font-family: 'Jost', sans-serif; font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase; text-align: center;
          transition: all 0.2s; box-shadow: 0 4px 16px rgba(107,45,45,0.25);
        }
        .btn-agendar:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(107,45,45,0.35); }

        .loading-wrap { min-height: 60vh; display: flex; align-items: center; justify-content: center; }
        .loading { font-size: 0.85rem; color: #C4786A; letter-spacing: 0.1em; }
        .empty { text-align: center; padding: 4rem 2rem; color: #C4786A; font-size: 0.85rem; }
      `}</style>

      <main className="page">
        <nav className="topbar">
          <a href="/" className="topbar-brand">Thamyres Ribeiro</a>
          <div className="topbar-links">
            <a href="/sobre" className="topbar-link">Nossa Equipe</a>
            <a href="/agendar" className="topbar-link primary">Agendar</a>
          </div>
        </nav>

        <div className="hero">
          <div className="hero-icon">🪷</div>
          <h1 className="hero-title">Nossa <em>Equipe</em></h1>
          <p className="hero-subtitle">Thamyres Ribeiro — Clínica Estética e Saúde</p>
          <div className="hero-divider" />
          <p className="hero-desc">
            Profissionais dedicadas a realçar sua beleza natural com cuidado, técnica e carinho.
          </p>
        </div>

        {loading ? (
          <div className="loading-wrap">
            <p className="loading">Carregando...</p>
          </div>
        ) : professionals.length === 0 ? (
          <div className="empty">
            <p>Nenhuma profissional cadastrada ainda.</p>
          </div>
        ) : (
          <div className="grid">
            {professionals.map(prof => {
              const foto = getFoto(prof)
              const specs = getSpecs(prof)
              const firstName = prof.name.split(' ')[0]

              return (
                <div key={prof.id} className="prof-card">
                 <div className="card-photo">
                  {foto
                    ? <img className="avatar" src={foto} alt={prof.name} />
                    : <div className="avatar-placeholder">🪷</div>
                  }
                </div>
                  <div className="card-body">
                    <h2 className="prof-name">{prof.name}</h2>
                    <p className="prof-role">Esteticista</p>
                    {specs.length > 0 && (
                      <div className="specialties-list">
                        {specs.map((s, i) => (
                          <span key={i} className="specialty-tag">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="card-divider" />
                    {prof.bio
                      ? <p className="bio-text">"{prof.bio}"</p>
                      : <p className="no-bio">Em breve mais informações sobre esta profissional.</p>
                    }
                    <a href="/agendar" className="btn-agendar">
                      Agendar com {firstName}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}