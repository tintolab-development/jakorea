import type { PlatformMemberProfile } from '@/features/mypage/model/types'
import type { ProgramDetail } from '@/features/program'
import { isSchoolTeacherMypageProfile } from '@/features/mypage/lib/member-profile'
import type { EducationDisplayStatus } from '../model/types'
import type { ApplyInstitutionGuidanceAnswers } from '@/features/program/ui/apply-institution-guidance/apply-institution-guidance'
import { INSTITUTION_GUIDANCE_FIELDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'

const GUIDANCE_WRITE_DISPLAY_STATUSES = new Set<EducationDisplayStatus>([
  'in_progress',
  'completed',
])

export function shouldShowTeacherInstitutionGuidanceWrite(options: {
  isTeacher: boolean
  programAudience: ProgramDetail['programAudience'] | undefined
  displayStatus: EducationDisplayStatus
}): boolean {
  if (!options.isTeacher) return false
  if (options.programAudience !== 'organization') return false
  return GUIDANCE_WRITE_DISPLAY_STATUSES.has(options.displayStatus)
}

export function shouldShowTeacherInstitutionGuidanceWriteForProfile(
  profile: PlatformMemberProfile,
  program: Pick<ProgramDetail, 'programAudience'> | undefined,
  displayStatus: EducationDisplayStatus,
): boolean {
  return shouldShowTeacherInstitutionGuidanceWrite({
    isTeacher: isSchoolTeacherMypageProfile(profile),
    programAudience: program?.programAudience,
    displayStatus,
  })
}

export function hasInstitutionGuidanceDraftContent(
  guidance: ApplyInstitutionGuidanceAnswers,
): boolean {
  return INSTITUTION_GUIDANCE_FIELDS.some(field => (guidance[field.id] ?? '').trim().length > 0)
}

export function resolveTeacherInstitutionGuidanceCtaLabel(
  guidance: ApplyInstitutionGuidanceAnswers,
): '안내사항 작성하기' | '안내사항 수정하기' {
  return hasInstitutionGuidanceDraftContent(guidance)
    ? '안내사항 수정하기'
    : '안내사항 작성하기'
}
