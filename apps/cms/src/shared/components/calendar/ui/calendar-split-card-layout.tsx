import type { ReactNode } from 'react'
import { Spin } from 'antd'

export type CalendarSplitCardLayoutProps = {
  loading?: boolean
  left: ReactNode
  right: ReactNode
}

/**
 * 7:3 카드형 캘린더 분할. 좌측은 `CalendarMain`만 자식으로 두고 `calendar-main-container`는 쓰지 않는다.
 */
export function CalendarSplitCardLayout({ loading, left, right }: CalendarSplitCardLayoutProps) {
  if (loading) {
    return (
      <div className="calendar-set-scroll-host">
        <div className="calendar-split-card-layout calendar-split-card-layout--loading">
          <Spin size="large" />
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-set-scroll-host">
      <div className="calendar-split-card-layout">
        <div className="calendar-split-card calendar-split-card--left">{left}</div>
        <div className="calendar-split-card calendar-split-card--right">{right}</div>
      </div>
    </div>
  )
}
