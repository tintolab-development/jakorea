import type { Program } from '@/types/domain'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import type { ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'
import { screeningSubjectNoun } from '@/features/program/general/lib/screening-subject-kind'
import type { GeneralInterviewAssignConfirmPayload } from './general-volunteer-interview-assign-modal'
import type { GeneralInterviewAssignFlow } from './use-doc-passed'
import { GeneralVolunteerInterviewAssignModal } from './general-volunteer-interview-assign-modal'
import { GeneralVolunteerInterviewAssignCompleteModal } from './general-volunteer-interview-assign-complete-modal'

export type GeneralVolunteerInterviewAssignModalsProps = {
  program: Program
  list: GeneralVolunteerApplicantRow[]
  assignFlow: GeneralInterviewAssignFlow | null
  /** 신청 목록 remote 여부 — false면 배정 팝업도 mock 스케줄 */
  applicationsUseRemote?: boolean
  subjectKind?: ScreeningSubjectKind
  onClosePick: () => void
  onConfirmPick: (payload: GeneralInterviewAssignConfirmPayload) => void
  onCloseComplete: () => void
}

export function GeneralVolunteerInterviewAssignModals({
  program,
  list,
  assignFlow,
  applicationsUseRemote = false,
  subjectKind = 'volunteer',
  onClosePick,
  onConfirmPick,
  onCloseComplete,
}: GeneralVolunteerInterviewAssignModalsProps) {
  const assignPickFlow = assignFlow?.type === 'pick' ? assignFlow : null
  const assignCompleteFlow = assignFlow?.type === 'complete' ? assignFlow : null
  const assignMode =
    assignPickFlow?.target.interviewAssignmentStatus === 'assigned' ? 'reassign' : 'assign'
  const subjectNoun = screeningSubjectNoun(subjectKind)

  return (
    <>
      {assignPickFlow ? (
        <GeneralVolunteerInterviewAssignModal
          open
          program={program}
          applicant={assignPickFlow.target}
          allApplicants={list}
          mode={assignMode}
          applicationsUseRemote={applicationsUseRemote}
          subjectNoun={subjectNoun}
          onCancel={onClosePick}
          onConfirm={onConfirmPick}
        />
      ) : null}
      <GeneralVolunteerInterviewAssignCompleteModal
        open={assignCompleteFlow != null}
        applicantName={assignCompleteFlow?.applicantName ?? ''}
        mode={assignCompleteFlow?.mode ?? 'assign'}
        subjectNoun={subjectNoun}
        payload={
          assignCompleteFlow?.payload ?? {
            dateLabel: '',
            timeRange: '',
            notifyTiming: 'immediate',
          }
        }
        onClose={onCloseComplete}
      />
    </>
  )
}
