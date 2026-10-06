import { useState } from 'react'
import { uploadMemberPortalFile } from '@/features/mypage/instructor-apply/api/member-file-upload'
import { getApplicationApiErrorCode } from '@/features/program/lib/application-api-error'
import {
  PFFormField,
  PFFormFieldHintText,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormFileAttach,
} from '@/shared/ui'
import styles from './apply-instructor-crime-record.module.css'

/** CMS `InstructorCrimeRecordParagraph` — 기관 ID 힌트 + PDF·이미지 첨부 */
export type ApplyInstructorCrimeRecordValues = {
  fileObjectId: number | null
  fileName: string
}

const AGENCY_ID_HINT = '기관이 작성한 ID와 검증번호가 노출됩니다.'
/** BE `CRIMINAL_HISTORY_EVIDENCE` 정책 — pdf·jpg·jpeg·png·webp, 20MB */
const ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp'
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_FILE_NAME_PATTERN = /\.(pdf|jpe?g|png|webp)$/i
const MAX_BYTES = 20 * 1024 * 1024
const FILE_TYPE_ERROR = 'PDF 또는 이미지(JPG, PNG, WEBP) 파일만 업로드할 수 있습니다.'
const FILE_SIZE_ERROR = '파일은 20MB 이하만 업로드할 수 있습니다.'

function isAllowedCrimeRecordFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase()
  if (mime) return ALLOWED_MIME_TYPES.has(mime)
  return ALLOWED_FILE_NAME_PATTERN.test(file.name)
}

function uploadErrorMessage(error: unknown): string {
  const code = getApplicationApiErrorCode(error)
  if (code === 'MEMBER_FILE_TYPE_NOT_ALLOWED') return FILE_TYPE_ERROR
  if (code === 'MEMBER_FILE_SIZE_EXCEEDED') return FILE_SIZE_ERROR
  return '파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

export function emptyInstructorCrimeRecord(): ApplyInstructorCrimeRecordValues {
  return { fileObjectId: null, fileName: '' }
}

export function findIncompleteInstructorCrimeRecordMessage(
  values: ApplyInstructorCrimeRecordValues,
): string | null {
  if (values.fileObjectId == null) {
    return '성범죄 경력 조회서 파일을 첨부해 주세요.'
  }
  return null
}

export function instructorCrimeRecordAnswerFromValues(
  values: ApplyInstructorCrimeRecordValues,
): Record<string, unknown> {
  return {
    fileObjectId: values.fileObjectId,
    fileName: values.fileName.trim() || undefined,
  }
}

export function instructorCrimeRecordValuesFromDraftAnswer(
  answer: unknown,
): ApplyInstructorCrimeRecordValues | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const row = answer as Record<string, unknown>
  const fileObjectId =
    typeof row.fileObjectId === 'number' && Number.isFinite(row.fileObjectId)
      ? row.fileObjectId
      : null
  const fileName = typeof row.fileName === 'string' ? row.fileName : ''
  if (fileObjectId == null && !fileName) return null
  return { fileObjectId, fileName }
}

type ApplyInstructorCrimeRecordProps = {
  value: ApplyInstructorCrimeRecordValues
  onChange: (next: ApplyInstructorCrimeRecordValues) => void
}

export function ApplyInstructorCrimeRecord({ value, onChange }: ApplyInstructorCrimeRecordProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    if (!isAllowedCrimeRecordFile(file)) {
      setError(FILE_TYPE_ERROR)
      return
    }
    if (file.size > MAX_BYTES) {
      setError(FILE_SIZE_ERROR)
      return
    }
    setError(null)
    setUploading(true)
    void uploadMemberPortalFile({ file, filePurpose: 'CRIMINAL_HISTORY_EVIDENCE' })
      .then(fileObjectId => {
        onChange({ fileObjectId, fileName: file.name })
      })
      .catch(uploadError => {
        onChange(emptyInstructorCrimeRecord())
        setError(uploadErrorMessage(uploadError))
      })
      .finally(() => {
        setUploading(false)
      })
  }

  return (
    <PFFormFieldTable className={styles.root}>
      {/* CMS DetailInfoForm.Row type="double" — fullWidth 금지 */}
      <PFFormFieldRow type="double">
        <PFFormField label="기관 ID 및 검증번호" labelWidth="wider">
          <PFFormFieldHintText as="p">{AGENCY_ID_HINT}</PFFormFieldHintText>
        </PFFormField>
        <PFFormField label="파일 첨부">
          <PFFormFileAttach
            accept={ACCEPT}
            uploading={uploading}
            fileName={value.fileName}
            error={error}
            aria-label="성범죄 경력 조회서 파일 첨부"
            onFileSelect={handleFileSelect}
            onRemove={() => {
              onChange(emptyInstructorCrimeRecord())
              setError(null)
            }}
          />
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}
