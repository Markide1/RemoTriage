import { useNavigate } from 'react-router-dom'

export default function HeroSection() {
  const navigate = useNavigate()
  return (
    <section style={{ background:'var(--navy)', minHeight:'100svh', display:'flex',
      alignItems:'center', padding:'calc(var(--nav-h) + clamp(40px,6vw,80px)) var(--px) clamp(60px,8vw,100px)',
      position:'relative', overflow:'hidden' }}>

      {[640,420,220].map((s,i) => (
        <div key={i} style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none',
          border:`1px solid rgba(14,191,157,${0.10 - i*0.03})`, width:s, height:s,
          right: i===0?'-6%':i===1?'6%':'18%', top:'50%', transform:'translateY(-50%)' }} />
      ))}

      <div style={{ maxWidth:'var(--max-w)', margin:'0 auto', width:'100%',
        display:'grid', gap:'clamp(40px,6vw,80px)', alignItems:'center' }}
        className="hero-grid">

        <div style={{ position:'relative', zIndex:2 }}>
          <div className="eyebrow">AI-powered health triage · 24 / 7</div>
          <h1 className="display" style={{ fontSize:'clamp(38px,5.5vw,68px)',
            color:'var(--white)', marginBottom:24 }}>
            Healthcare advice,{' '}
            <em style={{ color:'var(--teal)', fontStyle:'italic' }}>wherever you are</em>
          </h1>
          <p style={{ fontSize:'clamp(15px,1.5vw,17px)', color:'rgba(255,255,255,0.58)',
            lineHeight:1.8, maxWidth:460, marginBottom:40, fontWeight:300 }}>
            Describe your symptoms and get an instant triage assessment — severity rating,
            recommendation, and a unique case ID to share with any doctor.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:48 }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/assessment')}>
              Start free assessment
            </button>
            <button className="btn btn-outline-white btn-lg" onClick={() => navigate('/lookup')}>
              Look up a case
            </button>
          </div>
          <div style={{ display:'flex', gap:'clamp(24px,4vw,48px)',
            paddingTop:32, borderTop:'1px solid rgba(255,255,255,0.08)', flexWrap:'wrap' }}>
            {[['3','Severity levels'],['24/7','Always on'],['0','Sign-ups needed']].map(([n,l]) => (
              <div key={l}>
                <div className="display" style={{ fontSize:'clamp(24px,3vw,34px)', color:'var(--white)' }}>{n}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position:'relative', height:'clamp(360px,50vw,520px)', zIndex:2 }}
          className="hero-collage">
          <div style={{ position:'absolute', right:'5%', top:'5%', bottom:'5%',
            width:'55%', borderRadius:'var(--r-xl)', overflow:'hidden', boxShadow:'var(--shadow-xl)' }}>
            <img src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&q=80"
              alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div style={{ position:'absolute', left:0, top:'6%', width:'42%', height:'48%',
            borderRadius:'var(--r-lg)', overflow:'hidden', boxShadow:'0 20px 48px rgba(0,0,0,0.4)' }}>
            <img src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=400&q=80"
              alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div style={{ position:'absolute', left:'6%', bottom:'4%', width:'34%', height:'38%',
            borderRadius:'var(--r-lg)', overflow:'hidden', boxShadow:'0 16px 40px rgba(0,0,0,0.4)', zIndex:3 }}>
            <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80"
              alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div style={{ position:'absolute', bottom:'28%', left:'-4%', zIndex:5,
            background:'var(--white)', borderRadius:'var(--r-md)', padding:'14px 18px',
            boxShadow:'var(--shadow-lg)', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'var(--teal-15)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>✅</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--navy)' }}>Instant results</div>
              <div style={{ fontSize:11, color:'var(--navy-60)', marginTop:2 }}>AI-powered triage</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}