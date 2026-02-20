import Link from 'next/link'

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .page {
          min-height: 100vh;
          background-color: #F7EDE8;
          background-image: 
            radial-gradient(ellipse at 20% 50%, rgba(196,120,106,0.12) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(242,212,204,0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgba(139,58,58,0.06) 0%, transparent 40%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'Jost', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .page::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(196,120,106,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .page::after {
          content: '';
          position: absolute;
          bottom: -80px;
          left: -80px;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,58,58,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .card {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(196,120,106,0.2);
          border-radius: 32px;
          padding: 3rem 2.5rem;
          max-width: 420px;
          width: 100%;
          text-align: center;
          box-shadow: 
            0 4px 24px rgba(139,58,58,0.08),
            0 1px 0 rgba(255,255,255,0.8) inset;
          position: relative;
          z-index: 1;
        }

        .logo-container {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #F2D4CC 0%, #E8B4A8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 8px 32px rgba(139,58,58,0.2);
          font-size: 2.5rem;
        }

        .brand-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          font-weight: 600;
          color: #6B2D2D;
          letter-spacing: 0.02em;
          line-height: 1.1;
          margin-bottom: 0.3rem;
        }

        .brand-subtitle {
          font-family: 'Jost', sans-serif;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #C4786A;
          margin-bottom: 2.5rem;
        }

        .divider {
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #C4786A, transparent);
          margin: 0 auto 2.5rem;
        }

        .tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-style: italic;
          color: #8B5A5A;
          margin-bottom: 2.5rem;
          line-height: 1.6;
          font-weight: 300;
        }

        .btn-primary {
          display: block;
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #8B3A3A 0%, #6B2D2D 100%);
          color: #F7EDE8;
          text-decoration: none;
          border-radius: 100px;
          font-family: 'Jost', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(107,45,45,0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(107,45,45,0.4);
        }

        .btn-secondary {
          display: block;
          width: 100%;
          padding: 1rem 2rem;
          background: transparent;
          color: #8B3A3A;
          text-decoration: none;
          border-radius: 100px;
          border: 1.5px solid rgba(139,58,58,0.3);
          font-family: 'Jost', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(139,58,58,0.05);
          border-color: #8B3A3A;
        }

        .footer-text {
          margin-top: 2rem;
          font-size: 0.7rem;
          color: #C4786A;
          letter-spacing: 0.1em;
          opacity: 0.7;
        }

        .footer-contact {
  margin-top: 2rem;
  border-top: 1px solid rgba(196,120,106,0.15);
  padding-top: 1.5rem;
}

.contact-links {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1rem;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: 'Jost', sans-serif;
  font-size: 0.8rem;
  color: #8B3A3A;
  text-decoration: none;
  letter-spacing: 0.05em;
  transition: opacity 0.2s;
}

.contact-item:hover {
  opacity: 0.7;
}
      `}</style>

      <main className="page">
        <div className="card">
          <div className="logo-container">🪷</div>
          <h1 className="brand-name">Thamyres Ribeiro</h1>
          <p className="brand-subtitle">Clínica Estética e Saúde</p>
          <div className="divider" />
          <p className="tagline">Realce sua beleza natural com tratamentos exclusivos e personalizados</p>
          <Link href="/agendar" className="btn-primary">
            Agendar Horário
          </Link>
          <Link href="/login" className="btn-secondary">
            Minha Conta
          </Link>
          <div className="footer-contact">
            <p className="footer-text">✦ Beleza • Saúde • Bem-estar ✦</p>
            <div className="contact-links">
              <a href="https://www.instagram.com/thamyresribeiroestetica?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" className="contact-item">
                <span>📸</span> @thamyresribeiroestetica
              </a>
              <a href="https://wa.me/+556392906871" target="_blank" className="contact-item">
                <span>📱</span> (63) 9290-6871
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}