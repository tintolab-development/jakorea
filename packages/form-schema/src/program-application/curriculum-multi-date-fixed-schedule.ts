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
  return readPositiveInt(first.title)
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

/** 교육 진행 예정일 줄 × 회차 수 */
export function buildCurriculumMultiDateFixedScheduleChoiceItems(
  lines: readonly string[],
  educationRoundCount: number
): Array<{ id: string; label: string }> {
  const roundCount = Math.max(1, Math.floor(educationRoundCount))
  const items: Array<{ id: string; label: string }> = []
  lines.forEach((line, lineIndex) => {
    const base = line.trim()
    if (!base) return
    for (let round = 1; round <= roundCount; round += 1) {
      items.push({
        id: curriculumMultiDateFixedScheduleOptionId(lineIndex, round),
        label: `${base} | ${round}회차`,
      })
    }
  })
  return items
}

export function resolveFixedScheduleLinesToChoiceItems(
  visibility: ApplicationScheduleVisibilityInput,
  lines: readonly string[],
  meta: CurriculumMultiDateFixedScheduleMeta
): Array<{ id: string; label: string }> {
  const trimmed = expandEducationScheduleChoiceSlots(lines)
  if (shouldUseCurriculumMultiDateFixedScheduleMatrix(visibility)) {
    const roundCount = meta.educationRoundCount ?? 1
    return buildCurriculumMultiDateFixedScheduleChoiceItems(trimmed, roundCount)
  }
  return trimmed.map((label, index) => ({ id: `line:${index}`, label }))
}
