export const PROGRAM_ATTENDANCE_RATE_BASIS_NOTE = '(강의 진행 회차 기준)' as const

export interface ProgramAttendanceRateValueProps {
  countLabel: string
}

export function ProgramAttendanceRateValue({ countLabel }: ProgramAttendanceRateValueProps) {
  return (
    <span className="program-attendance-detail__rate">
      <span className="program-attendance-detail__rate-count">{countLabel}</span>
      <span className="program-attendance-detail__rate-note">{PROGRAM_ATTENDANCE_RATE_BASIS_NOTE}</span>
    </span>
  )
}
