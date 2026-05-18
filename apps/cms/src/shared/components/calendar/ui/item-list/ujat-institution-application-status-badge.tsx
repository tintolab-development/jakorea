import './ujat-institution-application-status-badge.css'

export function UjatInstitutionApplicationStatusBadge({
  statusKey,
  label,
}: {
  statusKey: string
  label: string
}) {
  return (
    <span
      className={`ujat-institution-application-status-badge ujat-institution-application-status-badge--${statusKey}`}
    >
      {label}
    </span>
  )
}
