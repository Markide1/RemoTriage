import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import type { PrognosisDetail } from '../types'
import { fetchPrognosis } from '../api'
import PrognosisCard from '../components/PrognosisCard'

export default function LookupPage() {
  const { id: paramId } = useParams<{ id: string }>()
  const [id,      setId]      = useState(paramId ?? '')
  const [pin,     setPin]     = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<PrognosisDetail | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const lookup = async (lookupId: string, lookupPin?: string) => {
    if (!lookupId.trim()) return
    setLoading(true); setError(null); setResult(null)
    try { setResult(await fetchPrognosis(lookupId.trim(), lookupPin?.trim() || undefined)) }
    catch (e: any) {
      if (e?.response?.status === 404) {
        setError('No case found with that ID. Please check and try again.')
      } else if (e?.response?.status === 401) {
        setError('PIN required or invalid PIN. Please enter the correct PIN for this case.')
      } else {
        setError('Lookup failed. Please try again.')
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { if (paramId) lookup(paramId, pin) }, [paramId])

  return (
    <div className="page-wrap" style={{ background:'#f4f7fa' }}>
      <div style={{ maxWidth:740, margin:'0 auto', padding:'clamp(40px,6vw,72px) var(--px) 80px' }}>

        <div style={{ marginBottom:40 }}>
          <div className="eyebrow">Case lookup</div>
          <h1 className="display" style={{ fontSize:'clamp(28px,4vw,46px)',
            color:'var(--navy)', marginBottom:12 }}>Retrieve a case</h1>
          <p style={{ color:'var(--navy-60)', fontSize:15, fontWeight:300,
            maxWidth:480, lineHeight:1.75 }}>
            Enter a prognosis ID to view an assessment. You can also share this page URL directly with a doctor.
          </p>
        </div>

        {/* Search bar */}
        <div className="card" style={{ marginBottom:24, padding:'20px 24px' }}>
          <form onSubmit={e => { e.preventDefault(); lookup(id, pin) }}
            style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <input
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="Paste prognosis ID — e.g. 3f4a1b2c-..."
              style={{ flex:'1 1 240px', padding:'12px 16px', fontSize:14,
                border:'1.5px solid var(--navy-12)', borderRadius:'var(--r-sm)',
                background:'#f8fafc', color:'var(--navy)', minWidth:0,
                transition:'border-color 0.15s' }}
              onFocus={e  => (e.target.style.borderColor='var(--teal)')}
              onBlur={e   => (e.target.style.borderColor='var(--navy-12)')}
            />
            <input
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="PIN (if set for this case)"
              type="password"
              inputMode="numeric"
              maxLength={10}
              style={{ flex:'1 1 190px', padding:'12px 16px', fontSize:14,
                border:'1.5px solid var(--navy-12)', borderRadius:'var(--r-sm)',
                background:'#f8fafc', color:'var(--navy)', minWidth:0,
                transition:'border-color 0.15s' }}
              onFocus={e  => (e.target.style.borderColor='var(--teal)')}
              onBlur={e   => (e.target.style.borderColor='var(--navy-12)')}
            />
            <button type="submit" disabled={loading || !id.trim()}
              className="btn btn-primary" style={{ flexShrink:0 }}>
              {loading ? 'Loading…' : 'Look up'}
            </button>
          </form>
        </div>

        {error && (
          <div style={{ marginBottom:24, padding:'14px 18px',
            background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)',
            borderRadius:'var(--r-md)', borderLeft:'3px solid #dc2626' }}>
            <p style={{ margin:0, color:'#991b1b', fontSize:14, fontWeight:500 }}>{error}</p>
          </div>
        )}

        {!result && !loading && !error && (
          <div style={{ textAlign:'center', padding:'56px 24px',
            border:'1.5px dashed var(--navy-12)', borderRadius:'var(--r-xl)',
            background:'rgba(255,255,255,0.5)' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>🔍</div>
            <p style={{ fontSize:15, color:'var(--navy-60)', fontWeight:300 }}>
              Enter a prognosis ID above to retrieve your case details
            </p>
          </div>
        )}

        {result && <PrognosisCard data={result} onCaseUpdated={next => setResult(next)} />}
      </div>
    </div>
  )
}