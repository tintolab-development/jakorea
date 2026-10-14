import { axiosClient } from '@/shared/api/axios-instance'
import type { ProgramApplicationType } from './types'
import type { TeacherInstitutionGuidanceFormState } from '../lib/institution-guidance-from-answers'
import { buildInstitutionGuidanceAnswerPatch } from '../lib/institution-guidance-from-answers'
import { resolveOrganizationApplicationId } from '../lib/resolve-organization-application-id'
import type { ProgramDetailCase } from '@/features/program'
import type {
  OrganizationGuidanceAnswersPatchRequest,
  OrganizationGuidanceAnswersPatchResponse,
} from './institution-guidance-types'

const ORGANIZATION_APPLICATIONS_PATH = '/api/portal/me/organization-applications'

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

export async function savePortalTeacherInstitutionGuidance(input: {
  applicationType: ProgramApplicationType
  applicationId: string
  detailCase: ProgramDetailCase | undefined
  state: TeacherInstitutionGuidanceFormState
}): Promise<OrganizationGuidanceAnswersPatchResponse> {
  if (input.applicationType !== 'ORGANIZATION') {
    throw new Error('기관 프로그램 신청만 안내사항을 수정할 수 있습니다.')
  }
  const answers = buildInstitutionGuidanceAnswerPatch(input.state, input.detailCase)
  return patchOrganizationGuidanceAnswers(input.applicationId, { answers })
}
