import { axiosClient } from '@/shared/api/axios-instance'
import type { ProgramApplicationType } from './types'

export type AssignedInstructorApplicationType = Extract<
  ProgramApplicationType,
  'INDIVIDUAL' | 'ORGANIZATION'
>

export type AssignedInstructorConsent = {
  consentType: 'CRIMINAL_HISTORY_CHECK_CONSENT' | 'ADMINISTRATIVE_INFO_CONSENT'
  title: string
  documentId: number | null
  originalFileName: string | null
}

export type AssignedInstructor = {
  instructorMemberId: number | null
  name: string
  phone?: string | null
  email?: string | null
  consentDocumentsRequested: boolean
  consents: AssignedInstructorConsent[]
}

export type AssignedInstructorList = {
  instructors: AssignedInstructor[]
}

export type AssignedInstructorConsentDownload = {
  fileObjectId: number
  downloadUrl: string
  expiresAt?: string
  requiredHeaders?: Record<string, string>
}

const CONSENT_TYPES = new Set<AssignedInstructorConsent['consentType']>([
  'CRIMINAL_HISTORY_CHECK_CONSENT',
  'ADMINISTRATIVE_INFO_CONSENT',
])

function unwrap(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload
  const body = payload as Record<string, unknown>
  if (Array.isArray(body.instructors) || Array.isArray(body.assignments)) return body
  if (body.data != null && body.data !== payload) return unwrap(body.data)
  return payload
}

function readRows(body: unknown): unknown[] {
  if (Array.isArray(body)) return body
  if (!body || typeof body !== 'object') return []
  const record = body as Record<string, unknown>
  if (Array.isArray(record.instructors)) return record.instructors
  if (Array.isArray(record.assignments)) return record.assignments
  if (Array.isArray(record.items)) return record.items
  if (Array.isArray(record.content)) return record.content
  return []
}

function readFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim())
  return null
}

function readName(row: Record<string, unknown>): string {
  if (typeof row.name === 'string' && row.name.trim()) return row.name.trim()
  if (typeof row.instructorName === 'string' && row.instructorName.trim()) {
    return row.instructorName.trim()
  }
  return ''
}

function mapConsent(value: unknown): AssignedInstructorConsent | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const consentType = row.consentType
  if (typeof consentType !== 'string' || !CONSENT_TYPES.has(consentType as AssignedInstructorConsent['consentType'])) {
    return null
  }
  const title = typeof row.title === 'string' ? row.title.trim() : ''
  if (!title) return null
  return {
    consentType: consentType as AssignedInstructorConsent['consentType'],
    title,
    documentId: readFiniteNumber(row.documentId),
    originalFileName: typeof row.originalFileName === 'string' ? row.originalFileName : null,
  }
}

function mapInstructor(value: unknown): AssignedInstructor | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const name = readName(row)
  if (!name) return null
  const consents = Array.isArray(row.consents)
    ? row.consents.map(mapConsent).filter((consent): consent is AssignedInstructorConsent => consent != null)
    : []
  return {
    instructorMemberId: readFiniteNumber(row.instructorMemberId),
    name,
    consentDocumentsRequested: row.consentDocumentsRequested === true,
    consents,
  }
}

export function parseAssignedInstructorList(payload: unknown): AssignedInstructorList {
  const instructors = readRows(unwrap(payload))
    .map(mapInstructor)
    .filter((instructor): instructor is AssignedInstructor => instructor != null)
  return { instructors }
}

/** GET .../assigned-instructors — 본인 INDIVIDUAL·ORGANIZATION 신청. 목록에 downloadUrl 없음 */
export async function fetchAssignedInstructors(
  applicationType: AssignedInstructorApplicationType,
  applicationId: number,
  signal?: AbortSignal,
): Promise<AssignedInstructorList> {
  const { data } = await axiosClient.get(
    `/api/portal/me/program-applications/${applicationType}/${applicationId}/assigned-instructors`,
    { signal },
  )
  return parseAssignedInstructorList(data)
}

/** POST .../download-requests — downloadUrl 을 다시 받아 저장한다 */
export async function requestAssignedInstructorConsentDownload(input: {
  applicationType: AssignedInstructorApplicationType
  applicationId: number
  instructorMemberId: number
  documentId: number
}): Promise<AssignedInstructorConsentDownload> {
  const { data } = await axiosClient.post(
    `/api/portal/me/program-applications/${input.applicationType}/${input.applicationId}/assigned-instructors/${input.instructorMemberId}/consents/${input.documentId}/download-requests`,
    { purpose: '교육 상세 강사 동의서 확인' },
  )
  return unwrap(data) as AssignedInstructorConsentDownload
}
