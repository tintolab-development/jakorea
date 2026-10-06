import { useState } from 'react'
import { uploadMemberPortalFile } from '@/features/mypage/instructor-apply/api/member-file-upload'
import {
  PFFormField,
  PFFormFieldHintText,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormFileAttach,
} from '@/shared/ui'
import styles from './apply-instructor-crime-record.module.css'

/** CMS `InstructorCrimeRecordParagraph` — 기관 ID 힌트 + PDF 첨부 */
export type ApplyInstructorCrimeRecordValues = {
  fileObjectId: number | null
  fileName: string
}

const AGENCY_ID_HINT = '기관이 작성한 ID와 검증번호가 노출됩니다.'
const ACCEPT = 'application/pdf,.pdf'
const MAX_BYTES = 20 * 1024 * 1024

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
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    if (!isPdf) {
      setError('PDF 파일만 업로드할 수 있습니다.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('파일은 20MB 이하만 업로드할 수 있습니다.')
      return
    }
    setError(null)
    setUploading(true)
    void uploadMemberPortalFile({ file, filePurpose: 'CRIMINAL_HISTORY_EVIDENCE' })
      .then(fileObjectId => {
        onChange({ fileObjectId, fileName: file.name })
      })
      .catch(() => {
        onChange(emptyInstructorCrimeRecord())
        setError('파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
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
