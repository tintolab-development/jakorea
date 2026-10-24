import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  MemberFileConfirmError,
  isMemberFileSizeUploadError,
  MemberFileEmptyError,
  MemberFileRejectedError,
  MemberFileScanTimeoutError,
  MemberFileStatusCheckError,
  MemberFileStorageUploadError,
  MemberFileTooLargeError,
  MemberFileTypeNotAllowedError,
  MemberFileUploadRequestError,
  uploadMemberPortalFile,
  validateMemberPortalFile,
} from '@/features/mypage/instructor-apply/api/member-file-upload'
import type {
  MemberFileUploadPolicy,
  MemberFileUploadStatus,
} from '@/features/mypage/instructor-apply/api/member-file-upload'
import {
  DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE,
  getApiErrorMessageFromBody,
} from '@/features/program/lib/application-api-error'
import {
  PFButton,
  PFDescriptionList,
  PFItemDeleteButton,
  PFModal,
  PFSelect,
  PFText,
  PFTextarea,
} from '@/shared/ui'
import type { ProgramApplicationType } from '../../applications/api/types'
import {
  PORTAL_ABSENCE_REASON_MAX_FILE_COUNT,
  PORTAL_ABSENCE_REASON_MAX_LENGTH,
} from '../../applications/api/activity-client'
import { useSubmitApplicationAbsenceReason } from '../../applications/api/activity-hooks'
import { resolveEducationScheduleDateLabel } from '../lib/format'
import type { EducationScheduleItem } from '../model/types'
import styles from './absence-reason-modal.module.css'

const ABSENCE_REASON_FILE_PURPOSE = 'ABSENCE_EVIDENCE'
const ABSENCE_REASON_ACCEPT = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf'
const ABSENCE_REASON_MAX_BYTES = 20 * 1024 * 1024
const ABSENCE_REASON_MAX_FILES = PORTAL_ABSENCE_REASON_MAX_FILE_COUNT
const ABSENCE_REASON_FILE_TYPES_LABEL = 'JPG, JPEG, PNG, PDF'

const ABSENCE_REASON_FILE_POLICY: MemberFileUploadPolicy = {
  maxBytes: ABSENCE_REASON_MAX_BYTES,
  allowedFileTypes: [
    { extensions: ['jpg', 'jpeg'], contentType: 'image/jpeg' },
    { extensions: ['png'], contentType: 'image/png' },
    { extensions: ['pdf'], contentType: 'application/pdf' },
  ],
}

type AbsenceFileStatus =
  | 'pending'
  | 'uploading'
  | 'confirming'
  | 'scanning'
  | 'uploaded'
  | 'failed'
  | 'blocked'

type AbsenceFile = {
  key: string
  file: File
  fileObjectId?: number
  fileName: string
  fileSize: number
  status: AbsenceFileStatus
  error?: string
}

type EducationAbsenceReasonModalProps = {
  open: boolean
  items: readonly EducationScheduleItem[]
  initialScheduleId: number | null
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
  onClose: () => void
}

function getResponseData(error: unknown): unknown {
  const originalError = getOriginalMemberFileError(error)
  if (!originalError || typeof originalError !== 'object') return undefined
  return (originalError as { response?: { data?: unknown } }).response?.data
}

function getResponseStatus(error: unknown): number | undefined {
  const originalError = getOriginalMemberFileError(error)
  if (!originalError || typeof originalError !== 'object') return undefined
  const status = (originalError as { response?: { status?: unknown } }).response?.status
  return typeof status === 'number' ? status : undefined
}

function getOriginalMemberFileError(error: unknown): unknown {
  if (
    error instanceof MemberFileUploadRequestError ||
    error instanceof MemberFileStorageUploadError ||
    error instanceof MemberFileConfirmError ||
    error instanceof MemberFileStatusCheckError
  ) {
    return getOriginalMemberFileError(error.originalError)
  }
  return error
}

function getResponseErrorCode(error: unknown): string | undefined {
  const data = getResponseData(error)
  if (!data || typeof data !== 'object') return undefined
  const body = data as {
    code?: unknown
    error?: { code?: unknown }
  }
  const code = body.error?.code ?? body.code
  return typeof code === 'string' && code.trim() ? code.trim().toUpperCase() : undefined
}

function uploadErrorMessage(error: unknown): string {
  const code = getResponseErrorCode(error)
  switch (code) {
    case 'MEMBER_FILE_PURPOSE_NOT_ALLOWED':
      return '결석 증빙 파일 목적값을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.'
    case 'MEMBER_FILE_TYPE_NOT_ALLOWED':
      return `${ABSENCE_REASON_FILE_TYPES_LABEL} 파일만 첨부할 수 있습니다.`
    case 'MEMBER_FILE_SIZE_EXCEEDED':
      return '파일은 20MB 이하만 첨부할 수 있습니다.'
    case 'MEMBER_FILE_CONFIRM_NOT_ALLOWED':
      return '파일 업로드 확정에 실패했습니다. 다시 첨부해 주세요.'
    case 'MEMBER_FILE_NOT_OWNED':
      return '본인이 업로드한 파일만 사용할 수 있습니다. 다시 첨부해 주세요.'
    default:
      break
  }
  if (getResponseStatus(error) === 401) {
    return '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.'
  }
  if (error instanceof MemberFileUploadRequestError) {
    return '업로드 URL 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  }
  if (error instanceof MemberFileStorageUploadError) {
    return '실제 파일 업로드에 실패했습니다. 파일을 다시 첨부해 주세요.'
  }
  if (error instanceof MemberFileConfirmError) {
    return '파일 업로드 확정에 실패했습니다. 파일을 다시 첨부해 주세요.'
  }
  if (error instanceof MemberFileStatusCheckError) {
    return '파일 상태 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  }
  if (error instanceof MemberFileTypeNotAllowedError) {
    return `${ABSENCE_REASON_FILE_TYPES_LABEL} 파일만 첨부할 수 있습니다.`
  }
  if (error instanceof MemberFileRejectedError) {
    return '보안 정책상 등록할 수 없는 파일입니다. 다른 파일로 다시 시도해 주세요.'
  }
  if (error instanceof MemberFileTooLargeError) {
    return '파일은 20MB 이하만 첨부할 수 있습니다.'
  }
  if (error instanceof MemberFileEmptyError) {
    return '빈 파일은 업로드할 수 없습니다. 파일을 다시 선택해 주세요.'
  }
  if (error instanceof MemberFileScanTimeoutError) {
    return '파일 보안 검사가 끝나지 않았습니다. 잠시 후 다시 시도해 주세요.'
  }
  if (isMemberFileSizeUploadError(getOriginalMemberFileError(error))) {
    return '파일 크기를 확인한 뒤 다시 첨부해 주세요.'
  }
  return '증빙서류 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

function submitErrorMessage(error: unknown): string {
  const code = getResponseErrorCode(error)
  switch (code) {
    case 'INVALID_ABSENCE_REASON':
    case 'VALIDATION_FAILED':
    case 'INVALID_VALUE':
      return '불참 사유를 확인해 주세요.'
    case 'SUBMISSION_FILE_PURPOSE_NOT_ALLOWED':
    case 'MEMBER_FILE_TYPE_NOT_ALLOWED':
      return `결석 증빙 파일을 확인해 주세요. ${ABSENCE_REASON_FILE_TYPES_LABEL}만 제출할 수 있습니다.`
    case 'FORBIDDEN':
      return '현재 교육 일정에 결석 사유를 제출할 수 없습니다.'
    case 'CONFLICT':
      return '교육 일정 상태가 변경되었습니다. 교육현황을 새로고침한 뒤 다시 시도해 주세요.'
    default:
      break
  }
  if (getResponseStatus(error) === 401) {
    return '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.'
  }
  if (getResponseStatus(error) === 403) {
    return '현재 교육 일정에 결석 사유를 제출할 수 없습니다.'
  }
  if (getResponseStatus(error) === 409) {
    return '교육 일정 상태가 변경되었습니다. 교육현황을 새로고침한 뒤 다시 시도해 주세요.'
  }
  return getApiErrorMessageFromBody(
    getResponseData(error),
    DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE
  )
}

function absenceFileError(file: File): string | null {
  try {
    validateMemberPortalFile(file, ABSENCE_REASON_FILE_POLICY)
    return null
  } catch (error) {
    return uploadErrorMessage(error)
  }
}

function toAbsenceFileStatus(status: MemberFileUploadStatus): AbsenceFileStatus {
  switch (status) {
    case 'CONFIRMING':
      return 'confirming'
    case 'SCANNING':
      return 'scanning'
    case 'AVAILABLE':
      return 'uploaded'
    case 'PREPARING':
    case 'UPLOADING':
    default:
      return 'uploading'
  }
}

function absenceFileStatusLabel(status: AbsenceFileStatus): string {
  switch (status) {
    case 'pending':
      return '대기 중'
    case 'uploading':
      return '업로드 중'
    case 'confirming':
      return '업로드 확정 중'
    case 'scanning':
      return '보안 검사 중'
    case 'uploaded':
      return '첨부 완료'
    case 'failed':
      return '업로드 실패'
    case 'blocked':
      return '이전 파일 실패로 중단'
  }
}

function resolveInitialScheduleId(
  items: readonly EducationScheduleItem[],
  initialScheduleId: number | null
): string {
  if (initialScheduleId != null && items.some(item => item.scheduleId === initialScheduleId)) {
    return String(initialScheduleId)
  }
  return items[0]?.scheduleId == null ? '' : String(items[0].scheduleId)
}

function fileIdentity(file: File): string {
  return [file.name, file.size, file.lastModified, file.type.trim().toLowerCase()].join('\u0000')
}

function formatFileSize(fileSize: number): string {
  if (fileSize < 1024) return `${fileSize}B`
  if (fileSize < 1024 * 1024) return `${Math.round(fileSize / 1024)}KB`
  return `${(fileSize / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')}MB`
}

export function EducationAbsenceReasonModal({
  open,
  items,
  initialScheduleId,
  applicationType,
  applicationId,
  onClose,
}: EducationAbsenceReasonModalProps) {
  const descriptionId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedScheduleId, setSelectedScheduleId] = useState(() =>
    resolveInitialScheduleId(items, initialScheduleId)
  )
  const [reason, setReason] = useState('')
  const [files, setFiles] = useState<AbsenceFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [fileSelectionNotice, setFileSelectionNotice] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const submitMutation = useSubmitApplicationAbsenceReason(applicationType, applicationId)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setSelectedScheduleId(resolveInitialScheduleId(items, initialScheduleId))
      setReason('')
      setFiles([])
      setUploading(false)
      setFileSelectionNotice(null)
      setFormError(null)
      submitMutation.reset()
    }
    wasOpenRef.current = open
  }, [initialScheduleId, items, open, submitMutation])

  const dateOptions = useMemo(
    () =>
      items.map(item => ({
        value: String(item.scheduleId),
        label: resolveEducationScheduleDateLabel(item),
      })),
    [items]
  )

  const isBusy = uploading || submitMutation.isPending
  const canSubmit =
    Boolean(selectedScheduleId && reason.trim()) &&
    files.length > 0 &&
    !isBusy &&
    files.every(file => file.status === 'uploaded' && file.fileObjectId != null)

  const updateFile = (key: string, patch: Partial<AbsenceFile>) => {
    setFiles(current => current.map(file => (file.key === key ? { ...file, ...patch } : file)))
  }

  const uploadSingleFile = async (file: AbsenceFile): Promise<void> => {
    try {
      updateFile(file.key, { status: 'uploading', error: undefined, fileObjectId: undefined })
      const fileObjectId = await uploadMemberPortalFile({
        file: file.file,
        filePurpose: ABSENCE_REASON_FILE_PURPOSE,
        policy: ABSENCE_REASON_FILE_POLICY,
        onStatusChange: status => updateFile(file.key, { status: toAbsenceFileStatus(status) }),
      })
      updateFile(file.key, { fileObjectId, status: 'uploaded', error: undefined })
    } catch (error) {
      const message = uploadErrorMessage(error)
      updateFile(file.key, { status: 'failed', fileObjectId: undefined, error: message })
    }
  }

  const uploadFiles = async (filesToUpload: readonly AbsenceFile[]) => {
    setUploading(true)
    try {
      for (const file of filesToUpload) {
        await uploadSingleFile(file)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (selectedFiles: readonly File[]) => {
    if (isBusy || selectedFiles.length === 0) return
    const remainingCount = ABSENCE_REASON_MAX_FILES - files.length
    if (remainingCount <= 0) {
      setFileSelectionNotice(
        `증빙서류는 최대 ${ABSENCE_REASON_MAX_FILES}개까지 첨부할 수 있습니다.`
      )
      return
    }

    const existingFileIdentities = new Set(files.map(item => fileIdentity(item.file)))
    const incomingFileIdentities = new Set<string>()
    const filesToUpload: File[] = []
    const rejectedMessages = new Set<string>()
    let duplicateCount = 0
    let overflowCount = 0

    for (const file of selectedFiles) {
      const identity = fileIdentity(file)
      if (existingFileIdentities.has(identity) || incomingFileIdentities.has(identity)) {
        duplicateCount += 1
        continue
      }
      if (filesToUpload.length >= remainingCount) {
        overflowCount += 1
        continue
      }
      const invalidMessage = absenceFileError(file)
      if (invalidMessage) {
        rejectedMessages.add(invalidMessage)
        continue
      }
      incomingFileIdentities.add(identity)
      filesToUpload.push(file)
    }

    const queuedFiles: AbsenceFile[] = filesToUpload.map(file => ({
      key: crypto.randomUUID(),
      file,
      fileName: file.name,
      fileSize: file.size,
      status: 'pending',
    }))
    if (queuedFiles.length > 0) {
      setFiles(current => [...current, ...queuedFiles])
      void uploadFiles(queuedFiles)
    }

    const notices = [...rejectedMessages]
    if (duplicateCount > 0) notices.push('이미 첨부한 파일은 중복으로 추가하지 않았습니다.')
    if (overflowCount > 0) {
      notices.push(
        `증빙서류는 최대 ${ABSENCE_REASON_MAX_FILES}개까지 첨부할 수 있어 ${overflowCount}개 파일은 제외했습니다.`
      )
    }
    setFileSelectionNotice(notices.length > 0 ? notices.join(' ') : null)
  }

  const handleRetry = (fileKey: string) => {
    if (isBusy) return
    const file = files.find(item => item.key === fileKey)
    if (!file || file.status !== 'failed') return
    setFileSelectionNotice(null)
    void uploadFiles([file])
  }

  const handleSubmit = () => {
    if (isBusy) return
    if (!selectedScheduleId) {
      setFormError('사유를 제출할 결석 일자를 선택해 주세요.')
      return
    }
    if (!reason.trim()) {
      setFormError('불참 사유를 작성해 주세요.')
      return
    }
    if (files.length === 0) {
      setFormError('증빙서류를 첨부해 주세요.')
      return
    }
    if (files.some(file => file.status !== 'uploaded' || file.fileObjectId == null)) {
      return
    }
    setFormError(null)
    const fileObjectIds = files.flatMap(file =>
      file.fileObjectId == null ? [] : [file.fileObjectId]
    )
    submitMutation.mutate(
      {
        scheduleId: Number(selectedScheduleId),
        reason: reason.trim(),
        ...(fileObjectIds.length > 0 ? { fileObjectIds } : {}),
      },
      { onSuccess: onClose }
    )
  }

  return (
    <PFModal
      open={open}
      title="결석 사유 제출하기"
      className={styles.modal}
      ariaDescribedBy={descriptionId}
      onClose={onClose}
      mobilePlacement="full"
      closeOnBackdropClick={!isBusy}
      closeOnEscape={!isBusy}
    >
      <div className={styles.content}>
        <div id={descriptionId} className={styles.description}>
          <PFText as="p" typo="bd-lg-rg" color="neutral-cool-600">
            개인 사유로 교육에 참여하지 못할 경우, 불참 사유 및 증빙서류를 제출해 주세요.
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="neutral-cool-600">
            제출하면 우선 사유 불참으로 처리되며 추후 결격 사유에서 제외돼요.
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="neutral-cool-600">
            * 담당자가 제출한 사유를 반려하면 결석으로 변경되어 수료 기준에 다시 반영돼요.
          </PFText>
        </div>

        <div className={styles.fields}>
          <PFSelect
            size="xlarge"
            label="결석 일자"
            placeholder="사유를 제출할 결석 일자를 선택해 주세요"
            options={dateOptions}
            value={selectedScheduleId}
            required
            onValueChange={value => {
              setSelectedScheduleId(value)
              setFormError(null)
            }}
            disabled={isBusy || dateOptions.length === 0}
            error={Boolean(formError && !selectedScheduleId)}
          />

          <PFTextarea
            size="xlarge"
            label="불참 사유"
            placeholder="불참 사유를 작성해 주세요"
            rows={2}
            maxLength={PORTAL_ABSENCE_REASON_MAX_LENGTH}
            value={reason}
            required
            onValueChange={value => {
              setReason(value)
              setFormError(null)
            }}
            disabled={isBusy}
            error={Boolean(formError && !reason.trim())}
            message={formError && !reason.trim() ? formError : undefined}
            messageStatus="error"
          />

          <div className={styles.fileField}>
            <div className={styles.fileLabel}>
              <PFText as="label" typo="label-md" color="inherit" className={styles.fileLabelText}>
                증빙서류를 첨부해 주세요.
              </PFText>
              <span className={styles.requiredMark} aria-hidden="true">
                *
              </span>
            </div>
            <input
              ref={fileInputRef}
              className={styles.fileInput}
              type="file"
              accept={ABSENCE_REASON_ACCEPT}
              disabled={isBusy || files.length >= ABSENCE_REASON_MAX_FILES}
              onChange={event => {
                const selectedFiles = Array.from(event.target.files ?? [])
                if (selectedFiles.length > 0) handleFileSelect(selectedFiles)
                event.target.value = ''
              }}
              multiple
            />
            <PFButton
              type="button"
              variant="tertiary"
              size="xlarge"
              width="100%"
              className={styles.filePicker}
              disabled={isBusy || files.length >= ABSENCE_REASON_MAX_FILES}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? '업로드 중…' : '증빙서류 추가하기'}
            </PFButton>
            <PFDescriptionList
              items={[
                `파일은 최대 20MB까지 ${ABSENCE_REASON_FILE_TYPES_LABEL} 형식만 등록 가능합니다.`,
                '첨부파일명에 특수문자가 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
              ]}
            />
            {files.length > 0 ? (
              <ul className={styles.fileList}>
                {files.map(file => (
                  <li key={file.key} className={styles.fileRow}>
                    <div className={styles.fileInfo}>
                      <PFText as="span" typo="bd-lg-rg" color="black" className={styles.fileName}>
                        {file.fileName}
                      </PFText>
                      <PFText
                        as="span"
                        typo="bd-sm-rg"
                        color={file.status === 'failed' ? 'error' : 'neutral-cool-600'}
                      >
                        {formatFileSize(file.fileSize)} ·{' '}
                        {file.error ?? absenceFileStatusLabel(file.status)}
                      </PFText>
                    </div>
                    <div className={styles.fileActions}>
                      {file.status === 'failed' ? (
                        <PFButton
                          type="button"
                          variant="tertiary"
                          size="small"
                          disabled={isBusy}
                          onClick={() => handleRetry(file.key)}
                        >
                          다시 시도
                        </PFButton>
                      ) : null}
                      <PFItemDeleteButton
                        aria-label={`${file.fileName} 삭제`}
                        disabled={isBusy}
                        onClick={() =>
                          setFiles(current => current.filter(item => item.key !== file.key))
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {fileSelectionNotice ? (
              <PFText
                as="p"
                typo="bd-sm-rg"
                color="neutral-cool-600"
                className={styles.fileSelectionNotice}
                role="status"
              >
                {fileSelectionNotice}
              </PFText>
            ) : null}
          </div>
        </div>

        {submitMutation.isError ? (
          <PFText as="p" typo="bd-md-rg" color="error" className={styles.formError}>
            {submitErrorMessage(submitMutation.error)}
          </PFText>
        ) : null}

        <div className={styles.actions}>
          <PFButton
            type="button"
            variant="secondary"
            size="xlarge"
            disabled={isBusy}
            onClick={onClose}
          >
            취소
          </PFButton>
          <PFButton
            type="button"
            variant="primary"
            size="xlarge"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitMutation.isPending ? '제출 중…' : '사유 제출하기'}
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
