import { useState } from 'react'
import type { FileAttachmentParagraph } from '@jakorea/form-schema/writing-form'
import {
  FILE_UPLOAD_MAX_COUNT,
  formatSingleFileUploadHint,
  validateUploadBatch,
} from '@/shared/lib/file-upload-policy'
import {
  PFFormField,
  PFFormFieldHintText,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormFileAttach,
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
  const [policyError, setPolicyError] = useState<string | null>(null)
  const atCap = fileNames.length >= FILE_UPLOAD_MAX_COUNT
  const busy = disabled || uploading

  return (
    <div className={styles.root}>
      <PFFormFieldTable>
        <PFFormFieldRow type="single">
          <PFFormField label="첨부 파일">
            <div className={styles.attachRow}>
              {disabled ? null : (
                <PFFormFileAttach
                  className={styles.trigger}
                  accept={IMAGE_UPLOAD_ACCEPT}
                  buttonLabel="파일 추가"
                  aria-label="교육 사진 첨부"
                  uploading={uploading}
                  disabled={busy || atCap}
                  onFileSelect={file => {
                    const error = validateUploadBatch({
                      currentCount: fileNames.length,
                      currentTotalBytes: 0,
                      incoming: [file],
                    })
                    setPolicyError(error)
                    if (error) return
                    onFileAdd?.([file])
                  }}
                />
              )}
              <div className={styles.hints}>
                {IMAGE_UPLOAD_HINTS.map(hint => (
                  <PFFormFieldHintText key={hint} as="p" className={styles.hintLine}>
                    {hint.startsWith('-') ? hint : `- ${hint}`}
                  </PFFormFieldHintText>
                ))}
              </div>
            </div>
            {fileNames.length > 0 ? (
              <div className={styles.files}>
                {fileNames.map((name, index) => (
                  <PFFormFileAttach
                    key={`${index}-${name}`}
                    hideTrigger
                    fileName={name}
                    disabled={busy}
                    onFileSelect={() => {}}
                    onRemove={disabled ? undefined : () => onFileRemove?.(index)}
                  />
                ))}
              </div>
            ) : null}
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
