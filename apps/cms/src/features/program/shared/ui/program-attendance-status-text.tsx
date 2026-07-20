import type { ReactNode } from 'react'

export type ProgramAttendanceStatusTextKind =
  | 'present'
  | 'late'
  | 'absent'
  | 'excused_absence'
  | 'withdrawn'
  | 'pending'
  | 'dash'

export interface ProgramAttendanceStatusTextProps {
  kind: ProgramAttendanceStatusTextKind
  label: ReactNode
  lateTime?: string
}

export function ProgramAttendanceStatusText({
  kind,
  label,
  lateTime,
}: ProgramAttendanceStatusTextProps) {
  if (kind === 'late' || kind === 'absent') {
    return (
      <span className="program-attendance-detail__status-late">
        {lateTime ? `지각 (${lateTime})` : label}
      </span>
    )
  }

  if (kind === 'excused_absence') {
    return <span className="program-attendance-detail__status-excused">{label}</span>
  }

  if (kind === 'withdrawn') {
    return <span className="cms-data-table__cell-accent--danger">{label}</span>
  }

  if (kind === 'pending' || kind === 'dash') {
    return <span className="program-attendance-detail__dash">-</span>
  }

  return <>{label}</>
}
