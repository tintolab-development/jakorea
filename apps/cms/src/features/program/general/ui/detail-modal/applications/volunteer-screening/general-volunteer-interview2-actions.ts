import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  GENERAL_MANUAL_SECOND_INTERVIEW_SCREENING_STATUSES,
  resolveGeneralEffectiveSecondInterviewStatus,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import { buildInterview2ProcessedSelectionAlert } from '@/features/program/general/lib/application-processed-selection-alert'
import type { ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

/** 선택 합격/불합격 가능 — 면접 대기만 (진행 완료·결과 확정·활동 포기 제외) */
export function isGeneralVolunteerInterview2SelectableForResult(
  row: Pick<
    GeneralVolunteerApplicantRow,
    | 'interviewAssignmentStatus'
    | 'secondInterviewScreeningStatus'
    | 'assignedInterviewDateLabel'
    | 'assignedInterviewTime'
  >
): boolean {
  const status = resolveGeneralEffectiveSecondInterviewStatus(row)
  if (status === 'withdrawn') return false
  if (GENERAL_MANUAL_SECOND_INTERVIEW_SCREENING_STATUSES.has(status)) return false
  return status === 'waiting'
}

function hasProcessedInterview2Selection(
  rows: readonly Pick<
    GeneralVolunteerApplicantRow,
    | 'interviewAssignmentStatus'
    | 'secondInterviewScreeningStatus'
    | 'assignedInterviewDateLabel'
    | 'assignedInterviewTime'
  >[]
): boolean {
  return rows.some(row => !isGeneralVolunteerInterview2SelectableForResult(row))
}

export function requestGeneralVolunteerInterview2BulkPass({
  selectedIds,
  selectedRows,
  subjectKind = 'volunteer',
  onOpenSinglePass,
  onOpenBulkPass,
}: {
  selectedIds: string[]
  selectedRows: readonly Pick<
    GeneralVolunteerApplicantRow,
    | 'interviewAssignmentStatus'
    | 'secondInterviewScreeningStatus'
    | 'assignedInterviewDateLabel'
    | 'assignedInterviewTime'
  >[]
  subjectKind?: ScreeningSubjectKind
  onOpenSinglePass: () => void
  onOpenBulkPass: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show({
      title: '항목 선택 안내',
      content: '합격 처리할 항목을 선택해 주세요.',
    })
    return
  }
  if (hasProcessedInterview2Selection(selectedRows)) {
    cmsAlertModal.show(buildInterview2ProcessedSelectionAlert(subjectKind))
    return
  }
  if (selectedIds.length === 1) {
    onOpenSinglePass()
    return
  }
  onOpenBulkPass()
}

export function requestGeneralVolunteerInterview2BulkFail({
  selectedIds,
  selectedRows,
  subjectKind = 'volunteer',
  onOpenSingleFail,
  onOpenBulkFail,
}: {
  selectedIds: string[]
  selectedRows: readonly Pick<
    GeneralVolunteerApplicantRow,
    | 'interviewAssignmentStatus'
    | 'secondInterviewScreeningStatus'
    | 'assignedInterviewDateLabel'
    | 'assignedInterviewTime'
  >[]
  subjectKind?: ScreeningSubjectKind
  onOpenSingleFail: () => void
  onOpenBulkFail: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show({
      title: '항목 선택 안내',
      content: '불합격 처리할 항목을 선택해 주세요.',
    })
    return
  }
  if (hasProcessedInterview2Selection(selectedRows)) {
    cmsAlertModal.show(buildInterview2ProcessedSelectionAlert(subjectKind))
    return
  }
  if (selectedIds.length === 1) {
    onOpenSingleFail()
    return
  }
  onOpenBulkFail()
}
