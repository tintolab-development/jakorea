import type { ReactNode } from 'react'
import './program-attendance-detail.css'

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
    return <span className="program-attendance-detail__status-withdrawn">{label}</span>
  }

  if (kind === 'pending' || kind === 'dash') {
    return <span className="program-attendance-detail__dash">-</span>
  }

  return <span className="program-attendance-detail__status-present">{label}</span>
}

export function CompletionStatusText({ label }: { label: string }) {
  const tone = label.startsWith('수료 불가') ? 'danger' : label === '수료 완료' ? 'done' : 'neutral'
  return <span className={`program-completion-status-text program-completion-status-text--${tone}`}>{label}</span>
}
