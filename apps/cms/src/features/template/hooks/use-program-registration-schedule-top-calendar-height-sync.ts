import { useLayoutEffect, type RefObject } from 'react'

/** `program-application-form-instructor__available-schedule-top` — 우측 영역 높이를 캘린더 열과 맞출 때 사용 */
export const PROGRAM_REGISTRATION_SCHEDULE_CALENDAR_HEIGHT_VAR =
  '--program-reg-schedule-calendar-height'

export function useProgramRegistrationScheduleTopCalendarHeightSync(
  scheduleTopRef: RefObject<HTMLElement | null>,
  calendarWrapRef: RefObject<HTMLElement | null>
): void {
  useLayoutEffect(() => {
    const top = scheduleTopRef.current
    const wrap = calendarWrapRef.current
    if (top == null || wrap == null) return

    const apply = () => {
      top.style.setProperty(PROGRAM_REGISTRATION_SCHEDULE_CALENDAR_HEIGHT_VAR, `${wrap.offsetHeight}px`)
    }
    apply()

    const ro = new ResizeObserver(apply)
    ro.observe(wrap)

    return () => {
      ro.disconnect()
      top.style.removeProperty(PROGRAM_REGISTRATION_SCHEDULE_CALENDAR_HEIGHT_VAR)
    }
    // Refs are stable; 캘린더 래퍼 크기 변화는 ResizeObserver로 반영
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref identity는 의존 대상이 아님
  }, [])
}
