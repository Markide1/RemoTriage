/// <reference types="vite/client" />
import axios from 'axios'
import type { TriageRequest, TriageResponse, PrognosisDetail } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: `${API_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const submitTriage = async (data: TriageRequest): Promise<TriageResponse> => {
  const res = await client.post('triage/', data)
  return res.data
}

export const fetchPrognosis = async (id: string): Promise<PrognosisDetail> => {
  const res = await client.get(`/prognosis/${id}`)
  return res.data
}

export const confirmReferral = async (id: string): Promise<{ message: string; hospital: string }> => {
  const res = await client.post(`/prognosis/${id}/refer`)
  return res.data
}