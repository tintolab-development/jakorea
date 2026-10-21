import type { PlatformMemberProfile } from '@/features/mypage/model/types'
import type { PortalRecruitmentFocus, ProgramDetail } from '@/features/program'
import { resolveProgramApplyFormCase } from '@/features/program/lib/apply-form-case'
import { resolveInstitutionPreEducationNoticeRequired } from '@/features/program/lib/portal-application-hidden-paragraph-ids'
import { hasTeacherMypageProfile } from '@/features/mypage/lib/member-profile'
import {
  isOrganizationEducationApplication,
  isTrainedTeachersEducationProgram,
} from './organization-education-application'
import type { EducationApplicationListItem } from '../model/types'
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

function isTeacherOrganizationProgramContext(
  application:
    | Pick<
        EducationApplicationListItem,
        'applicationType' | 'categoryLabel' | 'applicationAnswers'
      >
    | undefined,
  program: Pick<ProgramDetail, 'programAudience' | 'programType' | 'registrationKind'> | undefined,
): boolean {
  return isOrganizationEducationApplication(application, program)
}

type InstitutionGuidanceProgram = Pick<
  ProgramDetail,
  | 'programAudience'
  | 'programType'
  | 'registrationKind'
  | 'preEducationNoticeRequired'
  | 'advanceGuidanceRequired'
>

export function shouldShowTeacherInstitutionGuidanceWrite(options: {
  isTeacher: boolean
  application?: Pick<
    EducationApplicationListItem,
    'applicationType' | 'categoryLabel' | 'applicationAnswers'
  >
  program?: InstitutionGuidanceProgram
  displayStatus: EducationDisplayStatus
}): boolean {
  if (!options.isTeacher) return false
  if (!isTeacherOrganizationProgramContext(options.application, options.program)) return false
  if (!resolveInstitutionPreEducationNoticeRequired(options.program)) return false
  return GUIDANCE_WRITE_DISPLAY_STATUSES.has(options.displayStatus)
}

/** 신청 내용 탭 — 기관 안내 양식(4항목·성범죌) 수정 진입 */
export function shouldShowTeacherInstitutionGuidanceEditOnApplicationTab(options: {
  isTeacher?: boolean
  application?: Pick<
    EducationApplicationListItem,
    'applicationType' | 'categoryLabel' | 'applicationAnswers'
  >
  program?: InstitutionGuidanceProgram
  displayStatus: EducationDisplayStatus
}): boolean {
  if (!isTeacherOrganizationProgramContext(options.application, options.program)) return false
  if (!resolveInstitutionPreEducationNoticeRequired(options.program)) return false
  return canShowEducationApplicationContent(options.displayStatus)
}

/** 신청 내용 탭·진행중 신청 정보 팝업 — 「안내사항 수정하기」 */
export function shouldShowTeacherInstitutionGuidanceEditLink(options: {
  isTeacher?: boolean
  application?: Pick<
    EducationApplicationListItem,
    'applicationType' | 'categoryLabel' | 'applicationAnswers'
  >
  program?: InstitutionGuidanceProgram
  displayStatus: EducationDisplayStatus
}): boolean {
  if (!isTeacherOrganizationProgramContext(options.application, options.program)) return false
  if (!resolveInstitutionPreEducationNoticeRequired(options.program)) return false
  return (
    canShowEducationApplicationContent(options.displayStatus) ||
    GUIDANCE_WRITE_DISPLAY_STATUSES.has(options.displayStatus)
  )
}

/** 신청 양식에 기관 안내사항 단락이 있고, 모집 설정이 「사전 안내 작성」인 프로그램 */
export function shouldShowTeacherInstitutionGuidanceOnApplicationTab(
  program:
    | Pick<
        ProgramDetail,
        | 'id'
        | 'programType'
        | 'registrationKind'
        | 'programAudience'
        | 'detailCase'
        | 'applicationType'
        | 'participationMethod'
        | 'category'
        | 'preEducationNoticeRequired'
        | 'advanceGuidanceRequired'
      >
    | null
    | undefined,
  options?: {
    application?: Pick<
      EducationApplicationListItem,
      'applicationType' | 'categoryLabel' | 'applicationAnswers'
    >
    applicationFormRuntimeContext?: unknown
  },
): boolean {
  if (!program) return false
  if (isTrainedTeachersEducationProgram(program)) return false

  const applyCase = resolveProgramApplyFormCase({
    ...program,
    applicationType: options?.application?.applicationType ?? program.applicationType,
  })

  if (applyCase === 'institution-ujat' || applyCase === 'institution-gemini') {
    return false
  }

  const hasGuidanceForm =
    applyCase === 'institution-economy' ||
    applyCase === 'institution-general' ||
    isOrganizationEducationApplication(options?.application, program)

  if (!hasGuidanceForm) return false

  return resolveInstitutionPreEducationNoticeRequired(
    program,
    options?.applicationFormRuntimeContext,
  )
}

/** 교육현황 상세 — 해당 신청 건의 기관 모집 행을 프로그램 상세 focus로 쓴다. */
export function resolveEducationApplicationProgramFocus(
  application:
    | Pick<EducationApplicationListItem, 'recruitmentId' | 'applicationType'>
    | null
    | undefined,
): PortalRecruitmentFocus | null {
  if (!application) return null
  const applicationType = application.applicationType?.trim().toUpperCase()
  const recruitmentId = application.recruitmentId
  const recruitmentIds =
    recruitmentId != null && Number.isSafeInteger(recruitmentId) && recruitmentId > 0
      ? [recruitmentId]
      : undefined
  if (applicationType === 'ORGANIZATION') {
    return {
      portalTab: 'ORGANIZATION',
      applicationTypes: ['ORGANIZATION'],
      ...(recruitmentIds ? { recruitmentIds } : {}),
    }
  }
  if (!applicationType && !recruitmentIds) return null
  return {
    ...(applicationType ? { applicationTypes: [applicationType] } : {}),
    ...(recruitmentIds ? { recruitmentIds } : {}),
  }
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
  program: InstitutionGuidanceProgram | undefined,
  displayStatus: EducationDisplayStatus,
  application?: Pick<EducationApplicationListItem, 'applicationType' | 'categoryLabel'>,
): boolean {
  return shouldShowTeacherInstitutionGuidanceWrite({
    isTeacher: hasTeacherMypageProfile(profile),
    application,
    program,
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
