type CalendarListItemContentProps = {
  title?: string
  label: string
  time: string
}

export function CalendarListItemContentProgram({
  title,
  label,
  time,
}: CalendarListItemContentProps) {
  return (
    <>
      <div className="calendar-list-item__head" title={title ?? ''}>
        {title ?? ''}
      </div>
      <div className="calendar-list-item__desc">
        <span>{label}</span>
        <span>| {time}</span>
      </div>
    </>
  )
}
