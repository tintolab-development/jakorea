import { useId, useRef } from 'react'
import type { FileAttachmentParagraph } from '@jakorea/form-schema/writing-form'
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
          onFileNamesChange(files.map(file => file.name))
          onFileChange?.(files)
          event.target.value = ''
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
    </div>
  )
}
