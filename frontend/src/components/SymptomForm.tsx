import { useEffect, useState } from 'react'
import type { PrognosisDetail, TriageRequest } from '../types'
import PrognosisCard from './PrognosisCard'

interface Props {
  onSubmit: (d: TriageRequest) => void
  loading: boolean
  result: PrognosisDetail | null
  error: string | null
  onStartNew: () => void
  onCaseUpdated: (next: PrognosisDetail) => void
}

const FIELDS = [
  { key:'full_name',    label:'Full name',    type:'text',  ph:'Jane Doe' },
  { key:'dob',          label:'Date of birth',type:'date',  ph:'' },
  { key:'gender',       label:'Gender',       type:'select',ph:'' },
  { key:'location',     label:'Location',     type:'text',  ph:'e.g. Nairobi, Kisumu' },
  { key:'phone_number', label:'Phone',        type:'tel',   ph:'+254 7XX XXX XXX' },
  { key:'email',        label:'Email',        type:'email', ph:'you@email.com' },
]

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STEP_LABELS = ['Patient info', 'Symptoms & history', 'Review & PIN', 'Results']

export default function SymptomForm({ onSubmit, loading, result, error, onStartNew, onCaseUpdated }: Props) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<TriageRequest>({
    symptoms:'',
    full_name:'',
    dob:'',
    gender:'',
    phone_number:'',
    email:'',
    location:'',
    current_medications: [],
    previous_illness: [],
    family_illnesses: [],
    disease_description: '',
    pin: '',
  })
  const [confirmReview, setConfirmReview] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)
  const [medicationsText, setMedicationsText] = useState('')
  const [previousIllnessText, setPreviousIllnessText] = useState('')
  const [familyIllnessesText, setFamilyIllnessesText] = useState('')

  useEffect(() => {
    if (result) setStep(4)
  }, [result])

  const set = (k: keyof TriageRequest) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const toList = (value: string) =>
    value
      .split(',')
      .map(x => x.trim())
      .filter(Boolean)

  const validateStep = (targetStep: number): boolean => {
    setStepError(null)

    if (targetStep <= 1) return true

    if (step === 1 && targetStep > 1) {
      if (!form.full_name?.trim()) {
        setStepError('Full name is required.')
        return false
      }
      if (!form.location?.trim()) {
        setStepError('Location is required.')
        return false
      }
      if (form.email && !emailRe.test(form.email)) {
        setStepError('Please provide a valid email address.')
        return false
      }
      if (form.phone_number) {
        const digits = form.phone_number.replace(/\D/g, '')
        if (digits.length < 9) {
          setStepError('Phone number should have at least 9 digits.')
          return false
        }
      }
    }

    if (step === 2 && targetStep > 2) {
      if (!form.symptoms.trim()) {
        setStepError('Symptoms are required before review.')
        return false
      }
    }

    if (step === 3 && targetStep > 3) {
      if (!confirmReview) {
        setStepError('Please confirm your details before assessment.')
        return false
      }
      if (form.pin && !/^\d{4,10}$/.test(form.pin)) {
        setStepError('PIN must be 4 to 10 digits.')
        return false
      }
    }

    return true
  }

  const next = () => {
    const target = Math.min(4, step + 1)
    if (!validateStep(target)) return
    setStep(target)
  }

  const back = () => {
    setStepError(null)
    setStep(s => Math.max(1, s - 1))
  }

  const submitAssessment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(4)) return
    onSubmit({
      ...form,
      current_medications: toList(medicationsText),
      previous_illness: toList(previousIllnessText),
      family_illnesses: toList(familyIllnessesText),
    })
  }

  const resetAll = () => {
    setStep(1)
    setConfirmReview(false)
    setStepError(null)
    setMedicationsText('')
    setPreviousIllnessText('')
    setFamilyIllnessesText('')
    onStartNew()
  }

  const printResults = () => {
    window.print()
  }

  const downloadResultsPdf = async () => {
    if (!result) return

    const { jsPDF } = await import('jspdf')

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const lines: string[] = [
      'Remotriage Assessment Result',
      '',
      `Date: ${new Date().toLocaleString('en-KE')}`,
      `Patient: ${form.full_name || '-'}`,
      `Phone: ${form.phone_number || '-'}`,
      `Email: ${form.email || '-'}`,
      `Location: ${form.location || '-'}`,
      '',
      `Case ID: ${result.prognosis_id}`,
      `Custom ID: ${result.custom_id}`,
      `Severity: ${result.severity.toUpperCase()}`,
      '',
      'Recommendation:',
      result.recommendation,
      '',
      'Symptoms detected:',
      ...(result.symptoms_detected?.length ? result.symptoms_detected.map(s => `- ${s}`) : ['- None']),
      '',
      'Care plan:',
      ...(result.care_plan?.length ? result.care_plan.map(s => `- ${s}`) : ['- None']),
      '',
      'Likely conditions:',
      ...(result.likely_diseases?.length
        ? result.likely_diseases.map(d => `- ${d.name}: ${Number(d.probability).toFixed(1)}%`)
        : ['- None']),
      '',
      'Safety disclaimer: This is AI-assisted triage support and not a definitive diagnosis.',
    ]

    const wrapped = lines.flatMap(line => doc.splitTextToSize(line, 520))
    let y = 48
    wrapped.forEach((line, i) => {
      if (y > 790) {
        doc.addPage()
        y = 48
      }
      if (i === 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
      }
      doc.text(line, 40, y)
      y += i === 0 ? 26 : 16
    })

    const fileId = (result.custom_id || result.prognosis_id || 'assessment').replace(/[^a-zA-Z0-9-_]/g, '-')
    doc.save(`remotriage-${fileId}.pdf`)
  }

  return (
    <form onSubmit={submitAssessment} style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => {
              if (n <= step) setStep(n)
            }}
            style={{
              border: '1px solid var(--navy-12)',
              borderRadius: 999,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              background: n === step ? 'var(--teal-15)' : '#fff',
              color: n === step ? 'var(--teal)' : 'var(--navy-60)',
            }}
          >
            {STEP_LABELS[n - 1]}
          </button>
        ))}
      </div>

      {step === 1 && (
        <>
          <div>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'var(--navy-60)', marginBottom:18, paddingBottom:12, borderBottom:'1px solid var(--navy-06)' }}>
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
                    <input type={f.type} placeholder={f.ph} value={(form[f.key as keyof TriageRequest] ?? '') as string} onChange={set(f.key as keyof TriageRequest)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'var(--navy-60)', marginBottom:18, paddingBottom:12, borderBottom:'1px solid var(--navy-06)' }}>
              Symptoms and history
            </p>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Describe what you're experiencing</label>
              <textarea
                required
                rows={5}
                placeholder="e.g. Fever for 2 days, chest pain, and fatigue..."
                value={form.symptoms}
                onChange={set('symptoms')}
              />
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Current medications (comma separated)</label>
              <textarea
                rows={2}
                placeholder="Metformin, Vitamin D"
                value={medicationsText}
                onChange={e => setMedicationsText(e.target.value)}
              />
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Previous illnesses (comma separated)</label>
              <textarea
                rows={2}
                placeholder="Asthma, Hypertension"
                value={previousIllnessText}
                onChange={e => setPreviousIllnessText(e.target.value)}
              />
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Family illnesses (comma separated)</label>
              <textarea
                rows={2}
                placeholder="Diabetes, Heart disease"
                value={familyIllnessesText}
                onChange={e => setFamilyIllnessesText(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Disease description (optional context)</label>
              <textarea
                rows={3}
                placeholder="Any known diagnosis or clinician-provided notes"
                value={form.disease_description ?? ''}
                onChange={set('disease_description')}
              />
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'var(--navy-60)', marginBottom:18, paddingBottom:12, borderBottom:'1px solid var(--navy-06)' }}>
              Validate details and set PIN
            </p>

            <div style={{ border: '1px solid var(--navy-06)', borderRadius: 'var(--r-md)', padding: 14, background: '#f8fafc', marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Review summary</p>
              <p style={{ fontSize: 13, color: 'var(--navy-70)', marginBottom: 4 }}>Name: {form.full_name || '-'}</p>
              <p style={{ fontSize: 13, color: 'var(--navy-70)', marginBottom: 4 }}>Location: {form.location || '-'}</p>
              <p style={{ fontSize: 13, color: 'var(--navy-70)', marginBottom: 4 }}>Phone: {form.phone_number || '-'}</p>
              <p style={{ fontSize: 13, color: 'var(--navy-70)', marginBottom: 4 }}>Email: {form.email || '-'}</p>
              <p style={{ fontSize: 13, color: 'var(--navy-70)' }}>Symptoms: {form.symptoms || '-'}</p>
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label>Secure this case with PIN (4 to 10 digits)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={10}
                placeholder="e.g. 1234"
                value={form.pin ?? ''}
                onChange={e => {
                  const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setForm(f => ({ ...f, pin: digitsOnly }))
                }}
              />
              <span className="field-hint">If provided, this PIN is required to retrieve the case.</span>
            </div>

            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: 'var(--navy-70)' }}>
              <input
                type="checkbox"
                checked={confirmReview}
                onChange={e => setConfirmReview(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              I confirm the details are correct and I understand this tool supports triage, not a final medical diagnosis.
            </label>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <div>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:'var(--navy-60)', marginBottom:12, paddingBottom:12, borderBottom:'1px solid var(--navy-06)' }}>
              Results
            </p>

            {!result && !loading && (
              <div style={{ border: '1px dashed var(--navy-12)', borderRadius: 'var(--r-md)', padding: 16, color: 'var(--navy-60)', fontSize: 13 }}>
                Run the assessment from Tab 3 to view results here.
              </div>
            )}

            {loading && (
              <div style={{ border: '1px solid var(--teal-30)', borderRadius: 'var(--r-md)', padding: 16, color: 'var(--navy)' }}>
                Analysing symptoms...
              </div>
            )}

            {error && (
              <div style={{ marginBottom: 14, border: '1px solid rgba(220,38,38,0.2)', borderLeft: '3px solid #dc2626', borderRadius: 'var(--r-md)', background: 'rgba(220,38,38,0.06)', padding: 12, color: '#991b1b', fontSize: 13 }}>
                {error}
              </div>
            )}

            {result && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <button type="button" className="btn btn-outline" onClick={printResults}>
                    Print results
                  </button>
                  <button type="button" className="btn btn-primary" onClick={downloadResultsPdf}>
                    Download PDF
                  </button>
                </div>

                <PrognosisCard
                  data={result}
                  onCaseUpdated={onCaseUpdated}
                  onReferralConfirmed={hospital => {
                    onCaseUpdated({
                      ...result,
                      referred_to_hospital: true,
                      hospital_name: hospital,
                    })
                  }}
                />
              </>
            )}
          </div>
        </>
      )}

      {stepError && (
        <p style={{ margin: 0, color: '#991b1b', fontSize: 13 }}>{stepError}</p>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {step > 1 && (
          <button type="button" className="btn btn-outline" onClick={back}>
            Back
          </button>
        )}

        {step < 3 && (
          <button type="button" className="btn btn-primary" onClick={next}>
            Continue
          </button>
        )}

        {step === 3 && (
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Analysing symptoms...' : 'Run assessment'}
          </button>
        )}

        {step === 4 && (
          <>
            <button type="button" className="btn btn-outline" onClick={() => setStep(3)}>
              Back to validation
            </button>
            <button type="button" className="btn btn-dark" onClick={resetAll}>
              Start new assessment
            </button>
          </>
        )}
      </div>

      <style>{`
        .form-fields { grid-template-columns: repeat(2, 1fr); }
        @media (max-width: 540px) {
          .form-fields { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  )
}