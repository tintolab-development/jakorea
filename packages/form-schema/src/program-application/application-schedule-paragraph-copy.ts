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

/** 단일 회차 + 날짜 지정(커리큘럼·일정형) — 복수 선택, 승인 시 선택한 일정 중 1타임 배정 */
const FIXED_SCHEDULE_DESCRIPTION_SINGLE_ROUND =
  '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'

const FIXED_SCHEDULE_DESCRIPTION_MULTI_ROUND_SELECT_ALL =
  '진행 가능한 일정을 모두 선택해 주세요.'

const FIXED_SCHEDULE_DESCRIPTION_MULTI_ROUND =
  'N차시*N회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.'

export type ApplicationScheduleUnknownCountMode = 'placeholder' | 'omit'

export type ApplicationScheduleParagraphCopyInput = ApplicationScheduleVisibilityInput &
  CurriculumMultiDateFixedScheduleMetaInput & {
    maxScheduleCount?: number
    maxSessionsPerDay?: number
    /**
     * 차시·회차 수를 못 구할 때.
     * `placeholder` = 문자 'N' (템플릿 작성 기본). `omit` = 앞 문장 생략.
     */
    unknownCount?: ApplicationScheduleUnknownCountMode
  }

function countOrN(value: number | undefined): string {
  return value != null && value > 0 ? String(value) : 'N'
}

function resolveUnknownCountMode(
  input: ApplicationScheduleParagraphCopyInput
): ApplicationScheduleUnknownCountMode {
  return input.unknownCount === 'omit' ? 'omit' : 'placeholder'
}

function resolveMultiRoundFixedScheduleDescription(
  input: ApplicationScheduleParagraphCopyInput
): string {
  const unknownCount = resolveUnknownCountMode(input)
  const useMatrix = shouldUseCurriculumMultiDateFixedScheduleMatrix(input)
  const meta = useMatrix
    ? readCurriculumMultiDateFixedScheduleMeta(input)
    : { sessionsPerRound: undefined, educationRoundCount: undefined }
  if (unknownCount === 'omit') {
    const sessionsValue = meta.sessionsPerRound
    const roundsValue = meta.educationRoundCount
    if (
      sessionsValue == null ||
      sessionsValue <= 0 ||
      roundsValue == null ||
      roundsValue <= 0
    ) {
      return FIXED_SCHEDULE_DESCRIPTION_MULTI_ROUND_SELECT_ALL
    }
    return FIXED_SCHEDULE_DESCRIPTION_MULTI_ROUND.replace(
      'N차시',
      `${sessionsValue}차시`
    ).replace('N회', `${roundsValue}회`)
  }
  if (!useMatrix) {
    return FIXED_SCHEDULE_DESCRIPTION_MULTI_ROUND
  }
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
  // ④ 커리큘럼·복수·기간 — N은 모집 희망 차시 상한(maxSessionsPerDay). 회차당 차시(sessionsPerRound) 아님.
  const sessions = countOrN(
    input.sessionRound === 'multi'
      ? input.maxSessionsPerDay
      : readCurriculumPreferredScheduleDailySessionCountForCopy(input)
  )
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

/** 템플릿 시드 작성 안내 — 프로그램 매핑 후 사용자 화면에는 기본 안내로 대체한다. */
const SCHEDULE_PARAGRAPH_PLACEHOLDER_DESCRIPTIONS = new Set([
  '설명 입력',
  '설명을 입력해 주세요',
  '프로그램 등록 시 노출되는 항목에 따라 설명글을 작성해 주세요.',
])

const COUNT = String.raw`(?:\d+|N)`

/** 자동 생성 기본 안내(현행·과거 문구). 저장돼 있어도 프로그램 설정 기준으로 다시 계산한다. */
const SCHEDULE_PARAGRAPH_GENERATED_DESCRIPTION_PATTERNS: readonly RegExp[] = [
  new RegExp(
    `^진행할 일정을 1개 선택해 주세요\\.(?: 수업은 1일, ${COUNT}차시 운영됩니다\\.| 모두 동일한 커리큘럼이며, 선택한 일정에 배정됩니다\\.)?$`
  ),
  new RegExp(
    `^진행 가능한 일정을 모두 선택해 주세요\\.(?: 수업은 1일, ${COUNT}차시 운영됩니다\\.| 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다\\.)?$`
  ),
  new RegExp(
    `^${COUNT}차시\\*${COUNT}회로 구성된 프로그램입니다\\. 진행 가능한 일정을 모두 선택해 주세요\\.$`
  ),
  new RegExp(
    `^교육을 희망하는 (?:날짜를|날짜와 수업 시간을) 모두 작성해 주세요\\.(?: 수업은 1일, ${COUNT}차시 운영됩니다\\.)? \\(최대 ${COUNT}개까지 희망 일정 신청이 가능합니다\\.\\)$`
  ),
]

/**
 * 진행 희망 교육 일정 단락 설명이 기본값(빈 값·시드 안내·자동 생성 안내)인지.
 * 기본값이 아니면 프로그램 등록 시 관리자가 수정한 문구로 보고 유지한다.
 */
export function isApplicationScheduleDefaultParagraphDescription(
  value: string | null | undefined
): boolean {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return true
  if (SCHEDULE_PARAGRAPH_PLACEHOLDER_DESCRIPTIONS.has(trimmed)) return true
  return SCHEDULE_PARAGRAPH_GENERATED_DESCRIPTION_PATTERNS.some(pattern => pattern.test(trimmed))
}

/** 관리자 수정 문구는 유지하고, 기본값이면 프로그램 설정 기준 기본 안내로 채운다. */
export function resolveApplicationScheduleParagraphDescriptionKeepingCustom(
  current: string | null | undefined,
  defaultDescription: string
): string {
  if (!isApplicationScheduleDefaultParagraphDescription(current)) return current!.trim()
  return defaultDescription
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
  maxClassCount?: number
  maxScheduleCount?: number
  maxSessionsPerDay?: number
} {
  if (!isRecord(runtime)) return {}
  const fromRoot = {
    maxClassCount: readPositiveInt(runtime.maxClassCount),
    maxScheduleCount: readPositiveInt(runtime.maxScheduleCount),
    maxSessionsPerDay: readPositiveInt(runtime.maxSessionsPerDay),
  }
  const info = runtime.participantRecruitmentInfo
  if (!isRecord(info)) return fromRoot
  return {
    maxClassCount: fromRoot.maxClassCount ?? readPositiveInt(info.maxClassCount),
    maxScheduleCount:
      fromRoot.maxScheduleCount ?? readPositiveInt(info.maxScheduleCount),
    maxSessionsPerDay:
      fromRoot.maxSessionsPerDay ?? readPositiveInt(info.maxSessionsPerDay),
  }
}
