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
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-keys'
import {
  peekApplicantRecruitInstitutionOverlayRecord,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { peekGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  peekGeneralRegistrationWizardRhf,
  selectRecruitmentKvForParticipant,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-recruitment-rhf'
import { GENERAL_PROGRAM_REGISTRATION_STEPS } from '@/features/program/general/model/registration-flow'
import type { RegistrationProgramTypeKey } from '@/features/program/shared/lib/registration-draft-notice'
import { getSelectedOperationalTemplateCode } from '@/features/program/shared/lib/step-template-selection'
import {
  buildVolunteerInterviewOverlayKey,
  listVolunteerInterviewExceptionBlockIds,
} from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import {
  buildInstitutionApplicationRecruitLimitVisibilityBridge,
  shouldShowInstitutionApplicationMaxScheduleFields,
  shouldShowInstitutionApplicationMaxSessionsPerDayField,
} from '@/features/program/general/lib/institution-application-program-bridge'

export type GeneralProgramRecruitmentRequiredFieldContext = {
  participant: ProgramRegistrationParticipantSelection
  programType: ProgramRegistrationType
  sessionRoundType: ProgramRegistrationSessionRoundType
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  /** 봉사자 면접 예외 일정 블록 수 — 0이면 예외 필드 미검사 */
  volunteerExceptionScheduleCount: number
  /** 위저드 양식 선택 맵. 기본 GENERAL */
  registrationProgramType?: RegistrationProgramTypeKey
}

function defaultRecruitTemplateCode(
  registrationProgramType: RegistrationProgramTypeKey,
  stepKey: string
): string {
  const step = GENERAL_PROGRAM_REGISTRATION_STEPS.find(entry => entry.key === stepKey)
  const stepTemplateId = step?.templateId ?? stepKey
  if (registrationProgramType === 'COMPANY_SCHOOL' && stepKey === 'recruit-participant-school') {
    return 'recruitment-economy'
  }
  if (registrationProgramType === 'TRAINED_TEACHER' && stepKey === 'recruit-participant-school') {
    return 'recruitment-trained-teachers'
  }
  return stepTemplateId
}

function peekSelectedRecruitOverlay(
  registrationProgramType: RegistrationProgramTypeKey,
  stepKey: string,
  peek: (templateCode: string) => Record<string, unknown>
): Record<string, unknown> {
  const defaultCode = defaultRecruitTemplateCode(registrationProgramType, stepKey)
  return peek(getSelectedOperationalTemplateCode(registrationProgramType, stepKey, defaultCode))
}

/** 선택된 기관 모집 양식 버킷. 활성 탭 getRecord와 섞지 않는다. */
export function peekSelectedInstitutionRecruitOverlay(
  registrationProgramType: RegistrationProgramTypeKey = 'GENERAL'
): Record<string, unknown> {
  return peekSelectedRecruitOverlay(
    registrationProgramType,
    'recruit-participant-school',
    peekApplicantRecruitInstitutionOverlayRecord
  )
}

function pushReason(reasons: string[], condition: boolean, key: string): void {
  if (condition) reasons.push(key)
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

function pushInquiryIncomplete(
  reasons: string[],
  overlay: Record<string, unknown>,
  prefix: string
): void {
  pushReason(
    reasons,
    isEmptyText(read(overlay, `${prefix}.inquiryContact`)),
    `${prefix}.inquiryContact`
  )
  pushReason(reasons, isEmptyText(read(overlay, `${prefix}.inquiryTel`)), `${prefix}.inquiryTel`)
  pushReason(
    reasons,
    isEmptyText(read(overlay, `${prefix}.inquiryEmail`)),
    `${prefix}.inquiryEmail`
  )
}

function pushFinalAnnounceIncomplete(
  reasons: string[],
  overlay: Record<string, unknown>,
  prefix: string
): void {
  pushReason(
    reasons,
    isEmptyText(read(overlay, `${prefix}.finalAnnounceIso`)),
    `${prefix}.finalAnnounceIso`
  )
  pushReason(
    reasons,
    isEmptyText(read(overlay, `${prefix}.finalAnnounceMethod`)),
    `${prefix}.finalAnnounceMethod`
  )
}

function pushProgramAndRecruitPeriodIncomplete(
  reasons: string[],
  overlay: Record<string, unknown>,
  prefix: string
): void {
  pushReason(
    reasons,
    isRangeSealIncomplete(read(overlay, `${prefix}.programRangeSeal`)),
    `${prefix}.programRangeSeal`
  )
  pushReason(
    reasons,
    isRangeSealIncomplete(read(overlay, `${prefix}.recruitRangeSeal`)),
    `${prefix}.recruitRangeSeal`
  )
}

function buildInstitutionLimitsBridge(ctx: GeneralProgramRecruitmentRequiredFieldContext) {
  return buildInstitutionApplicationRecruitLimitVisibilityBridge({
    educationStructure: ctx.programType,
    sessionRound: ctx.sessionRoundType,
    educationScheduleMode: ctx.educationScheduleMode,
  })
}

function listIncompleteInstitutionRecruitInfo(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRecruitmentRequiredFieldContext
): string[] {
  const reasons: string[] = []
  const K = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
  const p = 'recruit.institution'
  pushReason(
    reasons,
    isEmptyText(readText(overlay, K.announcementPublished, 'published')),
    `${p}.announcementPublished`
  )
  pushReason(
    reasons,
    isEmptyText(readText(overlay, K.studentListRequired, 'need')),
    `${p}.studentListRequired`
  )
  pushReason(
    reasons,
    isEmptyText(readText(overlay, K.preguidanceRequired, 'need')),
    `${p}.preguidanceRequired`
  )
  pushReason(reasons, isEmptyNumber(read(overlay, K.maxAssignableInstructors)), `${p}.maxAssignableInstructors`)
  pushReason(reasons, isEmptyNumber(read(overlay, K.maxClassCount)), `${p}.maxClassCount`)

  const bridge = buildInstitutionLimitsBridge(ctx)
  if (shouldShowInstitutionApplicationMaxScheduleFields(bridge)) {
    pushReason(reasons, isEmptyNumber(read(overlay, K.maxScheduleCount)), `${p}.maxScheduleCount`)
  }
  if (shouldShowInstitutionApplicationMaxSessionsPerDayField(bridge)) {
    pushReason(reasons, isEmptyNumber(read(overlay, K.maxSessionsPerDay)), `${p}.maxSessionsPerDay`)
  }

  pushReason(reasons, isRangeSealIncomplete(read(overlay, K.programRangeSeal)), `${p}.programRangeSeal`)
  pushReason(reasons, isEmptyStringList(read(overlay, K.targetLevels)), `${p}.targetLevels`)
  pushReason(reasons, isEmptyText(read(overlay, K.targetLevelDetail)), `${p}.targetLevelDetail`)
  pushReason(reasons, isRangeSealIncomplete(read(overlay, K.recruitRangeSeal)), `${p}.recruitRangeSeal`)
  pushReason(reasons, isEmptyText(read(overlay, K.finalAnnounceIso)), `${p}.finalAnnounceIso`)
  pushReason(reasons, isEmptyText(read(overlay, K.finalAnnounceMethod)), `${p}.finalAnnounceMethod`)
  pushReason(reasons, isEmptyText(read(overlay, K.inquiryContact)), `${p}.inquiryContact`)
  pushReason(reasons, isEmptyText(read(overlay, K.inquiryTel)), `${p}.inquiryTel`)
  pushReason(reasons, isEmptyText(read(overlay, K.inquiryEmail)), `${p}.inquiryEmail`)
  pushReason(reasons, isNotesIncomplete(overlay, 'recruit'), `${p}.notes`)
  return reasons
}

function listIncompleteIndividualRecruitInfo(overlay: Record<string, unknown>): string[] {
  const reasons: string[] = []
  const p = 'recruit.individual'
  pushReason(
    reasons,
    isEmptyText(readText(overlay, `${p}.announcementPublished`, 'published')),
    `${p}.announcementPublished`
  )
  const interviewRequired = readText(overlay, `${p}.interviewRequired`, 'yes')
  pushReason(reasons, isEmptyText(interviewRequired), `${p}.interviewRequired`)
  pushProgramAndRecruitPeriodIncomplete(reasons, overlay, p)
  pushReason(reasons, isEmptyStringList(read(overlay, `${p}.targetLevels`)), `${p}.targetLevels`)
  pushReason(reasons, isEmptyText(read(overlay, `${p}.targetLevelDetail`)), `${p}.targetLevelDetail`)
  if (interviewRequired === 'yes') {
    pushReason(reasons, isEmptyText(read(overlay, `${p}.docDeadlineIso`)), `${p}.docDeadlineIso`)
    pushReason(reasons, isEmptyText(read(overlay, `${p}.docAnnounceMethod`)), `${p}.docAnnounceMethod`)
    pushReason(
      reasons,
      isRangeSealIncomplete(read(overlay, `${p}.interviewRangeSeal`)),
      `${p}.interviewRangeSeal`
    )
    pushReason(reasons, isEmptyText(read(overlay, `${p}.interviewMethod`)), `${p}.interviewMethod`)
  }
  pushFinalAnnounceIncomplete(reasons, overlay, p)
  pushInquiryIncomplete(reasons, overlay, p)
  pushReason(reasons, isNotesIncomplete(overlay, p), `${p}.notes`)
  return reasons
}

function listIncompleteInstructorRecruitInfo(overlay: Record<string, unknown>): string[] {
  const reasons: string[] = []
  const p = 'recruit.instructor'
  pushReason(
    reasons,
    isEmptyText(readText(overlay, `${p}.announcementPublished`, 'published')),
    `${p}.announcementPublished`
  )
  pushProgramAndRecruitPeriodIncomplete(reasons, overlay, p)
  const targets = read(overlay, `${p}.recruitTargets`)
  pushReason(reasons, targets !== undefined && isEmptyStringList(targets), `${p}.recruitTargets`)
  pushReason(reasons, isEmptyText(read(overlay, `${p}.recruitTargetDetail`)), `${p}.recruitTargetDetail`)
  pushFinalAnnounceIncomplete(reasons, overlay, p)
  pushInquiryIncomplete(reasons, overlay, p)
  pushReason(reasons, isNotesIncomplete(overlay, p), `${p}.notes`)
  return reasons
}

function isInterviewTimeRangeIncomplete(value: unknown): boolean {
  if (value == null) return true
  if (!Array.isArray(value) || value.length < 2) return true
  return value[0] == null || value[1] == null
}

function listIncompleteVolunteerInterviewSchedule(
  overlay: Record<string, unknown>,
  exceptionCount: number
): string[] {
  const reasons: string[] = []
  const p = 'recruit.volunteer.interview'
  const key = (suffix: string) => buildVolunteerInterviewOverlayKey('recruit', suffix)
  pushReason(
    reasons,
    isInterviewTimeRangeIncomplete(read(overlay, key('interviewTimeRange'))),
    `${p}.interviewTimeRange`
  )
  pushReason(reasons, isEmptyText(readText(overlay, key('timeUnit'), '30')), `${p}.timeUnit`)
  const slots = read(overlay, key('selectedSlotKeys'))
  pushReason(
    reasons,
    !Array.isArray(slots) || slots.length === 0 || slots.every(s => isEmptyText(s)),
    `${p}.selectedSlotKeys`
  )
  const exceptionIds = listVolunteerInterviewExceptionBlockIds(overlay, 'recruit')
  if (exceptionCount > exceptionIds.length) {
    pushReason(reasons, true, `${p}.exceptionDate`)
  }
  for (const id of exceptionIds) {
    const exceptionPrefix = `${p}.exception.${id}`
    pushReason(
      reasons,
      read(overlay, `${exceptionPrefix}.exceptionDate`) == null,
      `${exceptionPrefix}.exceptionDate`
    )
    const exceptionSlots = read(overlay, `${exceptionPrefix}.selectedSlotKeys`)
    const hasExceptionSlots =
      Array.isArray(exceptionSlots) && exceptionSlots.some(slot => !isEmptyText(slot))
    pushReason(
      reasons,
      !hasExceptionSlots && read(overlay, `${exceptionPrefix}.interviewTime`) == null,
      `${exceptionPrefix}.interviewTime`
    )
  }
  return reasons
}

function listIncompleteVolunteerRecruitInfo(
  overlay: Record<string, unknown>,
  ctx: GeneralProgramRecruitmentRequiredFieldContext
): string[] {
  const reasons: string[] = []
  const p = 'recruit.volunteer'
  pushReason(
    reasons,
    isEmptyText(readText(overlay, `${p}.announcementPublished`, 'published')),
    `${p}.announcementPublished`
  )
  const interviewRequired = readText(overlay, `${p}.interviewRequired`, 'yes')
  pushReason(reasons, isEmptyText(interviewRequired), `${p}.interviewRequired`)
  pushProgramAndRecruitPeriodIncomplete(reasons, overlay, p)
  pushReason(reasons, isEmptyStringList(read(overlay, `${p}.volunteerTargets`)), `${p}.volunteerTargets`)
  pushReason(reasons, isEmptyText(read(overlay, `${p}.volunteerTargetDetail`)), `${p}.volunteerTargetDetail`)

  if (interviewRequired === 'yes') {
    pushReason(reasons, isEmptyText(read(overlay, `${p}.docDeadlineIso`)), `${p}.docDeadlineIso`)
    pushReason(reasons, isEmptyText(read(overlay, `${p}.docAnnounceMethod`)), `${p}.docAnnounceMethod`)
    pushReason(
      reasons,
      isRangeSealIncomplete(read(overlay, `${p}.interviewRangeSeal`)),
      `${p}.interviewRangeSeal`
    )
    pushReason(reasons, isEmptyText(read(overlay, `${p}.interviewMethod`)), `${p}.interviewMethod`)
  }

  pushFinalAnnounceIncomplete(reasons, overlay, p)
  pushInquiryIncomplete(reasons, overlay, p)
  pushReason(reasons, isNotesIncomplete(overlay, p), `${p}.notes`)

  if (interviewRequired === 'yes') {
    reasons.push(...listIncompleteVolunteerInterviewSchedule(overlay, ctx.volunteerExceptionScheduleCount))
  }
  return reasons
}

function listIncompleteRecruitmentRequiredFieldsFromOverlay(
  overlays: {
    institution: Record<string, unknown>
    individual: Record<string, unknown>
    instructor: Record<string, unknown>
    volunteer: Record<string, unknown>
  },
  ctx: GeneralProgramRecruitmentRequiredFieldContext
): string[] {
  const reasons: string[] = []
  const { participant } = ctx
  if (participant.organization) {
    reasons.push(...listIncompleteInstitutionRecruitInfo(overlays.institution, ctx))
  }
  if (participant.individual) {
    reasons.push(...listIncompleteIndividualRecruitInfo(overlays.individual))
  }
  if (participant.teacherInstructor) {
    reasons.push(...listIncompleteInstructorRecruitInfo(overlays.instructor))
  }
  if (participant.volunteer) {
    reasons.push(...listIncompleteVolunteerRecruitInfo(overlays.volunteer, ctx))
  }
  return reasons
}

/** 노출된 모집 탭 전부 — 미입력 필수 필드 진단 키 */
export function listIncompleteGeneralProgramRecruitmentRequiredFields(
  ctx: GeneralProgramRecruitmentRequiredFieldContext
): string[] {
  const registrationProgramType = ctx.registrationProgramType ?? 'GENERAL'
  const rhf = peekGeneralRegistrationWizardRhf()
  if (registrationProgramType === 'GENERAL' && rhf != null) {
    const kv = selectRecruitmentKvForParticipant(rhf.getValues().recruitmentKv, ctx.participant)
    return listIncompleteRecruitmentRequiredFieldsFromOverlay(
      {
        institution: kv,
        individual: kv,
        instructor: kv,
        volunteer: kv,
      },
      ctx
    )
  }
  return listIncompleteRecruitmentRequiredFieldsFromOverlay(
    {
      institution: peekSelectedInstitutionRecruitOverlay(registrationProgramType),
      individual: peekSelectedRecruitOverlay(
        registrationProgramType,
        'recruit-participant-individual',
        peekGeneralRecruitOverlayRecord
      ),
      instructor: peekSelectedRecruitOverlay(
        registrationProgramType,
        'recruit-instructor',
        peekGeneralRecruitOverlayRecord
      ),
      volunteer: peekSelectedRecruitOverlay(
        registrationProgramType,
        'recruit-volunteer',
        peekGeneralRecruitOverlayRecord
      ),
    },
    ctx
  )
}

/** 노출된 모집 탭 전부에 대해 필수 미입력 여부 */
export function hasIncompleteGeneralProgramRecruitmentRequiredFields(
  ctx: GeneralProgramRecruitmentRequiredFieldContext
): boolean {
  return listIncompleteGeneralProgramRecruitmentRequiredFields(ctx).length > 0
}
