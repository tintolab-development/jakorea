import type { FormResponseAnswerResponse } from '@/shared/api/generated/forms-surveys/schemas/formResponseAnswerResponse'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'

const INSTITUTION_SCHEDULE_ANSWER_KEYS = [
  'program-application-institution-seed-schedule',
  'scheduleChoice',
  'program-application-economy-seed-schedule',
] as const

const OPAQUE_SCHEDULE_TOKEN_RE =
  /^(schedule:\d+(?::organization-application:\d+)?(?::education-period:\d+)?|line:\d+(?::education-round:\d+)?)$/i

function isJsonContainer(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false
  try {
    const parsed: unknown = JSON.parse(trimmed)
    return parsed != null && typeof parsed === 'object'
  } catch {
    return false
  }
}

function isOpaqueScheduleToken(value: string): boolean {
  return OPAQUE_SCHEDULE_TOKEN_RE.test(value.trim())
}

function sessionFromDisplayLabel(label: string, round: number): ParticipatingSchoolSession {
  const text = label.trim()
  return {
    round,
    date: text,
    dayOfWeek: '',
    duration: '',
    format: '',
    classNum: '',
    timeRange: '',
    scheduleLabel: text,
  }
}

function sessionsFromMultilineText(text: string): ParticipatingSchoolSession[] | undefined {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !isOpaqueScheduleToken(line))
  if (lines.length === 0) return undefined
  return lines.map((line, index) => sessionFromDisplayLabel(line, index + 1))
}

function sessionsFromPreferredScheduleBlocks(
  blocks: unknown[]
): ParticipatingSchoolSession[] | undefined {
  const sessions: ParticipatingSchoolSession[] = []
  let rank = 1
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    const row = block as Record<string, unknown>
    const date = String(row.date ?? row.dateText ?? '').trim()
    const sessionTimes = Array.isArray(row.sessionTimes)
      ? row.sessionTimes
      : Array.isArray(row.times)
        ? row.times
        : []
    const first =
      sessionTimes[0] && typeof sessionTimes[0] === 'object'
        ? (sessionTimes[0] as Record<string, unknown>)
        : null
    const start = String(first?.startTime ?? first?.start ?? '').trim()
    const end = String(first?.endTime ?? first?.end ?? '').trim()
    if (date) {
      sessions.push({
        round: rank++,
        date,
        dayOfWeek: '',
        duration: '',
        format: '',
        classNum: '',
        timeRange: start && end ? `${start} ~ ${end}` : start,
      })
      continue
    }
    const label = String(row.label ?? row.displayLabel ?? row.summary ?? '').trim()
    if (label && !isOpaqueScheduleToken(label)) {
      sessions.push(sessionFromDisplayLabel(label, rank++))
    }
  }
  return sessions.length > 0 ? sessions : undefined
}

function sessionsFromParsedAnswerJson(parsed: unknown): ParticipatingSchoolSession[] | undefined {
  if (Array.isArray(parsed)) {
    if (parsed.every(item => typeof item === 'string')) {
      const labels = parsed
        .map(item => String(item).trim())
        .filter(item => item.length > 0 && !isOpaqueScheduleToken(item))
      if (labels.length > 0) {
        return labels.map((label, index) => sessionFromDisplayLabel(label, index + 1))
      }
      return undefined
    }
    return sessionsFromPreferredScheduleBlocks(parsed)
  }
  if (parsed && typeof parsed === 'object') {
    const row = parsed as Record<string, unknown>
    if (Array.isArray(row.selectedLabels)) {
      const labels = row.selectedLabels
        .map(item => String(item).trim())
        .filter(item => item.length > 0 && !isOpaqueScheduleToken(item))
      if (labels.length > 0) {
        return labels.map((label, index) => sessionFromDisplayLabel(label, index + 1))
      }
    }
    const summary = String(row.summary ?? row.label ?? '').trim()
    if (summary && !isOpaqueScheduleToken(summary)) {
      return sessionsFromMultilineText(summary)
    }
  }
  return undefined
}

function sessionsFromAnswerValue(raw: string | undefined): ParticipatingSchoolSession[] | undefined {
  const text = raw?.trim()
  if (!text) return undefined
  if (isJsonContainer(text)) {
    try {
      const parsed: unknown = JSON.parse(text)
      const fromJson = sessionsFromParsedAnswerJson(parsed)
      if (fromJson?.length) return fromJson
    } catch {
      /* fall through */
    }
  }
  if (!isOpaqueScheduleToken(text) && !text.startsWith('[')) {
    return sessionsFromMultilineText(text)
  }
  return undefined
}

/**
 * form_response — 기관 「진행 희망 교육 일정」 답에서 표시용 sessions 생성.
 * opaque `schedule:*` 토큰만 있을 때는 answerDisplayText(사람이 읽는 문구)를 우선한다.
 */
export function pickInstitutionScheduleSessionsFromFormAnswers(
  answers: FormResponseAnswerResponse[] | undefined,
  answerMap?: Record<string, string>
): ParticipatingSchoolSession[] | undefined {
  for (const key of INSTITUTION_SCHEDULE_ANSWER_KEYS) {
    const answer = answers?.find(entry => entry.questionKeySnapshot?.trim() === key)
    const display = answer?.answerDisplayText?.trim()
    if (display) {
      const fromDisplay = sessionsFromAnswerValue(display)
      if (fromDisplay?.length) return fromDisplay
    }
    const fromMap = sessionsFromAnswerValue(answerMap?.[key])
    if (fromMap?.length) return fromMap
    const valueJson = answer?.answerValueJson?.trim()
    if (valueJson) {
      const fromJson = sessionsFromAnswerValue(valueJson)
      if (fromJson?.length) return fromJson
    }
  }
  return undefined
}
