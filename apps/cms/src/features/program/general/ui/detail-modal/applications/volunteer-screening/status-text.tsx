import type {
  GeneralDocumentScreeningStatus,
  GeneralInterviewAssignmentStatus,
  GeneralManagerEvaluation,
  GeneralSecondInterviewScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { DocumentScreeningStatusText } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/document-screening-status-text'
import { InterviewAssignmentStatusText } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assignment-status-text'
import { ManagerEvaluationBadge } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/manager-evaluation-badge'
import { SecondInterviewScreeningStatusText } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/second-interview-screening-status-text'

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
  return <InterviewAssignmentStatusText status={status} />
}

export function GeneralSecondInterviewStatusText({
  status,
}: {
  status: GeneralSecondInterviewScreeningStatus
}) {
  return <SecondInterviewScreeningStatusText status={status} />
}
