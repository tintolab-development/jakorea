import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import {
  EDUCATION_LEVEL_LABELS,
  getEducationLevelColor,
  type EducationLevelKey,
} from '@/shared/lib'
import { PFText } from '@/shared/ui'
import styles from './directory-list-item.module.css'

type DirectoryListItemProps = {
  titles: string[]
  level: EducationLevelKey
  onClick?: () => void
}

function DotSeparator() {
  return (
    <span className={styles.dot} aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" fill="none">
        <circle cx="2" cy="2" r="2" fill="currentColor" />
      </svg>
    </span>
  )
}

export function DirectoryListItem({ titles, level, onClick }: DirectoryListItemProps) {
  const levelColor = getEducationLevelColor(level)
  const interactive = Boolean(onClick)

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  const titleNodes: ReactNode[] = []
  titles.forEach((title, index) => {
    if (index > 0) {
      titleNodes.push(<DotSeparator key={`dot-${index}`} />)
    }
    titleNodes.push(
      <PFText key={`title-${index}`} as="span" typo="bd-lg-sb" color="black" className={styles.title}>
        {title}
      </PFText>
    )
  })

  return (
    <div
      className={[styles.item, interactive ? styles.itemInteractive : null]
        .filter(Boolean)
        .join(' ')}
      style={{ borderLeftColor: levelColor } as CSSProperties}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      <div className={styles.titles}>{titleNodes}</div>

      <span className={styles.level} style={{ color: levelColor } as CSSProperties}>
        <span className="typo-bd-md-sb">{EDUCATION_LEVEL_LABELS[level]}</span>
      </span>
    </div>
  )
}
