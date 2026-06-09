import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'

function padTimePart(part: string): string {
  const trimmed = part.trim()
  const [h, m = '00'] = trimmed.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

/** 스크린샷 형식: YYYY. MM. DD(요일) HH:mm ~ HH:mm | N차시 */
export function formatParticipatingSchoolSessionLine(s: ParticipatingSchoolSession): string {
  const datePart = s.date.replace(/\./g, '. ')
  const [startRaw, endRaw] = s.timeRange.split('~')
  const timePart = `${padTimePart(startRaw)} ~ ${padTimePart(endRaw ?? startRaw)}`
  return `${datePart}(${s.dayOfWeek}) ${timePart} | ${s.round}차시`
}

export function buildParticipatingSchoolSessionLines(
  sessions: ParticipatingSchoolSession[] | undefined
): string[] {
  if (!sessions?.length) return []
  return sessions.map(formatParticipatingSchoolSessionLine)
}
