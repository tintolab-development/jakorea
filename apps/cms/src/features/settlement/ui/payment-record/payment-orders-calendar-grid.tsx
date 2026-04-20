/**
 * 지급조서 캘린더 그리드 — 프로그램별·강사별 동일 크롬(상단 헤더 + 월간 라벨)
 * `ProgramCalendar` 공통 컴포넌트를 감싸 헤더·기간 필터 연동 UX를 한곳에서 맞춘다.
 */

import {
  ProgramCalendar,
  type ProgramCalendarEventsProps,
} from '@/shared/components/program-calendar'

export type PaymentOrdersCalendarGridProps = Omit<
  ProgramCalendarEventsProps,
  'hideHeaderTitle' | 'hideDateControls' | 'hideModeToggle' | 'monthOnlyLabel'
>

export function PaymentOrdersCalendarGrid(props: PaymentOrdersCalendarGridProps) {
  return (
    <ProgramCalendar
      {...props}
      hideHeaderTitle={false}
      hideDateControls={false}
      hideModeToggle
      monthOnlyLabel
    />
  )
}
