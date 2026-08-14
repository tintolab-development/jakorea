import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { downloadAttachment } from '@/shared/lib/download-attachment'
import { chevronDownIconUrl, downloadIconUrl } from './icons'
import styles from './pf-attachment-dropdown.module.css'

export type PFAttachmentDropdownItem = {
  fileName: string
  /** 실파일 URL. 없거나 `#`이면 빈 파일 폴백 다운로드 */
  href?: string
}

export type PFAttachmentDropdownProps = {
  files: PFAttachmentDropdownItem[]
  /** 트리거 라벨 prefix. 기본: 첨부파일 → `{label} ({count})` */
  label?: string
  /** 지정 시 prefix 조합 대신 이 문구를 트리거에 표시 */
  triggerLabel?: string
  className?: string
  /** 첨부 0건이면 null 렌더 (기본 true) */
  hideWhenEmpty?: boolean
}

/**
 * 첨부파일 드롭다운 — 결과 확인·공지 상세 헤더용.
 * - Trigger: 48× flex, warm-100, radius-12, Body/Medium/semibold + 22 chevron
 * - Panel: radius-16, border-default, white, dropdown shadow; 행 Body/Small/medium + 24 download
 */
export function PFAttachmentDropdown({
  files,
  label = '첨부파일',
  triggerLabel: triggerLabelProp,
  className,
  hideWhenEmpty = true,
}: PFAttachmentDropdownProps) {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const count = files.length
  const rootClassName = [styles.root, className].filter(Boolean).join(' ')
  const triggerLabel = triggerLabelProp ?? `${label} (${count})`

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const root = rootRef.current
      if (!root) return
      if (event.target instanceof Node && !root.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (hideWhenEmpty && count === 0) return null

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' && !isOpen) {
      event.preventDefault()
      setIsOpen(true)
    }
  }

  return (
    <div className={rootClassName} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={`typo-bd-md-sb ${styles.label}`}>{triggerLabel}</span>
        <img
          className={[styles.icon, isOpen ? styles.iconOpen : null].filter(Boolean).join(' ')}
          src={chevronDownIconUrl}
          alt=""
          width={22}
          height={22}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <ul className={styles.panel} id={listboxId} role="listbox" aria-label={triggerLabel}>
          {files.map(file => (
            <li key={file.fileName} className={styles.panelItem} role="option">
              <a
                className={styles.fileLink}
                href={file.href?.trim() || '#'}
                download={file.fileName}
                onClick={event => {
                  event.preventDefault()
                  downloadAttachment(file.fileName, file.href)
                }}
              >
                <span className={`typo-bd-sm-md ${styles.fileName}`}>{file.fileName}</span>
                <img
                  className={styles.downloadIcon}
                  src={downloadIconUrl}
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden="true"
                />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
