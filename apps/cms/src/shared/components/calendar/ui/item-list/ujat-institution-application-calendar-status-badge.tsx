import './ujat-institution-application-calendar-status-badge.css'

/** 캘린더 우측 일별 리스트 전용 상태 뱃지 (테이블 리스트뷰와 스타일 분리) */
export function UjatInstitutionApplicationCalendarStatusBadge({
  statusKey,
  label,
}: {
  statusKey: string
  label: string
}) {
  return (
    <span
      className={`ujat-institution-application-calendar-status-badge ujat-institution-application-calendar-status-badge--${statusKey}`}
    >
      {label}
    </span>
  )
}
