import type { ReactElement, ReactNode } from 'react'
import { ProgramCalendarOverlayFollowCursor } from '@/shared/components/program-calendar-cursor-overlay'

interface EventOverlayProps {
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
  previewContent: ReactNode
  children: ReactElement
}

export function EventOverlay({
  scheduleOverlay,
  tooltipOverlayClassName,
  previewContent,
  children,
}: EventOverlayProps) {
  return (
    <ProgramCalendarOverlayFollowCursor
      variant={scheduleOverlay}
      tooltipOverlayClassName={tooltipOverlayClassName}
      content={previewContent}
    >
      {children}
    </ProgramCalendarOverlayFollowCursor>
  )
}

