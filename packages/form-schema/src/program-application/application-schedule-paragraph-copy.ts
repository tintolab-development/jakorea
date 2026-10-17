import {
  readCurriculumMultiDateFixedScheduleMeta,
  readCurriculumPreferredScheduleDailySessionCountForCopy,
  shouldUseCurriculumMultiDateFixedScheduleMatrix,
  type CurriculumMultiDateFixedScheduleMetaInput,
} from './curriculum-multi-date-fixed-schedule.js'
import {
  shouldShowApplicationPreferredScheduleParagraph,
  shouldShowApplicationScheduleParagraph,
  shouldShowApplicationSchedulePeriodDateOnlyPreferred,
  type ApplicationScheduleVisibilityInput,
} from './schedule-paragraph-visibility.js'

const FIXED_SCHEDULE_DESCRIPTION_SINGLE_ROUND =
  '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'

const FIXED_SCHEDULE_DESCRIPTION_MULTI_ROUND =
  'N차시*N회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.'

export type ApplicationScheduleParagraphCopyInput = ApplicationScheduleVisibilityInput &
  CurriculumMultiDateFixedScheduleMetaInput & {
    maxScheduleCount?: number
    maxSessionsPerDay?: number
  }

function countOrN(value: number | undefined): string {
  return value != null && value > 0 ? String(value) : 'N'
}

function resolveMultiRoundFixedScheduleDescription(
  input: ApplicationScheduleParagraphCopyInput
): string {
  if (!shouldUseCurriculumMultiDateFixedScheduleMatrix(input)) {
    return FIXED_SCHEDULE_DESCRIPTION_MULTI_ROUND
  }
  const meta = readCurriculumMultiDateFixedScheduleMeta(input)
  const sessions = countOrN(meta.sessionsPerRound)
  const rounds = countOrN(meta.educationRoundCount)
  return FIXED_SCHEDULE_DESCRIPTION_MULTI_ROUND.replace('N차시', `${sessions}차시`).replace(
    'N회',
    `${rounds}회`
  )
}

/** 날짜 지정 — 고정 일정 체크박스 안내 (CMS `resolveInstitutionFixedScheduleDescription`) */
export function resolveApplicationFixedScheduleParagraphDescription(
  input: ApplicationScheduleParagraphCopyInput
): string {
  if (input.sessionRound === 'multi') {
    return resolveMultiRoundFixedScheduleDescription(input)
  }
  return FIXED_SCHEDULE_DESCRIPTION_SINGLE_ROUND
}

/** 기간 지정 지망 카드 설명 — 일정형 단일은 날짜만, 커리큘럼은 차시·시간 포함 */
export function resolveApplicationPreferredScheduleParagraphDescription(
  input: ApplicationScheduleParagraphCopyInput
): string {
  const max = countOrN(input.maxScheduleCount)
  if (shouldShowApplicationSchedulePeriodDateOnlyPreferred(input)) {
    return `교육을 희망하는 날짜를 모두 작성해 주세요. (최대 ${max}개까지 희망 일정 신청이 가능합니다.)`
  }
  const sessions = countOrN(readCurriculumPreferredScheduleDailySessionCountForCopy(input))
  return `교육을 희망하는 날짜와 수업 시간을 모두 작성해 주세요. 수업은 1일, ${sessions}차시 운영됩니다. (최대 ${max}개까지 희망 일정 신청이 가능합니다.)`
}

export function shouldUseApplicationPreferredScheduleParagraphDescription(
  input: ApplicationScheduleVisibilityInput
): boolean {
  return shouldShowApplicationPreferredScheduleParagraph(input)
}

export function shouldUseApplicationFixedScheduleParagraphDescription(
  input: ApplicationScheduleVisibilityInput
): boolean {
  if (!shouldShowApplicationScheduleParagraph(input)) return false
  return !shouldShowApplicationPreferredScheduleParagraph(input)
}

export function resolveApplicationScheduleParagraphDescription(
  input: ApplicationScheduleParagraphCopyInput
): string {
  if (shouldUseApplicationPreferredScheduleParagraphDescription(input)) {
    return resolveApplicationPreferredScheduleParagraphDescription(input)
  }
  if (shouldUseApplicationFixedScheduleParagraphDescription(input)) {
    return resolveApplicationFixedScheduleParagraphDescription(input)
  }
  return ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readPositiveInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value)
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed)
  }
  return undefined
}

/** form-bindings `runtimeContext` — 모집 상한·일일 차시 */
export function readApplicationScheduleRecruitmentLimitsFromRuntime(runtime: unknown): {
  maxScheduleCount?: number
  maxSessionsPerDay?: number
} {
  if (!isRecord(runtime)) return {}
  const fromRoot = {
    maxScheduleCount: readPositiveInt(runtime.maxScheduleCount),
    maxSessionsPerDay: readPositiveInt(runtime.maxSessionsPerDay),
  }
  const info = runtime.participantRecruitmentInfo
  if (!isRecord(info)) return fromRoot
  return {
    maxScheduleCount:
      fromRoot.maxScheduleCount ?? readPositiveInt(info.maxScheduleCount),
    maxSessionsPerDay:
      fromRoot.maxSessionsPerDay ?? readPositiveInt(info.maxSessionsPerDay),
  }
}
