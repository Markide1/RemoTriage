import { useState } from 'react'
import type { PrognosisDetail } from '../types'
import SeverityBadge from './SeverityBadge'
import { confirmReferral } from '../api'

interface Props { data: PrognosisDetail; onReferralConfirmed?: (h: string) => void }

const TOP_COLOR = { normal:'#86efac', moderate:'#fde047', critical:'#fca5a5' }

export default function PrognosisCard({ data, onReferralConfirmed }: Props) {
  const [referred,  setReferred]  = useState(data.referred_to_hospital)
  const [hospital,  setHospital]  = useState(data.hospital_name)
  const [referring, setReferring] = useState(false)
  const [copied,    setCopied]    = useState(false)

  const handleRefer = async () => {
    setReferring(true)
    try {
      const res = await confirmReferral(data.prognosis_id)
      setReferred(true); setHospital(res.hospital); onReferralConfirmed?.(res.hospital)
    } catch { alert('Referral failed. Please try again.') }
    finally { setReferring(false) }
  }

  const copyId = () => {
    navigator.clipboard.writeText(data.prognosis_id)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card" style={{ padding:0,
      borderTop:`4px solid ${TOP_COLOR[data.severity]}`, overflow:'hidden' }}>

      {/* Header row */}
      <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--navy-06)',
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        <SeverityBadge severity={data.severity} />
        <span style={{ fontSize:12, color:'var(--navy-60)', fontWeight:300 }}>
          {new Date(data.created_at).toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'})}
        </span>
      </div>

      {/* Recommendation */}
      <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--navy-06)' }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase',
          color:'var(--navy-60)', marginBottom:10 }}>Recommendation</p>
        <p style={{ fontSize:15, color:'var(--navy)', lineHeight:1.8 }}>{data.recommendation}</p>
      </div>

      {/* Symptoms */}
      {data.symptoms_detected.length > 0 && (
        <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--navy-06)' }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase',
            color:'var(--navy-60)', marginBottom:10 }}>Symptoms detected</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {data.symptoms_detected.map(s => (
              <span key={s} style={{ padding:'4px 12px', background:'var(--teal-08)',
                color:'var(--navy)', borderRadius:20, fontSize:13,
                border:'1px solid var(--teal-30)', fontWeight:500 }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Alerts / referral status */}
      <div style={{ padding:'0 24px' }}>
        {data.alert_triggered && (
          <div style={{ margin:'16px 0 0', padding:'12px 16px',
            background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)',
            borderLeft:'3px solid #dc2626', borderRadius:'var(--r-sm)' }}>
            <p style={{ margin:0, fontSize:13, color:'#991b1b', fontWeight:600 }}>
              Emergency — nearest hospital notified automatically.
            </p>
          </div>
        )}
        {referred && hospital && (
          <div style={{ margin:'12px 0 0', padding:'12px 16px',
            background:'rgba(14,191,157,0.08)', border:'1px solid var(--teal-30)',
            borderLeft:'3px solid var(--teal)', borderRadius:'var(--r-sm)' }}>
            <p style={{ margin:0, fontSize:13, color:'var(--navy)', fontWeight:600 }}>
              Referred to {hospital}
            </p>
          </div>
        )}
        {data.severity === 'moderate' && !referred && (
          <div style={{ margin:'16px 0 0' }}>
            <button onClick={handleRefer} disabled={referring}
              className="btn btn-dark btn-full">
              {referring ? 'Referring…' : 'Refer to nearest clinic'}
            </button>
          </div>
        )}
      </div>

      {/* Prognosis ID */}
      <div style={{ margin:'16px 24px 0', padding:'16px 20px',
        background:'#f8fafc', borderRadius:'var(--r-md)',
        border:'1px solid var(--navy-06)', marginBottom:24 }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase',
          color:'var(--navy-60)', marginBottom:10 }}>Prognosis ID</p>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <code style={{ flex:'1 1 200px', fontSize:12, background:'var(--white)',
            padding:'9px 12px', borderRadius:'var(--r-sm)', wordBreak:'break-all',
            color:'var(--navy)', border:'1px solid var(--navy-12)', minWidth:0,
            fontFamily:'monospace' }}>{data.prognosis_id}</code>
          <button onClick={copyId} className="btn btn-outline btn-sm"
            style={{ flexShrink:0, color: copied ? 'var(--teal)' : undefined,
              borderColor: copied ? 'var(--teal)' : undefined }}>
            {copied ? '✓ Copied' : 'Copy ID'}
          </button>
        </div>
        <p style={{ marginTop:8, fontSize:12, color:'var(--navy-60)', fontWeight:300 }}>
          Save this ID to retrieve your case anytime or share with a doctor.
        </p>
      </div>
    </div>
  )
}