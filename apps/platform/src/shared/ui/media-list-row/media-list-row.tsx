import type { KeyboardEvent, ReactNode } from 'react'
import jaLogoGrayCompactUrl from '@/shared/assets/brand/ja-logo-gray-compact.svg'
import { resolvePortalPublicFileImageUrl } from '@/shared/lib/resolve-portal-public-file-image-url'
import styles from './media-list-row.module.css'

type MediaListRowProps = {
  thumbnailUrl?: string
  content: ReactNode
  aside: ReactNode
  className?: string
  thumbnailWrapClassName?: string
  contentClassName?: string
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
  thumbnailWrapClassName,
  contentClassName,
  asideClassName,
  muted = false,
  interactive = false,
  onClick,
}: MediaListRowProps) {
  const imageSrc = resolvePortalPublicFileImageUrl(thumbnailUrl)
  const hasThumbnailImage = Boolean(imageSrc)

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
          thumbnailWrapClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {hasThumbnailImage ? (
          <img className={styles.thumbnail} src={imageSrc} alt="" loading="lazy" decoding="async" />
        ) : (
          <img
            className={styles.thumbnailPlaceholderLogo}
            src={jaLogoGrayCompactUrl}
            alt=""
            aria-hidden="true"
          />
        )}
      </div>

      <div className={[styles.content, contentClassName].filter(Boolean).join(' ')}>{content}</div>

      <div className={[styles.aside, asideClassName].filter(Boolean).join(' ')}>{aside}</div>
    </div>
  )
}
