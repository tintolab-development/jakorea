import {
  expandEducationScheduleChoiceSlots,
  shouldShowApplicationPreferredScheduleParagraph,
  shouldShowApplicationScheduleParagraph,
  type ApplicationScheduleVisibilityInput,
} from './schedule-paragraph-visibility.js'

export type CurriculumSessionMetaRow = {
  sessionLabel?: string
  title?: string
}

export type CurriculumMultiDateFixedScheduleMetaInput = {
  curriculumSessions?: readonly CurriculumSessionMetaRow[]
  educationRoundCount?: number
  sessionsPerRound?: number
  /** 단일 회차 — 교육 진행(커리큘럼) 단락 차시 개수 */
  curriculumChartSessionCount?: number
}

export type CurriculumMultiDateFixedScheduleMeta = {
  educationRoundCount?: number
  sessionsPerRound?: number
}

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

function isPreEducationSessionLabel(label: string): boolean {
  const trimmed = label.trim()
  return trimmed.includes('사전') || trimmed.includes('연수')
}

function sessionHasRoundLabel(session: CurriculumSessionMetaRow): boolean {
  return /회차/.test(session.sessionLabel ?? '')
}

function countEducationRoundsFromSessions(
  sessions: readonly CurriculumSessionMetaRow[] | undefined
): number | undefined {
  if (!sessions?.length) return undefined
  const rounds = sessions.filter(
    session =>
      sessionHasRoundLabel(session) && !isPreEducationSessionLabel(session.sessionLabel ?? '')
  )
  if (rounds.length > 0) return rounds.length
  const regular = sessions.filter(
    session => !isPreEducationSessionLabel(session.sessionLabel ?? '')
  )
  return regular.length > 0 ? regular.length : undefined
}

/** 복수 회차 행 `title` — CMS overlay `progress`는 숫자 또는 「N차시」로 노출된다. */
function readProgressSessionCountFromRoundTitle(title: string | undefined): number | undefined {
  const trimmed = title?.trim() ?? ''
  if (!trimmed) return undefined
  const asInt = readPositiveInt(trimmed)
  if (asInt != null) return asInt
  const 차시Match = trimmed.match(/^(\d+)\s*차시\s*$/)
  if (차시Match) return readPositiveInt(차시Match[1])
  return undefined
}

function readSessionsPerRoundFromSessions(
  sessions: readonly CurriculumSessionMetaRow[] | undefined
): number | undefined {
  if (!sessions?.length) return undefined
  const rounds = sessions.filter(
    session =>
      sessionHasRoundLabel(session) && !isPreEducationSessionLabel(session.sessionLabel ?? '')
  )
  const first = rounds[0] ?? sessions.find(s => !isPreEducationSessionLabel(s.sessionLabel ?? ''))
  if (!first) return undefined
  return readProgressSessionCountFromRoundTitle(first.title)
}

/** 기관 커리큘럼 + 복수 회차 + 날짜 지정 — 일정×회차 체크박스 matrix */
export function shouldUseCurriculumMultiDateFixedScheduleMatrix(
  input: ApplicationScheduleVisibilityInput
): boolean {
  if (input.educationStructure !== 'curriculum') return false
  if (input.sessionRound !== 'multi') return false
  if (input.educationScheduleMode === 'period') return false
  if (!shouldShowApplicationScheduleParagraph(input)) return false
  if (shouldShowApplicationPreferredScheduleParagraph(input)) return false
  return true
}

function countRegularCurriculumChartSessions(
  sessions: readonly CurriculumSessionMetaRow[] | undefined
): number | undefined {
  if (!sessions?.length) return undefined
  const regular = sessions.filter(
    session => !isPreEducationSessionLabel(session.sessionLabel ?? '')
  )
  return regular.length > 0 ? regular.length : undefined
}

/**
 * 기간 지정 지망 설명의 「1일, N차시」 — multi는 1회차 진행 차시, single은 커리큘럼 차시 개수.
 */
export function readCurriculumPreferredScheduleDailySessionCountForCopy(input: {
  sessionRound?: 'single' | 'multi'
  curriculumChartSessionCount?: number
  curriculumSessions?: readonly CurriculumSessionMetaRow[]
  sessionsPerRound?: number
  educationRoundCount?: number
}): number | undefined {
  if (input.sessionRound === 'multi') {
    const meta = readCurriculumMultiDateFixedScheduleMeta(input)
    return readPositiveInt(input.sessionsPerRound) ?? meta.sessionsPerRound
  }
  return (
    readPositiveInt(input.curriculumChartSessionCount) ??
    countRegularCurriculumChartSessions(input.curriculumSessions)
  )
}

export function readCurriculumMultiDateFixedScheduleMeta(
  input: CurriculumMultiDateFixedScheduleMetaInput
): CurriculumMultiDateFixedScheduleMeta {
  const educationRoundCount =
    readPositiveInt(input.educationRoundCount) ??
    countEducationRoundsFromSessions(input.curriculumSessions)
  const sessionsPerRound =
    readPositiveInt(input.sessionsPerRound) ??
    readSessionsPerRoundFromSessions(input.curriculumSessions)
  return { educationRoundCount, sessionsPerRound }
}

export function curriculumMultiDateFixedScheduleOptionId(
  lineIndex: number,
  roundIndex: number
): string {
  return `line:${lineIndex}:education-round:${roundIndex}`
}

/**
 * @deprecated 회차별 matrix 선택지는 더 이상 생성하지 않는다.
 * 기존 import 호환을 위해 유지하되, 교육 진행 예정일 줄 1개당 선택지 1개만 반환한다.
 */
export function buildCurriculumMultiDateFixedScheduleChoiceItems(
  lines: readonly string[],
  _educationRoundCount: number
): Array<{ id: string; label: string }> {
  return lines
    .map(line => line.trim())
    .filter(Boolean)
    .map((label, index) => ({
      id: `line:${index}`,
      label,
    }))
}

const FIXED_SCHEDULE_SESSION_SUFFIX_RE = /\|\s*\d+\s*차시\s*$/

function hasFixedScheduleLineSessionSuffix(label: string): boolean {
  return FIXED_SCHEDULE_SESSION_SUFFIX_RE.test(label.trim())
}

/** 커리큘럼·단일·날짜 고정 일정 — 예정일 라벨 우측 `| N차시` (교육 진행 커리큘럼 차시 수) */
export function appendCurriculumSingleDateFixedScheduleSessionSuffix(
  baseLabel: string,
  visibility: ApplicationScheduleVisibilityInput,
  metaInput: CurriculumMultiDateFixedScheduleMetaInput
): string {
  const trimmed = baseLabel.trim()
  if (!trimmed) return baseLabel
  if (visibility.educationStructure !== 'curriculum') return trimmed
  if (visibility.sessionRound !== 'single') return trimmed
  if (visibility.educationScheduleMode === 'period') return trimmed
  if (shouldUseCurriculumMultiDateFixedScheduleMatrix(visibility)) return trimmed
  if (hasFixedScheduleLineSessionSuffix(trimmed)) return trimmed

  const sessions = readCurriculumPreferredScheduleDailySessionCountForCopy({
    sessionRound: 'single',
    curriculumChartSessionCount: metaInput.curriculumChartSessionCount,
    curriculumSessions: metaInput.curriculumSessions,
    sessionsPerRound: metaInput.sessionsPerRound,
    educationRoundCount: metaInput.educationRoundCount,
  })
  if (sessions == null || sessions <= 0) return trimmed
  return `${trimmed} | ${sessions}차시`
}

export function resolveFixedScheduleLinesToChoiceItems(
  visibility: ApplicationScheduleVisibilityInput,
  lines: readonly string[],
  metaInput: CurriculumMultiDateFixedScheduleMetaInput = {}
): Array<{ id: string; label: string }> {
  const trimmed = expandEducationScheduleChoiceSlots(lines)
  return trimmed.map((label, index) => ({
    id: `line:${index}`,
    label: appendCurriculumSingleDateFixedScheduleSessionSuffix(label, visibility, metaInput),
  }))
}
