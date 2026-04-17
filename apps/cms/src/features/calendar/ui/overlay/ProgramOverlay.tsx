import type { ReactElement, ReactNode } from 'react'
import { ProgramCalendarOverlayFollowCursor } from '@/shared/components/program-calendar-cursor-overlay'

interface ProgramOverlayProps {
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
  previewContent: ReactNode
  children: ReactElement
}

export function ProgramOverlay({
  scheduleOverlay,
  tooltipOverlayClassName,
  previewContent,
  children,
}: ProgramOverlayProps) {
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

