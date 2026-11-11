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
  /** 모든 회차의 진행 차시 수가 같을 때만 그 값. 회차별로 다르면 undefined */
  sessionsPerRound?: number
  /** curriculumSessions 기준 회차별 진행 차시 수가 서로 다르면 true */
  sessionsPerRoundVaries?: boolean
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

/**
 * 회차 행 title(진행 차시 수)을 모두 읽는다. 첫 회차만 보고 전체 회차 차시 수로 쓰지 않는다.
 * - 모든 회차 값이 같으면 `{ sessionsPerRound }`
 * - 읽힌 값끼리 다르면 `{ varies: true }`
 * - 일부만 읽히고 읽힌 값이 같으면 판단하지 않는다(undefined)
 */
function readSessionsPerRoundFromSessions(
  sessions: readonly CurriculumSessionMetaRow[] | undefined
): { sessionsPerRound?: number; varies: boolean } {
  if (!sessions?.length) return { varies: false }
  const labeledRounds = sessions.filter(
    session =>
      sessionHasRoundLabel(session) && !isPreEducationSessionLabel(session.sessionLabel ?? '')
  )
  const rounds =
    labeledRounds.length > 0
      ? labeledRounds
      : sessions.filter(s => !isPreEducationSessionLabel(s.sessionLabel ?? '')).slice(0, 1)
  if (rounds.length === 0) return { varies: false }
  const counts = rounds.map(round => readProgressSessionCountFromRoundTitle(round.title))
  const known = counts.filter((count): count is number => count != null)
  if (known.length === 0) return { varies: false }
  if (new Set(known).size > 1) return { varies: true }
  if (known.length !== counts.length) return { varies: false }
  return { sessionsPerRound: known[0], varies: false }
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
    // 회차별 차시 수가 다르면 meta.sessionsPerRound는 undefined — 1회차 값을 일괄 차시로 쓰지 않는다.
    return readCurriculumMultiDateFixedScheduleMeta(input).sessionsPerRound
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
  const fromSessions = readSessionsPerRoundFromSessions(input.curriculumSessions)
  // 회차별 차시 수가 다르면 넘겨받은 1회차 값(sessionsPerRound)도 전체 회차 값으로 쓰지 않는다.
  if (fromSessions.varies) {
    return { educationRoundCount, sessionsPerRound: undefined, sessionsPerRoundVaries: true }
  }
  const sessionsPerRound =
    readPositiveInt(input.sessionsPerRound) ?? fromSessions.sessionsPerRound
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

/**
 * 커리큘럼·단일·날짜 고정 일정 — 모든 예정일 줄에 커리큘럼 총 차시 수(마지막 차시)를 같게 붙인다.
 * 라벨 `일시 | N차시` (N = 커리큘럼 차시 개수, 예정일 줄 수·입력 순서와 무관).
 * 차시가 1개면 일시만. lineIndex를 모르면 educationScheduleLines에서 같은 줄을 찾고, 없으면 일시만.
 */
export function appendCurriculumSingleDateFixedScheduleSessionSuffix(
  baseLabel: string,
  visibility: ApplicationScheduleVisibilityInput,
  metaInput: CurriculumMultiDateFixedScheduleMetaInput,
  lineIndex?: number
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
  if (sessions == null || sessions <= 1) return trimmed
  const index =
    lineIndex != null && Number.isInteger(lineIndex) && lineIndex >= 0
      ? lineIndex
      : expandEducationScheduleChoiceSlots(visibility.educationScheduleLines).indexOf(trimmed)
  if (index < 0) return trimmed
  return `${trimmed} | ${sessions}차시`
}

const FIXED_SCHEDULE_ROUND_SUFFIX_RE = /\|\s*\d+\s*회차(?:\s*\(\s*\d+\s*차시\s*\))?\s*$/

/**
 * 커리큘럼·복수·날짜 고정 일정 — 그 일정의 실제 회차(program_schedule.session_no)를 알 때만 `일시 | N회차`.
 * 예정일 줄 입력 순서로 회차 번호를 만들지 않는다. 회차를 모르면 일시만 둔다.
 */
export function appendCurriculumMultiDateFixedScheduleRoundSuffix(
  baseLabel: string,
  visibility: ApplicationScheduleVisibilityInput,
  sessionNo?: number | null
): string {
  const trimmed = baseLabel.trim()
  if (!trimmed) return baseLabel
  if (!shouldUseCurriculumMultiDateFixedScheduleMatrix(visibility)) return trimmed
  if (sessionNo == null || !Number.isInteger(sessionNo) || sessionNo < 1) return trimmed
  if (FIXED_SCHEDULE_ROUND_SUFFIX_RE.test(trimmed)) return trimmed
  return `${trimmed} | ${sessionNo}회차`
}

export function resolveFixedScheduleLinesToChoiceItems(
  visibility: ApplicationScheduleVisibilityInput,
  lines: readonly string[],
  metaInput: CurriculumMultiDateFixedScheduleMetaInput = {}
): Array<{ id: string; label: string }> {
  const trimmed = expandEducationScheduleChoiceSlots(lines)
  return trimmed.map((label, index) => ({
    id: `line:${index}`,
    // 예정일 줄(문자열)에는 실제 회차(sessionNo)가 없으므로 회차 번호를 붙이지 않는다.
    label: appendCurriculumMultiDateFixedScheduleRoundSuffix(
      appendCurriculumSingleDateFixedScheduleSessionSuffix(label, visibility, metaInput, index),
      visibility
    ),
  }))
}
