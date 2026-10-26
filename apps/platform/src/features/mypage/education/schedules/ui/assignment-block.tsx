import { useMemo, useState } from 'react'
import type { ProgramApplicationType } from '../../applications/api/types'
import type { EducationScheduleAssignment, EducationScheduleAssignmentFile } from '../model/types'
import {
  canSubmitEducationAssignment,
  resolveEducationAssignmentGuide,
} from '../lib/schedule-rules'
import attachFileUrl from '../image/icon/attach-file-24.svg'
import portalBlackUrl from '@/shared/assets/icons/portal-black.svg'
import { getProgramApplicationApiErrorMessage } from '@/features/program/lib/application-api-error'
import {
  MemberFileConfirmError,
  MemberFileEmptyError,
  MemberFileRejectedError,
  MemberFileScanTimeoutError,
  MemberFileStatusCheckError,
  MemberFileStorageUploadError,
  MemberFileTooLargeError,
  MemberFileUploadRequestError,
} from '@/features/mypage/instructor-apply/api/member-file-upload'
import { EducationSessionGuideBlock } from '../../shared'
import { PFAlertModal, PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import { usePortalFormResponseFeedbackQuery } from '../api/use-portal-form-response-feedback-query'
import {
  AssignmentFileCountExceededError,
  AssignmentSubmissionLimitExceededError,
  AssignmentSubmissionRequiredError,
  AssignmentUploadPolicyError,
  useScheduleAssignmentFilesMutation,
} from '../api/assignment-hooks'
import { EducationAssignmentFeedbackModal } from './assignment-feedback-modal'
import {
  EducationAssignmentSubmitModal,
  type AssignmentSubmitModalInput,
} from './assignment-submit-modal'
import styles from './assignment-block.module.css'

const ASSIGNMENT_UPLOAD_FAILED_MESSAGE = '과제 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.'
const EMPTY_ASSIGNMENT_FILES: readonly EducationScheduleAssignmentFile[] = []

const UPLOAD_ERROR_CLASSES = [
  AssignmentFileCountExceededError,
  AssignmentSubmissionLimitExceededError,
  AssignmentSubmissionRequiredError,
  AssignmentUploadPolicyError,
  MemberFileTooLargeError,
  MemberFileEmptyError,
  MemberFileRejectedError,
  MemberFileScanTimeoutError,
  MemberFileUploadRequestError,
  MemberFileStorageUploadError,
  MemberFileConfirmError,
  MemberFileStatusCheckError,
] as const

function assignmentSubmitErrorMessage(error: unknown): string {
  if (UPLOAD_ERROR_CLASSES.some(ErrorClass => error instanceof ErrorClass)) {
    return (error as Error).message
  }
  return getProgramApplicationApiErrorMessage(error, ASSIGNMENT_UPLOAD_FAILED_MESSAGE)
}

type EducationScheduleAssignmentBlockProps = {
  assignment: EducationScheduleAssignment
  scheduleId: number | null
  /** 피드백 팝업 상단 — `2026년 04월 03일(금), 1차 교육` */
  sessionHeading: string
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
}

export function EducationScheduleAssignmentBlock({
  assignment,
  scheduleId,
  sessionHeading,
  applicationType,
  applicationId,
}: EducationScheduleAssignmentBlockProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const filesMutation = useScheduleAssignmentFilesMutation(applicationType, applicationId)

  const feedbackQuery = usePortalFormResponseFeedbackQuery({
    formResponseId: assignment.formResponseId,
    enabled: feedbackOpen,
  })

  const guide = resolveEducationAssignmentGuide(assignment.status, assignment.submitEndAt)
  const isRevision = assignment.status === 'submitted' || assignment.status === 'feedback'
  const isSubmitted =
    assignment.status === 'submitted' || assignment.status === 'revision_submitted'
  const canSubmitFiles =
    scheduleId != null &&
    scheduleId > 0 &&
    canSubmitEducationAssignment(assignment, isRevision ? 'revise' : 'submit')
  const uploading = filesMutation.isPending
  // 제출물은 신청 일정 GET 응답의 submissions만 사용한다. 예시·로컬 파일은 여기서 만들지 않는다.
  const remoteFiles = assignment.files ?? EMPTY_ASSIGNMENT_FILES
  const hasRemoteFiles = remoteFiles.length > 0
  const blockVariant =
    assignment.status === 'feedback' ? 'feedback' : isSubmitted ? 'submitted' : 'default'

  const remoteFeedbackText = useMemo(() => {
    const items = feedbackQuery.data?.feedbacks ?? []
    if (items.length === 0) return null
    return items.map(item => item.content).join('\n\n')
  }, [feedbackQuery.data?.feedbacks])

  const feedbackBody =
    remoteFeedbackText?.trim() ||
    (feedbackQuery.isFetching ? (
      <PFLoadingSpinner label="피드백을 불러오는 중" />
    ) : (
      '등록된 피드백이 없습니다.'
    ))

  const submitFiles = (keepFileObjectIds: number[], newFiles: File[], urls: string[]) => {
    if (scheduleId == null || scheduleId <= 0) return
    filesMutation.mutate(
      {
        scheduleId,
        mode: isRevision ? 'revise' : 'submit',
        keepFileObjectIds,
        newFiles,
        urls,
      },
      {
        onError: error => {
          setErrorMessage(assignmentSubmitErrorMessage(error))
        },
      },
    )
  }

  const handleSubmit = ({ newFiles, keepFileObjectIds, urls }: AssignmentSubmitModalInput) => {
    setSubmitOpen(false)
    submitFiles(keepFileObjectIds, newFiles, urls)
  }

  return (
    <>
      <EducationSessionGuideBlock
        variant={blockVariant}
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
            <PFButton
              type="button"
              variant="primary"
              size="large"
              disabled={!canSubmitFiles || uploading}
              aria-busy={uploading}
              onClick={() => setSubmitOpen(true)}
            >
              {uploading ? '업로드 중' : guide.submitLabel}
            </PFButton>
          </div>
        }
      >
        {hasRemoteFiles ? <div className={styles.divider} aria-hidden="true" /> : null}

        {hasRemoteFiles ? (
          <ul className={styles.files}>
            {remoteFiles.map(file => {
              const isUrl = file.kind === 'url'
              const label = isUrl ? file.url : file.fileName
              return (
                <li
                  key={file.id}
                  className={[styles.chip, isUrl ? styles.chipUrl : styles.chipFile].join(' ')}
                >
                  <span className={styles.chipBody}>
                    {isUrl ? (
                      <img
                        className={styles.chipIcon}
                        src={portalBlackUrl}
                        alt=""
                        width={20}
                        height={20}
                        aria-hidden="true"
                      />
                    ) : (
                      <img
                        className={styles.chipIconFile}
                        src={attachFileUrl}
                        alt=""
                        width={24}
                        height={24}
                        aria-hidden="true"
                      />
                    )}
                    <PFText
                      as="span"
                      typo="bd-sm-sb"
                      color={isUrl ? 'black' : 'primary-700'}
                      className={styles.chipLabel}
                      title={label}
                    >
                      {label}
                    </PFText>
                  </span>
                </li>
              )
            })}
          </ul>
        ) : null}
      </EducationSessionGuideBlock>
      <PFAlertModal
        open={errorMessage != null}
        title="과제 제출 안내"
        description={errorMessage ?? ''}
        onConfirm={() => setErrorMessage(null)}
      />
      <EducationAssignmentFeedbackModal
        open={feedbackOpen}
        sessionHeading={sessionHeading}
        body={feedbackBody}
        canRevise={isRevision && canSubmitFiles && !uploading}
        onClose={() => setFeedbackOpen(false)}
        onRevise={() => {
          setFeedbackOpen(false)
          setSubmitOpen(true)
        }}
      />
      {submitOpen ? (
        <EducationAssignmentSubmitModal
          open
          sessionHeading={sessionHeading}
          periodLabel={assignment.periodLabel}
          mode={isRevision ? 'revise' : 'submit'}
          initialFiles={remoteFiles}
          submitting={uploading}
          onClose={() => setSubmitOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  )
}
