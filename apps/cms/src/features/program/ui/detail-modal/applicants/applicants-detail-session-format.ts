export type ApplicantSessionLineInput = {
  date: string
  dayOfWeek: string
  duration: string
  format: string
  classNum: string
  timeRange: string
}

/** 날짜·시간·교시 구간 텍스트 (participating-institutions-section과 동일) */
export function getSessionLineParts(s: ApplicantSessionLineInput) {
  const datePart = `${s.date.replace(/\./g, '. ')}(${s.dayOfWeek})`
  const durationPart = `${s.duration} (${s.format})`
  const periodPart = `${s.classNum} (${s.timeRange.replace('~', ' ~ ')})`
  return { datePart, durationPart, periodPart }
}
