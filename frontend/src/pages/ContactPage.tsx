import { useState } from 'react'

const INFO = [
  { icon:'🗺️', label:'Address',     value:'Kenyatta Avenue, Nairobi, Kenya' },
  { icon:'☎️', label:'Phone',       value:'+254 700 000 000' },
  { icon:'✉️', label:'Email',       value:'hello@remotriage.app' },
  { icon:'🕐', label:'Available',   value:'24 / 7 — AI always on' },
]

const SOCIALS = [
  { icon: '🐦', label: 'Twitter', href: 'https://twitter.com/remotriage' },
  { icon: '📷', label: 'Instagram', href: 'https://instagram.com/remotriage' },
  { icon: '🟦', label: 'Facebook', href: 'https://facebook.com/remotriage' },
  { icon: '🟢', label: 'WhatsApp', href: 'https://wa.me/254700000000' },
]

export default function ContactPage() {
  const [form, setForm]       = useState({ name:'', email:'', subject:'', message:'' })
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setSent(true); setLoading(false)
  }

  return (
    <div className="page-wrap" style={{ background:'#f4f7fa' }}>

      {/* Hero banner */}
      <div style={{ background:'var(--navy)',
        padding:'clamp(48px,6vw,72px) var(--px) clamp(48px,6vw,72px)' }}>
        <div style={{ maxWidth:'var(--max-w)', margin:'0 auto' }}>
          <div className="eyebrow">Contact</div>
          <h1 className="display" style={{ fontSize:'clamp(32px,4.5vw,56px)',
            color:'var(--white)', maxWidth:560, marginBottom:16 }}>
            Get in touch
          </h1>
          <p style={{ fontSize:'clamp(15px,1.5vw,17px)', color:'rgba(255,255,255,0.55)',
            maxWidth:480, fontWeight:300, lineHeight:1.8 }}>
            Questions, partnership enquiries, or feedback — we'd love to hear from you.
          </p>
        </div>
      </div>

      <div style={{ maxWidth:'var(--max-w)', margin:'0 auto',
        padding:'clamp(40px,5vw,64px) var(--px) 80px' }}>
        <div style={{ display:'grid', gap:24, alignItems:'start' }}
          className="contact-grid">

          {/* ── FORM ── */}
          <div className="card" style={{ padding:'clamp(24px,4vw,40px)' }}>
            {sent ? (
              <div style={{ textAlign:'center', padding:'clamp(32px,5vw,56px) 24px' }}>
                <div style={{ width:72, height:72, borderRadius:'50%',
                  background:'var(--teal-15)', border:'2px solid var(--teal-30)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:32, margin:'0 auto 24px' }}>✅</div>
                <h3 className="display" style={{ fontSize:26, color:'var(--navy)', marginBottom:12 }}>
                  Message sent!
                </h3>
                <p style={{ color:'var(--navy-60)', fontSize:15, fontWeight:300, marginBottom:32 }}>
                  We'll get back to you within 24 hours.
                </p>
                <button className="btn btn-primary" onClick={() => setSent(false)}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:22 }}>
                <h2 className="display" style={{ fontSize:22, color:'var(--navy)' }}>
                  Send a message
                </h2>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}
                  className="form-row">
                  <div className="field">
                    <label>Your name</label>
                    <input required placeholder="Jane Doe" value={form.name} onChange={set('name')} />
                  </div>
                  <div className="field">
                    <label>Email address</label>
                    <input required type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} />
                  </div>
                </div>

                <div className="field">
                  <label>Subject</label>
                  <select required value={form.subject} onChange={set('subject')}>
                    <option value="">Select a topic…</option>
                    <option value="general">General enquiry</option>
                    <option value="partnership">Partnership / integration</option>
                    <option value="feedback">Feedback on assessment</option>
                    <option value="technical">Technical issue</option>
                    <option value="media">Media / press</option>
                  </select>
                </div>

                <div className="field">
                  <label>Message</label>
                  <textarea required rows={5}
                    placeholder="Tell us how we can help…"
                    value={form.message} onChange={set('message')} />
                </div>

                <button type="submit" disabled={loading}
                  className="btn btn-primary btn-lg btn-full">
                  {loading ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Info grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {INFO.map(i => (
                <div key={i.label} className="card" style={{ padding:'20px' }}>
                  <div style={{ fontSize:22, marginBottom:10 }}>{i.icon}</div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:1,
                    textTransform:'uppercase', color:'var(--teal)', marginBottom:6 }}>{i.label}</div>
                  <div style={{ fontSize:13, color:'var(--navy)', fontWeight:500,
                    lineHeight:1.5 }}>{i.value}</div>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <iframe
                title="Remotriage Nairobi"
                src="https://www.openstreetmap.org/export/embed.html?bbox=36.78,-1.30,36.84,-1.26&layer=mapnik&marker=-1.2833,36.8167"
                style={{ width:'100%', height:220, border:'none', display:'block' }}
                loading="lazy"
              />
              <div style={{ padding:'12px 18px', display:'flex', alignItems:'center', gap:10,
                borderTop:'1px solid var(--navy-06)' }}>
                <div style={{ width:8, height:8, borderRadius:'50%',
                  background:'var(--teal)', flexShrink:0 }} />
                <span style={{ fontSize:13, color:'var(--navy-60)', fontWeight:300 }}>
                  Kenyatta Avenue, Nairobi CBD
                </span>
              </div>
            </div>

            {/* Socials */}
            <div className="card" style={{ padding:'20px 22px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1,
                textTransform:'uppercase', color:'var(--teal)', marginBottom:12 }}>
                Follow and chat with us
              </div>
              <p style={{ margin:'0 0 14px', color:'var(--navy-60)', fontSize:13, fontWeight:300 }}>
                You can follow us on Twitter, Instagram, Facebook, or chat on WhatsApp.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {SOCIALS.map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display:'flex', alignItems:'center', gap:10,
                      border:'1px solid var(--navy-06)', borderRadius:'var(--r-sm)',
                      padding:'10px 12px', textDecoration:'none', color:'var(--navy)',
                      background:'#fff'
                    }}
                  >
                    <span style={{ fontSize:16 }}>{s.icon}</span>
                    <span style={{ fontSize:13, fontWeight:600 }}>{s.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .contact-grid { grid-template-columns: minmax(0,1.15fr) minmax(0,0.85fr); }
        .form-row     { grid-template-columns: 1fr 1fr; }
        @media (max-width: 900px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}