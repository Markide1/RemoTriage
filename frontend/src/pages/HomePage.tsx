import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import HeroSection from '../components/HeroSection'

const FEATURES = [
  { icon:'🧠', title:'AI triage engine',  desc:'NLP classifies symptoms as normal, moderate, or critical in seconds.' },
  { icon:'🪪', title:'Prognosis ID',       desc:'Every case gets a unique UUID — share with a doctor or look it up anytime.' },
  { icon:'🏥', title:'Hospital alerts',    desc:'Critical cases automatically notify the nearest hospital.' },
  { icon:'📱', title:'Any device',         desc:'Browser, phone, or toll-free call — meets you anywhere.' },
  { icon:'🔒', title:'No registration',    desc:'Your ID is your receipt. No account, no login, full control.' },
  { icon:'🌍', title:'Built for Kenya',    desc:'County hospitals, M-Pesa, Africa\'s Talking — local by design.' },
]

const STEPS = [
  { n:'01', icon:'✍️', title:'Describe symptoms', desc:'Type freely or call our toll-free line. Include duration and severity.' },
  { n:'02', icon:'⚡', title:'AI analyses',        desc:'Our model processes symptoms, factors in age and gender, sets severity.' },
  { n:'03', icon:'📬', title:'Get your result',    desc:'A clear recommendation and prognosis ID, ready to share.' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const rootRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current; if (!root) return
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target) } }),
      { threshold: 0.07 }
    )
    root.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={rootRef}>
      <HeroSection />

      {/* HOW IT WORKS */}
      <section style={{ background:'var(--white)', padding:'var(--section-py) var(--px)' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto' }}>
          <div className="reveal" style={{ textAlign:'center', maxWidth:500, margin:'0 auto 52px' }}>
            <div className="eyebrow" style={{ justifyContent:'center' }}>How it works</div>
            <h2 className="display" style={{ fontSize:'clamp(28px,3.5vw,44px)', color:'var(--navy)', marginBottom:14 }}>
              Three steps to clarity
            </h2>
            <p style={{ fontSize:15, color:'var(--navy-60)', fontWeight:300, lineHeight:1.75 }}>
              No appointments, no waiting rooms. Get a medically-grounded response in under a minute.
            </p>
          </div>
          <div className="reveal d1 steps-grid">
            {STEPS.map((s,i) => (
              <div key={i} style={{ background:'var(--white)', padding:'36px 30px', position:'relative',
                borderRadius:'var(--r-xl)', border:'1px solid var(--navy-06)', boxShadow:'var(--shadow-sm)' }}>
                <div className="display" style={{ fontSize:80, lineHeight:1, color:'#f0f4f8',
                  position:'absolute', top:16, right:20, letterSpacing:-4, userSelect:'none' }}>{s.n}</div>
                <div style={{ width:52, height:52, borderRadius:14, background:'var(--teal-15)',
                  border:'1px solid var(--teal-30)', display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:24, marginBottom:22 }}>{s.icon}</div>
                <div style={{ fontSize:17, fontWeight:700, color:'var(--navy)', marginBottom:10 }}>{s.title}</div>
                <div style={{ fontSize:14, color:'var(--navy-60)', lineHeight:1.75, fontWeight:300 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA CARDS */}
      <section style={{ background:'#f4f7fa', padding:'var(--section-py) var(--px)' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto' }}>
          <div className="reveal" style={{ marginBottom:40 }}>
            <div className="eyebrow">Get started</div>
            <h2 className="display" style={{ fontSize:'clamp(28px,3.5vw,44px)', color:'var(--navy)' }}>
              What would you like to do?
            </h2>
          </div>
          <div className="reveal d1 cta-cards">
            {[
              { img:'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800&q=80',
                tag:'New assessment', title:'Describe your symptoms', path:'/assessment',
                desc:'Severity rating and personalised recommendation — no login needed.', cta:'Start now' },
              { img:'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80',
                tag:'Case lookup', title:'Retrieve your case', path:'/lookup',
                desc:'Have a prognosis ID? Pull results, confirm a referral, or share with a doctor.', cta:'Look up case' },
            ].map(c => (
              <div key={c.path} onClick={() => navigate(c.path)}
                style={{ borderRadius:'var(--r-xl)', overflow:'hidden', position:'relative',
                  minHeight:390, display:'flex', flexDirection:'column', justifyContent:'flex-end',
                  cursor:'pointer', transition:'transform 0.25s, box-shadow 0.25s' }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLDivElement; el.style.transform='translateY(-5px)'; el.style.boxShadow='var(--shadow-xl)' }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLDivElement; el.style.transform=''; el.style.boxShadow='' }}>
                <div style={{ position:'absolute', inset:0 }}>
                  <img src={c.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 15%,rgba(10,37,64,0.94) 100%)' }} />
                </div>
                <div style={{ position:'relative', zIndex:1, padding:'clamp(24px,4vw,36px)' }}>
                  <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:11,
                    fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', marginBottom:14,
                    background:'var(--teal-15)', color:'var(--teal)', border:'1px solid var(--teal-30)' }}>{c.tag}</span>
                  <div className="display" style={{ fontSize:'clamp(22px,2.8vw,32px)',
                    color:'var(--white)', marginBottom:12 }}>{c.title}</div>
                  <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)', lineHeight:1.7,
                    marginBottom:24, fontWeight:300 }}>{c.desc}</div>
                  <button className="btn btn-primary">{c.cta} →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background:'var(--navy)', padding:'var(--section-py) var(--px)' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto' }}>
          <div className="reveal" style={{ marginBottom:52 }}>
            <div className="eyebrow">Why Remotriage</div>
            <h2 className="display" style={{ fontSize:'clamp(28px,3.5vw,44px)',
              color:'var(--white)', maxWidth:480 }}>
              Built for where healthcare is hardest to reach
            </h2>
          </div>
          <div className="reveal d1 features-grid">
            {FEATURES.map((f,i) => (
              <div key={i} className="card-dark"
                style={{ transition:'transform 0.2s, border-color 0.2s', padding:'28px 24px' }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLDivElement; el.style.transform='translateY(-4px)'; el.style.borderColor='var(--teal-30)' }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLDivElement; el.style.transform=''; el.style.borderColor='' }}>
                <div style={{ fontSize:28, marginBottom:16 }}>{f.icon}</div>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--white)', marginBottom:8 }}>{f.title}</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.42)', lineHeight:1.75, fontWeight:300 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ background:'var(--teal)', padding:'clamp(60px,8vw,100px) var(--px)', textAlign:'center' }}>
        <div style={{ maxWidth:540, margin:'0 auto' }}>
          <h2 className="display" style={{ fontSize:'clamp(28px,4vw,52px)', color:'var(--navy)', marginBottom:18 }}>
            Your health, assessed in seconds
          </h2>
          <p style={{ fontSize:16, color:'rgba(10,37,64,0.65)', marginBottom:40, fontWeight:300, lineHeight:1.75 }}>
            Free, instant, no registration. Start your assessment right now.
          </p>
          <button className="btn btn-dark btn-lg" onClick={() => navigate('/assessment')}>
            Get free assessment →
          </button>
        </div>
      </section>

      <style>{`
        .hero-grid     { grid-template-columns: minmax(0,1fr) minmax(0,1fr); }
        .steps-grid    { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .cta-cards     { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
        .features-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        @media(max-width:960px){
          .features-grid { grid-template-columns:repeat(2,1fr)!important; }
        }
        @media(max-width:768px){
          .hero-grid     { grid-template-columns:1fr!important; }
          .hero-collage  { display:none!important; }
          .steps-grid    { grid-template-columns:1fr!important; gap:14px!important; }
          .cta-cards     { grid-template-columns:1fr!important; }
          .features-grid { grid-template-columns:1fr 1fr!important; }
        }
        @media(max-width:480px){
          .features-grid { grid-template-columns:1fr!important; }
        }
      `}</style>
    </div>
  )
}