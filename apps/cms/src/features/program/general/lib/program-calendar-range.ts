import type { Dayjs } from 'dayjs'
import type { ProgramListView } from '@/features/program/general/ui/table/program-table-column-resolver'

export type ProgramCalendarVisibleRange = {
  startDate: string
  endDate: string
}

/** 일요일 시작 그리드 — CalendarMini / antd month 셀과 동일 */
function sundayGridStart(date: Dayjs): Dayjs {
  return date.startOf('day').subtract(date.day(), 'day')
}

/** 월간은 그리드가 보여주는 앞뒤 날짜까지, 주간은 해당 주(일~토) */
export function resolveProgramCalendarVisibleRange(
  mode: 'month' | 'week',
  viewAnchor: Dayjs
): ProgramCalendarVisibleRange {
  if (mode === 'week') {
    const start = sundayGridStart(viewAnchor)
    return {
      startDate: start.format('YYYY-MM-DD'),
      endDate: start.add(6, 'day').format('YYYY-MM-DD'),
    }
  }
  const monthStart = viewAnchor.startOf('month')
  const monthEnd = viewAnchor.endOf('month').startOf('day')
  const gridStart = sundayGridStart(monthStart)
  const lastWeekStart = sundayGridStart(monthEnd)
  return {
    startDate: gridStart.format('YYYY-MM-DD'),
    endDate: lastWeekStart.add(6, 'day').format('YYYY-MM-DD'),
  }
}

export function mapProgramListViewToCalendarProgramStatus(
  view: ProgramListView | undefined
): string {
  if (view === 'SCHEDULED') return 'UPCOMING'
  if (view === 'IN_PROGRESS') return 'IN_PROGRESS'
  if (view === 'COMPLETED') return 'COMPLETED'
  return 'ALL'
}
