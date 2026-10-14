import type { ProgramDetail } from '@/features/program'
import type { ProgramApplicationType } from '../api/types'
import type { EducationApplicationListItem } from '../model/types'

export function isOrganizationEducationApplication(
  application: Pick<EducationApplicationListItem, 'applicationType'> | null | undefined,
  program: Pick<ProgramDetail, 'programAudience'> | null | undefined,
): boolean {
  return (
    application?.applicationType === 'ORGANIZATION' || program?.programAudience === 'organization'
  )
}

/** 신청 API type 누락·불일치 시 프로그램 audience로 기관 신청 콘텐츠 빌드 */
export function resolveOrganizationApplicationTypeForContent(
  applicationType: ProgramApplicationType | undefined,
  programAudience: ProgramDetail['programAudience'] | undefined,
): ProgramApplicationType {
  if (applicationType === 'ORGANIZATION' || programAudience === 'organization') {
    return 'ORGANIZATION'
  }
  return applicationType ?? 'INDIVIDUAL'
}
