import './institution-application-status-badge.css'

/** 캘린더 우측 일별 리스트 전용 기관 신청 상태 뱃지 (테이블 리스트뷰와 스타일 분리) */
export function InstitutionApplicationStatusBadge({
  statusKey,
  label,
}: {
  statusKey: string
  label: string
}) {
  return (
    <span
      className={`institution-application-status-badge institution-application-status-badge--${statusKey}`}
    >
      {label}
    </span>
  )
}
