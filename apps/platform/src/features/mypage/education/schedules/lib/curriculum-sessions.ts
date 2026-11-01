import type { EducationCurriculumSession } from '../model/types'

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** null / omit / [] 모두 없음 — 기존 sessionLabel·content fallback */
export function hasEducationCurriculumSessions(
  sessions: readonly EducationCurriculumSession[] | null | undefined,
): sessions is readonly EducationCurriculumSession[] {
  return Array.isArray(sessions) && sessions.length > 0
}

/** sessionLabel·title 둘 다 없으면 행 숨김 */
export function visibleEducationCurriculumSessions(
  sessions: readonly EducationCurriculumSession[],
): EducationCurriculumSession[] {
  return sessions.filter(
    session =>
      optionalText(session.sessionLabel) != null || optionalText(session.title) != null,
  )
}

export function educationCurriculumSessionSummaryLabel(
  sessions: readonly EducationCurriculumSession[],
): string | undefined {
  const labels = visibleEducationCurriculumSessions(sessions)
    .map(session => optionalText(session.sessionLabel) ?? optionalText(session.title))
    .filter((label): label is string => Boolean(label))
  if (labels.length === 0) return undefined
  return labels.join(' · ')
}
