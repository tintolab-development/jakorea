import {
  GENERAL_INTERVIEW_ASSIGNMENT_STATUS_LABELS,
  type GeneralDocumentScreeningStatus,
  type GeneralInterviewAssignmentStatus,
  type GeneralManagerEvaluation,
  type GeneralSecondInterviewScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { DocumentScreeningStatusText } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/document-screening-status-text'
import { ManagerEvaluationBadge } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/manager-evaluation-badge'
import { SecondInterviewScreeningStatusText } from '@/features/program/shared/ui/volunteer-screening/second-interview-screening-status-text'
import '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assignment-status-text.css'

export function GeneralManagerEvaluationBadge({
  evaluation,
}: {
  evaluation: GeneralManagerEvaluation
}) {
  return <ManagerEvaluationBadge evaluation={evaluation} />
}

export function GeneralDocumentScreeningStatusText({
  status,
}: {
  status: GeneralDocumentScreeningStatus
}) {
  return <DocumentScreeningStatusText status={status} />
}

export function GeneralInterviewAssignmentStatusText({
  status,
}: {
  status: GeneralInterviewAssignmentStatus
}) {
  return (
    <span
      className={`ujat-interview-assignment-status-text ujat-interview-assignment-status-text--${status}`}
    >
      {GENERAL_INTERVIEW_ASSIGNMENT_STATUS_LABELS[status]}
    </span>
  )
}

export function GeneralSecondInterviewStatusText({
  status,
}: {
  status: GeneralSecondInterviewScreeningStatus
}) {
  return <SecondInterviewScreeningStatusText status={status} />
}
