import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  GENERAL_MANUAL_SECOND_INTERVIEW_SCREENING_STATUSES,
  isGeneralInterviewTotalScoreUnevaluated,
  resolveGeneralEffectiveSecondInterviewStatus,
  type GeneralEffectiveSecondInterviewStatus,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import { buildInterview2ProcessedSelectionAlert } from '@/features/program/general/lib/application-processed-selection-alert'
import type { ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'
import type { GeneralInterview2BulkPassType } from '@/features/program/general/lib/volunteer-screening-constants'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

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
    | 'assignedInterviewStartAt'
    | 'assignedInterviewEndAt'
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
    | 'assignedInterviewStartAt'
    | 'assignedInterviewEndAt'
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
    | 'assignedInterviewStartAt'
    | 'assignedInterviewEndAt'
    | 'availableActions'
    | 'managerAScore'
    | 'managerBScore'
  >[]
  subjectKind?: ScreeningSubjectKind
  onOpenSinglePass: () => void
  onOpenBulkPass: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(NO_SELECTION_ALERT)
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
    | 'assignedInterviewStartAt'
    | 'assignedInterviewEndAt'
    | 'availableActions'
    | 'managerAScore'
    | 'managerBScore'
  >[]
  subjectKind?: ScreeningSubjectKind
  onOpenSingleFail: () => void
  onOpenBulkFail: () => void
}): void {
  if (selectedIds.length === 0) {
    cmsAlertModal.show(NO_SELECTION_ALERT)
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

/**
 * 2차 면접 합격 확정 경로.
 * - 기관형 봉사자 단건 「합격」 → 기관 배정 안내 후 final-result PASS + assignments
 * - 개인 프로그램 봉사자 단건 「합격」 → 교육 배정 안내 후 봉사자 approve-with-education-scope
 * - 일반 개인 프로그램 참여자 「합격」(단건·일괄) → 상세 「참여 승인」과 같은 개인 approve-with-education-scope.
 *   GENERAL_INDIVIDUAL 참여자는 final-result PASS(교육 범위 없는 승인)를 쓰지 않는다.
 * - 그 외(예비합격·봉사자 일괄 등) → 기존 final-result
 */
export type GeneralInterview2PassRoute =
  | 'organization-assign'
  | 'volunteer-education-assign'
  | 'participant-education-scope'
  | 'final-result'

export function resolveGeneralInterview2PassRoute({
  subjectKind,
  isIndividualProgram,
  isOrganizationProgram,
  passType,
  mode,
}: {
  subjectKind: ScreeningSubjectKind
  isIndividualProgram: boolean
  isOrganizationProgram: boolean
  passType: GeneralInterview2BulkPassType | undefined
  mode: 'single' | 'bulk'
}): GeneralInterview2PassRoute {
  if ((passType ?? 'pass') !== 'pass') return 'final-result'
  if (subjectKind === 'participant') {
    return isIndividualProgram ? 'participant-education-scope' : 'final-result'
  }
  if (mode === 'bulk') return 'final-result'
  if (isOrganizationProgram) return 'organization-assign'
  if (isIndividualProgram) return 'volunteer-education-assign'
  return 'final-result'
}
