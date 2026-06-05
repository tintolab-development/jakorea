import dayjs, { type Dayjs } from 'dayjs'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

/** 교육 진행 예정일 한 줄 표기 (예: `26년 4월 20일(월) 9:30 ~ 12:20`) */
export function formatEducationScheduleLineFromRange([start, end]: [Dayjs, Dayjs]): string {
  const formatDatePart = (d: Dayjs) => {
    const yy = d.year() % 100
    return `${yy}년 ${d.month() + 1}월 ${d.date()}일(${WEEKDAY_KO[d.day()]})`
  }

  const startPart = formatDatePart(start)
  if (start.isSame(end, 'day')) {
    const hasTime =
      !(start.hour() === 0 && start.minute() === 0 && end.hour() === 0 && end.minute() === 0)
    if (hasTime) {
      return `${startPart} ${start.format('H:mm')} ~ ${end.format('H:mm')}`
    }
    return startPart
  }

  const endPart = formatDatePart(end)
  const startHasTime = start.hour() !== 0 || start.minute() !== 0
  const endHasTime = end.hour() !== 0 || end.minute() !== 0
  if (startHasTime || endHasTime) {
    return `${startPart} ${start.format('H:mm')} ~ ${endPart} ${end.format('H:mm')}`
  }
  return `${startPart} ~ ${endPart}`
}

const SCHEDULE_DATE_PART_RE = /^(\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일/

function parseScheduleDatePartToken(part: string): Dayjs | null {
  const withoutWeekday = part.replace(/\([^)]*\)/g, '').trim()
  const dateOnly = withoutWeekday.replace(/\s+\d{1,2}:\d{2}.*$/, '').trim()
  const match = dateOnly.match(SCHEDULE_DATE_PART_RE)
  if (!match) return null
  const yy = Number(match[1])
  const year = 2000 + yy
  const parsed = dayjs(`${year}-${match[2]}-${match[3]}`)
  return parsed.isValid() ? parsed : null
}

/** `26년 4월 20일(월) ~ 26년 4월 27일(월)` 등 → Dayjs 구간 (제출 기한 피커 표시용) */
export function parseEducationScheduleLineToRange(line: string | undefined): [Dayjs, Dayjs] | null {
  const trimmed = line?.trim()
  if (!trimmed) return null

  const segments = trimmed.split(/\s*~\s*/)
  const start = parseScheduleDatePartToken(segments[0] ?? '')
  if (!start) return null

  if (segments.length < 2) return [start, start]

  const end = parseScheduleDatePartToken(segments[segments.length - 1] ?? '')
  if (!end) return [start, start]

  return [start, end]
}
