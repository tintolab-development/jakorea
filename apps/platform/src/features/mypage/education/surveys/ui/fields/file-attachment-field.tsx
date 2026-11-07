import { useState } from 'react'
import type { FileAttachmentParagraph } from '@jakorea/form-schema/writing-form'
import { FILE_UPLOAD_MAX_COUNT, validateUploadBatch } from '@/shared/lib/file-upload-policy'
import hostStyles from '@/features/program/ui/apply-form-field-host.module.css'
import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFFormFileAttach } from '@/shared/ui'
import styles from './file-attachment-field.module.css'

const IMAGE_UPLOAD_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_UPLOAD_HINTS = [
  '파일은 JPG, PNG 형식만 등록 가능하며, 최대 10개(파일당 20MB, 총 100MB)까지 첨부할 수 있습니다.',
  '첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
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
    <div className={[styles.root, hostStyles.root].join(' ')}>
      <PFFormFieldTable>
        <PFFormFieldRow type="single">
          <PFFormField label="첨부 파일" fullWidth>
            <div className={styles.attach}>
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
              {disabled ? null : (
                <div className={styles.attachRow}>
                  <PFFormFileAttach
                    className={styles.trigger}
                    accept={IMAGE_UPLOAD_ACCEPT}
                    buttonLabel="파일 추가"
                    aria-label="교육 사진 첨부"
                    uploading={uploading}
                    disabled={busy || atCap}
                    multiple
                    onFileSelect={() => {}}
                    onFilesSelect={files => {
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
                  <p className={styles.hint}>
                    {IMAGE_UPLOAD_HINTS.map(hint => (
                      <span key={hint}>{hint}</span>
                    ))}
                  </p>
                </div>
              )}
              {policyError ? <p className={styles.fileError}>{policyError}</p> : null}
            </div>
          </PFFormField>
        </PFFormFieldRow>
      </PFFormFieldTable>
    </div>
  )
}
