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
  /** 첨부된 파일명 — 있으면 버튼 옆 칩 노출 */
  fileName?: string | null
  /** 이미 올린 파일 목록용. 추가 버튼 없이 칩만 보여 준다 */
  hideTrigger?: boolean
  onFileSelect: (file: File) => void
  onRemove?: () => void
  error?: string | null
  className?: string
  'aria-label'?: string
}

function PdfFileIcon() {
  return (
    <svg
      className={styles.fileAttachIcon}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 12 17"
      fill="none"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 0H6.87144C7.12872 0 7.37611 0.0991646 7.56216 0.276875L11.5292 4.06612C11.7267 4.2548 11.8385 4.51607 11.8385 4.78924V15.2C11.8385 15.7523 11.3907 16.2 10.8385 16.2H1C0.447715 16.2 0 15.7523 0 15.2V1C0 0.447715 0.447715 0 1 0ZM5.64074 2.43671C5.64074 2.32985 5.62744 2.25778 5.61242 2.21308C5.60626 2.19476 5.59914 2.1832 5.5943 2.17534L5.59289 2.17304L5.58974 2.17406L5.58703 2.17499C5.55672 2.21626 5.51938 2.31301 5.53039 2.52265C5.53725 2.65246 5.56169 2.80266 5.60168 2.96796C5.6265 2.7827 5.64073 2.60498 5.64074 2.43671ZM3.33117 8.0705C3.13943 8.16658 3.01292 8.2491 2.94934 8.31269C2.83756 8.42449 2.80361 8.50605 2.79504 8.54511C2.79628 8.54508 2.79759 8.54513 2.79897 8.54521C2.80003 8.54528 2.80113 8.54537 2.80227 8.54546C2.80752 8.54587 2.81358 8.54635 2.82043 8.54511C2.86804 8.53646 2.94871 8.5027 3.04406 8.40741C3.12789 8.32358 3.2245 8.20936 3.33117 8.0705ZM5.71398 4.8664C5.55538 5.29588 5.3741 5.72225 5.18078 6.12519C5.05385 6.38974 4.91982 6.64718 4.78527 6.89374C5.41114 6.70398 6.09151 6.52534 6.72668 6.38202C6.55843 6.19689 6.38457 5.97824 6.21105 5.71796C6.05136 5.4784 5.8789 5.18456 5.71398 4.8664ZM6.24133 2.43671C6.2413 2.93036 6.14053 3.47854 5.98254 4.0412C6.20486 4.54274 6.47402 5.03184 6.71008 5.38593C6.96228 5.76419 7.20557 6.03757 7.42492 6.23554C7.82129 6.16204 8.13765 6.15047 8.38391 6.18866C8.63842 6.22817 8.85944 6.32717 8.98547 6.50702C9.12398 6.70478 9.10462 6.94211 8.97766 7.11347C8.85868 7.27397 8.66296 7.35966 8.45617 7.36151L8.45324 7.36249H8.43762C8.4248 7.36244 8.40774 7.36177 8.38781 7.36054C8.34797 7.35806 8.29403 7.35236 8.22863 7.34003C8.09749 7.31527 7.92028 7.26344 7.71105 7.15937C7.57344 7.09091 7.42417 6.99954 7.26574 6.88007C6.45382 7.04988 5.51692 7.28733 4.71008 7.54315C4.60783 7.57558 4.50851 7.60989 4.41171 7.64333L4.33117 7.67108C4.01167 8.18139 3.70791 8.59318 3.46887 8.83222C3.15848 9.14247 2.6965 9.27517 2.38391 9.00116C2.22648 8.86316 2.1672 8.65837 2.20129 8.45331C2.23416 8.2557 2.35051 8.06388 2.52551 7.88886C2.69867 7.7157 2.99434 7.55641 3.32336 7.41229C3.50728 7.33174 3.71324 7.25071 3.93469 7.17108C4.16809 6.78454 4.41197 6.3402 4.63977 5.86542C4.91967 5.28201 5.16804 4.67001 5.34777 4.08319C5.28315 3.92794 5.2228 3.77284 5.17004 3.6203C5.04153 3.24876 4.94772 2.87594 4.93078 2.5539C4.91473 2.24843 4.96448 1.89243 5.2384 1.67987L5.26086 1.66229L5.28723 1.64862C5.48713 1.54857 5.75573 1.51971 5.97375 1.70331C6.17117 1.86959 6.24133 2.14351 6.24133 2.43671ZM1.61973 14.5386H2.33356V13.32H2.95222C3.74696 13.32 4.20381 12.8063 4.20381 12.0601C4.20381 11.3243 3.7541 10.8002 2.97126 10.8002H1.61973V14.5386ZM2.33356 12.6952V11.4353H2.83801C3.26155 11.4379 3.46856 11.6883 3.46618 12.0601C3.46856 12.4371 3.26155 12.6952 2.83801 12.6952H2.33356ZM5.86943 14.5386C6.92115 14.5386 7.55646 13.8338 7.55408 12.6643C7.55646 11.4999 6.92115 10.8002 5.88371 10.8002H4.65591V14.5386H5.86943ZM5.36975 13.8725V11.4663H5.84564C6.49761 11.4663 6.84025 11.8252 6.84025 12.6643C6.84025 13.5033 6.49761 13.8725 5.84088 13.8725H5.36975ZM8.78664 14.5386H8.0728V10.8002H10.3428V11.4405H8.78664V12.3493H10.1953V12.9896H8.78664V14.5386Z"
        fill="#3D3D3D"
      />
    </svg>
  )
}

/**
 * PFFormFieldTable 값 칸용 파일 첨부 — CMS `ParagraphFileUpload` + crime `__file-cell` 정렬.
 * `[파일 추가]  📄 name.pdf [X]`
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
    const file = event.target.files?.[0]
    // input을 초기화하면 원본 File이 비동기 업로드 중 0바이트처럼 보이는
    // 브라우저/파일 provider가 있다. 선택 순간 독립된 File 스냅샷을 만든다.
    if (file) {
      const snapshot = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified,
      })
      onFileSelect(snapshot)
    }
    event.target.value = ''
  }

  return (
    <div className={[styles.fileAttach, className].filter(Boolean).join(' ')}>
      {hideTrigger ? null : (
        <span className={styles.fileAttachPicker}>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
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
      {name ? (
        <span className={styles.fileAttachChip}>
          <PdfFileIcon />
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
      {error ? (
        <PFText as="p" typo="bd-sm-rg" color="error" className={styles.fileAttachError}>
          {error}
        </PFText>
      ) : null}
    </div>
  )
}
