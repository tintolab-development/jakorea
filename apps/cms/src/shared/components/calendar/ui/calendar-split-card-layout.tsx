import type { ReactNode } from 'react'
import { Spin } from 'antd'

export type CalendarSplitCardLayoutProps = {
  loading?: boolean
  left: ReactNode
  right: ReactNode
  /** 풀페이지 모달 page-scroll — 우측 sticky·modal `__main` 가로 스크롤 (`calendar-split-card-layout--page-scroll`) */
  pageScroll?: boolean
}

/**
 * 7:3 카드형 캘린더 분할. 좌측은 `CalendarMain`만 자식으로 두고 `calendar-main-container`는 쓰지 않는다.
 */
export function CalendarSplitCardLayout({
  loading,
  left,
  right,
  pageScroll,
}: CalendarSplitCardLayoutProps) {
  const layoutClassName = [
    'calendar-split-card-layout',
    pageScroll && 'calendar-split-card-layout--page-scroll',
    loading && 'calendar-split-card-layout--loading',
  ]
    .filter(Boolean)
    .join(' ')

  if (loading) {
    return (
      <div className="calendar-set-scroll-host">
        <div className={layoutClassName}>
          <Spin size="large" />
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-set-scroll-host">
      <div className={layoutClassName}>
        <div className="calendar-split-card calendar-split-card--left">{left}</div>
        <div className="calendar-split-card calendar-split-card--right">{right}</div>
      </div>
    </div>
  )
}
