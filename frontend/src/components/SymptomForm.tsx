import { useState } from 'react'
import type { TriageRequest } from '../types'

interface Props { onSubmit: (d: TriageRequest) => void; loading: boolean }

const FIELDS = [
  { key:'full_name',    label:'Full name',    type:'text',  ph:'Jane Doe' },
  { key:'dob',          label:'Date of birth',type:'date',  ph:'' },
  { key:'gender',       label:'Gender',       type:'select',ph:'' },
  { key:'location',     label:'Location',     type:'text',  ph:'e.g. Nairobi, Kisumu' },
  { key:'phone_number', label:'Phone',        type:'tel',   ph:'+254 7XX XXX XXX' },
  { key:'email',        label:'Email',        type:'email', ph:'you@email.com' },
]

export default function SymptomForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState<TriageRequest>({
    symptoms:'', full_name:'', dob:'', gender:'', phone_number:'', email:'', location:'',
  })
  const set = (k: keyof TriageRequest) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}
      style={{ display:'flex', flexDirection:'column', gap:28 }}>

      {/* Patient info section */}
      <div>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase',
          color:'var(--navy-60)', marginBottom:18, paddingBottom:12,
          borderBottom:'1px solid var(--navy-06)' }}>
          Patient information
        </p>
        <div style={{ display:'grid', gap:16 }} className="form-fields">
          {FIELDS.map(f => (
            <div className="field" key={f.key}>
              <label>{f.label}</label>
              {f.type === 'select' ? (
                <select value={form.gender ?? ''} onChange={set('gender')}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              ) : (
                <input type={f.type} placeholder={f.ph}
                  value={(form[f.key as keyof TriageRequest] ?? '') as string}
                  onChange={set(f.key as keyof TriageRequest)} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Symptoms section */}
      <div>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase',
          color:'var(--navy-60)', marginBottom:18, paddingBottom:12,
          borderBottom:'1px solid var(--navy-06)' }}>
          Symptoms <span style={{ color:'#ef4444' }}>*</span>
        </p>
        <div className="field">
          <label>Describe what you're experiencing</label>
          <textarea required rows={5}
            placeholder="e.g. I have had a high fever for 2 days, chest tightness when breathing, and feel very weak and dizzy..."
            value={form.symptoms} onChange={set('symptoms')} />
          <span className="field-hint">
            Be specific — include duration, severity, and any related symptoms for the best assessment.
          </span>
        </div>
      </div>

      <button type="submit" disabled={loading || !form.symptoms.trim()}
        className="btn btn-primary btn-lg btn-full">
        {loading ? 'Analysing symptoms…' : 'Get triage assessment'}
      </button>

      <style>{`
        .form-fields { grid-template-columns: repeat(2, 1fr); }
        @media (max-width: 540px) {
          .form-fields { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  )
}