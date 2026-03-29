import { useState } from 'react'
import type { PrognosisDetail, TriageRequest } from '../types'
import { submitTriage } from '../api'
import SymptomForm from '../components/SymptomForm'

export default function AssessmentPage() {
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<PrognosisDetail | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const handleSubmit = async (data: TriageRequest) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Submits symptoms to the Hybrid AI Engine (Objective 2: Severity Classification)
      const res = await submitTriage(data)
      
      setResult({
        prognosis_id: res.prognosis_id, 
        custom_id: res.custom_id,
        doctor_type: res.doctor_type,
        severity: res.severity,
        symptoms_detected: res.symptoms_detected, 
        recommendation: res.recommendation,
        care_plan: res.care_plan,
        likely_diseases: res.likely_diseases,
        alert_triggered: res.alert_triggered, 
        referred_to_hospital: !!res.referred_hospital,
        hospital_name: res.referred_hospital, 
        nearby_clinics: res.nearby_clinics,
        input_mode: 'text',
        created_at: new Date().toISOString(),
        follow_up_history: [],
      })
      
      // Smooth scroll to the result card for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e: any) {
      // Handle Axios error structure or generic fallback
      const msg = e?.response?.data?.detail || 'Assessment failed. Please check your connection and try again.'
      setError(msg)
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="page-wrap" style={{ background: '#f4f7fa' }}>
      <div style={{ maxWidth: 740, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) var(--px) 80px' }}>

        {/* Header aligned with Remotriage Objectives 1 & 2 */}
        <div style={{ marginBottom: 40 }}>
          <div className="eyebrow" style={{ color: 'var(--teal)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Remotriage | Hybrid AI Engine
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 46px)', color: 'var(--navy)', marginBottom: 12 }}>
            Medical Triage
          </h1>
          <p style={{ color: 'var(--navy-60)', fontSize: 16, maxWidth: 540, lineHeight: 1.6, fontWeight: 300 }}>
            Democratizing access to clinical intelligence. Describe your symptoms for instant severity classification and automated emergency dispatch.
          </p>
        </div>

        {error && (
          <div style={{ 
            marginBottom: 24, 
            padding: '14px 18px',
            background: 'rgba(220,38,38,0.06)', 
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 'var(--r-md)', 
            borderLeft: '4px solid #dc2626' 
          }}>
            <p style={{ margin: 0, color: '#991b1b', fontSize: 14, fontWeight: 500 }}>{error}</p>
          </div>
        )}

        <div className="card shadow-sm">
          <SymptomForm
            onSubmit={handleSubmit}
            loading={loading}
            result={result}
            error={error}
            onStartNew={() => {
              setError(null)
              setResult(null)
            }}
            onCaseUpdated={next => setResult(next)}
          />
        </div>
      </div>
    </div>
  )
}