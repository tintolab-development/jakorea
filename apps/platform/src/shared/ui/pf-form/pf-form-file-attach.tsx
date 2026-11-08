import { type ChangeEvent, useId, useRef } from 'react'
import { PFButton } from '../pf-button'
import { PFItemDeleteButton } from '../pf-item-delete-button'
import { PFText } from '../pf-text'
import styles from './pf-form.module.css'

type PFFormFileAttachButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'text' | 'certificate'
type PFFormFileAttachButtonSize = 'small' | 'medium' | 'large' | 'xlarge' | 'formPage'

export type PFFormFileAttachProps = {
  /** input accept. 기본 PDF */
  accept?: string
  buttonLabel?: string
  buttonVariant?: PFFormFileAttachButtonVariant
  buttonSize?: PFFormFileAttachButtonSize
  /** 트리거 버튼을 컨테이너 너비에 맞춘다 */
  buttonFullWidth?: boolean
  uploadingLabel?: string
  uploading?: boolean
  disabled?: boolean
  /** 첨부된 파일명 — 있으면 추가 버튼 위 칩 노출 */
  fileName?: string | null
  /** 이미 올린 파일 목록용. 추가 버튼 없이 칩만 보여 준다 */
  hideTrigger?: boolean
  onFileSelect: (file: File) => void
  /** `multiple`일 때 선택한 파일 전체. 없으면 `onFileSelect`를 파일마다 호출한다 */
  onFilesSelect?: (files: File[]) => void
  /** 파일 선택 창에서 여러 개 선택 */
  multiple?: boolean
  onRemove?: () => void
  error?: string | null
  className?: string
  'aria-label'?: string
}

/**
 * PFFormFieldTable 값 칸용 파일 첨부.
 * 파일명 칩이 있으면 `파일 추가` 버튼 위에 둔다.
 */
export function PFFormFileAttach({
  accept = 'application/pdf,.pdf',
  buttonLabel = '파일 추가',
  buttonVariant = 'secondary',
  buttonSize = 'medium',
  buttonFullWidth = false,
  uploadingLabel = '업로드 중…',
  uploading = false,
  disabled = false,
  fileName,
  hideTrigger = false,
  onFileSelect,
  onFilesSelect,
  multiple = false,
  onRemove,
  error,
  className,
  'aria-label': ariaLabel,
}: PFFormFileAttachProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const busy = disabled || uploading
  const name = fileName?.trim() || ''

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    // input을 초기화하면 원본 File이 비동기 업로드 중 0바이트처럼 보이는
    // 브라우저/파일 provider가 있다. 선택 순간 독립된 File 스냅샷을 만든다.
    const snapshots = selected.map(
      file =>
        new File([file], file.name, {
          type: file.type,
          lastModified: file.lastModified,
        }),
    )
    if (snapshots.length > 0) {
      if (multiple) {
        if (onFilesSelect) onFilesSelect(snapshots)
        else snapshots.forEach(file => onFileSelect(file))
      } else {
        onFileSelect(snapshots[0])
      }
    }
    event.target.value = ''
  }

  return (
    <div className={[styles.fileAttach, className].filter(Boolean).join(' ')}>
      {name ? (
        <span className={styles.fileAttachChip}>
          <span className={styles.fileAttachName}>{name}</span>
          {onRemove ? (
            <PFItemDeleteButton
              aria-label={`${name} 삭제`}
              disabled={busy}
              onClick={onRemove}
            />
          ) : null}
        </span>
      ) : null}
      {hideTrigger ? null : (
        <span className={styles.fileAttachPicker}>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            multiple={multiple}
            className={styles.fileAttachInput}
            aria-label={ariaLabel ?? buttonLabel}
            disabled={busy}
            onChange={handleChange}
          />
          <PFButton
            type="button"
            variant={buttonVariant}
            size={buttonSize}
            width={buttonFullWidth ? '100%' : undefined}
            className={styles.fileAttachTrigger}
            disabled={busy}
            tabIndex={busy ? undefined : -1}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? uploadingLabel : buttonLabel}
          </PFButton>
        </span>
      )}
      {error ? (
        <PFText as="p" typo="bd-sm-rg" color="error" className={styles.fileAttachError}>
          {error}
        </PFText>
      ) : null}
    </div>
  )
}
