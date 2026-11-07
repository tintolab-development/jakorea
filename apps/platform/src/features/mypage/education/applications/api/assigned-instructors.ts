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
  instructorMemberId: number
  name: string
  assignmentId: number | null
  programScheduleId: number | null
  assignmentStatus: string | null
  phone: string | null
  email: string | null
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
  if (Array.isArray(body.instructors)) return body
  if (body.data != null && body.data !== payload) return unwrap(body.data)
  return payload
}

function readInstructorRows(body: unknown): unknown[] {
  if (!body || typeof body !== 'object') return []
  const instructors = (body as Record<string, unknown>).instructors
  return Array.isArray(instructors) ? instructors : []
}

function readMaskedContact(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function readFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim())
  return null
}

function readName(row: Record<string, unknown>): string {
  if (typeof row.name === 'string' && row.name.trim()) return row.name.trim()
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
  const instructorMemberId = readFiniteNumber(row.instructorMemberId)
  const name = readName(row)
  if (instructorMemberId == null || !name) return null
  const consents = Array.isArray(row.consents)
    ? row.consents.map(mapConsent).filter((consent): consent is AssignedInstructorConsent => consent != null)
    : []
  const assignmentStatus =
    typeof row.assignmentStatus === 'string' && row.assignmentStatus.trim()
      ? row.assignmentStatus.trim()
      : null
  return {
    instructorMemberId,
    name,
    assignmentId: readFiniteNumber(row.assignmentId),
    programScheduleId: readFiniteNumber(row.programScheduleId),
    assignmentStatus,
    phone: readMaskedContact(row.phone),
    email: readMaskedContact(row.email),
    consentDocumentsRequested: row.consentDocumentsRequested === true,
    consents,
  }
}

export function parseAssignedInstructorList(payload: unknown): AssignedInstructorList {
  return {
    instructors: readInstructorRows(unwrap(payload))
      .map(mapInstructor)
      .filter((instructor): instructor is AssignedInstructor => instructor != null),
  }
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
