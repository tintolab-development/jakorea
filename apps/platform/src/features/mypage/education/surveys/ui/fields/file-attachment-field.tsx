import { useId, useRef, useState } from 'react'
import type { FileAttachmentParagraph } from '@jakorea/form-schema/writing-form'
import { validateUploadBatch } from '@/shared/lib/file-upload-policy'
import { PFButton, PFText } from '@/shared/ui'
import styles from '../survey-fields.module.css'

type SurveyFileAttachmentFieldProps = {
  paragraph: FileAttachmentParagraph
  fileNames: string[]
  onFileNamesChange: (next: string[]) => void
  onFileChange?: (next: File[]) => void
  disabled?: boolean
}

export function SurveyFileAttachmentField({
  paragraph: _paragraph,
  fileNames,
  onFileNamesChange,
  onFileChange,
  disabled = false,
}: SurveyFileAttachmentFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [policyError, setPolicyError] = useState<string | null>(null)

  return (
    <div className={styles.fileRow}>
      <input
        ref={inputRef}
        id={inputId}
        className={styles.fileInput}
        type="file"
        multiple
        disabled={disabled}
        onChange={event => {
          const files = Array.from(event.target.files ?? [])
          event.target.value = ''
          const error = validateUploadBatch({ currentCount: 0, currentTotalBytes: 0, incoming: files })
          setPolicyError(error)
          if (error) return
          onFileNamesChange(files.map(file => file.name))
          onFileChange?.(files)
        }}
      />
      <PFButton
        type="button"
        variant="secondary"
        size="medium"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        파일 선택
      </PFButton>
      {fileNames.length > 0 ? (
        <PFText as="span" typo="bd-md-md" color="neutral-cool-600" className={styles.fileName}>
          {fileNames.join(', ')}
        </PFText>
      ) : (
        <PFText as="span" typo="bd-md-md" color="neutral-cool-500" className={styles.fileName}>
          선택된 파일 없음
        </PFText>
      )}
      {policyError ? (
        <PFText as="p" role="alert" typo="bd-sm-rg" color="error" className={styles.fileError}>
          {policyError}
        </PFText>
      ) : null}
    </div>
  )
}
