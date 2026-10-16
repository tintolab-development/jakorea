/**
 * 프로그램 등록 위저드 — program registration overlay + 모집 overlay → institution bridge SSOT.
 * 탭 순서·paragraph mount와 무관하게 신청 양식 단락 노출을 맞춘다.
 */

import {
  patchInstitutionApplicationProgramBridge,
  syncInstitutionApplicationPreferredEducationFormFromOverlay,
  type InstitutionApplicationEducationScheduleMode,
} from '@/features/program/general/lib/institution-application-program-bridge'
import {
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
  peekApplicantRecruitInstitutionOverlayRecord,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { PROGRAM_REGISTRATION_EDUCATION_FORM_BRIDGE_OVERLAY_KEYS } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import {
  GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY,
  getProgramRegistrationOverlayRecord,
  readGeneralRegistrationOverlayScheduleLines,
  subscribeProgramRegistrationOverlayKeys,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { subscribeApplicantRecruitInstitutionOverlay } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { resolveInstitutionApplicationScheduleMetaForRegistrationWizard } from '@/features/program/general/lib/institution-application-schedule-meta'
import { parseEducationScheduleLineToRange } from '@/features/template/lib/format-education-schedule-line'
import dayjs from 'dayjs'

const CURRICULUM_PROGRESS_SESSION_BY_ROUND_KEY =
  'generalRegistration.educationCurriculum.progressSessionByRound' as const

const TRAINED_TEACHERS_SCHEDULE_LINES_KEY =
  'trainedTeachersRegistration.educationScheduleSettings.scheduleLines' as const

const ECONOMY_DATE_RANGE_SEAL_KEY =
  'economyRegistration.educationScheduleSettings.dateRangeSeal' as const

export type SyncInstitutionApplicationBridgeForRegistrationWizardArgs = {
  registrationFormVariant: ProgramRegistrationFormVariant
  programType: ProgramRegistrationType
  sessionRound: ProgramRegistrationSessionRoundType
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  recruitTemplateCode: string | null | undefined
  curriculumSessionCount?: number
  curriculumChartSessionCount?: number
}

function readStringArrayFromOverlay(
  overlay: Record<string, unknown>,
  key: string
): string[] {
  const raw = overlay[key]
  if (!Array.isArray(raw)) return []
  return raw
    .filter((line): line is string => typeof line === 'string')
    .map(line => line.trim())
    .filter(Boolean)
}

function readTrainedTeachersScheduleLinesFromOverlay(): string[] {
  return readStringArrayFromOverlay(
    getProgramRegistrationOverlayRecord(),
    TRAINED_TEACHERS_SCHEDULE_LINES_KEY
  )
}

function resolvePeriodRangeFromLines(
  lines: readonly string[]
): { start: string; end: string } | undefined {
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const range = parseEducationScheduleLineToRange(lines[i])
    if (!range) continue
    const [start, end] = range
    if (!start.isSame(end, 'day')) {
      return {
        start: start.startOf('day').toISOString(),
        end: end.endOf('day').toISOString(),
      }
    }
  }
  return undefined
}

function readEconomyScheduleRangeFromOverlay(): { start: string; end: string } | undefined {
  const raw = getProgramRegistrationOverlayRecord()[ECONOMY_DATE_RANGE_SEAL_KEY]
  if (raw == null || typeof raw !== 'object') return undefined
  const seal = raw as { start?: string; end?: string }
  const start = dayjs(seal.start)
  const end = dayjs(seal.end)
  if (!start.isValid() || !end.isValid()) return undefined
  return {
    start: start.startOf('day').toISOString(),
    end: end.endOf('day').toISOString(),
  }
}

function readPreEducationNoticeRequiredFromRecruitOverlay(
  recruitTemplateCode: string | null | undefined
): boolean | undefined {
  const raw =
    peekApplicantRecruitInstitutionOverlayRecord(recruitTemplateCode)[
      APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.preguidanceRequired
    ]
  if (raw === 'need') return true
  if (raw === 'none') return false
  return undefined
}

function readRecruitLimitsFromOverlay(
  recruitTemplateCode: string | null | undefined
): Pick<
  Parameters<typeof patchInstitutionApplicationProgramBridge>[0],
  'maxAssignableInstructors' | 'maxClassCount' | 'maxScheduleCount' | 'maxSessionsPerDay'
> {
  const record = peekApplicantRecruitInstitutionOverlayRecord(recruitTemplateCode)
  return {
    maxAssignableInstructors: record[
      APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxAssignableInstructors
    ] as number | undefined,
    maxClassCount: record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxClassCount] as
      | number
      | undefined,
    maxScheduleCount: record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxScheduleCount] as
      | number
      | undefined,
    maxSessionsPerDay: record[APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.maxSessionsPerDay] as
      | number
      | undefined,
  }
}

export function syncInstitutionApplicationBridgeForRegistrationWizard(
  args: SyncInstitutionApplicationBridgeForRegistrationWizardArgs
): void {
  const overlay = getProgramRegistrationOverlayRecord()
  syncInstitutionApplicationPreferredEducationFormFromOverlay(overlay)

  const recruitLimits = readRecruitLimitsFromOverlay(args.recruitTemplateCode)
  const preEducationFromRecruit = readPreEducationNoticeRequiredFromRecruitOverlay(
    args.recruitTemplateCode
  )

  if (args.registrationFormVariant === 'general') {
    const hideScheduleSettings =
      args.programType === 'schedule' && args.sessionRound === 'multi'
    const lines = hideScheduleSettings ? [] : readGeneralRegistrationOverlayScheduleLines()
    const mode = args.educationScheduleMode as InstitutionApplicationEducationScheduleMode
    const scheduleMeta = resolveInstitutionApplicationScheduleMetaForRegistrationWizard({
      sessionRound: args.sessionRound,
      curriculumSessionCount: args.curriculumSessionCount,
      curriculumChartSessionCount: args.curriculumChartSessionCount,
      overlay,
    })
    patchInstitutionApplicationProgramBridge({
      ...recruitLimits,
      educationStructure: args.programType,
      sessionRound: args.sessionRound,
      educationScheduleMode: mode,
      educationScheduleLines: lines,
      educationRoundCount: scheduleMeta.educationRoundCount,
      sessionsPerRound: scheduleMeta.sessionsPerRound,
      curriculumChartSessionCount: scheduleMeta.curriculumChartSessionCount,
      educationScheduleRange: mode === 'period' ? resolvePeriodRangeFromLines(lines) : undefined,
      ...(preEducationFromRecruit !== undefined
        ? { preEducationNoticeRequired: preEducationFromRecruit }
        : {}),
    })
    return
  }

  if (args.registrationFormVariant === 'trainedTeachers') {
    const lines = readTrainedTeachersScheduleLinesFromOverlay()
    const mode = args.educationScheduleMode as InstitutionApplicationEducationScheduleMode
    patchInstitutionApplicationProgramBridge({
      ...recruitLimits,
      preEducationNoticeRequired: false,
      educationStructure: args.programType,
      sessionRound: args.sessionRound,
      educationScheduleMode: mode,
      educationScheduleLines: lines,
      educationScheduleRange:
        mode === 'period' ? resolvePeriodRangeFromLines(lines) : undefined,
    })
    return
  }

  // 1사1교 (economy)
  patchInstitutionApplicationProgramBridge({
    ...recruitLimits,
    preEducationNoticeRequired: preEducationFromRecruit ?? true,
    maxScheduleCount: recruitLimits.maxScheduleCount ?? 2,
    maxSessionsPerDay: recruitLimits.maxSessionsPerDay ?? 2,
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    educationScheduleMode: 'period',
    educationScheduleRange: readEconomyScheduleRangeFromOverlay(),
  })
}

/** 참여자(모집·신청) 탭 — overlay 변경 시 브리지 재동기화 */
export function subscribeInstitutionApplicationBridgeForRegistrationWizard(
  args: SyncInstitutionApplicationBridgeForRegistrationWizardArgs
): () => void {
  const run = () => {
    syncInstitutionApplicationBridgeForRegistrationWizard(args)
  }
  run()
  const unsubReg = subscribeProgramRegistrationOverlayKeys(
    registrationWizardBridgeOverlayKeys(args.registrationFormVariant),
    run
  )
  const unsubRecruit = subscribeApplicantRecruitInstitutionOverlay(run)
  return () => {
    unsubReg()
    unsubRecruit()
  }
}

export function registrationWizardScheduleLinesOverlayKey(
  variant: ProgramRegistrationFormVariant
): string | null {
  if (variant === 'general') return GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY
  if (variant === 'trainedTeachers') return TRAINED_TEACHERS_SCHEDULE_LINES_KEY
  return null
}

export function registrationWizardBridgeOverlayKeys(
  variant: ProgramRegistrationFormVariant
): readonly string[] {
  if (variant === 'general') {
    return [
      GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY,
      CURRICULUM_PROGRESS_SESSION_BY_ROUND_KEY,
      ...PROGRAM_REGISTRATION_EDUCATION_FORM_BRIDGE_OVERLAY_KEYS,
    ]
  }
  if (variant === 'trainedTeachers') {
    return [TRAINED_TEACHERS_SCHEDULE_LINES_KEY]
  }
  if (variant === 'economy') {
    return [ECONOMY_DATE_RANGE_SEAL_KEY]
  }
  return []
}
