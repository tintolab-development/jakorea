import type { MypageScheduleEvent } from '../model/schedule-types'

/** 스크린샷 확인용 — 2026-01 기준 mock */
export const MOCK_MYPAGE_SCHEDULE_EVENTS: MypageScheduleEvent[] = [
  {
    id: 'evt-01',
    programName: '프로그램명 1',
    title: '영수증 신청 마감일',
    time: '종일',
    type: 'receipt',
    startDate: '2026-01-03',
    endDate: '2026-01-03',
  },
  {
    id: 'evt-02',
    programName: '프로그램명 1',
    title: '2회차',
    time: '09:00~15:00',
    type: 'program',
    startDate: '2026-01-03',
    endDate: '2026-01-03',
  },
  {
    id: 'evt-03',
    programName: '프로그램명 2',
    title: '만족도조사 마감',
    time: '종일',
    type: 'satisfaction',
    startDate: '2026-01-03',
    endDate: '2026-01-03',
  },
  {
    id: 'evt-04',
    programName: '프로그램명',
    title: '시작일',
    time: '종일',
    type: 'program',
    startDate: '2026-01-05',
    endDate: '2026-01-05',
  },
  {
    id: 'evt-05',
    programName: '프로그램명',
    title: '종료일',
    time: '종일',
    type: 'program',
    startDate: '2026-01-07',
    endDate: '2026-01-07',
  },
  {
    id: 'evt-06',
    programName: '프로그램명',
    title: '만족도조사',
    time: '종일',
    type: 'satisfaction',
    startDate: '2026-01-07',
    endDate: '2026-01-07',
  },
  {
    id: 'evt-07',
    programName: '프로그램명',
    title: '과제 제출기간',
    time: '종일',
    type: 'assignment',
    startDate: '2026-01-11',
    endDate: '2026-01-17',
  },
  {
    id: 'evt-08',
    programName: '프로그램명',
    title: '설문조사 기간',
    time: '종일',
    type: 'survey',
    startDate: '2026-01-12',
    endDate: '2026-01-17',
  },
  {
    id: 'evt-09',
    programName: '프로그램명',
    title: '교육 일정',
    time: '종일',
    type: 'education',
    startDate: '2026-01-11',
    endDate: '2026-01-11',
  },
  {
    id: 'evt-10',
    programName: '프로그램명 1',
    title: '시작일',
    time: '종일',
    type: 'program',
    startDate: '2026-01-22',
    endDate: '2026-01-22',
  },
  {
    id: 'evt-11',
    programName: '프로그램명',
    title: '영수증 신청 마감',
    time: '종일',
    type: 'receipt',
    startDate: '2026-01-26',
    endDate: '2026-01-26',
  },
  {
    id: 'evt-12',
    programName: '프로그램명',
    title: '종료일',
    time: '종일',
    type: 'program',
    startDate: '2026-01-26',
    endDate: '2026-01-26',
  },
  {
    id: 'evt-13',
    programName: '프로그램명',
    title: '교육 일정',
    time: '종일',
    type: 'education',
    startDate: '2026-01-26',
    endDate: '2026-01-26',
  },
]

export function formatMypageScheduleBarLabel(event: MypageScheduleEvent): string {
  return `${event.programName} ${event.title}`
}

export function getMypageScheduleEventsOnDate(
  events: MypageScheduleEvent[],
  date: Date,
): MypageScheduleEvent[] {
  const key = toDateKey(date)
  return events.filter(event => event.startDate <= key && key <= event.endDate)
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** 해당 월에 일정이 있는 날짜(오름차순, 중복 제거) */
export function getMypageScheduleDatesInMonth(
  events: MypageScheduleEvent[],
  month: Date,
): Date[] {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const monthStart = new Date(year, monthIndex, 1)
  const monthEnd = new Date(year, monthIndex + 1, 0)
  const startKey = toDateKey(monthStart)
  const endKey = toDateKey(monthEnd)
  const dateKeys = new Set<string>()

  for (const event of events) {
    if (event.endDate < startKey || event.startDate > endKey) continue

    const rangeStart = event.startDate < startKey ? monthStart : parseDateKey(event.startDate)
    const rangeEnd = event.endDate > endKey ? monthEnd : parseDateKey(event.endDate)

    for (
      let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
      cursor.getTime() <= rangeEnd.getTime();
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    ) {
      dateKeys.add(toDateKey(cursor))
    }
  }

  return [...dateKeys].sort().map(parseDateKey)
}

/**
 * 보이는 월과 선택일을 맞춘다.
 * - 이미 같은 달이면 유지
 * - 아니면 그 달 일정 있는 첫날, 없으면 기존 일자(말일 clamp)
 */
export function syncSelectedDateToMonth(
  month: Date,
  selectedDate: Date,
  events: MypageScheduleEvent[],
): Date {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()

  if (selectedDate.getFullYear() === year && selectedDate.getMonth() === monthIndex) {
    return new Date(year, monthIndex, selectedDate.getDate())
  }

  const datesInMonth = getMypageScheduleDatesInMonth(events, month)
  if (datesInMonth.length > 0) {
    return datesInMonth[0]
  }

  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const day = Math.min(selectedDate.getDate(), lastDay)
  return new Date(year, monthIndex, day)
}
