import { useEffect, useState } from 'react'
import type { PrognosisDetail } from '../types'
import SeverityBadge from './SeverityBadge'
import { confirmReferral, submitFollowUp } from '../api'
import FollowUpTimeline from './FollowUpTimeline'

interface Props {
  data: PrognosisDetail
  onReferralConfirmed?: (h: string) => void
  onCaseUpdated?: (next: PrognosisDetail) => void
}

const TOP_COLOR = { normal:'#86efac', moderate:'#fde047', critical:'#fca5a5' }

export default function PrognosisCard({ data, onReferralConfirmed, onCaseUpdated }: Props) {
  const [referred,  setReferred]  = useState(data.referred_to_hospital)
  const [hospital,  setHospital]  = useState(data.hospital_name)
  const [referring, setReferring] = useState(false)
  const [copied,    setCopied]    = useState(false)
  const [selectedClinicId, setSelectedClinicId] = useState(data.nearby_clinics?.[0]?.id ?? '')
  const [followUpText, setFollowUpText] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    setReferred(data.referred_to_hospital)
    setHospital(data.hospital_name)
    setSelectedClinicId(data.nearby_clinics?.[0]?.id ?? '')
  }, [data])

  const handleRefer = async () => {
    setReferring(true)
    try {
      const res = await confirmReferral(data.prognosis_id, selectedClinicId || undefined)
      setReferred(true); setHospital(res.hospital); onReferralConfirmed?.(res.hospital)
    } catch { alert('Referral failed. Please try again.') }
    finally { setReferring(false) }
  }

  const handleFollowUp = async () => {
    if (!followUpText.trim()) return
    setUpdating(true)
    try {
      const res = await submitFollowUp(data.prognosis_id, {
        additional_symptoms: followUpText.trim(),
      })
      const next: PrognosisDetail = {
        ...data,
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
        follow_up_history: [
          ...(data.follow_up_history || []),
          {
            timestamp: new Date().toISOString(),
            symptoms_added: followUpText.trim(),
            severity: res.severity,
            reasoning: 'Follow-up reassessment submitted.',
          },
        ],
      }
      setFollowUpText('')
      onCaseUpdated?.(next)
    } catch {
      alert('Update failed. Please try again.')
    } finally {
      setUpdating(false)
    }
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
        {data.doctor_type && (
          <p style={{ marginTop: 10, fontSize: 13, color: 'var(--navy-70)' }}>
            System-recommended specialist: <strong>{data.doctor_type}</strong>
          </p>
        )}
      </div>

      <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--navy-06)' }}>
        <div
          style={{
            border: '1px solid #f59e0b55',
            borderLeft: '3px solid #f59e0b',
            borderRadius: 'var(--r-sm)',
            background: 'rgba(245,158,11,0.08)',
            padding: '10px 12px',
            marginBottom: 10,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 600 }}>
            Confidence disclaimer: this is AI-assisted triage support and not a definitive diagnosis.
          </p>
        </div>
        {(data.severity === 'critical' || data.severity === 'moderate') && (
          <div
            style={{
              border: '1px solid rgba(220,38,38,0.2)',
              borderLeft: '3px solid #dc2626',
              borderRadius: 'var(--r-sm)',
              background: 'rgba(220,38,38,0.06)',
              padding: '10px 12px',
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: '#991b1b', fontWeight: 600 }}>
              Seek emergency care immediately for severe breathing difficulty, chest pain, confusion, fainting,
              uncontrolled bleeding, seizures, or sudden weakness.
            </p>
          </div>
        )}
      </div>

      {/* Likely diseases */}
      {data.likely_diseases?.length > 0 && (
        <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--navy-06)' }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase',
            color:'var(--navy-60)', marginBottom:10 }}>Likely conditions (AI estimate)</p>
          <div style={{ display:'grid', gap:8 }}>
            {data.likely_diseases.map(item => {
              const pct = Math.max(0, Math.min(100, Number(item.probability || 0)))
              return (
                <div key={item.name} style={{ display:'grid', gap:4 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--navy)' }}>
                    <span>{item.name}</span>
                    <strong>{pct.toFixed(1)}%</strong>
                  </div>
                  <div style={{ height:8, borderRadius:999, background:'var(--navy-06)', overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:'var(--teal)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Care plan */}
      {data.care_plan?.length > 0 && (
        <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--navy-06)' }}>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase',
            color:'var(--navy-60)', marginBottom:10 }}>Recommended care plan</p>
          <div style={{ display:'grid', gap:8 }}>
            {data.care_plan.map(step => (
              <div key={step} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                <span style={{ color:'var(--teal)', fontWeight:700 }}>•</span>
                <span style={{ fontSize:14, color:'var(--navy)', lineHeight:1.6 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      <FollowUpTimeline entries={data.follow_up_history || []} />

      {/* Alerts / referral status */}
      <div style={{ padding:'0 24px' }}>
        {data.alert_triggered && (
          <div style={{ margin:'16px 0 0', padding:'12px 16px',
            background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)',
            borderLeft:'3px solid #dc2626', borderRadius:'var(--r-sm)' }}>
            <p style={{ margin:0, fontSize:13, color:'#991b1b', fontWeight:600 }}>
              Emergency — nearest hospital notified automatically.
            </p>
            <p style={{ margin:'6px 0 0', fontSize:13, color:'#991b1b', fontWeight:700 }}>
              Call emergency services immediately: 020 100 200 4000
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
          <div style={{ margin:'16px 0 0', display:'grid', gap:10 }}>
            {data.nearby_clinics?.length > 0 && (
              <select
                value={selectedClinicId}
                onChange={e => setSelectedClinicId(e.target.value)}
                style={{ padding:'10px 12px', border:'1px solid var(--navy-12)', borderRadius:'var(--r-sm)' }}
              >
                {data.nearby_clinics.map(clinic => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name} ({clinic.location})
                  </option>
                ))}
              </select>
            )}
            <button onClick={handleRefer} disabled={referring}
              className="btn btn-dark btn-full">
              {referring ? 'Referring…' : 'Refer to selected nearby clinic'}
            </button>
          </div>
        )}
      </div>

      {/* Follow-up via existing prognosis ID */}
      <div style={{ margin:'16px 24px 0', padding:'16px', border:'1px solid var(--navy-06)', borderRadius:'var(--r-md)' }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase',
          color:'var(--navy-60)', marginBottom:8 }}>Improve this result with more data</p>
        <textarea
          rows={3}
          placeholder="Add new symptoms or changes since last assessment..."
          value={followUpText}
          onChange={e => setFollowUpText(e.target.value)}
          style={{ width:'100%', padding:'10px 12px', border:'1px solid var(--navy-12)', borderRadius:'var(--r-sm)' }}
        />
        <button
          className="btn btn-primary btn-full"
          style={{ marginTop:10 }}
          disabled={updating || !followUpText.trim()}
          onClick={handleFollowUp}
        >
          {updating ? 'Updating assessment…' : 'Add data using this ID'}
        </button>
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
          Save this ID to retrieve your case, add more data later, or share with a clinician.
        </p>

        <p style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase',
          color:'var(--navy-60)', margin:'12px 0 10px' }}>Custom case ID</p>
        <code style={{ fontSize:12, background:'var(--white)',
          padding:'9px 12px', borderRadius:'var(--r-sm)', wordBreak:'break-all',
          color:'var(--navy)', border:'1px solid var(--navy-12)', display:'inline-block',
          fontFamily:'monospace' }}>{data.custom_id}</code>
      </div>
    </div>
  )
}