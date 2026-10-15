import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  GENERAL_MANUAL_SECOND_INTERVIEW_SCREENING_STATUSES,
  isGeneralInterviewTotalScoreUnevaluated,
  resolveGeneralEffectiveSecondInterviewStatus,
  type GeneralEffectiveSecondInterviewStatus,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import { buildInterview2ProcessedSelectionAlert } from '@/features/program/general/lib/application-processed-selection-alert'
import type { ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

/**
 * 선택 합격/불합격 가능 — 면접 종료·평가 완료·최종 결과 미입력 상태.
 *
 * `completed`는 배정된 면접 시간이 종료되어 평가/결과 처리가 가능한 상태이며,
 * 최종 합격·불합격·예비 결과가 확정되었다는 의미가 아니다. 최종 결과가 저장된
 * 상태는 manual screening status로 별도 제외한다.
 */
export function isGeneralVolunteerInterview2EffectiveStatusSelectableForResult(
  status: GeneralEffectiveSecondInterviewStatus
): boolean {
  if (status === 'withdrawn') return false
  if (GENERAL_MANUAL_SECOND_INTERVIEW_SCREENING_STATUSES.has(status)) return false
  return status === 'completed'
}

export function isGeneralVolunteerInterview2SelectableForResult(
  row: Pick<
    GeneralVolunteerApplicantRow,
    | 'interviewAssignmentStatus'
    | 'secondInterviewScreeningStatus'
    | 'assignedInterviewDateLabel'
    | 'assignedInterviewTime'
    | 'availableActions'
    | 'managerAScore'
    | 'managerBScore'
  >
): boolean {
  const status = resolveGeneralEffectiveSecondInterviewStatus(row)
  const hasResultAction = row.availableActions.some(action => {
    const normalized = action.trim().toUpperCase()
    return normalized === 'APPROVE' || normalized === 'REJECT'
  })
  if (!hasResultAction) return false
  if (isGeneralInterviewTotalScoreUnevaluated(row)) return false
  return isGeneralVolunteerInterview2EffectiveStatusSelectableForResult(status)
}

function hasProcessedInterview2Selection(
  rows: readonly Pick<
    GeneralVolunteerApplicantRow,
    | 'interviewAssignmentStatus'
    | 'secondInterviewScreeningStatus'
    | 'assignedInterviewDateLabel'
    | 'assignedInterviewTime'
    | 'availableActions'
    | 'managerAScore'
    | 'managerBScore'
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
    | 'availableActions'
    | 'managerAScore'
    | 'managerBScore'
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
    | 'availableActions'
    | 'managerAScore'
    | 'managerBScore'
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
