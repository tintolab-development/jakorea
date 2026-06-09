import { DividerVertical } from '@/shared/components/divider-vertical'

type CalendarListItemContentGeneralProgramEventProps = {
  programTitle: string
  scheduleContent: string
  timeLabel: string
}

export function CalendarListItemContentGeneralProgramEvent({
  programTitle,
  scheduleContent,
  timeLabel,
}: CalendarListItemContentGeneralProgramEventProps) {
  return (
    <>
      <div className="calendar-list-item__head" title={programTitle}>
        {programTitle}
      </div>
      <div className="calendar-list-item__desc">
        <span>{scheduleContent}</span>
        <DividerVertical height={12} />
        <span>{timeLabel}</span>
      </div>
    </>
  )
}
