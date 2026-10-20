import { useId, useMemo, useRef, useState } from 'react'
import {
  isMemberFileSizeUploadError,
  MemberFileEmptyError,
  MemberFileRejectedError,
  MemberFileTooLargeError,
  uploadMemberPortalFile,
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
import { useSubmitApplicationAbsenceReason } from '../../applications/api/activity-hooks'
import { resolveEducationScheduleDateLabel } from '../lib/format'
import type { EducationScheduleItem } from '../model/types'
import styles from './absence-reason-modal.module.css'

const ABSENCE_REASON_FILE_PURPOSE = 'ABSENCE_EVIDENCE'
const ABSENCE_REASON_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const ABSENCE_REASON_MAX_BYTES = 20 * 1024 * 1024
const ABSENCE_REASON_MAX_FILES = 20

type UploadedAbsenceFile = {
  fileObjectId: number
  fileName: string
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
  if (!error || typeof error !== 'object') return undefined
  return (error as { response?: { data?: unknown } }).response?.data
}

function uploadErrorMessage(error: unknown): string {
  if (error instanceof MemberFileRejectedError) {
    return '보안 정책상 등록할 수 없는 파일입니다. 다른 파일로 다시 시도해 주세요.'
  }
  if (error instanceof MemberFileTooLargeError || error instanceof MemberFileEmptyError) {
    return '파일은 20MB 이하의 JPG, PNG 형식만 첨부할 수 있습니다.'
  }
  if (isMemberFileSizeUploadError(error)) {
    return '파일 크기를 확인한 뒤 다시 첨부해 주세요.'
  }
  return '증빙서류 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

function submitErrorMessage(error: unknown): string {
  return getApiErrorMessageFromBody(
    getResponseData(error),
    DEFAULT_PROGRAM_APPLICATION_REQUEST_ERROR_MESSAGE
  )
}

function isAcceptedFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase()
  return mime === 'image/jpeg' || mime === 'image/png' || /\.(jpe?g|png)$/i.test(file.name)
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
  const [files, setFiles] = useState<UploadedAbsenceFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const submitMutation = useSubmitApplicationAbsenceReason(applicationType, applicationId)

  const dateOptions = useMemo(
    () =>
      items.map(item => ({
        value: String(item.scheduleId),
        label: resolveEducationScheduleDateLabel(item),
      })),
    [items]
  )

  const isBusy = uploading || submitMutation.isPending
  const canSubmit = Boolean(selectedScheduleId && reason.trim()) && !isBusy

  const handleFileSelect = (file: File) => {
    if (files.length >= ABSENCE_REASON_MAX_FILES) {
      setUploadError(`증빙서류는 최대 ${ABSENCE_REASON_MAX_FILES}개까지 첨부할 수 있습니다.`)
      return
    }
    if (!isAcceptedFile(file)) {
      setUploadError('JPG, PNG 파일만 첨부할 수 있습니다.')
      return
    }
    if (file.size > ABSENCE_REASON_MAX_BYTES) {
      setUploadError('파일은 20MB 이하만 첨부할 수 있습니다.')
      return
    }

    setUploadError(null)
    setUploading(true)
    void uploadMemberPortalFile({
      file,
      filePurpose: ABSENCE_REASON_FILE_PURPOSE,
    })
      .then(fileObjectId => {
        setFiles(current => [...current, { fileObjectId, fileName: file.name }])
      })
      .catch((error: unknown) => setUploadError(uploadErrorMessage(error)))
      .finally(() => setUploading(false))
  }

  const handleSubmit = () => {
    if (!selectedScheduleId) {
      setFormError('사유를 제출할 결석 일자를 선택해 주세요.')
      return
    }
    if (!reason.trim()) {
      setFormError('불참 사유를 작성해 주세요.')
      return
    }
    setFormError(null)
    submitMutation.mutate(
      {
        scheduleId: Number(selectedScheduleId),
        reason: reason.trim(),
        fileObjectIds: files.map(file => file.fileObjectId),
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
            개인사유로 교육 이행을 하지 못한 경우, 불참 사유 및 증빙 서류를 제출해 주세요.
          </PFText>
          <PFText as="p" typo="bd-lg-sb" color="neutral-cool-600">
            * 사전에 담당자와 협의되지 않은 건은 별도 고지 없이 결석 처리될 수 있습니다.
          </PFText>
        </div>

        <div className={styles.fields}>
          <PFSelect
            size="xlarge"
            label="결석 일자"
            placeholder="사유를 제출할 결석 일자를 선택해 주세요"
            options={dateOptions}
            value={selectedScheduleId}
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
            maxLength={2000}
            value={reason}
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
            <PFText as="label" typo="label-md" color="black">
              증빙서류를 첨부해 주세요.
            </PFText>
            <input
              ref={fileInputRef}
              className={styles.fileInput}
              type="file"
              accept={ABSENCE_REASON_ACCEPT}
              disabled={isBusy || files.length >= ABSENCE_REASON_MAX_FILES}
              onChange={event => {
                const file = event.target.files?.[0]
                if (file) handleFileSelect(file)
                event.target.value = ''
              }}
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
              {uploading ? '업로드 중…' : '파일 추가'}
            </PFButton>
            <PFDescriptionList
              items={[
                '파일은 최대 20MB까지 JPG, PNG 형식만 등록 가능합니다.',
                '첨부파일명에 특수문자가 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
              ]}
            />
            {files.length > 0 ? (
              <ul className={styles.fileList}>
                {files.map(file => (
                  <li key={file.fileObjectId} className={styles.fileRow}>
                    <PFText as="span" typo="bd-lg-rg" color="black" className={styles.fileName}>
                      {file.fileName}
                    </PFText>
                    <PFItemDeleteButton
                      aria-label={`${file.fileName} 삭제`}
                      disabled={isBusy}
                      onClick={() =>
                        setFiles(current =>
                          current.filter(item => item.fileObjectId !== file.fileObjectId)
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            ) : null}
            {uploadError ? (
              <PFText as="p" typo="bd-sm-rg" color="error">
                {uploadError}
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
