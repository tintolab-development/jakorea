import type { PlatformMemberProfile } from '@/features/mypage/model/types'
import type { ProgramDetail } from '@/features/program'
import { isSchoolTeacherMypageProfile } from '@/features/mypage/lib/member-profile'
import type {
  EducationDisplayStatus,
  EducationTeacherApplicationGuidance,
} from '../model/types'
import type { ApplyInstitutionGuidanceAnswers } from '@/features/program/ui/apply-institution-guidance/apply-institution-guidance'
import { INSTITUTION_GUIDANCE_FIELDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { canShowEducationApplicationContent } from './display-status'

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

/** 신청 내용 탭 — 기관 안내 양식(4항목·성범죌) 수정 진입 */
export function shouldShowTeacherInstitutionGuidanceEditOnApplicationTab(options: {
  isTeacher: boolean
  programAudience: ProgramDetail['programAudience'] | undefined
  displayStatus: EducationDisplayStatus
}): boolean {
  if (!options.isTeacher) return false
  if (options.programAudience !== 'organization') return false
  return canShowEducationApplicationContent(options.displayStatus)
}

/** 신청 내용 탭·진행중 신청 정보 팝업 — 「안내사항 수정하기」 */
export function shouldShowTeacherInstitutionGuidanceEditLink(options: {
  isTeacher: boolean
  programAudience: ProgramDetail['programAudience'] | undefined
  displayStatus: EducationDisplayStatus
}): boolean {
  if (!options.isTeacher) return false
  if (options.programAudience !== 'organization') return false
  return (
    canShowEducationApplicationContent(options.displayStatus) ||
    GUIDANCE_WRITE_DISPLAY_STATUSES.has(options.displayStatus)
  )
}

export function hasTeacherApplicationGuidanceContent(
  guidance: EducationTeacherApplicationGuidance,
): boolean {
  const hasField =
    Boolean(guidance.computerInRoom?.trim()) ||
    Boolean(guidance.waitingPlace?.trim()) ||
    Boolean(guidance.meal?.trim()) ||
    Boolean(guidance.otherNotes?.trim())
  return hasField || Boolean(guidance.sexOffenseConsentMethod?.trim())
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
