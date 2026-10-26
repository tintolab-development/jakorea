import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { ProgramApplicationType } from '../../applications/api/types'
import type { EducationScheduleAssignment, EducationScheduleAssignmentFile } from '../model/types'
import {
  canSubmitEducationAssignment,
  resolveEducationAssignmentGuide,
} from '../lib/schedule-rules'
import attachFileUrl from '../image/icon/attach-file-24.svg'
import portalBlackUrl from '@/shared/assets/icons/portal-black.svg'
import closeDarkMintUrl from '@/shared/assets/icons/close-dark-mint.svg'
import closeBlackUrl from '@/shared/assets/icons/close-black.svg'
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
  useScheduleAssignmentFilesMutation,
} from '../api/assignment-hooks'
import { EducationAssignmentFeedbackModal } from './assignment-feedback-modal'
import styles from './assignment-block.module.css'

const ASSIGNMENT_UPLOAD_FAILED_MESSAGE = '과제 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.'

const UPLOAD_ERROR_CLASSES = [
  AssignmentFileCountExceededError,
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

function keptFileObjectIds(
  files: readonly EducationScheduleAssignmentFile[],
  excludeFileObjectId?: number,
): number[] {
  return files.flatMap(file =>
    file.kind === 'file' &&
    file.fileObjectId != null &&
    file.fileObjectId !== excludeFileObjectId
      ? [file.fileObjectId]
      : [],
  )
}

export function EducationScheduleAssignmentBlock({
  assignment,
  scheduleId,
  sessionHeading,
  applicationType,
  applicationId,
}: EducationScheduleAssignmentBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
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
  const files = assignment.files ?? []
  const hasFiles = files.length > 0
  const blockVariant =
    assignment.status === 'feedback' ? 'feedback' : isSubmitted ? 'submitted' : 'default'
  const canRemoveFiles = isRevision && canSubmitFiles && !uploading

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

  const submitFiles = (keepFileObjectIds: number[], newFiles: File[]) => {
    if (scheduleId == null || scheduleId <= 0) return
    filesMutation.mutate(
      {
        scheduleId,
        mode: isRevision ? 'revise' : 'submit',
        keepFileObjectIds,
        newFiles,
      },
      {
        onError: error => {
          setErrorMessage(assignmentSubmitErrorMessage(error))
        },
      },
    )
  }

  const openFilePicker = () => {
    if (!canSubmitFiles || uploading) return
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length === 0) return
    submitFiles(isRevision ? keptFileObjectIds(files) : [], selected)
  }

  const removeFile = (file: EducationScheduleAssignmentFile) => {
    if (!canRemoveFiles || file.fileObjectId == null) return
    const remaining = keptFileObjectIds(files, file.fileObjectId)
    if (remaining.length === 0) {
      setErrorMessage('제출한 과제 파일은 1개 이상 남아 있어야 합니다.')
      return
    }
    submitFiles(remaining, [])
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
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className={styles.fileInput}
              tabIndex={-1}
              aria-hidden="true"
              onChange={handleFileChange}
            />
            <PFButton
              type="button"
              variant="primary"
              size="large"
              disabled={!canSubmitFiles || uploading}
              aria-busy={uploading}
              onClick={openFilePicker}
            >
              {uploading ? '업로드 중' : guide.submitLabel}
            </PFButton>
          </div>
        }
      >
        {hasFiles ? <div className={styles.divider} aria-hidden="true" /> : null}

        {hasFiles ? (
          <ul className={styles.files}>
            {files.map(file => {
              const isUrl = file.kind === 'url'
              const removable = canRemoveFiles && !isUrl && file.fileObjectId != null
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
                      title={file.fileName}
                    >
                      {file.fileName}
                    </PFText>
                  </span>
                  {removable ? (
                    <button
                      type="button"
                      className={styles.chipRemove}
                      aria-label={`${file.fileName} 삭제`}
                      onClick={() => removeFile(file)}
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
          openFilePicker()
        }}
      />
    </>
  )
}
