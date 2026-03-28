import { NavLink, useNavigate } from 'react-router-dom'

const cols = [
  { heading:'Platform', links:[
    { to:'/assessment', label:'Get assessment' },
    { to:'/lookup',     label:'Lookup case'    },
    { to:'/contact',    label:'Contact us'     },
  ]},
  { heading:'Navigate', links:[
    { to:'/',        label:'Home'       },
    { to:'/contact', label:'About'      },
  ]},
]

export default function Footer() {
  const navigate = useNavigate()
  return (
    <footer style={{ background:'var(--navy)', color:'var(--white)' }}>
      <div style={{ maxWidth:'var(--max-w)', margin:'0 auto',
        padding:'clamp(52px,8vw,88px) var(--px) 0' }}>

        {/* Top grid */}
        <div style={{ display:'grid',
          gridTemplateColumns:'minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr)',
          gap:'clamp(32px,5vw,64px)', paddingBottom:'clamp(40px,6vw,64px)' }}
          className="footer-grid">

          {/* Brand */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:36, height:36, background:'var(--teal)', borderRadius:10,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2v14M2 9h14" stroke="var(--navy)" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700 }}>
                Remotriage
              </span>
            </div>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.48)', lineHeight:1.8,
              fontWeight:300, maxWidth:280, marginBottom:28 }}>
              AI-powered symptom triage for everyone — browser, phone, or a simple toll-free call.
            </p>
            <button className="btn btn-primary btn-sm"
              onClick={() => navigate('/assessment')}>
              Start free assessment
            </button>
          </div>

          {/* Link cols */}
          {cols.map(col => (
            <div key={col.heading}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.4,
                textTransform:'uppercase', color:'var(--teal)', marginBottom:20 }}>
                {col.heading}
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {col.links.map(l => (
                  <NavLink key={l.to} to={l.to}
                    style={{ fontSize:14, color:'rgba(255,255,255,0.5)',
                      transition:'color 0.15s', fontWeight:300 }}
                    onMouseEnter={e => (e.currentTarget.style.color='var(--white)')}
                    onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.5)')}>
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)',
          padding:'24px 0 28px', display:'flex', justifyContent:'space-between',
          alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.28)', fontWeight:300 }}>
            © {new Date().getFullYear()} Remotriage · Helping you get the care you need, remotely.
          </p>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.28)', fontWeight:300 }}>
            Built for Kenya.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .footer-grid > div:first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 400px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}