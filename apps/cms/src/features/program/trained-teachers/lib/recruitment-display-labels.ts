import dayjs from 'dayjs'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const
const DATE_RE = /(\d{4})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})/g

/**
 * 교육받은 교사 상세 모집 정보 「모집 기간」 — `YYYY.MM.DD(요일) ~ YYYY.MM.DD(요일)` (시각 제외).
 * 날짜를 읽지 못하면 원문 그대로. QA 2026-11-13 교육받은 교사 #11.
 */
export function formatTrainedTeachersRecruitmentPeriodLabel(label: string): string {
  const dates = [...label.matchAll(DATE_RE)].map(match => {
    const d = dayjs(`${match[1]}-${match[2]!.padStart(2, '0')}-${match[3]!.padStart(2, '0')}`)
    return d.isValid() ? `${d.format('YYYY.MM.DD')}(${WEEKDAYS[d.day()]})` : null
  })
  if (dates.length === 0 || dates.some(date => date == null)) return label
  if (dates.length === 1) return dates[0]!
  return `${dates[0]} ~ ${dates[dates.length - 1]}`
}

/** 교육받은 교사 「학생 명단 제출 여부」 — 「필요 / 불필요」. QA 2026-11-13 교육받은 교사 #10. */
export function formatTrainedTeachersStudentListLabel(label: string): string {
  const trimmed = label.trim()
  if (trimmed === '제출 필요') return '필요'
  if (trimmed === '제출 불필요') return '불필요'
  return label
}
