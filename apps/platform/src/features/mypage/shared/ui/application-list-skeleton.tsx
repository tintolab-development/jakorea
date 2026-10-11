import { PFText } from '@/shared/ui'
import { SkeletonBlock } from '@/shared/ui/skeleton-block'
import loadingStatusStyles from './loading-status.module.css'
import styles from './application-list-skeleton.module.css'

const DEFAULT_ROW_KEYS = ['a', 'b', 'c'] as const

type EducationApplicationListSkeletonProps = {
  rowCount?: number
  statusMessage?: string
}

export function EducationApplicationListSkeleton({
  rowCount = 3,
  statusMessage = '프로그램 목록을 불러오는 중입니다.',
}: EducationApplicationListSkeletonProps) {
  const keys = DEFAULT_ROW_KEYS.slice(0, Math.min(rowCount, DEFAULT_ROW_KEYS.length))
  const extraCount = rowCount - keys.length
  const allKeys = [
    ...keys,
    ...Array.from({ length: extraCount }, (_, index) => `extra-${index}`),
  ]

  return (
    <div className={styles.list} aria-busy="true">
      <PFText
        as="p"
        typo="bd-md-rg"
        color="neutral-cool-600"
        className={loadingStatusStyles.loadingStatus}
      >
        {statusMessage}
      </PFText>
      {allKeys.map(key => (
        <div key={key} className={styles.row} aria-hidden="true">
          <SkeletonBlock className={styles.thumb} />
          <div className={styles.body}>
            <SkeletonBlock className={styles.boneCategory} />
            <SkeletonBlock className={styles.boneTitle} />
            <SkeletonBlock className={styles.boneLine} />
            <SkeletonBlock className={styles.boneLine} />
            <SkeletonBlock className={styles.boneBadges} />
          </div>
          <SkeletonBlock className={styles.aside} />
        </div>
      ))}
    </div>
  )
}
