export interface TriageRequest {
  symptoms: string
  full_name?: string
  dob?: string
  gender?: string
  phone_number?: string
  email?: string
  location?: string
}

export interface TriageResponse {
  prognosis_id: string
  severity: 'normal' | 'moderate' | 'critical'
  symptoms_detected: string[]
  recommendation: string
  alert_triggered: boolean
  referred_hospital: string | null
}

export interface PrognosisDetail {
  prognosis_id: string
  severity: 'normal' | 'moderate' | 'critical'
  symptoms_detected: string[]
  recommendation: string
  alert_triggered: boolean
  referred_to_hospital: boolean
  hospital_name: string | null
  input_mode: 'text' | 'voice'
  created_at: string
}