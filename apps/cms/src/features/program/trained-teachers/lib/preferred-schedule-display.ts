import type { ApplicantPreferredScheduleBlock } from '@/features/program/shared/model/applicant-institution'

/**
 * TT 기관 신청 「진행 희망 교육 일정」 한 줄.
 * SSOT: preferredScheduleBlocks date + dayOfWeek + sessionTimes[].timeRange.
 * classPeriod 가 있을 때만 끼운다. 시각·교시를 프로그램 일정에서 추정하지 않는다.
 */
export function formatTrainedTeacherPreferredScheduleLines(
  block: Pick<ApplicantPreferredScheduleBlock, 'date' | 'dayOfWeek' | 'sessionTimes'>
): string[] {
  const date = block.date.trim()
  const weekday = block.dayOfWeek.trim()
  const datePart = weekday ? `${date} (${weekday})` : date
  const sessions = Array.isArray(block.sessionTimes) ? block.sessionTimes : []
  if (sessions.length === 0) return datePart ? [datePart] : []

  const lines = sessions.map(session => {
    const period = session.classPeriod?.trim()
    const time = session.timeRange?.trim()
    const parts = [datePart]
    if (period) parts.push(period)
    if (time) parts.push(time)
    return parts.join(' ')
  })
  return lines.filter(line => line.length > 0)
}

export function trainedTeacherPreferredScheduleLineKey(
  block: Pick<ApplicantPreferredScheduleBlock, 'preferenceRank' | 'date' | 'scheduleId' | 'sessionTimes'>,
  sessionIndex: number
): string {
  const scheduleKey =
    typeof block.scheduleId === 'number' && Number.isFinite(block.scheduleId)
      ? String(block.scheduleId)
      : 'none'
  const sessionOrder = block.sessionTimes[sessionIndex]?.sessionIndex ?? sessionIndex + 1
  return `${block.preferenceRank}-${block.date}-${scheduleKey}-${sessionOrder}`
}
