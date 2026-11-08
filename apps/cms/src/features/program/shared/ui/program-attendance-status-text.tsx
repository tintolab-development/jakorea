import type { ReactNode } from 'react'
import { StatusBadge } from '@/shared/components/status-badge'
import {
  getProgramAttendanceTextPresentation,
  getProgramCompletionTextPresentation,
  type ProgramAttendanceStatusTextKind,
} from '@/features/program/shared/lib/attendance-status-presentation'
import './program-attendance-detail.css'

export type { ProgramAttendanceStatusTextKind }

export interface ProgramAttendanceStatusTextProps {
  kind: ProgramAttendanceStatusTextKind
  label: ReactNode
  lateTime?: string
}

export function ProgramAttendanceStatusText({ kind, label, lateTime }: ProgramAttendanceStatusTextProps) {
  const presentation = getProgramAttendanceTextPresentation(kind, label, lateTime)
  return (
    <StatusBadge
      domain="custom"
      variant="text"
      label={presentation.label}
      accentColor={presentation.accentColor}
    />
  )
}

export function CompletionStatusText({ label }: { label: string }) {
  const presentation = getProgramCompletionTextPresentation(label)
  return (
    <StatusBadge
      domain="custom"
      variant="text"
      label={presentation.label}
      accentColor={presentation.accentColor}
    />
  )
}
