import { PFText } from '@/shared/ui'
import { SkeletonBlock } from '@/shared/ui/skeleton-block'
import loadingStatusStyles from './loading-status.module.css'
import styles from './session-list-skeleton.module.css'

type EducationSessionListSkeletonProps = {
  statusMessage?: string
  rowCount?: number
}

export function EducationSessionListSkeleton({
  statusMessage = '목록을 불러오는 중입니다.',
  rowCount = 3,
}: EducationSessionListSkeletonProps) {
  return (
    <div className={styles.shell} aria-busy="true">
      <PFText
        as="p"
        typo="bd-md-rg"
        color="neutral-cool-600"
        className={loadingStatusStyles.loadingStatus}
      >
        {statusMessage}
      </PFText>
      <div className={styles.header} aria-hidden="true">
        <SkeletonBlock className={styles.boneTitle} />
        <SkeletonBlock className={styles.boneCount} />
      </div>
      {Array.from({ length: rowCount }, (_, index) => (
        <SkeletonBlock key={index} className={styles.row} />
      ))}
    </div>
  )
}
