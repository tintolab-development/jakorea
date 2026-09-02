import { useId, useRef } from 'react'
import type { FileAttachmentParagraph } from '@jakorea/form-schema/writing-form'
import { PFButton, PFText } from '@/shared/ui'
import styles from '../survey-fields.module.css'

type SurveyFileAttachmentFieldProps = {
  paragraph: FileAttachmentParagraph
  fileName: string | null
  onFileNameChange: (next: string | null) => void
}

export function SurveyFileAttachmentField({
  paragraph: _paragraph,
  fileName,
  onFileNameChange,
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
        onChange={event => {
          const file = event.target.files?.[0]
          onFileNameChange(file?.name ?? null)
        }}
      />
      <PFButton
        type="button"
        variant="secondary"
        size="medium"
        onClick={() => inputRef.current?.click()}
      >
        파일 선택
      </PFButton>
      {fileName ? (
        <PFText as="span" typo="bd-md-md" color="neutral-cool-600" className={styles.fileName}>
          {fileName}
        </PFText>
      ) : (
        <PFText as="span" typo="bd-md-md" color="neutral-cool-500" className={styles.fileName}>
          선택된 파일 없음
        </PFText>
      )}
    </div>
  )
}
