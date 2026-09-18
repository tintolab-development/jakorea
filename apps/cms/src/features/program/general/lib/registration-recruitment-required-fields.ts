/**
 * 일반 프로그램 등록 — 모집 정보 단계 필수 필드.
 * 「상세 정보」단락은 제외. 유형별 「* 모집 정보」단락(+ 봉사자 면접 일정)만 검사.
 */

import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import {
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
  getApplicantRecruitInstitutionOverlayRecord,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { buildVolunteerInterviewOverlayKey } from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import {
  shouldShowInstitutionApplicationMaxScheduleFields,
  shouldShowInstitutionApplicationMaxSessionsPerDayField,
  type InstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'

export type GeneralProgramRecruitmentRequiredFieldContext = {
  participant: ProgramRegistrationParticipantSelection
  programType: ProgramRegistrationType
  sessionRoundType: ProgramRegistrationSessionRoundType
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  /** 봉사자 면접 예외 일정 블록 수 — 0이면 예외 필드 미검사 */
  volunteerExceptionScheduleCount: number
}

function isEmptyText(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === ''
}

function isEmptyNumber(value: unknown): boolean {
  return typeof value !== 'number' || !Number.isFinite(value)
}

function isEmptyStringList(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return true
  return value.every(item => isEmptyText(item))
}

function isRangeSealIncomplete(value: unknown): boolean {
  if (value == null || typeof value !== 'object') return true
  const row = value as { start?: unknown; end?: unknown }
  return isEmptyText(row.start) || isEmptyText(row.end)
}

function read(overlay: Record<string, unknown>, key: string): unknown {
  return overlay[key]
}

function readText(overlay: Record<string, unknown>, key: string, fallback = ''): string {
  const raw = overlay[key]
  if (raw === undefined) return fallback
  return typeof raw === 'string' ? raw : ''
}

/** 비고: 「해당없음」이면 본문 생략 허용 */
function isNotesIncomplete(overlay: Record<string, unknown>, prefix: string): boolean {
  const na = overlay[`${prefix}.notesNotApplicable`]
  if (na === true) return false
  return isEmptyText(read(overlay, `${prefix}.notes`))
}

function isInquiryIncomplete(overlay: Record<string, unknown>, prefix: string): boolean {
  return (
    isEmptyText(read(overlay, `${prefix}.inquiryContact`)) ||
    isEmptyText(read(overlay, `${prefix}.inquiryTel`)) ||
    isEmptyText(read(overlay, `${prefix}.inquiryEmail`))
  )
}

function isFinalAnnounceIncomplete(overlay: Record<string, unknown>, prefix: string): boolean {
  return (
    isEmptyText(read(overlay, `${prefix}.finalAnnounceIso`)) ||
    isEmptyText(read(overlay, `${prefix}.finalAnnounceMethod`))
  )
}

function isProgramAndRecruitPeriodIncomplete(
  overlay: Record<string, unknown>,
  prefix: string
): boolean {
  return (
    isRangeSealIncomplete(read(overlay, `${prefix}.programRangeSeal`)) ||
    isRangeSealIncomplete(read(overlay, `${prefix}.recruitRangeSeal`))
  )
}

function buildInstitutionLimitsBridge(
  ctx: GeneralProgramRecruitmentRequiredFieldContext
): InstitutionApplicationProgramBridge {
  return {
    // 최대 일정·회차 필드 노출 판정에만 쓰는 합성 브리지 — 사전 안내 여부는 기본값을 따른다
    preEducationNoticeRequired: true,
    educationStructure: ctx.programType,
    sessionRound: ctx.sessionRoundType,
    educationScheduleMode: ctx.educationScheduleMode,
  }
}

function hasIncompleteInstitutionRecruitInfo(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRecruitmentRequiredFieldContext
): boolean {
  const K = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
  // 라디오 기본값 — 미기록이면 기본으로 간주
  if (isEmptyText(readText(overlay, K.announcementPublished, 'published'))) return true
  if (isEmptyText(readText(overlay, K.studentListRequired, 'need'))) return true
  if (isEmptyText(readText(overlay, K.preguidanceRequired, 'need'))) return true

  if (isEmptyNumber(read(overlay, K.maxAssignableInstructors))) return true
  if (isEmptyNumber(read(overlay, K.maxClassCount))) return true

  const bridge = buildInstitutionLimitsBridge(ctx)
  if (shouldShowInstitutionApplicationMaxScheduleFields(bridge)) {
    if (isEmptyNumber(read(overlay, K.maxScheduleCount))) return true
  }
  if (shouldShowInstitutionApplicationMaxSessionsPerDayField(bridge)) {
    if (isEmptyNumber(read(overlay, K.maxSessionsPerDay))) return true
  }

  if (isRangeSealIncomplete(read(overlay, K.programRangeSeal))) return true
  if (isEmptyStringList(read(overlay, K.targetLevels))) return true
  if (isEmptyText(read(overlay, K.targetLevelDetail))) return true
  if (isRangeSealIncomplete(read(overlay, K.recruitRangeSeal))) return true
  if (isEmptyText(read(overlay, K.finalAnnounceIso))) return true
  if (isEmptyText(read(overlay, K.finalAnnounceMethod))) return true
  if (isEmptyText(read(overlay, K.inquiryContact))) return true
  if (isEmptyText(read(overlay, K.inquiryTel))) return true
  if (isEmptyText(read(overlay, K.inquiryEmail))) return true
  if (isNotesIncomplete(overlay, 'recruit')) return true
  return false
}

function hasIncompleteIndividualRecruitInfo(overlay: Record<string, unknown>): boolean {
  const p = 'recruit.individual'
  if (isEmptyText(readText(overlay, `${p}.announcementPublished`, 'published'))) return true
  if (isProgramAndRecruitPeriodIncomplete(overlay, p)) return true
  if (isEmptyStringList(read(overlay, `${p}.targetLevels`))) return true
  if (isEmptyText(read(overlay, `${p}.targetLevelDetail`))) return true
  // 면접 UI 비노출(interviewEnabled=false) — 서류/면접 필드 미검사
  if (isFinalAnnounceIncomplete(overlay, p)) return true
  if (isInquiryIncomplete(overlay, p)) return true
  if (isNotesIncomplete(overlay, p)) return true
  return false
}

function hasIncompleteInstructorRecruitInfo(overlay: Record<string, unknown>): boolean {
  const p = 'recruit.instructor'
  if (isEmptyText(readText(overlay, `${p}.announcementPublished`, 'published'))) return true
  if (isProgramAndRecruitPeriodIncomplete(overlay, p)) return true
  // 기본 ['성인'] — 미기록이면 통과, 명시적 빈 배열만 실패
  const targets = read(overlay, `${p}.recruitTargets`)
  if (targets !== undefined && isEmptyStringList(targets)) return true
  if (isEmptyText(read(overlay, `${p}.recruitTargetDetail`))) return true
  if (isFinalAnnounceIncomplete(overlay, p)) return true
  if (isInquiryIncomplete(overlay, p)) return true
  if (isNotesIncomplete(overlay, p)) return true
  return false
}

function isInterviewTimeRangeIncomplete(value: unknown): boolean {
  if (value == null) return true
  if (!Array.isArray(value) || value.length < 2) return true
  return value[0] == null || value[1] == null
}

function hasIncompleteVolunteerInterviewSchedule(
  overlay: Record<string, unknown>,
  exceptionCount: number
): boolean {
  const key = (suffix: string) => buildVolunteerInterviewOverlayKey('recruit', suffix)
  // 면접 진행 불가일 — 빈 목록(불가일 없음) 허용. exclusion 기본값 있음.
  if (isInterviewTimeRangeIncomplete(read(overlay, key('interviewTimeRange')))) return true
  if (isEmptyText(readText(overlay, key('timeUnit'), '30'))) return true
  const slots = read(overlay, key('selectedSlotKeys'))
  if (!Array.isArray(slots) || slots.length === 0) return true
  if (slots.every(s => isEmptyText(s))) return true

  if (exceptionCount > 0) {
    if (read(overlay, key('exceptionDate')) == null) return true
    if (read(overlay, key('interviewTime')) == null) return true
  }
  return false
}

function hasIncompleteVolunteerRecruitInfo(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRecruitmentRequiredFieldContext
): boolean {
  const p = 'recruit.volunteer'
  if (isEmptyText(readText(overlay, `${p}.announcementPublished`, 'published'))) return true
  const interviewRequired = readText(overlay, `${p}.interviewRequired`, 'yes')
  if (isEmptyText(interviewRequired)) return true

  if (isProgramAndRecruitPeriodIncomplete(overlay, p)) return true
  if (isEmptyStringList(read(overlay, `${p}.volunteerTargets`))) return true
  if (isEmptyText(read(overlay, `${p}.volunteerTargetDetail`))) return true

  if (interviewRequired === 'yes') {
    if (isEmptyText(read(overlay, `${p}.docDeadlineIso`))) return true
    if (isEmptyText(read(overlay, `${p}.docAnnounceMethod`))) return true
    if (isRangeSealIncomplete(read(overlay, `${p}.interviewRangeSeal`))) return true
    if (isEmptyText(read(overlay, `${p}.interviewMethod`))) return true
  }

  if (isFinalAnnounceIncomplete(overlay, p)) return true
  if (isInquiryIncomplete(overlay, p)) return true
  if (isNotesIncomplete(overlay, p)) return true

  if (interviewRequired === 'yes') {
    if (
      hasIncompleteVolunteerInterviewSchedule(overlay, ctx.volunteerExceptionScheduleCount)
    ) {
      return true
    }
  }
  return false
}

/** 노출된 모집 탭 전부에 대해 필수 미입력 여부 */
export function hasIncompleteGeneralProgramRecruitmentRequiredFields(
  ctx: GeneralProgramRecruitmentRequiredFieldContext
): boolean {
  const { participant } = ctx
  if (participant.organization) {
    if (
      hasIncompleteInstitutionRecruitInfo(getApplicantRecruitInstitutionOverlayRecord(), ctx)
    ) {
      return true
    }
  }
  const general = getGeneralRecruitOverlayRecord()
  if (participant.individual) {
    if (hasIncompleteIndividualRecruitInfo(general)) return true
  }
  if (participant.teacherInstructor) {
    if (hasIncompleteInstructorRecruitInfo(general)) return true
  }
  if (participant.volunteer) {
    if (hasIncompleteVolunteerRecruitInfo(general, ctx)) return true
  }
  return false
}
