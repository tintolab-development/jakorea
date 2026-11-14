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

/** 시안: 「안내사항」 라벨 글자는 #9E9E9E (좌측 보더는 레벨 토큰 그대로) */
const NOTICE_LABEL_COLOR = '#9e9e9e'

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
  const labelColor = level === 'notice' ? NOTICE_LABEL_COLOR : levelColor
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

      <span className={styles.level} style={{ color: labelColor } as CSSProperties}>
        <span className="typo-bd-md-sb">{EDUCATION_LEVEL_LABELS[level]}</span>
      </span>
    </div>
  )
}
