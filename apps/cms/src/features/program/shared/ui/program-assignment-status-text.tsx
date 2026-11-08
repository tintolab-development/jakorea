import { StatusBadge } from '@/shared/components/status-badge'
import { getProgramAssignmentStatusTextPresentation, type ProgramAssignmentTextContext } from '@/features/program/general/lib/assignment-status-presentation'
import './program-assignment-status-text.css'

export function ProgramAssignmentStatusText({ status, context, assignmentStatusLabel }: {
  status: string
  context: ProgramAssignmentTextContext
  assignmentStatusLabel?: string
}) {
  return <StatusBadge domain="custom" variant="text" {...getProgramAssignmentStatusTextPresentation(status, context, assignmentStatusLabel)} />
}
