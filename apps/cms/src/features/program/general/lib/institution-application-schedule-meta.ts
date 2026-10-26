import {
  readCurriculumMultiDateFixedScheduleMeta,
  readCurriculumPreferredScheduleDailySessionCountForCopy,
} from '@jakorea/form-schema/program-application'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { extrasFromGeneralProgram } from '@/features/program/general/lib/general-registration-overlay-from-program'
import type { Program } from '@/types/domain'

const PROGRESS_SESSION_BY_ROUND_KEY =
  'generalRegistration.educationCurriculum.progressSessionByRound' as const

function readPositiveInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value)
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed)
  }
  return undefined
}

function readProgressSessionsPerRoundFromOverlay(
  overlay: Record<string, unknown> | null | undefined
): number | undefined {
  if (!overlay) return undefined
  const raw = overlay[PROGRESS_SESSION_BY_ROUND_KEY]
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const record = raw as Record<string, unknown>
  return readPositiveInt(record[1] ?? record['1'])
}

export function resolveInstitutionApplicationScheduleMetaFromProgram(
  program?: Program | null
): Pick<
  InstitutionApplicationProgramBridge,
  'educationRoundCount' | 'sessionsPerRound' | 'curriculumChartSessionCount'
> {
  if (!program) return {}
  const commonInfo = program.generalCommonInfo
  const extras = extrasFromGeneralProgram(program)
  const overlay =
    program.registrationOverlay != null && typeof program.registrationOverlay === 'object'
      ? (program.registrationOverlay as Record<string, unknown>)
      : undefined

  const meta = readCurriculumMultiDateFixedScheduleMeta({
    curriculumSessions: commonInfo?.curriculumSessions,
    educationRoundCount:
      extras.sessionRoundType === 'multi' ? extras.curriculumSessionCount : undefined,
    sessionsPerRound: readProgressSessionsPerRoundFromOverlay(overlay),
  })

  const curriculumChartSessionCount =
    extras.sessionRoundType === 'single'
      ? (extras.curriculumChartSessionCount ??
        readCurriculumPreferredScheduleDailySessionCountForCopy({
          sessionRound: 'single',
          curriculumSessions: commonInfo?.curriculumSessions,
        }))
      : undefined

  return {
    educationRoundCount: meta.educationRoundCount,
    sessionsPerRound: meta.sessionsPerRound,
    curriculumChartSessionCount,
  }
}

export function resolveInstitutionApplicationScheduleMetaForRegistrationWizard(input: {
  sessionRound: 'single' | 'multi'
  curriculumSessionCount?: number
  curriculumChartSessionCount?: number
  overlay?: Record<string, unknown>
}): Pick<
  InstitutionApplicationProgramBridge,
  'educationRoundCount' | 'sessionsPerRound' | 'curriculumChartSessionCount'
> {
  const meta = readCurriculumMultiDateFixedScheduleMeta({
    educationRoundCount:
      input.sessionRound === 'multi' ? input.curriculumSessionCount : undefined,
    sessionsPerRound: readProgressSessionsPerRoundFromOverlay(input.overlay),
  })
  return {
    educationRoundCount: meta.educationRoundCount,
    sessionsPerRound: meta.sessionsPerRound,
    curriculumChartSessionCount:
      input.sessionRound === 'single' ? input.curriculumChartSessionCount : undefined,
  }
}
