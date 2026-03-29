import axios from 'axios'
import type {
  TriageRequest,
  TriageResponse,
  PrognosisDetail,
  FollowUpRequest,
  PinValidationResponse,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: `${API_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Submits both symptoms and numerical vitals to the 
 * Hybrid AI (Random Forest + Gemini) backend.
 */
export const submitTriage = async (data: TriageRequest): Promise<TriageResponse> => {
  const res = await client.post('triage/', data)
  return res.data
}

export const fetchPrognosis = async (id: string, pin?: string): Promise<PrognosisDetail> => {
  const payload = pin ? { pin } : {}
  const res = await client.post(`/prognosis/${id}`, payload)
  return res.data
}

export const validateCasePin = async (id: string, pin: string): Promise<PinValidationResponse> => {
  const res = await client.post(`/triage/${id}/validate-pin`, { pin })
  return res.data
}

export const confirmReferral = async (id: string, clinicId?: string): Promise<{ message: string; hospital: string }> => {
  const payload = clinicId ? { clinic_id: clinicId } : {}
  const res = await client.post(`/prognosis/${id}/refer`, payload)
  return res.data
}

export const submitFollowUp = async (id: string, data: FollowUpRequest): Promise<TriageResponse> => {
  const res = await client.post(`/triage/${id}/follow-up`, data)
  return res.data
}