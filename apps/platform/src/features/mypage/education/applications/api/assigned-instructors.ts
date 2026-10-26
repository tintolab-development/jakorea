import { axiosClient } from '@/shared/api/axios-instance'

export type AssignedInstructorConsent = {
  consentType: 'CRIMINAL_HISTORY_CHECK_CONSENT' | 'ADMINISTRATIVE_INFO_CONSENT'
  title: string
  documentId: number
  originalFileName: string
}

export type AssignedInstructor = {
  instructorMemberId: number
  name: string
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

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (body.success === true && 'data' in body) return unwrap<T>(body.data)
  }
  return payload as T
}

/** GET .../assigned-instructors — 학교·기관 본인 신청만. 목록에 downloadUrl 없음 */
export async function fetchAssignedInstructors(
  applicationId: number,
  signal?: AbortSignal
): Promise<AssignedInstructorList> {
  const { data } = await axiosClient.get(
    `/api/portal/me/program-applications/ORGANIZATION/${applicationId}/assigned-instructors`,
    { signal }
  )
  const body = unwrap<AssignedInstructorList>(data)
  return { instructors: body.instructors ?? [] }
}

/** POST .../download-requests — downloadUrl 을 다시 받아 저장한다 */
export async function requestAssignedInstructorConsentDownload(input: {
  applicationId: number
  instructorMemberId: number
  documentId: number
}): Promise<AssignedInstructorConsentDownload> {
  const { data } = await axiosClient.post(
    `/api/portal/me/program-applications/ORGANIZATION/${input.applicationId}/assigned-instructors/${input.instructorMemberId}/consents/${input.documentId}/download-requests`,
    { purpose: '교육 상세 강사 동의서 확인' }
  )
  return unwrap<AssignedInstructorConsentDownload>(data)
}
