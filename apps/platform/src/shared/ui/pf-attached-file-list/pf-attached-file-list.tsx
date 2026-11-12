import { PFItemDeleteButton } from '../pf-item-delete-button'
import { PFText } from '../pf-text'
import { getFileTypeIconUrl } from './file-type-icon'
import styles from './pf-attached-file-list.module.css'

export type PFAttachedFileListItem = {
  id: string
  name: string
}

export type PFAttachedFileListProps = {
  files: readonly PFAttachedFileListItem[]
  onRemove?: (id: string) => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

/** 신청 폼 첨부 목록 — Figma 13279:85102, 공지 작성 첨부 리스트와 동일 */
export function PFAttachedFileList({
  files,
  onRemove,
  disabled = false,
  className,
  'aria-label': ariaLabel = '첨부된 파일',
}: PFAttachedFileListProps) {
  if (files.length === 0) return null

  return (
    <ul className={[styles.list, className].filter(Boolean).join(' ')} aria-label={ariaLabel}>
      {files.map(file => (
        <li key={file.id} className={styles.row}>
          <span className={styles.file}>
            <img
              className={styles.fileIcon}
              src={getFileTypeIconUrl(file.name)}
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
            />
            <PFText
              as="span"
              typo="bd-md-md"
              color="black"
              className={styles.name}
              title={file.name}
            >
              {file.name}
            </PFText>
          </span>
          {onRemove ? (
            <PFItemDeleteButton
              aria-label={`${file.name} 삭제`}
              disabled={disabled}
              onClick={() => onRemove(file.id)}
            />
          ) : null}
        </li>
      ))}
    </ul>
  )
}
