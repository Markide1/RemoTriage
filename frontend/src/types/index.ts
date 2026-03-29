export interface TriageRequest {
  symptoms: string
  full_name?: string
  dob?: string
  gender?: string
  phone_number?: string
  email?: string
  location?: string
  current_medications?: string[]
  previous_illness?: string[]
  family_illnesses?: string[]
  doctor_type?: string
  disease_description?: string
  pin?: string
}

export interface FollowUpRequest {
  additional_symptoms: string
  location?: string
  phone_number?: string
}

export interface LikelyDisease {
  name: string
  probability: number
}

export interface ClinicOption {
  id: string
  name: string
  phone: string
  location: string
  distance: number
}

export interface TriageResponse {
  prognosis_id: string
  custom_id: string
  doctor_type?: string | null
  severity: 'normal' | 'moderate' | 'critical'
  symptoms_detected: string[]
  recommendation: string
  care_plan: string[]
  likely_diseases: LikelyDisease[]
  alert_triggered: boolean
  referred_hospital: string | null
  nearby_clinics: ClinicOption[]
}

export interface FollowUpHistoryEntry {
  timestamp: string
  symptoms_added: string | null
  severity: 'normal' | 'moderate' | 'critical'
  reasoning: string
}

export interface PrognosisLookupRequest {
  pin?: string
}

export interface PinValidationResponse {
  valid: boolean
  message: string
}

export interface PrognosisDetail {
  prognosis_id: string
  custom_id: string
  doctor_type?: string | null
  severity: 'normal' | 'moderate' | 'critical'
  symptoms_detected: string[]
  recommendation: string
  care_plan: string[]
  likely_diseases: LikelyDisease[]
  alert_triggered: boolean
  referred_to_hospital: boolean
  hospital_name: string | null
  nearby_clinics: ClinicOption[]
  input_mode: 'text' | 'voice'
  created_at: string
  follow_up_history: FollowUpHistoryEntry[]
}