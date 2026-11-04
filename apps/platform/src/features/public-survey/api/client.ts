import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'

export type PublicSurveyFormType =
  | 'SURVEY'
  | 'SATISFACTION'
  | 'SATISFACTION_SURVEY'
  | 'PROGRAM_SATISFACTION'
  | 'LECTURE_EVALUATION'
  | string

const SATISFACTION_FORM_TYPES = new Set([
  'SATISFACTION',
  'SATISFACTION_SURVEY',
  'PROGRAM_SATISFACTION',
])

export type PublicSurveyFormResponse = {
  programId?: number
  bindingId?: number
  templateVersionId?: number
  formType?: PublicSurveyFormType
  targetScope?: string
  targetScopeId?: number
  form?: Record<string, unknown>
}

export type PublicSurveySubmitResponse = {
  formResponseId?: number
  bindingId?: number
  templateVersionId?: number
  formType?: PublicSurveyFormType
  responseStatus?: string
  submittedAt?: string
}

type PublicSurveySubmitRequest = {
  answers: Record<string, unknown>
}

type PublicRequestConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

const PUBLIC_SURVEY_PATH = '/api/portal/public/surveys'
const PUBLIC_REQUEST_CONFIG: PublicRequestConfig = {
  timeout: 30_000,
  skipAuth: true,
  skipRefresh: true,
} as PublicRequestConfig

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

function encodeShareToken(shareToken: string): string {
  const token = shareToken.trim()
  if (!token) throw new Error('PUBLIC_SURVEY_TOKEN_REQUIRED')
  return encodeURIComponent(token)
}

function normalizeFormType(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const next = value.trim().toUpperCase()
  return next || undefined
}

export function resolvePublicSurveyKind(
  formType: string | undefined
): 'survey' | 'satisfaction' {
  const normalized = formType?.trim().toUpperCase()
  return normalized && SATISFACTION_FORM_TYPES.has(normalized) ? 'satisfaction' : 'survey'
}

export function publicSurveySubmitMatchesForm(
  form: Pick<PublicSurveyFormResponse, 'bindingId' | 'formType'>,
  submitted: Pick<PublicSurveySubmitResponse, 'bindingId' | 'formType'>
): boolean {
  if (form.bindingId != null && submitted.bindingId != null && form.bindingId !== submitted.bindingId) {
    return false
  }
  if (form.formType && submitted.formType && form.formType !== submitted.formType) {
    return false
  }
  return true
}

export async function fetchPublicSurveyForm(
  shareToken: string,
  signal?: AbortSignal
): Promise<PublicSurveyFormResponse> {
  const encodedToken = encodeShareToken(shareToken)
  const { data } = await axiosClient.get<unknown>(`${PUBLIC_SURVEY_PATH}/${encodedToken}`, {
    ...PUBLIC_REQUEST_CONFIG,
    signal,
  })
  const response = unwrapEnvelope<PublicSurveyFormResponse>(data)
  if (!response || typeof response !== 'object' || !response.form) {
    throw new Error('PUBLIC_SURVEY_FORM_INVALID')
  }
  return {
    ...response,
    formType: normalizeFormType(response.formType),
  }
}

export async function submitPublicSurveyResponse(
  shareToken: string,
  answers: Record<string, unknown>
): Promise<PublicSurveySubmitResponse> {
  const encodedToken = encodeShareToken(shareToken)
  const { data } = await axiosClient.post<unknown, { data: unknown }, PublicSurveySubmitRequest>(
    `${PUBLIC_SURVEY_PATH}/${encodedToken}/responses`,
    { answers },
    PUBLIC_REQUEST_CONFIG
  )
  const response = unwrapEnvelope<PublicSurveySubmitResponse>(data)
  return {
    ...response,
    formType: normalizeFormType(response.formType),
  }
}
