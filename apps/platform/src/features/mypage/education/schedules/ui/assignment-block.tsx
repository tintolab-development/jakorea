import { useMemo, useState } from 'react'
import type { ProgramApplicationType } from '../../applications/api/types'
import type { EducationSurveyListEntry } from '../../surveys/lib/survey-list-types'
import type { EducationScheduleAssignment } from '../model/types'
import { resolveEducationAssignmentGuide } from '../lib/schedule-rules'
import clipDarkMintUrl from '@/shared/assets/icons/clip-dark-mint.svg'
import portalBlackUrl from '@/shared/assets/icons/portal-black.svg'
import closeDarkMintUrl from '@/shared/assets/icons/close-dark-mint.svg'
import closeBlackUrl from '@/shared/assets/icons/close-black.svg'
import { EducationSessionGuideBlock } from '../../shared'
import { PFAlertModal, PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import { usePortalFormResponseFeedbackQuery } from '../api/use-portal-form-response-feedback-query'
import { EducationAssignmentFillModal } from './assignment-fill-modal'
import styles from './assignment-block.module.css'

type EducationScheduleAssignmentBlockProps = {
  assignment: EducationScheduleAssignment
  programId: string
  scheduleId: number | null
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
  assignmentForm?: EducationSurveyListEntry | null
  assignmentFormLoading?: boolean
  assignmentFormError?: boolean
  assignmentFormsLoaded?: boolean
}

export function EducationScheduleAssignmentBlock({
  assignment,
  programId,
  scheduleId,
  applicationType,
  applicationId,
  assignmentForm = null,
  assignmentFormLoading = false,
  assignmentFormError = false,
  assignmentFormsLoaded = false,
}: EducationScheduleAssignmentBlockProps) {
  const [submitOpen, setSubmitOpen] = useState(false)
  const [formUnavailableOpen, setFormUnavailableOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const feedbackQuery = usePortalFormResponseFeedbackQuery({
    formResponseId: assignment.formResponseId,
    enabled: feedbackOpen,
  })

  const guide = resolveEducationAssignmentGuide(assignment.status, assignment.submitEndAt)
  const deadlineOpen = new Date().getTime() <= new Date(assignment.submitEndAt).getTime()
  const showFileRemove =
    (assignment.status === 'submitted' || assignment.status === 'feedback') && deadlineOpen
  const isSubmitted =
    assignment.status === 'submitted' || assignment.status === 'revision_submitted'
  const files = assignment.files ?? []
  const hasFiles = files.length > 0
  const showSubmittedDivider = isSubmitted && hasFiles

  const remoteFeedbackText = useMemo(() => {
    const items = feedbackQuery.data?.feedbacks ?? []
    if (items.length === 0) return null
    return items.map(item => item.content).join('\n\n')
  }, [feedbackQuery.data?.feedbacks])

  const feedbackBody =
    remoteFeedbackText?.trim() ||
    assignment.feedback?.trim() ||
    (feedbackQuery.isFetching ? (
      <PFLoadingSpinner label="피드백을 불러오는 중" />
    ) : (
      '등록된 피드백이 없습니다.'
    ))

  const hasMatchingForm =
    assignmentForm != null &&
    assignmentForm.bindingId != null &&
    assignmentForm.bindingId > 0 &&
    scheduleId != null &&
    scheduleId > 0
  const isRevision =
    assignment.status === 'submitted' || assignment.status === 'feedback'
  const allowedByForm = hasMatchingForm
    ? isRevision
      ? assignmentForm.canResubmit === true
      : assignmentForm.canSubmit === true
    : false
  const formsReadyEmpty = assignmentFormsLoaded && !hasMatchingForm && !assignmentFormError
  const showSubmitButton = !formsReadyEmpty
  const submitDisabled =
    guide.submitDisabled ||
    assignmentFormLoading ||
    (hasMatchingForm ? !allowedByForm : !assignmentFormError)

  const openAssignmentForm = () => {
    if (assignmentFormLoading) return
    if (!hasMatchingForm) {
      if (formsReadyEmpty) return
      setFormUnavailableOpen(true)
      return
    }
    if (!allowedByForm) return
    setSubmitOpen(true)
  }

  return (
    <>
      <EducationSessionGuideBlock
        variant={isSubmitted ? 'submitted' : 'default'}
        statusLabel={guide.statusLabel}
        statusTone={guide.statusTone}
        message={guide.message}
        description={assignment.periodLabel}
        actions={
          <div className={styles.actions}>
            {guide.showFeedbackButton ? (
              <PFButton
                type="button"
                variant="tertiary"
                size="large"
                onClick={() => setFeedbackOpen(true)}
              >
                피드백 확인
              </PFButton>
            ) : null}
            {showSubmitButton ? (
              <PFButton
                type="button"
                variant="primary"
                size="large"
                disabled={submitDisabled}
                onClick={openAssignmentForm}
              >
                {guide.submitLabel}
              </PFButton>
            ) : null}
          </div>
        }
      >
        {showSubmittedDivider ? <div className={styles.divider} aria-hidden="true" /> : null}

        {formsReadyEmpty ? (
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
            이 일정에 연결된 과제 양식이 없습니다.
          </PFText>
        ) : null}

        {hasFiles ? (
          <ul className={styles.files}>
            {files.map(file => {
              const isUrl = file.kind === 'url'
              return (
                <li
                  key={file.id}
                  className={[styles.chip, isUrl ? styles.chipUrl : styles.chipFile].join(' ')}
                >
                  <img
                    className={styles.chipIcon}
                    src={isUrl ? portalBlackUrl : clipDarkMintUrl}
                    alt=""
                    width={20}
                    height={20}
                    aria-hidden="true"
                  />
                  <PFText
                    as="span"
                    typo="bd-sm-sb"
                    color={isUrl ? 'black' : 'primary-700'}
                    className={styles.chipLabel}
                  >
                    {file.fileName}
                  </PFText>
                  {showFileRemove ? (
                    <button
                      type="button"
                      className={styles.chipRemove}
                      aria-label={`${file.fileName} 삭제`}
                      onClick={openAssignmentForm}
                    >
                      <img
                        src={isUrl ? closeBlackUrl : closeDarkMintUrl}
                        alt=""
                        width={20}
                        height={20}
                        aria-hidden="true"
                      />
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : null}
      </EducationSessionGuideBlock>
      <EducationAssignmentFillModal
        open={submitOpen}
        assignment={assignment}
        formEntry={assignmentForm}
        programId={programId}
        scheduleId={scheduleId}
        applicationType={applicationType}
        applicationId={applicationId}
        onClose={() => setSubmitOpen(false)}
      />
      <PFAlertModal
        open={formUnavailableOpen}
        title="과제 양식 확인"
        description="연결된 과제 양식을 찾을 수 없습니다."
        onConfirm={() => setFormUnavailableOpen(false)}
      />
      <PFAlertModal
        open={feedbackOpen}
        title="피드백 확인"
        description={feedbackBody}
        onConfirm={() => setFeedbackOpen(false)}
      />
    </>
  )
}
