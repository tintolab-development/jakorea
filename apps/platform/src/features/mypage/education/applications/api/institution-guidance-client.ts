import type { ProgramApplicationType } from './types'
import type { TeacherInstitutionGuidanceFormState } from '../lib/institution-guidance-from-answers'
import { buildInstitutionGuidanceAnswerPatch } from '../lib/institution-guidance-from-answers'
import type { ProgramDetailCase } from '@/features/program'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

/**
 * Portal 기관 안내사항 저장 — OpenAPI에 전용 PATCH가 없어 BE 배포 전까지 no-op.
 * 연동 시 이 함수만 `PATCH /api/portal/me/organization-applications/{id}` 등으로 교체.
 */
export async function savePortalTeacherInstitutionGuidance(_input: {
  applicationType: ProgramApplicationType
  applicationId: string
  detailCase: ProgramDetailCase | undefined
  state: TeacherInstitutionGuidanceFormState
}): Promise<void> {
  if (!isRemoteApiConfigured()) return
  void buildInstitutionGuidanceAnswerPatch(_input.state, _input.detailCase)
  throw new Error('PORTAL_INSTITUTION_GUIDANCE_SAVE_NOT_AVAILABLE')
}
