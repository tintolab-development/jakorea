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
 * - 폭 360px 고정
 * - 그림자 제거 + 토큰 기반 보더/라운드
 * - schedule(이벤트) 셀, 선택 셀 스펙 갱신
 * - `clickableDates`로 클릭 가능 날짜 제한 + 비활성 시각화
 *
 * 추후 템플릿 페이지의 모든 `CalendarMini` 사용처는 이 컴포넌트로 대체 예정.
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
