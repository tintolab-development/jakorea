import { axiosClient } from '@/shared/api/axios-instance'
import type { ProgramApplicationType } from './types'
import type { TeacherInstitutionGuidanceFormState } from '../lib/institution-guidance-from-answers'
import { buildInstitutionGuidanceAnswerPatch } from '../lib/institution-guidance-from-answers'
import { resolveOrganizationApplicationId } from '../lib/resolve-organization-application-id'
import type { ProgramDetailCase } from '@/features/program'
import type {
  OrganizationGuidanceAnswersPatchRequest,
  OrganizationGuidanceAnswersPatchResponse,
  UjatTemporaryScheduleConfirmRequest,
  UjatTemporaryScheduleConfirmResponse,
} from './institution-guidance-types'

const ORGANIZATION_APPLICATIONS_PATH = '/api/portal/me/organization-applications'
const PROGRAM_APPLICATIONS_PATH = '/api/portal/me/program-applications'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

function organizationApplicationPath(applicationId: string): string {
  return `${ORGANIZATION_APPLICATIONS_PATH}/${encodeURIComponent(applicationId)}/application-answers`
}

/** PATCH /api/portal/me/organization-applications/{applicationId}/application-answers */
export async function patchOrganizationGuidanceAnswers(
  applicationId: string,
  body: OrganizationGuidanceAnswersPatchRequest,
): Promise<OrganizationGuidanceAnswersPatchResponse> {
  const orgApplicationId = resolveOrganizationApplicationId(applicationId)
  if (!orgApplicationId) {
    throw new Error('신청 정보가 올바르지 않습니다.')
  }
  const { data } = await axiosClient.patch<unknown>(
    organizationApplicationPath(orgApplicationId),
    body,
  )
  return unwrapEnvelope<OrganizationGuidanceAnswersPatchResponse>(data)
}

/** POST /api/portal/me/program-applications/{applicationId}/ujat/temporary-schedule/confirm */
export async function confirmUjatTemporarySchedule(
  applicationId: string,
  body: UjatTemporaryScheduleConfirmRequest = {},
): Promise<UjatTemporaryScheduleConfirmResponse> {
  const orgApplicationId = resolveOrganizationApplicationId(applicationId)
  if (!orgApplicationId) {
    throw new Error('신청 정보가 올바르지 않습니다.')
  }
  const payload: UjatTemporaryScheduleConfirmRequest = {}
  if (typeof body.assignmentRevision === 'number') {
    payload.assignmentRevision = body.assignmentRevision
  }
  const { data } = await axiosClient.post<unknown>(
    `${PROGRAM_APPLICATIONS_PATH}/${encodeURIComponent(orgApplicationId)}/ujat/temporary-schedule/confirm`,
    payload,
  )
  return unwrapEnvelope<UjatTemporaryScheduleConfirmResponse>(data)
}

export async function savePortalTeacherInstitutionGuidance(input: {
  applicationType: ProgramApplicationType
  applicationId: string
  detailCase: ProgramDetailCase | undefined
  state: TeacherInstitutionGuidanceFormState
  existingAnswers?: Record<string, unknown> | null
}): Promise<OrganizationGuidanceAnswersPatchResponse> {
  if (input.applicationType !== 'ORGANIZATION') {
    throw new Error('기관 프로그램 신청만 안내사항을 수정할 수 있습니다.')
  }
  const answers = buildInstitutionGuidanceAnswerPatch(
    input.state,
    input.detailCase,
    input.existingAnswers,
  )
  return patchOrganizationGuidanceAnswers(input.applicationId, { answers })
}
