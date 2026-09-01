import type { KeyboardEvent, ReactNode } from 'react'
import styles from './media-list-row.module.css'

type MediaListRowProps = {
  thumbnailUrl?: string
  content: ReactNode
  aside: ReactNode
  className?: string
  asideClassName?: string
  muted?: boolean
  interactive?: boolean
  onClick?: () => void
}

export function MediaListRow({
  thumbnailUrl,
  content,
  aside,
  className,
  asideClassName,
  muted = false,
  interactive = false,
  onClick,
}: MediaListRowProps) {
  const hasThumbnailImage = Boolean(thumbnailUrl?.trim())

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !onClick) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  const rowClassName = [
    styles.row,
    interactive ? styles.rowInteractive : null,
    muted ? styles.rowMuted : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={rowClassName}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      <div
        className={[
          styles.thumbnailWrap,
          hasThumbnailImage ? styles.thumbnailWrapHasImage : styles.thumbnailWrapNoImage,
        ].join(' ')}
      >
        {hasThumbnailImage ? (
          <img className={styles.thumbnail} src={thumbnailUrl} alt="" />
        ) : null}
      </div>

      <div className={styles.content}>{content}</div>

      <div className={[styles.aside, asideClassName].filter(Boolean).join(' ')}>{aside}</div>
    </div>
  )
}
