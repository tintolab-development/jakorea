import {
  GENERAL_DOCUMENT_SCREENING_STATUS_LABELS,
  GENERAL_INTERVIEW_ASSIGNMENT_STATUS_LABELS,
  GENERAL_MANAGER_EVALUATION_LABELS,
  GENERAL_SECOND_INTERVIEW_SCREENING_STATUS_LABELS,
  type GeneralDocumentScreeningStatus,
  type GeneralInterviewAssignmentStatus,
  type GeneralManagerEvaluation,
  type GeneralSecondInterviewScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'

export function GeneralManagerEvaluationBadge({
  evaluation,
}: {
  evaluation: GeneralManagerEvaluation
}) {
  return (
    <span className={`general-volunteer-status general-volunteer-status--${evaluation}`}>
      {GENERAL_MANAGER_EVALUATION_LABELS[evaluation]}
    </span>
  )
}

export function GeneralDocumentScreeningStatusText({
  status,
}: {
  status: GeneralDocumentScreeningStatus
}) {
  return (
    <span className={`general-volunteer-status general-volunteer-status--${status}`}>
      {GENERAL_DOCUMENT_SCREENING_STATUS_LABELS[status]}
    </span>
  )
}

export function GeneralInterviewAssignmentStatusText({
  status,
}: {
  status: GeneralInterviewAssignmentStatus
}) {
  return (
    <span className={`general-volunteer-status general-volunteer-status--${status}`}>
      {GENERAL_INTERVIEW_ASSIGNMENT_STATUS_LABELS[status]}
    </span>
  )
}

export function GeneralSecondInterviewStatusText({
  status,
}: {
  status: GeneralSecondInterviewScreeningStatus
}) {
  return (
    <span className={`general-volunteer-status general-volunteer-status--${status}`}>
      {GENERAL_SECOND_INTERVIEW_SCREENING_STATUS_LABELS[status]}
    </span>
  )
}
