import { useId, useRef, useState } from 'react'
import type { FileAttachmentParagraph } from '@jakorea/form-schema/writing-form'
import { formatSingleFileUploadHint, validateUploadBatch } from '@/shared/lib/file-upload-policy'
import {
  PFButton,
  PFFormField,
  PFFormFieldHintText,
  PFFormFieldRow,
  PFFormFieldTable,
  PFItemDeleteButton,
  PFText,
} from '@/shared/ui'
import styles from './file-attachment-field.module.css'

const IMAGE_UPLOAD_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_UPLOAD_HINTS = [
  formatSingleFileUploadHint('JPG, PNG'),
  '- 첨부파일명에 특수문자가 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

type SurveyFileAttachmentFieldProps = {
  paragraph: FileAttachmentParagraph
  fileNames: string[]
  /** 레거시 — `onFileAdd`·`onFileRemove` 사용 시 부모가 목록을 관리 */
  onFileNamesChange?: (next: string[]) => void
  onFileAdd?: (next: File[]) => void
  onFileRemove?: (index: number) => void
  disabled?: boolean
  uploading?: boolean
}

export function SurveyFileAttachmentField({
  paragraph: _paragraph,
  fileNames,
  onFileAdd,
  onFileRemove,
  disabled = false,
  uploading = false,
}: SurveyFileAttachmentFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [policyError, setPolicyError] = useState<string | null>(null)

  return (
    <div className={styles.root}>
      {fileNames.length > 0 ? (
        <ul className={styles.fileList}>
          {fileNames.map((name, index) => (
            <li key={`${index}-${name}`} className={styles.fileChip}>
              <PFText as="span" typo="bd-md-md" color="black" className={styles.fileName}>
                {name}
              </PFText>
              {disabled ? null : (
                <PFItemDeleteButton
                  aria-label={`${name} 삭제`}
                  disabled={uploading}
                  onClick={() => onFileRemove?.(index)}
                />
              )}
            </li>
          ))}
        </ul>
      ) : null}
      <PFFormFieldTable>
        <PFFormFieldRow type="single">
          <PFFormField label="첨부 파일">
            <div className={styles.attachRow}>
              <input
                ref={inputRef}
                id={inputId}
                className={styles.fileInput}
                type="file"
                accept={IMAGE_UPLOAD_ACCEPT}
                multiple
                disabled={disabled || uploading}
                onChange={event => {
                  const files = Array.from(event.target.files ?? [])
                  event.target.value = ''
                  if (files.length === 0) return
                  const error = validateUploadBatch({
                    currentCount: fileNames.length,
                    currentTotalBytes: 0,
                    incoming: files,
                  })
                  setPolicyError(error)
                  if (error) return
                  onFileAdd?.(files)
                }}
              />
              <PFButton
                type="button"
                variant="secondary"
                size="medium"
                className={styles.fileButton}
                disabled={disabled || uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? '업로드 중…' : '파일 추가'}
              </PFButton>
              <div className={styles.hints}>
                {IMAGE_UPLOAD_HINTS.map(hint => (
                  <PFFormFieldHintText key={hint} as="p" className={styles.hintLine}>
                    {hint.startsWith('-') ? hint : `- ${hint}`}
                  </PFFormFieldHintText>
                ))}
              </div>
            </div>
            {policyError ? (
              <PFText as="p" role="alert" typo="bd-sm-rg" color="error" className={styles.fileError}>
                {policyError}
              </PFText>
            ) : null}
          </PFFormField>
        </PFFormFieldRow>
      </PFFormFieldTable>
    </div>
  )
}
