import { useMemo, type ComponentProps } from 'react'
import type { Dayjs } from 'dayjs'
import { CalendarMini } from '@/shared/components/calendar'
import './paragraph-calendar-mini.css'

export interface ParagraphCalendarMiniProps
  extends ComponentProps<typeof CalendarMini> {
  /** 달력 크기. 기본값은 단락 영역에서 쓰는 large(360px). */
  size?: 'small' | 'large'
  /**
   * 클릭 가능한 날짜 집합 (예: 관리자가 지정한 면접 가능일).
   * 지정 시 이 집합에 없는 날짜는 비활성 시각화 + 클릭/선택 차단.
   * 미지정 시 모든 날짜 클릭 가능.
   *
   * `programDates`(시각 강조)와 의미 분리.
   */
  clickableDates?: Set<string>
}

/**
 * 템플릿 페이지(단락 에디터/미리보기) 전용 CalendarMini 래퍼.
 * - large: 360×372px 고정 · small: 300×332px
 * - `CalendarMini`가 월별 `countMiniCalendarWeekRows`로 주 수(4~6)를 정하고,
 *   `--calendar-mini-week-rows` → 행 높이 → 셀 크기를 자동 조정
 * - 그림자 제거 + 토큰 기반 보더/라운드
 * - `clickableDates`로 클릭 가능 날짜 제한 + 비활성 시각화
 *
 * 템플릿 단락(강사·봉사자 일정 등)에서는 `CalendarMini` 직접 사용 대신 이 래퍼를 쓴다.
 */
export function ParagraphCalendarMini({
  size = 'large',
  clickableDates,
  disabledDate: disabledDateProp,
  ...rest
}: ParagraphCalendarMiniProps) {
  const disabledDate = useMemo(() => {
    if (disabledDateProp) return disabledDateProp
    if (!clickableDates) return undefined
    return (date: Dayjs) => !clickableDates.has(date.format('YYYY-MM-DD'))
  }, [clickableDates, disabledDateProp])

  return (
    <div className={`paragraph-calendar-mini paragraph-calendar-mini--${size}`}>
      <CalendarMini {...rest} disabledDate={disabledDate} />
    </div>
  )
}
