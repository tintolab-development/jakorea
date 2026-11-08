import {
  getGeneralInterviewAssignmentTextPresentation,
  type GeneralDocumentScreeningStatus,
  type GeneralInterviewAssignmentStatus,
  type GeneralManagerEvaluation,
  type GeneralSecondInterviewScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { DocumentScreeningStatusText } from '@/features/program/shared/ui/volunteer-screening/document-screening-status-text'
import { ManagerEvaluationBadge } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/shared/manager-evaluation-badge'
import { SecondInterviewScreeningStatusText } from '@/features/program/shared/ui/volunteer-screening/second-interview-screening-status-text'
import { StatusBadge } from '@/shared/components/status-badge'

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
    <StatusBadge domain="custom" variant="text" {...getGeneralInterviewAssignmentTextPresentation(status)}
      className={`ujat-interview-assignment-status-text ujat-interview-assignment-status-text--${status}`} />
  )
}

export function GeneralSecondInterviewStatusText({
  status,
}: {
  status: GeneralSecondInterviewScreeningStatus
}) {
  return <SecondInterviewScreeningStatusText status={status} />
}
