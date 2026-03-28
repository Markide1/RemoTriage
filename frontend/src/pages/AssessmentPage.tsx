import { useState } from 'react'
import type { PrognosisDetail, TriageRequest } from '../types'
import { submitTriage } from '../api'
import SymptomForm from '../components/SymptomForm'
import PrognosisCard from '../components/PrognosisCard'

export default function AssessmentPage() {
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<PrognosisDetail | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const handleSubmit = async (data: TriageRequest) => {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await submitTriage(data)
      setResult({
        prognosis_id: res.prognosis_id, severity: res.severity,
        symptoms_detected: res.symptoms_detected, recommendation: res.recommendation,
        alert_triggered: res.alert_triggered, referred_to_hospital: !!res.referred_hospital,
        hospital_name: res.referred_hospital, input_mode: 'text',
        created_at: new Date().toISOString(),
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="page-wrap" style={{ background:'#f4f7fa' }}>
      <div style={{ maxWidth:740, margin:'0 auto', padding:'clamp(40px,6vw,72px) var(--px) 80px' }}>

        {/* Page header */}
        <div style={{ marginBottom:40 }}>
          <div className="eyebrow">AI Triage</div>
          <h1 className="display" style={{ fontSize:'clamp(28px,4vw,46px)',
            color:'var(--navy)', marginBottom:12 }}>New assessment</h1>
          <p style={{ color:'var(--navy-60)', fontSize:15, fontWeight:300,
            maxWidth:480, lineHeight:1.75 }}>
            Fill in your details and describe your symptoms. Our AI will assess severity and give a clear recommendation instantly.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom:24, padding:'14px 18px',
            background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)',
            borderRadius:'var(--r-md)', borderLeft:'3px solid #dc2626' }}>
            <p style={{ margin:0, color:'#991b1b', fontSize:14, fontWeight:500 }}>{error}</p>
          </div>
        )}

        {result ? (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10,
              padding:'12px 16px', background:'rgba(14,191,157,0.08)',
              border:'1px solid var(--teal-30)', borderRadius:'var(--r-md)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--teal)', flexShrink:0 }} />
              <p style={{ margin:0, fontSize:13, color:'var(--navy)', fontWeight:500 }}>
                Assessment complete — your prognosis ID has been generated
              </p>
            </div>
            <PrognosisCard data={result}
              onReferralConfirmed={h => setResult(r => r ? {...r, referred_to_hospital:true, hospital_name:h} : r)} />
            <button className="btn btn-outline btn-full" style={{ marginTop:4 }}
              onClick={() => setResult(null)}>
              Start new assessment
            </button>
          </div>
        ) : (
          <div className="card">
            <SymptomForm onSubmit={handleSubmit} loading={loading} />
          </div>
        )}
      </div>
    </div>
  )
}