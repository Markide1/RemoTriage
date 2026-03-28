import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/',           label: 'Home'        },
  { to: '/assessment', label: 'Assessment'  },
  { to: '/lookup',     label: 'Lookup case' },
  { to: '/contact',    label: 'Contact'     },
]

const Logo = ({ dark }: { dark: boolean }) => (
  <NavLink to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
    <div style={{
      width:36, height:36,
      background: dark ? 'var(--teal)' : 'var(--navy)',
      borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
    }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2v14M2 9h14" stroke={dark ? 'var(--navy)' : 'var(--teal)'}
          strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </div>
    <span style={{
      fontFamily:'var(--font-display)', fontSize:17, fontWeight:700, letterSpacing:'-0.3px',
      color: dark ? 'var(--white)' : 'var(--navy)',
    }}>Remotriage</span>
  </NavLink>
)

export default function Header() {
  const [open,    setOpen]    = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  // Hero pages have dark (navy) background — nav should render light text
  const isHeroPage = location.pathname === '/'
  const useLightNav = isHeroPage && !scrolled

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => setOpen(false), [location.pathname])

  const bg = scrolled
    ? 'rgba(255,255,255,0.94)'
    : isHeroPage ? 'transparent' : 'var(--white)'

  const border = scrolled
    ? '1px solid var(--navy-06)'
    : '1px solid transparent'

  return (
    <>
      <header style={{
        position:'fixed', top:0, left:0, right:0, zIndex:300,
        height:'var(--nav-h)', background:bg, borderBottom:border,
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        transition:'background 0.35s, border-color 0.35s',
      }}>
        <div style={{
          maxWidth:'var(--max-w)', margin:'0 auto', padding:'0 var(--px)',
          height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <Logo dark={useLightNav} />

          {/* Desktop nav */}
          <nav style={{ display:'flex', alignItems:'center', gap:2 }} className="show-desktop">
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'}
                style={({ isActive }) => ({
                  padding:'7px 15px', borderRadius:'var(--r-sm)', fontSize:14, fontWeight:500,
                  color: isActive
                    ? 'var(--teal)'
                    : useLightNav ? 'rgba(255,255,255,0.8)' : 'var(--navy)',
                  background: isActive ? 'var(--teal-08)' : 'transparent',
                  transition:'color 0.15s, background 0.15s',
                })}>
                {l.label}
              </NavLink>
            ))}
            <button className="btn btn-primary btn-sm" style={{ marginLeft:14 }}
              onClick={() => navigate('/assessment')}>
              Get assessment
            </button>
          </nav>

          {/* Hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="show-mobile"
            style={{ background:'none', padding:8, cursor:'pointer' }}>
            <div style={{ width:24, height:20, position:'relative' }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  position:'absolute', left:0, height:2, borderRadius:2,
                  background: useLightNav ? 'var(--white)' : 'var(--navy)',
                  transition:'all 0.25s ease',
                  width: open && i === 1 ? 0 : 24,
                  top: open
                    ? i === 0 ? 9 : i === 2 ? 9 : 9
                    : i === 0 ? 0 : i === 1 ? 9 : 18,
                  transform: open
                    ? i === 0 ? 'rotate(45deg)'
                    : i === 2 ? 'rotate(-45deg)'
                    : 'none'
                    : 'none',
                  opacity: open && i === 1 ? 0 : 1,
                }} />
              ))}
            </div>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div style={{
        position:'fixed', inset:0, zIndex:290,
        background:'var(--navy)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
        display:'flex', flexDirection:'column',
        padding:'calc(var(--nav-h) + 24px) 28px 40px',
      }}>
        <nav style={{ display:'flex', flexDirection:'column', gap:4, flex:1 }}>
          {NAV_LINKS.map((l, i) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                padding:'16px 20px', borderRadius:'var(--r-md)', fontSize:20,
                fontFamily:'var(--font-display)', fontWeight:700,
                color: isActive ? 'var(--teal)' : 'rgba(255,255,255,0.85)',
                background: isActive ? 'var(--teal-08)' : 'transparent',
                transition:'color 0.15s, background 0.15s',
                transitionDelay: open ? `${i * 50}ms` : '0ms',
              })}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button className="btn btn-primary btn-lg btn-full"
          onClick={() => { navigate('/assessment'); setOpen(false) }}>
          Get free assessment
        </button>
      </div>

      <style>{`
        .show-desktop { display: flex !important; }
        .show-mobile  { display: none  !important; }
        @media (max-width: 768px) {
          .show-desktop { display: none  !important; }
          .show-mobile  { display: flex  !important; }
        }
      `}</style>
    </>
  )
}